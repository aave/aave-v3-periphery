import { DRE } from './misc-utils';
import { eContractid, tEthereumAddress, tStringTokenSmallUnits } from './types';
import { getFirstSigner } from './wallet-helpers';
import { insertContractAddressInDb, linkBytecode, withSaveAndVerify } from './contracts-helpers';
import {
  WalletBalanceProvider__factory,
  WETHGateway__factory,
  SelfdestructTransfer__factory,
} from '../types';

import {
  MintableERC20,
  MintableERC20Factory,
  PoolAddressesProviderFactory,
  PoolAddressesProviderRegistryFactory,
  WETH9Mocked,
  WETH9MockedFactory,
  PoolFactory,
  ConfiguratorLogicFactory,
  PoolConfiguratorFactory,
  StableAndVariableTokensHelperFactory,
  ATokensAndRatesHelperFactory,
  PriceOracleFactory,
  MockAggregatorFactory,
  AaveOracleFactory,
  MockFlashLoanReceiverFactory,
  AaveProtocolDataProviderFactory,
  RateOracleFactory,
  MockUniswapV2Router02Factory,
  DefaultReserveInterestRateStrategyFactory,
  DelegationAwareATokenFactory,
  StableDebtTokenFactory,
  VariableDebtTokenFactory,
  ATokenFactory,
} from '@aave/core-v3/types';
import { PoolLibraryAddresses } from '@aave/core-v3/types/PoolFactory';

const readArtifact = async (id: string) => {
  return DRE.artifacts.readArtifact(id);
};

export const deployWETHMocked = async (verify?: boolean): Promise<WETH9Mocked> =>
  withSaveAndVerify(
    await new WETH9MockedFactory(await getFirstSigner()).deploy(),
    eContractid.WETHMocked,
    [],
    verify
  );

export const deployMintableERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC20> =>
  withSaveAndVerify(
    await new MintableERC20Factory(await getFirstSigner()).deploy(...args),
    eContractid.MintableERC20,
    args,
    verify
  );

export const deployPoolAddressesProvider = async (marketId: string, verify?: boolean) =>
  withSaveAndVerify(
    await new PoolAddressesProviderFactory(await getFirstSigner()).deploy(marketId),
    eContractid.PoolAddressesProvider,
    [marketId],
    verify
  );

export const deployPoolAddressesProviderRegistry = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PoolAddressesProviderRegistryFactory(await getFirstSigner()).deploy(),
    eContractid.PoolAddressesProviderRegistry,
    [],
    verify
  );

