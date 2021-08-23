import BigNumber from 'bignumber.js';

export interface SymbolMap<T> {
  [symbol: string]: T;
}

export type eNetwork = eEthereumNetwork | ePolygonNetwork | eXDaiNetwork;

export enum eEthereumNetwork {
  hardhatevm = 'hardhatevm',
  kovan = 'kovan',
  ropsten = 'ropsten',
  main = 'main',
  coverage = 'coverage',
  hardhat = 'hardhat',
  tenderlyMain = 'tenderlyMain',
}

export enum ePolygonNetwork {
  matic = 'matic',
  mumbai = 'mumbai',
}

export enum eXDaiNetwork {
  xdai = 'xdai',
}

export enum EthereumNetworkNames {
  kovan = 'kovan',
  ropsten = 'ropsten',
  main = 'main',
  matic = 'matic',
  mumbai = 'mumbai',
  xdai = 'xdai',
}

export enum AavePools {
  proto = 'proto',
  matic = 'matic',
  amm = 'amm',
}

export enum eContractid {
  PoolAddressesProvider = 'PoolAddressesProvider',
  MintableERC20 = 'MintableERC20',
  PoolAddressesProviderRegistry = 'PoolAddressesProviderRegistry',
  PoolConfiguratorImpl = 'PoolConfiguratorImpl',
  PoolConfigurator = 'PoolConfigurator',
  ValidationLogic = 'ValidationLogic',
  ReserveLogic = 'ReserveLogic',
  GenericLogic = 'GenericLogic',
  DepositLogic = 'DepositLogic',
  BorrowLogic = 'BorrowLogic',
  LiquidationLogic = 'LiquidationLogic',
  ConfiguratorLogic = 'ConfiguratorLogic',
  PoolImpl = 'PoolImpl',
  Pool = 'Pool',
  PriceOracle = 'PriceOracle',
  // Proxy = 'Proxy',
  MockAggregator = 'MockAggregator',
  RateOracle = 'RateOracle',
  AaveOracle = 'AaveOracle',
  DefaultReserveInterestRateStrategy = 'DefaultReserveInterestRateStrategy',
  // InitializableAdminUpgradeabilityProxy = 'InitializableAdminUpgradeabilityProxy',
  // MockFlashLoanReceiver = 'MockFlashLoanReceiver',
  AToken = 'AToken',
  // MockAToken = 'MockAToken',
  DelegationAwareAToken = 'DelegationAwareAToken',
  MockStableDebtToken = 'MockStableDebtToken',
  MockVariableDebtToken = 'MockVariableDebtToken',
  AaveProtocolDataProvider = 'AaveProtocolDataProvider',
  // IERC20Detailed = 'IERC20Detailed',
  StableDebtToken = 'StableDebtToken',
  VariableDebtToken = 'VariableDebtToken',
  // FeeProvider = 'FeeProvider',
  // TokenDistributor = 'TokenDistributor',
  StableAndVariableTokensHelper = 'StableAndVariableTokensHelper',
  ATokensAndRatesHelper = 'ATokensAndRatesHelper',
  // WETH = 'WETH',
  WETHMocked = 'WETHMocked',
  SelfdestructTransferMock = 'SelfdestructTransferMock',
  MockUniswapV2Router02 = 'MockUniswapV2Router02',
  WETHGateway = 'WETHGateway',
  MockFlashLoanReceiver = 'MockFlashLoanReceiver',
  WalletBalanceProvider = 'WalletBalanceProvider',
}

export type tEthereumAddress = string;
export type tStringTokenBigUnits = string; // 1 ETH, or 10e6 USDC or 10e18 DAI
export type tBigNumberTokenBigUnits = BigNumber;
export type tStringTokenSmallUnits = string; // 1 wei, or 1 basic unit of USDC, or 1 basic unit of DAI
export type tBigNumberTokenSmallUnits = BigNumber;

export interface iAssetCommon<T> {
  [key: string]: T;
}
export interface iAssetBase<T> {
  WETH: T;
  DAI: T;
  TUSD: T;
  USDC: T;
  USDT: T;
  SUSD: T;
  AAVE: T;
  BAT: T;
  MKR: T;
  LINK: T;
  KNC: T;
  WBTC: T;
  MANA: T;
  ZRX: T;
  SNX: T;
  BUSD: T;
  YFI: T;
  UNI: T;
  USD: T;
  REN: T;
  ENJ: T;
  UniDAIWETH: T;
  UniWBTCWETH: T;
  UniAAVEWETH: T;
  UniBATWETH: T;
  UniDAIUSDC: T;
  UniCRVWETH: T;
  UniLINKWETH: T;
  UniMKRWETH: T;
  UniRENWETH: T;
  UniSNXWETH: T;
  UniUNIWETH: T;
  UniUSDCWETH: T;
  UniWBTCUSDC: T;
  UniYFIWETH: T;
  BptWBTCWETH: T;
  BptBALWETH: T;
  WMATIC: T;
  STAKE: T;
  xSUSHI: T;
}

