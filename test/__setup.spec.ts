import rawHRE from 'hardhat';
import { ethers, Signer } from 'ethers';
import { MockContract } from 'ethereum-waffle';
import { waitForTx } from '../helpers/misc-utils';
import {
  AavePools,
  eContractid,
  iAssetBase,
  tEthereumAddress,
  TokenContractId,
} from '../helpers/types';
import {
  deployAaveOracle,
  deployAaveProtocolDataProvider,
  deployATokensAndRatesHelper,
  deployMintableERC20,
  deployMockFlashLoanReceiver,
  deployMockUniswapRouter,
  deployPool,
  deployPoolAddressesProvider,
  deployPoolAddressesProviderRegistry,
  deployPoolConfigurator,
  deployPriceOracle,
  deployRateOracle,
  deployStableAndVariableTokensHelper,
  deployWalletBalancerProvider,
  deployWETHGateway,
  deployWETHMocked,
} from '../helpers/contracts-deployments';
import {
  deployAllMockAggregators,
  setInitialAssetPricesInOracle,
  setInitialMarketRatesInRatesOracleByHelper,
} from '../helpers/oracles-helpers';
import {
  insertContractAddressInDb,
  MockTokenMap,
  registerContractInJsonDb,
} from '../helpers/contracts-helpers';

import { getEthersSigners, getEthersSignersAddresses } from '../helpers/wallet-helpers';
import { ZERO_ADDRESS } from '../helpers/constants';
import {
  getAllMockedTokens,
  getPairsTokenAggregator,
  getPool,
  getPoolConfiguratorProxy,
} from '../helpers/contracts-getters';
import {
  ConfigNames,
  getReservesConfigByPool,
  getTreasuryAddress,
  loadPoolConfig,
} from '../helpers/configuration';
import AaveConfig from '../markets/aave';
import {
  authorizeWETHGateway,
  configureReservesByHelper,
  initReservesByHelper,
} from '../helpers/init-helpers';
import { initializeMakeSuite } from './helpers/make-suite';

import { MintableERC20, WETH9Mocked } from '@aave/core-v3/types';
import { getAllAggregatorsAddresses, getAllTokenAddresses } from '../helpers/mock-helpers';

