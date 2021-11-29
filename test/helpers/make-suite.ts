import { StakedTokenTransferStrategy } from './../../types/StakedTokenTransferStrategy';
import { PullRewardsTransferStrategy } from './../../types/PullRewardsTransferStrategy';
import { ATokenMock } from './../../types/ATokenMock.d';
import { IncentivesControllerV2 } from './../../types/IncentivesControllerV2';
import hre from 'hardhat';
import { Signer } from 'ethers';
import { usingTenderly } from '../../helpers/tenderly-utils';
import chai from 'chai';
import bignumberChai from 'chai-bignumber';
import { solidity } from 'ethereum-waffle';
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
  getWETHGateway,
  WETHGateway,
  tEthereumAddress,
  getEthersSigners,
  getAaveOracle,
  getIncentivesV2,
  getBlockTimestamp,
  TESTNET_REWARD_TOKEN_PREFIX,
  getSubTokensByPrefix,
  getPullRewardsStrategy,
  getStakedRewardsStrategy,
  StakedAaveV3,
  getStakeAave,
  waitForTx,
  MAX_UINT_AMOUNT,
  TESTNET_PRICE_AGGR_PREFIX,
} from '@aave/deploy-v3';
import { deployATokenMock } from '../incentives-v2/helpers/deploy';
import { parseEther } from 'ethers/lib/utils';

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
  wethGateway: WETHGateway;
  incentivesControllerV2: IncentivesControllerV2;
  rewardsVault: SignerWithAddress;
  stakedAave: StakedAaveV3;
  aaveToken: MintableERC20;
  aDaiMockV2: ATokenMock;
  aWethMockV2: ATokenMock;
  pullRewardsStrategy: PullRewardsTransferStrategy;
  stakedTokenStrategy: StakedTokenTransferStrategy;
  rewardToken: MintableERC20;
  distributionEnd: number;
  aavePriceAggregator: tEthereumAddress;
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
  wethGateway: {} as WETHGateway,
  incentivesControllerV2: {} as IncentivesControllerV2,
  rewardsVault: {} as SignerWithAddress,
  stakedAave: {} as StakedAaveV3,
  aaveToken: {} as MintableERC20,
  aDaiMockV2: {} as ATokenMock,
  aWethMockV2: {} as ATokenMock,
  pullRewardsStrategy: {} as PullRewardsTransferStrategy,
  stakedTokenStrategy: {} as StakedTokenTransferStrategy,
  rewardToken: {} as MintableERC20,
  distributionEnd: 0,
  aavePriceAggregator: '',
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

  testEnv.addressesProvider = await getPoolAddressesProvider();

  testEnv.registry = await getPoolAddressesProviderRegistry();
  testEnv.registry = await getPoolAddressesProviderRegistry();
  testEnv.oracle = await getAaveOracle();

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

  if (!aDaiAddress || !aWEthAddress || !aUsdcAddress) {
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

  // incentives-v2 setup
  const rewardTokens = await getSubTokensByPrefix(TESTNET_REWARD_TOKEN_PREFIX);
  const incentivesControllerV2 = ((await getIncentivesV2()) as any) as IncentivesControllerV2;
  testEnv.incentivesControllerV2 = incentivesControllerV2;
  testEnv.rewardsVault = rewardsVault;
  testEnv.stakedAave = await getStakeAave();
  testEnv.aaveToken = testEnv.aave;
  testEnv.aDaiMockV2 = await deployATokenMock(incentivesControllerV2.address, 'aDaiV2');
  testEnv.aWethMockV2 = await deployATokenMock(incentivesControllerV2.address, 'aWethV2');
  testEnv.pullRewardsStrategy = (await getPullRewardsStrategy()) as PullRewardsTransferStrategy;
  testEnv.stakedTokenStrategy = (await getStakedRewardsStrategy()) as StakedTokenTransferStrategy;
  testEnv.rewardToken = await getMintableERC20(rewardTokens[0].artifact.address);
  testEnv.distributionEnd = (await getBlockTimestamp()) + 1000 * 60 * 60;
  testEnv.aavePriceAggregator = (
    await hre.deployments.get(`AAVE${TESTNET_PRICE_AGGR_PREFIX}`)
  ).address;
  await waitForTx(
    await testEnv.aaveToken
      .connect(rewardsVault.signer)
      ['mint(address,uint256)'](rewardsVault.address, parseEther('3000000'))
  );
  await waitForTx(
    await testEnv.rewardToken
      .connect(rewardsVault.signer)
      ['mint(address,uint256)'](rewardsVault.address, parseEther('2000000'))
  );

  await waitForTx(
    await testEnv.aaveToken
      .connect(rewardsVault.signer)
      .transfer(incentivesControllerV2.address, parseEther('1000000'))
  );

  await waitForTx(
    await testEnv.rewardToken
      .connect(rewardsVault.signer)
      .approve(incentivesControllerV2.address, MAX_UINT_AMOUNT)
  );

  await waitForTx(
    await (await getAaveOracle()).setAssetSources(
      [testEnv.stakedAave.address],
      [await testEnv.aavePriceAggregator]
    )
  );
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