export type iAssetsWithoutETH<T> = Omit<iAssetBase<T>, 'ETH'>;

export type iAssetsWithoutUSD<T> = Omit<iAssetBase<T>, 'USD'>;

export type iAavePoolAssets<T> = Pick<
  iAssetsWithoutUSD<T>,
  | 'DAI'
  | 'TUSD'
  | 'USDC'
  | 'USDT'
  | 'SUSD'
  | 'AAVE'
  | 'BAT'
  | 'MKR'
  | 'LINK'
  | 'KNC'
  | 'WBTC'
  | 'MANA'
  | 'ZRX'
  | 'SNX'
  | 'BUSD'
  | 'WETH'
  | 'YFI'
  | 'UNI'
  | 'REN'
  | 'ENJ'
  | 'xSUSHI'
>;

export type iLpPoolAssets<T> = Pick<
  iAssetsWithoutUSD<T>,
  | 'DAI'
  | 'USDC'
  | 'USDT'
  | 'WBTC'
  | 'WETH'
  | 'UniDAIWETH'
  | 'UniWBTCWETH'
  | 'UniAAVEWETH'
  | 'UniBATWETH'
  | 'UniDAIUSDC'
  | 'UniCRVWETH'
  | 'UniLINKWETH'
  | 'UniMKRWETH'
  | 'UniRENWETH'
  | 'UniSNXWETH'
  | 'UniUNIWETH'
  | 'UniUSDCWETH'
  | 'UniWBTCUSDC'
  | 'UniYFIWETH'
  | 'BptWBTCWETH'
  | 'BptBALWETH'
>;

export type iMaticPoolAssets<T> = Pick<
  iAssetsWithoutUSD<T>,
  'DAI' | 'USDC' | 'USDT' | 'WBTC' | 'WETH' | 'WMATIC' | 'AAVE'
>;

export type iXDAIPoolAssets<T> = Pick<
  iAssetsWithoutUSD<T>,
  'DAI' | 'USDC' | 'USDT' | 'WBTC' | 'WETH' | 'STAKE'
>;

export type iMultiPoolsAssets<T> = iAssetCommon<T> | iAavePoolAssets<T>;

export type iAavePoolTokens<T> = Omit<iAavePoolAssets<T>, 'ETH'>;

export type iAssetAggregatorBase<T> = iAssetsWithoutETH<T>;

export interface IReserveParams extends IReserveBorrowParams, IReserveCollateralParams {
  aTokenImpl: eContractid;
  reserveFactor: string;
  supplyCap: string;
  strategy: IInterestRateStrategyParams;
}

export interface IInterestRateStrategyParams {
  name: string;
  optimalUtilizationRate: string;
  baseVariableBorrowRate: string;
  variableRateSlope1: string;
  variableRateSlope2: string;
  stableRateSlope1: string;
  stableRateSlope2: string;
}

export interface IReserveBorrowParams {
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  reserveDecimals: string;
  borrowCap: string;
}

export interface IReserveCollateralParams {
  baseLTVAsCollateral: string;
  liquidationThreshold: string;
  liquidationBonus: string;
}
export interface IMarketRates {
  borrowRate: string;
}

export type iParamsPerNetwork<T> =
  | iEthereumParamsPerNetwork<T>
  | iPolygonParamsPerNetwork<T>
  | iXDaiParamsPerNetwork<T>;

export interface iParamsPerNetworkAll<T>
  extends iEthereumParamsPerNetwork<T>,
    iPolygonParamsPerNetwork<T>,
    iXDaiParamsPerNetwork<T> {}

export interface iEthereumParamsPerNetwork<T> {
  [eEthereumNetwork.coverage]: T;
  [eEthereumNetwork.hardhatevm]: T;
  [eEthereumNetwork.kovan]: T;
  [eEthereumNetwork.ropsten]: T;
  [eEthereumNetwork.main]: T;
  [eEthereumNetwork.hardhat]: T;
  [eEthereumNetwork.tenderlyMain]: T;
}

export interface iPolygonParamsPerNetwork<T> {
  [ePolygonNetwork.matic]: T;
  [ePolygonNetwork.mumbai]: T;
}

export interface iXDaiParamsPerNetwork<T> {
  [eXDaiNetwork.xdai]: T;
}

export interface iParamsPerPool<T> {
  [AavePools.proto]: T;
  [AavePools.matic]: T;
  [AavePools.amm]: T;
}

export interface iBasicDistributionParams {
  receivers: string[];
  percentages: string[];
}

export enum RateMode {
  None = '0',
  Stable = '1',
  Variable = '2',
}

export interface ObjectString {
  [key: string]: string;
}

