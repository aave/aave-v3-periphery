import hardhat from 'hardhat';
import { Signer } from 'ethers';
import { eNetwork, tEthereumAddress } from '../../helpers/types';
import { getEthersSigners } from '../../helpers/wallet-helpers';
import {
  getAaveProtocolDataProvider,
  getAToken,
  getMintableERC20,
  getPool,
  getPoolAddressesProvider,
  getPoolAddressesProviderRegistry,
  getPoolConfiguratorProxy,
  getPriceOracle,
  getStableDebtToken,
  getVariableDebtToken,
  getWETHGateway,
  getWETHMocked,
} from '../../helpers/contracts-getters';
import AaveConfig from '../../market-config';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { DRE, evmRevert, evmSnapshot } from '../../helpers/misc-utils';
import { usingTenderly } from '../../helpers/tenderly-utils';
import chai from 'chai';
import bignumberChai from 'chai-bignumber';
import { solidity } from 'ethereum-waffle';

import {
  AaveProtocolDataProvider,
  AToken,
  MintableERC20,
  Pool,
  PoolAddressesProvider,
  PoolAddressesProviderRegistry,
  PoolConfigurator,
  PriceOracle,
  StableDebtToken,
  VariableDebtToken,
  WETH9Mocked,
} from '../../types';
import { WETHGateway } from '../../types';

chai.use(bignumberChai());
chai.use(solidity);

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}

export interface TestEnv {
  deployer: SignerWithAddress;
  users: SignerWithAddress[];
  poolAdmin: SignerWithAddress;
  emergencyAdmin: SignerWithAddress;
  riskAdmin: SignerWithAddress;
  pool: Pool;
  configurator: PoolConfigurator;
  oracle: PriceOracle;
  helpersContract: AaveProtocolDataProvider;
  weth: WETH9Mocked;
  aWETH: AToken;
  dai: MintableERC20;
  aDai: AToken;
  variableDebtDai: VariableDebtToken;
  stableDebtDai: StableDebtToken;
  aUsdc: AToken;
  usdc: MintableERC20;
  aave: MintableERC20;
  addressesProvider: PoolAddressesProvider;
  registry: PoolAddressesProviderRegistry;
  wethGateway: WETHGateway;
}

let hardhatevmSnapshotId: string = '0x1';
const setHardhatevmSnapshotId = (id: string) => {
  hardhatevmSnapshotId = id;
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  poolAdmin: {} as SignerWithAddress,
  emergencyAdmin: {} as SignerWithAddress,
  riskAdmin: {} as SignerWithAddress,
  pool: {} as Pool,
  configurator: {} as PoolConfigurator,
  helpersContract: {} as AaveProtocolDataProvider,
  oracle: {} as PriceOracle,
  weth: {} as WETH9Mocked,
  aWETH: {} as AToken,
  dai: {} as MintableERC20,
  aDai: {} as AToken,
  variableDebtDai: {} as VariableDebtToken,
  stableDebtDai: {} as StableDebtToken,
  aUsdc: {} as AToken,
  usdc: {} as MintableERC20,
  aave: {} as MintableERC20,
  addressesProvider: {} as PoolAddressesProvider,
  registry: {} as PoolAddressesProviderRegistry,
  wethGateway: {} as WETHGateway,
} as TestEnv;

export async function initializeMakeSuite() {
  const [_deployer, ...restSigners] = await getEthersSigners();
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  for (const signer of restSigners) {
    testEnv.users.push({
      signer,
      address: await signer.getAddress(),
    });
  }
  testEnv.deployer = deployer;
  testEnv.poolAdmin = deployer;
  testEnv.emergencyAdmin = testEnv.users[1];
  testEnv.riskAdmin = testEnv.users[2];
  testEnv.pool = await getPool();

  testEnv.configurator = await getPoolConfiguratorProxy();

  testEnv.addressesProvider = await getPoolAddressesProvider();

  if (process.env.FORK) {
    testEnv.registry = await getPoolAddressesProviderRegistry(
      getParamPerNetwork(AaveConfig.ProviderRegistry, process.env.FORK as eNetwork)
    );
  } else {
    testEnv.registry = await getPoolAddressesProviderRegistry();
    testEnv.oracle = await getPriceOracle();
  }

  testEnv.helpersContract = await getAaveProtocolDataProvider();

  const allTokens = await testEnv.helpersContract.getAllATokens();
  const aDaiAddress = allTokens.find((aToken) => aToken.symbol === 'aDAI')?.tokenAddress;
  const aUsdcAddress = allTokens.find((aToken) => aToken.symbol === 'aUSDC')?.tokenAddress;

  const aWEthAddress = allTokens.find((aToken) => aToken.symbol === 'aWETH')?.tokenAddress;

  const reservesTokens = await testEnv.helpersContract.getAllReservesTokens();

  const daiAddress = reservesTokens.find((token) => token.symbol === 'DAI')?.tokenAddress;
  const {
    variableDebtTokenAddress: variableDebtDaiAddress,
    stableDebtTokenAddress: stableDebtDaiAddress,
  } = await testEnv.helpersContract.getReserveTokensAddresses(daiAddress || '');
  const usdcAddress = reservesTokens.find((token) => token.symbol === 'USDC')?.tokenAddress;
  const aaveAddress = reservesTokens.find((token) => token.symbol === 'AAVE')?.tokenAddress;
  const wethAddress = reservesTokens.find((token) => token.symbol === 'WETH')?.tokenAddress;

  if (!aDaiAddress || !aWEthAddress) {
    process.exit(1);
  }
  if (!daiAddress || !usdcAddress || !aaveAddress || !wethAddress) {
    process.exit(1);
  }

  testEnv.aDai = await getAToken(aDaiAddress);
  testEnv.variableDebtDai = await getVariableDebtToken(variableDebtDaiAddress);
  testEnv.stableDebtDai = await getStableDebtToken(stableDebtDaiAddress);
  testEnv.aUsdc = await getAToken(aUsdcAddress);
  testEnv.aWETH = await getAToken(aWEthAddress);

  testEnv.dai = await getMintableERC20(daiAddress);
  testEnv.usdc = await getMintableERC20(usdcAddress);
  testEnv.aave = await getMintableERC20(aaveAddress);
  testEnv.weth = await getWETHMocked(wethAddress);
  testEnv.wethGateway = await getWETHGateway();
}

const setSnapshot = async () => {
  if (usingTenderly()) {
    setHardhatevmSnapshotId((await DRE.tenderlyNetwork.getHead()) || '0x1');
    return;
  }
  setHardhatevmSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  if (usingTenderly()) {
    await DRE.tenderlyNetwork.setHead(hardhatevmSnapshotId);
    return;
  }
  await evmRevert(hardhatevmSnapshotId);
};

export async function makeSuite(name: string, tests: (testEnv: TestEnv) => void): Promise<void> {
  before(async () => {
    await hardhat.run('set-DRE');
  });
  describe(name, async () => {
    before(async () => {
      await setSnapshot();
    });
    tests(testEnv);
    after(async () => {
      await revertHead();
    });
  });
  afterEach(async () => {});
}
