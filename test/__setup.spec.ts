import { ZERO_ADDRESS } from './../helpers/constants';
import rawHRE from 'hardhat';
import { ethers, Signer } from 'ethers';
import { waitForTx } from '../helpers/misc-utils';
import { eContractid, tEthereumAddress } from '../helpers/types';
import {
  deployAaveOracle,
  deployAaveProtocolDataProvider,
  deployACLManager,
  deployAllMockTokens,
  deployMockFlashLoanReceiver,
  deployMockIncentivesController,
  deployPool,
  deployPoolAddressesProvider,
  deployPoolAddressesProviderRegistry,
  deployPoolConfigurator,
  deployPriceOracle,
  deployReservesSetupHelper,
  deployWalletBalancerProvider,
  deployWETHGateway,
} from '../helpers/contracts-deployments';
import {
  deployAllMockAggregators,
  setInitialAssetPricesInOracle,
} from '../helpers/oracles-helpers';
import { insertContractAddressInDb } from '../helpers/contracts-helpers';

import { getEthersSigners, getEthersSignersAddresses } from '../helpers/wallet-helpers';
import {
  getPairsTokenAggregator,
  getPool,
  getPoolConfiguratorProxy,
} from '../helpers/contracts-getters';
import AaveConfig from '../market-config';
import {
  authorizeWETHGateway,
  configureReservesByHelper,
  initReservesByHelper,
} from '../helpers/init-helpers';
import { initializeMakeSuite } from './helpers/make-suite';