const deployAllMockTokens = async (deployer: Signer) => {
  const tokens: MockTokenMap = {};

  const protoConfigData = getReservesConfigByPool(AavePools.proto);

  for (const tokenSymbol of Object.keys(TokenContractId)) {
    if (tokenSymbol === 'WETH') {
      tokens[tokenSymbol] = await deployWETHMocked();
      await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
      continue;
    }

    let decimals = 18;
    let configData = (<any>protoConfigData)[tokenSymbol];
    if (!configData) {
      decimals = 18;
    }

    tokens[tokenSymbol] = await deployMintableERC20([
      tokenSymbol,
      tokenSymbol,
      configData ? configData.reserveDecimals : 18,
    ]);
    await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
  }

  return tokens;
};

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time('setup');

  const MOCK_USD_PRICE_IN_WEI = AaveConfig.ProtocolGlobalParams.MockUsdPriceInWei;
  const ALL_ASSETS_INITIAL_PRICES = AaveConfig.Mocks.AllAssetsInitialPrices;
  const USD_ADDRESS = AaveConfig.ProtocolGlobalParams.UsdAddress;
  const MOCK_CHAINLINK_AGGREGATORS_PRICES = AaveConfig.Mocks.AllAssetsInitialPrices;
  const RATE_ORACLE_RATES_COMMON = AaveConfig.RateOracleRatesCommon;
  const { UsdAddress } = AaveConfig.ProtocolGlobalParams;

  const aaveAdmin = await deployer.getAddress();

  const mockTokens = await deployAllMockTokens(deployer);
  console.log('Deployed mocks');
  const addressesProvider = await deployPoolAddressesProvider(AaveConfig.MarketId);
  await waitForTx(await addressesProvider.setPoolAdmin(aaveAdmin));

  //setting users[1] as emergency admin, which is in position 2 in the DRE addresses list
  const addressList = await getEthersSignersAddresses();

  await waitForTx(await addressesProvider.setEmergencyAdmin(addressList[2]));

  const addressesProviderRegistry = await deployPoolAddressesProviderRegistry();
  await waitForTx(
    await addressesProviderRegistry.registerAddressesProvider(addressesProvider.address, 1)
  );

  const poolImpl = await deployPool();

  await waitForTx(await addressesProvider.setPoolImpl(poolImpl.address));

  const poolAddress = await addressesProvider.getPool();
  const poolProxy = await getPool(poolAddress);

  await insertContractAddressInDb(eContractid.Pool, poolProxy.address);

  const poolConfiguratorImpl = await deployPoolConfigurator();
  await waitForTx(await addressesProvider.setPoolConfiguratorImpl(poolConfiguratorImpl.address));
  const poolConfiguratorProxy = await getPoolConfiguratorProxy(
    await addressesProvider.getPoolConfigurator()
  );
  await waitForTx(await poolConfiguratorProxy.registerRiskAdmin(addressList[3]));
  await insertContractAddressInDb(eContractid.PoolConfigurator, poolConfiguratorProxy.address);

  // Deploy deployment helpers
  await deployStableAndVariableTokensHelper([poolProxy.address, addressesProvider.address]);
  await deployATokensAndRatesHelper([
    poolProxy.address,
    addressesProvider.address,
    poolConfiguratorProxy.address,
  ]);

  const fallbackOracle = await deployPriceOracle();
  await waitForTx(await fallbackOracle.setEthUsdPrice(MOCK_USD_PRICE_IN_WEI));
  const defaultTokenList = {
    ...Object.fromEntries(Object.keys(TokenContractId).map((symbol) => [symbol, ''])),
    USD: USD_ADDRESS,
  } as iAssetBase<string>;
  const mockTokensAddress = Object.keys(mockTokens).reduce<iAssetBase<string>>((prev, curr) => {
    prev[curr as keyof iAssetBase<string>] = mockTokens[curr].address;
    return prev;
  }, defaultTokenList);
  await setInitialAssetPricesInOracle(ALL_ASSETS_INITIAL_PRICES, mockTokensAddress, fallbackOracle);

  const mockAggregators = await deployAllMockAggregators(MOCK_CHAINLINK_AGGREGATORS_PRICES);
  console.log('Mock aggs deployed');

  const allTokenAddresses = getAllTokenAddresses(mockTokens);
  const allAggregatorsAddresses = getAllAggregatorsAddresses(mockAggregators);

  const [tokens, aggregators] = getPairsTokenAggregator(allTokenAddresses, allAggregatorsAddresses);

  await deployAaveOracle([
    tokens,
    aggregators,
    fallbackOracle.address,
    mockTokens.WETH.address,
    ethers.constants.WeiPerEther.toString(),
  ]);
  await waitForTx(await addressesProvider.setPriceOracle(fallbackOracle.address));

  const rateOracle = await deployRateOracle();
  await waitForTx(await addressesProvider.setRateOracle(rateOracle.address));

  const { USD, ...tokensAddressesWithoutUsd } = allTokenAddresses;
  const allReservesAddresses = {
    ...tokensAddressesWithoutUsd,
  };
  await setInitialMarketRatesInRatesOracleByHelper(
    RATE_ORACLE_RATES_COMMON,
    allReservesAddresses,
    rateOracle,
    aaveAdmin
  );

  const reservesParams = getReservesConfigByPool(AavePools.proto);

  const testHelpers = await deployAaveProtocolDataProvider(addressesProvider.address);

  await insertContractAddressInDb(eContractid.AaveProtocolDataProvider, testHelpers.address);
  const admin = await deployer.getAddress();

  console.log('Initialize configuration');

  const config = loadPoolConfig(ConfigNames.Aave);

  const {
    ATokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
  } = config;
  const treasuryAddress = await getTreasuryAddress(config);

  await initReservesByHelper(
    reservesParams,
    allReservesAddresses,
    ATokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    admin,
    treasuryAddress,
    ZERO_ADDRESS,
    false
  );

  await configureReservesByHelper(reservesParams, allReservesAddresses, testHelpers, admin);
  poolConfiguratorProxy.dropReserve(mockTokens.KNC.address);

  await deployMockFlashLoanReceiver(addressesProvider.address);

  const mockUniswapRouter = await deployMockUniswapRouter();

  const adapterParams: [string, string, string] = [
    addressesProvider.address,
    mockUniswapRouter.address,
    mockTokens.WETH.address,
  ];

  //   await deployUniswapLiquiditySwapAdapter(adapterParams);
  //   await deployUniswapRepayAdapter(adapterParams);
  //   await deployFlashLiquidationAdapter(adapterParams);

  await deployWalletBalancerProvider();

  const gateWay = await deployWETHGateway([mockTokens.WETH.address]);
  await authorizeWETHGateway(gateWay.address, poolAddress);

  console.timeEnd('setup');
};

before(async () => {
  await rawHRE.run('set-DRE');
  const [deployer, secondaryWallet] = await getEthersSigners();
  const FORK = process.env.FORK;

  if (FORK) {
    await rawHRE.run('aave:mainnet', { skipRegistry: true });
  } else {
    console.log('-> Deploying test environment...');
    await buildTestEnv(deployer, secondaryWallet);
  }

  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
