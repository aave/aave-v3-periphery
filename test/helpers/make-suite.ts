import { StakedTokenTransferStrategy } from './../../types/StakedTokenTransferStrategy';
import { PullRewardsTransferStrategy } from './../../types/PullRewardsTransferStrategy';
import { ATokenMock } from './../../types/ATokenMock.d';
import { RewardsController } from './../../types/RewardsController';
import hre from 'hardhat';
import { Signer } from 'ethers';
import bluebird from 'bluebird';
import { usingTenderly } from '../../helpers/tenderly-utils';
import chai from 'chai';
import bignumberChai from 'chai-bignumber';
import {
  getPool,
  getPoolConfiguratorProxy,
  getPoolAddressesProvider,
  getPoolAddressesProviderRegistry,
  getAaveProtocolDataProvider,
  getAToken,
  getVariableDebtToken,
  getStableDebtToken,
  getMintableERC20,
  getWETHMocked,
  evmSnapshot,
  evmRevert,
  AaveProtocolDataProvider,
  AToken,
  MintableERC20,
  Pool,
  PoolAddressesProvider,
  PoolAddressesProviderRegistry,
  PoolConfigurator,
  StableDebtToken,
  VariableDebtToken,
  WETH9Mocked,
  AaveOracle,
  getWrappedTokenGateway,
  WrappedTokenGatewayV3,
  tEthereumAddress,
  getEthersSigners,
  getAaveOracle,
  getIncentivesV2,
  getBlockTimestamp,
  TESTNET_REWARD_TOKEN_PREFIX,
  getSubTokensByPrefix,
  getPullRewardsStrategy,
  getStakedRewardsStrategy,
  getStakeAave,
  waitForTx,
  MAX_UINT_AMOUNT,
  TESTNET_PRICE_AGGR_PREFIX,
  deployMintableERC20,
  getEmissionManager,
  StakedTokenV2Rev3,
} from '@aave/deploy-v3';
import { deployATokenMock } from '../rewards/helpers/deploy';
import { parseEther } from 'ethers/lib/utils';
import { EmissionManager, EmissionManager__factory } from '../../types';

chai.use(bignumberChai());

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
  oracle: AaveOracle;
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
  WrappedTokenGatewayV3: WrappedTokenGatewayV3;
  emissionManager: EmissionManager;
  rewardsController: RewardsController;
  rewardsVault: SignerWithAddress;
  stakedAave: StakedTokenV2Rev3;
  aaveToken: MintableERC20;
  aDaiMockV2: ATokenMock;
  aWethMockV2: ATokenMock;
  aAaveMockV2: ATokenMock;
  aEursMockV2: ATokenMock;
  pullRewardsStrategy: PullRewardsTransferStrategy;
  stakedTokenStrategy: StakedTokenTransferStrategy;
  rewardToken: MintableERC20;
  rewardTokens: MintableERC20[];
  distributionEnd: number;
  aavePriceAggregator: tEthereumAddress;
  rewardPriceAggregator: tEthereumAddress;
  rewardsPriceAggregators: tEthereumAddress[];
}

let hardhatevmSnapshotId = '0x1';
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
  oracle: {} as AaveOracle,
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
  WrappedTokenGatewayV3: {} as WrappedTokenGatewayV3,
  emissionManager: {} as EmissionManager,
  rewardsController: {} as RewardsController,
  rewardsVault: {} as SignerWithAddress,
  stakedAave: {} as StakedTokenV2Rev3,
  aaveToken: {} as MintableERC20,
  aDaiMockV2: {} as ATokenMock,
  aWethMockV2: {} as ATokenMock,
  aAaveMockV2: {} as ATokenMock,
  aEursMockV2: {} as ATokenMock,
  pullRewardsStrategy: {} as PullRewardsTransferStrategy,
  stakedTokenStrategy: {} as StakedTokenTransferStrategy,
  rewardToken: {} as MintableERC20,
  rewardTokens: [],
  distributionEnd: 0,
  aavePriceAggregator: '',
  rewardPriceAggregator: '',
  rewardsPriceAggregators: [],
} as TestEnv;