const MOCK_USD_PRICE_IN_WEI = AaveConfig.ProtocolGlobalParams.MockUsdPriceInWei;
const ALL_ASSETS_INITIAL_PRICES = AaveConfig.Mocks.AllAssetsInitialPrices;
const USD_ADDRESS = AaveConfig.ProtocolGlobalParams.UsdAddress;
const MOCK_CHAINLINK_AGGREGATORS_PRICES = AaveConfig.Mocks.AllAssetsInitialPrices;

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time('setup');
  const aaveAdmin = await deployer.getAddress();

  const mockTokens = await deployAllMockTokens();
  console.log('Deployed mocks');
  const addressesProvider = await deployPoolAddressesProvider(AaveConfig.MarketId);

  // Set ACL Admin
  await waitForTx(await addressesProvider.setACLAdmin(aaveAdmin));

  // Set ACL configuration
  // ACL Admin should be fixed beforehand
  const aclManager = await deployACLManager(addressesProvider.address);
  await waitForTx(await addressesProvider.setACLManager(aclManager.address));

  await waitForTx(await aclManager.addPoolAdmin(aaveAdmin));

  await waitForTx(await aclManager.addAssetListingAdmin(aaveAdmin));

  //setting users[1] as emergency admin, which is in position 2 in the DRE addresses list
  const addressList = await getEthersSignersAddresses();

  await waitForTx(await aclManager.addEmergencyAdmin(addressList[2]));

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
  await insertContractAddressInDb(eContractid.PoolConfigurator, poolConfiguratorProxy.address);
  await waitForTx(await aclManager.addRiskAdmin(addressList[3]));

  // Deploy deployment helpers
  await deployReservesSetupHelper();

  const fallbackOracle = await deployPriceOracle();
  await waitForTx(await fallbackOracle.setEthUsdPrice(MOCK_USD_PRICE_IN_WEI));
  await setInitialAssetPricesInOracle(
    ALL_ASSETS_INITIAL_PRICES,
    {
      WETH: mockTokens.WETH.address,
      DAI: mockTokens.DAI.address,
      TUSD: mockTokens.TUSD.address,
      USDC: mockTokens.USDC.address,
      USDT: mockTokens.USDT.address,
      SUSD: mockTokens.SUSD.address,
      AAVE: mockTokens.AAVE.address,
      BAT: mockTokens.BAT.address,
      MKR: mockTokens.MKR.address,
      LINK: mockTokens.LINK.address,
      KNC: mockTokens.KNC.address,
      WBTC: mockTokens.WBTC.address,
      MANA: mockTokens.MANA.address,
      ZRX: mockTokens.ZRX.address,
      SNX: mockTokens.SNX.address,
      BUSD: mockTokens.BUSD.address,
      YFI: mockTokens.BUSD.address,
      REN: mockTokens.REN.address,
      UNI: mockTokens.UNI.address,
      ENJ: mockTokens.ENJ.address,
      // DAI: mockTokens.LpDAI.address,
      // USDC: mockTokens.LpUSDC.address,
      // USDT: mockTokens.LpUSDT.address,
      // WBTC: mockTokens.LpWBTC.address,
      // WETH: mockTokens.LpWETH.address,
      UniDAIWETH: mockTokens.UniDAIWETH.address,
      UniWBTCWETH: mockTokens.UniWBTCWETH.address,
      UniAAVEWETH: mockTokens.UniAAVEWETH.address,
      UniBATWETH: mockTokens.UniBATWETH.address,
      UniDAIUSDC: mockTokens.UniDAIUSDC.address,
      UniCRVWETH: mockTokens.UniCRVWETH.address,
      UniLINKWETH: mockTokens.UniLINKWETH.address,
      UniMKRWETH: mockTokens.UniMKRWETH.address,
      UniRENWETH: mockTokens.UniRENWETH.address,
      UniSNXWETH: mockTokens.UniSNXWETH.address,
      UniUNIWETH: mockTokens.UniUNIWETH.address,
      UniUSDCWETH: mockTokens.UniUSDCWETH.address,
      UniWBTCUSDC: mockTokens.UniWBTCUSDC.address,
      UniYFIWETH: mockTokens.UniYFIWETH.address,
      BptWBTCWETH: mockTokens.BptWBTCWETH.address,
      BptBALWETH: mockTokens.BptBALWETH.address,
      WMATIC: mockTokens.WMATIC.address,
      USD: USD_ADDRESS,
      STAKE: mockTokens.STAKE.address,
      xSUSHI: mockTokens.xSUSHI.address,
    },
    fallbackOracle
  );

  const mockAggregators = await deployAllMockAggregators(MOCK_CHAINLINK_AGGREGATORS_PRICES);
  console.log('Mock aggs deployed');
  const allTokenAddresses = Object.entries(mockTokens).reduce(
    (accum: { [tokenSymbol: string]: tEthereumAddress }, [tokenSymbol, tokenContract]) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {}
  );
  const allAggregatorsAddresses = Object.entries(mockAggregators).reduce(
    (accum: { [tokenSymbol: string]: tEthereumAddress }, [tokenSymbol, aggregator]) => ({
      ...accum,
      [tokenSymbol]: aggregator.address,
    }),
    {}
  );

  const [tokens, aggregators] = getPairsTokenAggregator(allTokenAddresses, allAggregatorsAddresses);

  await deployAaveOracle([
    addressesProvider.address,
    tokens,
    aggregators,
    fallbackOracle.address,
    mockTokens.WETH.address,
    ethers.constants.WeiPerEther.toString(),
  ]);
  await waitForTx(await addressesProvider.setPriceOracle(fallbackOracle.address));

  const { USD, ...tokensAddressesWithoutUsd } = allTokenAddresses;
  const allReservesAddresses = {
    ...tokensAddressesWithoutUsd,
  };

  const reservesParams = AaveConfig.ReservesConfig;

  const protocolDataProvider = await deployAaveProtocolDataProvider(addressesProvider.address);
  console.log(5);

  await insertContractAddressInDb(
    eContractid.AaveProtocolDataProvider,
    protocolDataProvider.address
  );
  const admin = await deployer.getAddress();

  await addressesProvider.setPoolDataProvider(protocolDataProvider.address);

  console.log('Initialize configuration');

  const config = AaveConfig;

  const {
    ATokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
  } = config;
  const treasuryAddress = config.ReserveFactorTreasuryAddress;

  // Add an IncentivesController
  const mockIncentivesController = await deployMockIncentivesController();

  await initReservesByHelper(
    reservesParams,
    allReservesAddresses,
    ATokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    admin,
    ZERO_ADDRESS,
    mockIncentivesController.address // ZERO_ADDRESS
  );

  await configureReservesByHelper(
    reservesParams,
    allReservesAddresses,
    protocolDataProvider,
    admin
  );

  await deployMockFlashLoanReceiver(addressesProvider.address);

  const gateWay = await deployWETHGateway([mockTokens.WETH.address]);
  await authorizeWETHGateway(gateWay.address, poolAddress);
  await deployWalletBalancerProvider();

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
