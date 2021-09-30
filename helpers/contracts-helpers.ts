import { ethers, Contract } from 'ethers';
import { Artifact } from 'hardhat/types';
import { Artifact as HardhatArtifact } from 'hardhat/types';
import {
  AavePools,
  eContractid,
  eEthereumNetwork,
  eNetwork,
  ePolygonNetwork,
  eXDaiNetwork,
  iEthereumParamsPerNetwork,
  iParamsPerNetwork,
  iParamsPerPool,
  iPolygonParamsPerNetwork,
  iXDaiParamsPerNetwork,
  tEthereumAddress,
} from './types';
import { getIErc20Detailed, getMintableERC20 } from './contracts-getters';
import { DRE, getDb, waitForTx } from './misc-utils';
import { usingTenderly, verifyAtTenderly } from './tenderly-utils';
import { verifyEtherscanContract } from './etherscan-verification';
import { MintableERC20, WETH9Mocked } from '@aave/core-v3/types';
import { MockContract } from '@ethereum-waffle/mock-contract';

export type MockTokenMap = { [symbol: string]: MockContract | MintableERC20 | WETH9Mocked };

export const getParamPerNetwork = <T>(param: iParamsPerNetwork<T>, network: eNetwork) => {
  const {
    main,
    ropsten,
    kovan,
    coverage,
    hardhatevm,
    tenderlyMain,
  } = param as iEthereumParamsPerNetwork<T>;
  const { matic, mumbai } = param as iPolygonParamsPerNetwork<T>;
  const { xdai } = param as iXDaiParamsPerNetwork<T>;
  if (process.env.FORK) {
    return param[process.env.FORK as eNetwork] as T;
  }

  switch (network) {
    case eEthereumNetwork.coverage:
      return coverage;
    case eEthereumNetwork.hardhatevm:
      return hardhatevm;
    case eEthereumNetwork.hardhat:
      return hardhatevm;
    case eEthereumNetwork.kovan:
      return kovan;
    case eEthereumNetwork.ropsten:
      return ropsten;
    case eEthereumNetwork.main:
      return main;
    case eEthereumNetwork.tenderlyMain:
      return tenderlyMain;
    case ePolygonNetwork.matic:
      return matic;
    case ePolygonNetwork.mumbai:
      return mumbai;
    case eXDaiNetwork.xdai:
      return xdai;
  }
};

export const getParamPerPool = <T>({ proto, amm, matic }: iParamsPerPool<T>, pool: AavePools) => {
  switch (pool) {
    case AavePools.proto:
      return proto;
    case AavePools.amm:
      return amm;
    case AavePools.matic:
      return matic;
    default:
      return proto;
  }
};

export const convertToCurrencyDecimals = async (tokenAddress: tEthereumAddress, amount: string) => {
  const token = await getIErc20Detailed(tokenAddress);
  let decimals = (await token.decimals()).toString();

  return ethers.utils.parseUnits(amount, decimals);
};

export const registerContractInJsonDb = async (contractId: string, contractInstance: Contract) => {
  const currentNetwork = DRE.network.name;
  const FORK = process.env.FORK;
  if (FORK || (currentNetwork !== 'hardhat' && !currentNetwork.includes('coverage'))) {
    console.log(`*** ${contractId} ***\n`);
    console.log(`Network:           ${currentNetwork}`);
    console.log(`tx:                ${contractInstance.deployTransaction.hash}`);
    console.log(`contract address:  ${contractInstance.address}`);
    console.log(`deployer address:  ${contractInstance.deployTransaction.from}`);
    console.log(`gas price:         ${contractInstance.deployTransaction.gasPrice}`);
    console.log(`gas used:          ${contractInstance.deployTransaction.gasLimit}`);
    console.log(`\n******\n`);
  }

  await getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: contractInstance.address,
      deployer: contractInstance.deployTransaction.from,
    })
    .write();
};

export const verifyContract = async (
  id: string,
  instance: Contract,
  args: (string | string[])[]
) => {
  if (usingTenderly()) {
    await verifyAtTenderly(id, instance);
  }
  await verifyEtherscanContract(instance.address, args);
  return instance;
};

export const withSaveAndVerify = async <ContractType extends Contract>(
  instance: ContractType,
  id: string,
  args: (string | string[])[],
  verify?: boolean
): Promise<ContractType> => {
  await waitForTx(instance.deployTransaction);
  await registerContractInJsonDb(id, instance);
  if (verify) {
    await verifyContract(id, instance, args);
  }
  return instance;
};

export const withSave = async <ContractType extends Contract>(
  instance: ContractType,
  id: string
): Promise<ContractType> => {
  await waitForTx(instance.deployTransaction);
  await registerContractInJsonDb(id, instance);
  return instance;
};

export const insertContractAddressInDb = async (id: eContractid, address: tEthereumAddress) =>
  await getDb()
    .set(`${id}.${DRE.network.name}`, {
      address,
    })
    .write();

export const rawInsertContractAddressInDb = async (id: string, address: tEthereumAddress) =>
  await getDb()
    .set(`${id}.${DRE.network.name}`, {
      address,
    })
    .write();

export const linkBytecode = (artifact: HardhatArtifact | Artifact, libraries: any) => {
  let bytecode = artifact.bytecode;

  for (const [fileName, fileReferences] of Object.entries(artifact.linkReferences)) {
    for (const [libName, fixups] of Object.entries(fileReferences)) {
      const addr = libraries[libName];

      if (addr === undefined) {
        continue;
      }

      for (const fixup of fixups) {
        bytecode =
          bytecode.substr(0, 2 + fixup.start * 2) +
          addr.substr(2) +
          bytecode.substr(2 + (fixup.start + fixup.length) * 2);
      }
    }
  }

  return bytecode;
};