export interface IProtocolGlobalConfig {
  TokenDistributorPercentageBase: string;
  MockUsdPriceInWei: string;
  UsdAddress: tEthereumAddress;
  NilAddress: tEthereumAddress;
  OneAddress: tEthereumAddress;
  AaveReferral: string;
}

export interface IMocksConfig {
  AllAssetsInitialPrices: iAssetBase<string>;
}

export interface IRateOracleRatesCommon {
  [token: string]: IRate;
}

export interface IRate {
  borrowRate: string;
}

export interface ICommonConfiguration {
  MarketId: string;
  ATokenNamePrefix: string;
  StableDebtTokenNamePrefix: string;
  VariableDebtTokenNamePrefix: string;
  SymbolPrefix: string;
  ProviderId: number;
  ProtocolGlobalParams: IProtocolGlobalConfig;
  Mocks: IMocksConfig;
  ProviderRegistry: iParamsPerNetwork<tEthereumAddress | undefined>;
  ProviderRegistryOwner: iParamsPerNetwork<tEthereumAddress | undefined>;
  PoolConfigurator: iParamsPerNetwork<tEthereumAddress>;
  Pool: iParamsPerNetwork<tEthereumAddress>;
  RateOracleRatesCommon: iMultiPoolsAssets<IMarketRates>;
  RateOracle: iParamsPerNetwork<tEthereumAddress>;
  TokenDistributor: iParamsPerNetwork<tEthereumAddress>;
  AaveOracle: iParamsPerNetwork<tEthereumAddress>;
  FallbackOracle: iParamsPerNetwork<tEthereumAddress>;
  ChainlinkAggregator: iParamsPerNetwork<ITokenAddress>;
  PoolAdmin: iParamsPerNetwork<tEthereumAddress | undefined>;
  PoolAdminIndex: number;
  EmergencyAdmin: iParamsPerNetwork<tEthereumAddress | undefined>;
  EmergencyAdminIndex: number;
  ReserveAssets: iParamsPerNetwork<SymbolMap<tEthereumAddress>>;
  ReservesConfig: iMultiPoolsAssets<IReserveParams>;
  ATokenDomainSeparator: iParamsPerNetwork<string>;
  WETH: iParamsPerNetwork<tEthereumAddress>;
  WrappedNativeToken: iParamsPerNetwork<tEthereumAddress>;
  ReserveFactorTreasuryAddress: iParamsPerNetwork<tEthereumAddress>;
  IncentivesController: iParamsPerNetwork<tEthereumAddress>;
}

export interface IAaveConfiguration extends ICommonConfiguration {
  ReservesConfig: iAavePoolAssets<IReserveParams>;
}

export interface IAmmConfiguration extends ICommonConfiguration {
  ReservesConfig: iLpPoolAssets<IReserveParams>;
}

export interface IMaticConfiguration extends ICommonConfiguration {
  ReservesConfig: iMaticPoolAssets<IReserveParams>;
}

export interface IXDAIConfiguration extends ICommonConfiguration {
  ReservesConfig: iXDAIPoolAssets<IReserveParams>;
}

export interface ITokenAddress {
  [token: string]: tEthereumAddress;
}

export type PoolConfiguration = ICommonConfiguration | IAaveConfiguration;

export enum TokenContractId {
  DAI = 'DAI',
  AAVE = 'AAVE',
  TUSD = 'TUSD',
  BAT = 'BAT',
  WETH = 'WETH',
  USDC = 'USDC',
  USDT = 'USDT',
  SUSD = 'SUSD',
  ZRX = 'ZRX',
  MKR = 'MKR',
  WBTC = 'WBTC',
  LINK = 'LINK',
  KNC = 'KNC',
  MANA = 'MANA',
  REN = 'REN',
  SNX = 'SNX',
  BUSD = 'BUSD',
  USD = 'USD',
  YFI = 'YFI',
  UNI = 'UNI',
  ENJ = 'ENJ',
  UniDAIWETH = 'UniDAIWETH',
  UniWBTCWETH = 'UniWBTCWETH',
  UniAAVEWETH = 'UniAAVEWETH',
  UniBATWETH = 'UniBATWETH',
  UniDAIUSDC = 'UniDAIUSDC',
  UniCRVWETH = 'UniCRVWETH',
  UniLINKWETH = 'UniLINKWETH',
  UniMKRWETH = 'UniMKRWETH',
  UniRENWETH = 'UniRENWETH',
  UniSNXWETH = 'UniSNXWETH',
  UniUNIWETH = 'UniUNIWETH',
  UniUSDCWETH = 'UniUSDCWETH',
  UniWBTCUSDC = 'UniWBTCUSDC',
  UniYFIWETH = 'UniYFIWETH',
  BptWBTCWETH = 'BptWBTCWETH',
  BptBALWETH = 'BptBALWETH',
  WMATIC = 'WMATIC',
  STAKE = 'STAKE',
  xSUSHI = 'xSUSHI',
}
