import { DRE } from './misc-utils';
import { eContractid, tEthereumAddress, tStringTokenSmallUnits } from './types';
import { getFirstSigner } from './wallet-helpers';
import { insertContractAddressInDb, linkBytecode, withSaveAndVerify } from './contracts-helpers';
import {
  WalletBalanceProvider__factory,
  WETHGateway__factory,
  SelfdestructTransfer__factory,
  WETH9Mocked__factory,
  WETH9Mocked,
} from '../types';

import {
  MintableERC20,
  MintableERC20__factory,
  PoolAddressesProvider__factory,
  PoolAddressesProviderRegistry__factory,
  WETH9,
  WETH9__factory,
  Pool__factory,
  ConfiguratorLogic__factory,
  PoolConfigurator__factory,
  StableAndVariableTokensHelper__factory,
  ATokensAndRatesHelper__factory,
  PriceOracle__factory,
  MockAggregator__factory,
  AaveOracle__factory,
  MockFlashLoanReceiver__factory,
  AaveProtocolDataProvider__factory,
  RateOracle__factory,
  DefaultReserveInterestRateStrategy__factory,
  DelegationAwareAToken__factory,
  StableDebtToken__factory,
  VariableDebtToken__factory,
  AToken__factory,
} from '../types';
import { PoolLibraryAddresses } from '../types/factories/Pool__factory';

const readArtifact = async (id: string) => {
  return DRE.artifacts.readArtifact(id);
};

export const deployWETHMocked = async (verify?: boolean): Promise<WETH9Mocked> =>
  withSaveAndVerify(
    await new WETH9Mocked__factory(await getFirstSigner()).deploy(),
    eContractid.WETHMocked,
    [],
    verify
  );

export const deployMintableERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC20> =>
  withSaveAndVerify(
    await new MintableERC20__factory(await getFirstSigner()).deploy(...args),
    eContractid.MintableERC20,
    args,
    verify
  );

export const deployPoolAddressesProvider = async (marketId: string, verify?: boolean) =>
  withSaveAndVerify(
    await new PoolAddressesProvider__factory(await getFirstSigner()).deploy(marketId),
    eContractid.PoolAddressesProvider,
    [marketId],
    verify
  );

export const deployPoolAddressesProviderRegistry = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PoolAddressesProviderRegistry__factory(await getFirstSigner()).deploy(),
    eContractid.PoolAddressesProviderRegistry,
    [],
    verify
  );