export const deployDepositLogic = async (verify?: boolean) => {
  const depositLogicArtifact = await readArtifact(eContractid.DepositLogic);
  const linkedDepositLogicByteCode = linkBytecode(depositLogicArtifact, {});
  const depositLogicFactory = await DRE.ethers.getContractFactory(
    depositLogicArtifact.abi,
    linkedDepositLogicByteCode
  );
  const depositLogic = await (
    await depositLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(depositLogic, eContractid.DepositLogic, [], verify);
};

export const deployBorrowLogic = async (verify?: boolean) => {
  const borrowLogicArtifact = await readArtifact(eContractid.BorrowLogic);

  const borrowLogicFactory = await DRE.ethers.getContractFactory(
    borrowLogicArtifact.abi,
    borrowLogicArtifact.bytecode
  );
  const borrowLogic = await (
    await borrowLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(borrowLogic, eContractid.BorrowLogic, [], verify);
};

export const deployLiquidationLogic = async (verify?: boolean) => {
  const liquidationLogicArtifact = await readArtifact(eContractid.LiquidationLogic);

  const borrowLogicFactory = await DRE.ethers.getContractFactory(
    liquidationLogicArtifact.abi,
    liquidationLogicArtifact.bytecode
  );
  const liquidationLogic = await (
    await borrowLogicFactory.connect(await getFirstSigner()).deploy()
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
    //    ['__$de8c0cf1a7d7c36c802af9a64fb9d86036$__']: validationLogic.address,
    ['__$209f7610f7b09602dd9c7c2ef5b135794a$__']: depositLogic.address,
    ['__$c3724b8d563dc83a94e797176cddecb3b9$__']: borrowLogic.address,
    ['__$f598c634f2d943205ac23f707b80075cbb$__']: liquidationLogic.address,
  };
};

export const deployPool = async (verify?: boolean) => {
  const libraries = await deployAaveLibraries(verify);
  const poolImpl = await new PoolFactory(libraries, await getFirstSigner()).deploy();
  await insertContractAddressInDb(eContractid.PoolImpl, poolImpl.address);
  return withSaveAndVerify(poolImpl, eContractid.Pool, [], verify);
};

export const deployConfiguratorLogicLibrary = async (verify?: boolean) =>
  withSaveAndVerify(
    await new ConfiguratorLogicFactory(await getFirstSigner()).deploy(),
    eContractid.ConfiguratorLogic,
    [],
    verify
  );

export const deployPoolConfigurator = async (verify?: boolean) => {
  const configuratorLogic = await deployConfiguratorLogicLibrary(verify);
  const poolConfiguratorImpl = await new PoolConfiguratorFactory(
    { ['__$3ddc574512022f331a6a4c7e4bbb5c67b6$__']: configuratorLogic.address },
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
    await new StableAndVariableTokensHelperFactory(await getFirstSigner()).deploy(...args),
    eContractid.StableAndVariableTokensHelper,
    args,
    verify
  );

export const deployATokensAndRatesHelper = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new ATokensAndRatesHelperFactory(await getFirstSigner()).deploy(...args),
    eContractid.ATokensAndRatesHelper,
    args,
    verify
  );

export const deployPriceOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PriceOracleFactory(await getFirstSigner()).deploy(),
    eContractid.PriceOracle,
    [],
    verify
  );

export const deployMockAggregator = async (price: tStringTokenSmallUnits, verify?: boolean) =>
  withSaveAndVerify(
    await new MockAggregatorFactory(await getFirstSigner()).deploy(price),
    eContractid.MockAggregator,
    [price],
    verify
  );

export const deployAaveOracle = async (
  args: [tEthereumAddress[], tEthereumAddress[], tEthereumAddress, tEthereumAddress, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new AaveOracleFactory(await getFirstSigner()).deploy(...args),
    eContractid.AaveOracle,
    args,
    verify
  );

export const deployRateOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new RateOracleFactory(await getFirstSigner()).deploy(),
    eContractid.RateOracle,
    [],
    verify
  );

export const deployAaveProtocolDataProvider = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new AaveProtocolDataProviderFactory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.AaveProtocolDataProvider,
    [addressesProvider],
    verify
  );

export const deployMockFlashLoanReceiver = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockFlashLoanReceiverFactory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.MockFlashLoanReceiver,
    [addressesProvider],
    verify
  );

export const deployMockUniswapRouter = async (verify?: boolean) =>
  withSaveAndVerify(
    await new MockUniswapV2Router02Factory(await getFirstSigner()).deploy(),
    eContractid.MockUniswapV2Router02,
    [],
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
    await new DefaultReserveInterestRateStrategyFactory(await getFirstSigner()).deploy(...args),
    eContractid.DefaultReserveInterestRateStrategy,
    args,
    verify
  );

export const deployDelegationAwareATokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new DelegationAwareATokenFactory(await getFirstSigner()).deploy(),
    eContractid.DelegationAwareAToken,
    [],
    verify
  );

export const deployGenericStableDebtToken = async () =>
  withSaveAndVerify(
    await new StableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.StableDebtToken,
    [],
    false
  );

export const deployGenericVariableDebtToken = async () =>
  withSaveAndVerify(
    await new VariableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.VariableDebtToken,
    [],
    false
  );

export const deployGenericATokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new ATokenFactory(await getFirstSigner()).deploy(),
    eContractid.AToken,
    [],
    verify
  );