export async function initializeMakeSuite() {
  const [_deployer, , , ...restSigners] = await getEthersSigners();
  const { incentivesRewardsVault } = await hre.getNamedAccounts();
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  const rewardsVault: SignerWithAddress = {
    address: incentivesRewardsVault,
    signer: await hre.ethers.getSigner(incentivesRewardsVault),
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

  const emissionManager = await getEmissionManager();
  testEnv.addressesProvider = await getPoolAddressesProvider();

  testEnv.registry = await getPoolAddressesProviderRegistry();
  testEnv.registry = await getPoolAddressesProviderRegistry();
  testEnv.oracle = await getAaveOracle();

  testEnv.helpersContract = await getAaveProtocolDataProvider();

  const allTokens = await testEnv.helpersContract.getAllATokens();
  const aDaiAddress = allTokens.find((aToken) => aToken.symbol === 'aTestDAI')?.tokenAddress;
  const aUsdcAddress = allTokens.find((aToken) => aToken.symbol === 'aTestUSDC')?.tokenAddress;

  const aWEthAddress = allTokens.find((aToken) => aToken.symbol === 'aTestWETH')?.tokenAddress;

  const reservesTokens = await testEnv.helpersContract.getAllReservesTokens();

  const daiAddress = reservesTokens.find((token) => token.symbol === 'DAI')?.tokenAddress;
  const {
    variableDebtTokenAddress: variableDebtDaiAddress,
    stableDebtTokenAddress: stableDebtDaiAddress,
  } = await testEnv.helpersContract.getReserveTokensAddresses(daiAddress || '');
  const usdcAddress = reservesTokens.find((token) => token.symbol === 'USDC')?.tokenAddress;
  const aaveAddress = reservesTokens.find((token) => token.symbol === 'AAVE')?.tokenAddress;
  const wethAddress = reservesTokens.find((token) => token.symbol === 'WETH')?.tokenAddress;

  if (!aDaiAddress || !aWEthAddress || !aUsdcAddress) {
    console.error('Missing AToken address');
    process.exit(1);
  }
  if (!daiAddress || !usdcAddress || !aaveAddress || !wethAddress) {
    console.error('Missing Reserve address');
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
  testEnv.WrappedTokenGatewayV3 = await getWrappedTokenGateway();

  // Added extra reward token
  await hre.deployments.deploy(`EXTRA${TESTNET_REWARD_TOKEN_PREFIX}`, {
    from: await _deployer.getAddress(),
    contract: 'MintableERC20',
    args: ['EXTRA', 'EXTRA', 18],
    log: true,
  });
  await hre.deployments.deploy(`EXTRA${TESTNET_PRICE_AGGR_PREFIX}`, {
    args: [parseEther('2')],
    from: await _deployer.getAddress(),
    log: true,
    contract: 'MockAggregator',
  });
  // Setup Incentives V2 environment
  const rewardTokens = await getSubTokensByPrefix(TESTNET_REWARD_TOKEN_PREFIX);
  const rewardsController = (await getIncentivesV2()) as any as RewardsController;
  testEnv.rewardsController = rewardsController;
  testEnv.emissionManager = await new EmissionManager__factory(deployer.signer).deploy(
    rewardsController.address,
    deployer.address
  );
  testEnv.rewardsVault = rewardsVault;
  testEnv.stakedAave = await getStakeAave();
  testEnv.aaveToken = testEnv.aave;
  testEnv.aDaiMockV2 = await deployATokenMock(rewardsController.address, 'aDaiV2');
  testEnv.aWethMockV2 = await deployATokenMock(rewardsController.address, 'aWethV2');
  testEnv.aAaveMockV2 = await deployATokenMock(rewardsController.address, 'aAaveV2');
  testEnv.aEursMockV2 = await deployATokenMock(rewardsController.address, 'aEursV2', 2);
  testEnv.pullRewardsStrategy = (await getPullRewardsStrategy()) as PullRewardsTransferStrategy;
  testEnv.stakedTokenStrategy =
    (await getStakedRewardsStrategy()) as any as StakedTokenTransferStrategy;
  testEnv.rewardToken = await getMintableERC20(rewardTokens[0].artifact.address);
  testEnv.rewardTokens = await bluebird.map(rewardTokens, ({ artifact }) =>
    getMintableERC20(artifact.address)
  );
  testEnv.distributionEnd = (await getBlockTimestamp()) + 1000 * 60 * 60;
  testEnv.aavePriceAggregator = (
    await hre.deployments.get(`AAVE${TESTNET_PRICE_AGGR_PREFIX}`)
  ).address;
  testEnv.rewardPriceAggregator = (
    await hre.deployments.get(`${rewardTokens[0].symbol}${TESTNET_PRICE_AGGR_PREFIX}`)
  ).address;
  testEnv.rewardsPriceAggregators = await bluebird.map(
    rewardTokens,
    async ({ symbol }) =>
      (
        await hre.deployments.get(`${symbol}${TESTNET_PRICE_AGGR_PREFIX}`)
      ).address
  );
  await waitForTx(
    await testEnv.aaveToken
      .connect(rewardsVault.signer)
      ['mint(address,uint256)'](rewardsVault.address, parseEther('60000000000'))
  );
  await waitForTx(
    await testEnv.rewardToken
      .connect(rewardsVault.signer)
      ['mint(address,uint256)'](rewardsVault.address, parseEther('200000000'))
  );

  await waitForTx(
    await testEnv.aaveToken
      .connect(rewardsVault.signer)
      .transfer(testEnv.stakedTokenStrategy.address, parseEther('30000000000'))
  );
  await waitForTx(await emissionManager.setEmissionManager(deployer.address));
}

const setSnapshot = async () => {
  if (usingTenderly()) {
    setHardhatevmSnapshotId((await hre.tenderlyNetwork.getHead()) || '0x1');
    return;
  }
  setHardhatevmSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  if (usingTenderly()) {
    await hre.tenderlyNetwork.setHead(hardhatevmSnapshotId);
    return;
  }
  await evmRevert(hardhatevmSnapshotId);
};

export async function makeSuite(name: string, tests: (testEnv: TestEnv) => void): Promise<void> {
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