export const deployDepositLogic = async (verify?: boolean) => {
  const depositLogicArtifact = await readArtifact(eContractid.DepositLogic);
  const linkedDepositLogicByteCode = linkBytecode(depositLogicArtifact, {});
  const depositLogic__factory = await DRE.ethers.getContractFactory(
    depositLogicArtifact.abi,
    linkedDepositLogicByteCode
  );
  const depositLogic = await (
    await depositLogic__factory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(depositLogic, eContractid.DepositLogic, [], verify);
};

export const deployBorrowLogic = async (verify?: boolean) => {
  const borrowLogicArtifact = await readArtifact(eContractid.BorrowLogic);

  const borrowLogic__factory = await DRE.ethers.getContractFactory(
    borrowLogicArtifact.abi,
    borrowLogicArtifact.bytecode
  );
  const borrowLogic = await (
    await borrowLogic__factory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(borrowLogic, eContractid.BorrowLogic, [], verify);
};

export const deployLiquidationLogic = async (verify?: boolean) => {
  const liquidationLogicArtifact = await readArtifact(eContractid.LiquidationLogic);

  const borrowLogic__factory = await DRE.ethers.getContractFactory(
    liquidationLogicArtifact.abi,
    liquidationLogicArtifact.bytecode
  );
  const liquidationLogic = await (
    await borrowLogic__factory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(liquidationLogic, eContractid.LiquidationLogic, [], verify);
};

export const deployAaveLibraries = async (verify?: boolean): Promise<PoolLibraryAddresses> => {
  const depositLogic = await deployDepositLogic(verify);
  const borrowLogic = await deployBorrowLogic(verify);
  const liquidationLogic = await deployLiquidationLogic(verify);
  // Hardcoded solidity placeholders, if any library changes path this will fail.
  // The '__$PLACEHOLDER$__ can be calculated via solidity keccak, but the PoolLibraryAddresses Type seems to
  // require a hardcoded string.
  //
  //  how-to:
  //  1. PLACEHOLDER = solidityKeccak256(['string'], `${libPath}:${libName}`).slice(2, 36)
  //  2. LIB_PLACEHOLDER = `__$${PLACEHOLDER}$__`
  // or grab placeholders from PoolLibraryAddresses at Typechain generation.
  //
  // libPath example: contracts/libraries/logic/GenericLogic.sol
  // libName example: GenericLogic
  return {
    ['contracts/protocol/libraries/logic/DepositLogic.sol:DepositLogic']: depositLogic.address,
    ['contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic']: borrowLogic.address,
    ['contracts/protocol/libraries/logic/LiquidationLogic.sol:LiquidationLogic']:
      liquidationLogic.address,
  };
};

export const deployPool = async (verify?: boolean) => {
  const libraries = await deployAaveLibraries(verify);
  const poolImpl = await new Pool__factory(libraries, await getFirstSigner()).deploy();
  await insertContractAddressInDb(eContractid.PoolImpl, poolImpl.address);
  return withSaveAndVerify(poolImpl, eContractid.Pool, [], verify);
};

export const deployConfiguratorLogicLibrary = async (verify?: boolean) =>
  withSaveAndVerify(
    await new ConfiguratorLogic__factory(await getFirstSigner()).deploy(),
    eContractid.ConfiguratorLogic,
    [],
    verify
  );

export const deployPoolConfigurator = async (verify?: boolean) => {
  const configuratorLogic = await deployConfiguratorLogicLibrary(verify);
  const poolConfiguratorImpl = await new PoolConfigurator__factory(
    {
      ['contracts/protocol/libraries/logic/ConfiguratorLogic.sol:ConfiguratorLogic']:
        configuratorLogic.address,
    },
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(eContractid.PoolConfiguratorImpl, poolConfiguratorImpl.address);
  return withSaveAndVerify(poolConfiguratorImpl, eContractid.PoolConfigurator, [], verify);
};

export const deployWETHGateway = async (args: [tEthereumAddress], verify?: boolean) =>
  withSaveAndVerify(
    await new WETHGateway__factory(await getFirstSigner()).deploy(...args),
    eContractid.WETHGateway,
    args,
    verify
  );

export const deployStableAndVariableTokensHelper = async (
  args: [tEthereumAddress, tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new StableAndVariableTokensHelper__factory(await getFirstSigner()).deploy(...args),
    eContractid.StableAndVariableTokensHelper,
    args,
    verify
  );

export const deployATokensAndRatesHelper = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new ATokensAndRatesHelper__factory(await getFirstSigner()).deploy(...args),
    eContractid.ATokensAndRatesHelper,
    args,
    verify
  );

export const deployPriceOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PriceOracle__factory(await getFirstSigner()).deploy(),
    eContractid.PriceOracle,
    [],
    verify
  );

export const deployMockAggregator = async (price: tStringTokenSmallUnits, verify?: boolean) =>
  withSaveAndVerify(
    await new MockAggregator__factory(await getFirstSigner()).deploy(price),
    eContractid.MockAggregator,
    [price],
    verify
  );

export const deployAaveOracle = async (
  args: [tEthereumAddress[], tEthereumAddress[], tEthereumAddress, tEthereumAddress, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new AaveOracle__factory(await getFirstSigner()).deploy(...args),
    eContractid.AaveOracle,
    args,
    verify
  );

export const deployRateOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new RateOracle__factory(await getFirstSigner()).deploy(),
    eContractid.RateOracle,
    [],
    verify
  );

export const deployAaveProtocolDataProvider = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new AaveProtocolDataProvider__factory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.AaveProtocolDataProvider,
    [addressesProvider],
    verify
  );

export const deployMockFlashLoanReceiver = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockFlashLoanReceiver__factory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.MockFlashLoanReceiver,
    [addressesProvider],
    verify
  );

export const deploySelfdestructTransferMock = async (verify?: boolean) =>
  withSaveAndVerify(
    await new SelfdestructTransfer__factory(await getFirstSigner()).deploy(),
    eContractid.SelfdestructTransferMock,
    [],
    verify
  );

export const deployWalletBalancerProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WalletBalanceProvider__factory(await getFirstSigner()).deploy(),
    eContractid.WalletBalanceProvider,
    [],
    verify
  );

export const deployDefaultReserveInterestRateStrategy = async (
  args: [tEthereumAddress, string, string, string, string, string, string],
  verify: boolean
) =>
  withSaveAndVerify(
    await new DefaultReserveInterestRateStrategy__factory(await getFirstSigner()).deploy(...args),
    eContractid.DefaultReserveInterestRateStrategy,
    args,
    verify
  );

export const deployDelegationAwareATokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new DelegationAwareAToken__factory(await getFirstSigner()).deploy(),
    eContractid.DelegationAwareAToken,
    [],
    verify
  );

export const deployGenericStableDebtToken = async () =>
  withSaveAndVerify(
    await new StableDebtToken__factory(await getFirstSigner()).deploy(),
    eContractid.StableDebtToken,
    [],
    false
  );

export const deployGenericVariableDebtToken = async () =>
  withSaveAndVerify(
    await new VariableDebtToken__factory(await getFirstSigner()).deploy(),
    eContractid.VariableDebtToken,
    [],
    false
  );

export const deployGenericATokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new AToken__factory(await getFirstSigner()).deploy(),
    eContractid.AToken,
    [],
    verify
  );
