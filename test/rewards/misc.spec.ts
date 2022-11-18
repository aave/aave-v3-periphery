import { RewardsController } from './../../types/RewardsController.d';
import {
  waitForTx,
  MAX_UINT_AMOUNT,
  ZERO_ADDRESS,
  deployReservesSetupHelper,
} from '@aave/deploy-v3';
import { expect } from 'chai';
import { makeSuite } from '../helpers/make-suite';
import { RANDOM_ADDRESSES } from '../helpers/constants';
import hre from 'hardhat';

makeSuite('RewardsController misc tests', (testEnv) => {
  it('Deployment should pass', async () => {
    const peiEmissionManager = RANDOM_ADDRESSES[1];
    const { deployer } = await hre.getNamedAccounts();

    if (process.env.COVERAGE === 'true') {
      console.log('Skip due coverage loss of data');
      return;
    }
    const artifact = await hre.deployments.deploy('RewardsController', {
      from: deployer,
      args: [],
    });
    const rewardsController = (await hre.ethers.getContractAt(
      artifact.abi,
      artifact.address
    )) as RewardsController;
    await expect((await rewardsController.getEmissionManager()).toString()).to.be.equal(
      ZERO_ADDRESS
    );
  });

  it('Should return same index while multiple asset index updates', async () => {
    const {
      aDaiMockV2,
      rewardsController,
      users,
      stakedAave: { address: reward },
      distributionEnd,
      stakedTokenStrategy,
    } = testEnv;
    await waitForTx(
      await rewardsController.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: '100',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
        },
      ])
    );
    await waitForTx(await aDaiMockV2.doubleHandleActionOnAic(users[1].address, '2000', '100'));
  });

  it('Should overflow index if passed a large emission', async () => {
    const {
      aDaiMockV2,
      rewardsController,
      users,
      distributionEnd,
      stakedAave: { address: reward },
      stakedTokenStrategy,
    } = testEnv;
    const MAX_88_UINT = '309485009821345068724781055';

    await waitForTx(
      await rewardsController.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: MAX_88_UINT,
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
        },
      ])
    );

    await expect(
      aDaiMockV2.doubleHandleActionOnAic(users[1].address, '2000', '100')
    ).to.be.revertedWith('INDEX_OVERFLOW');
  });

  it('Should claimRewards revert if to argument is ZERO_ADDRESS', async () => {
    const {
      aDaiMockV2,
      users,
      rewardsController,
      distributionEnd,
      stakedAave: { address: reward },
      stakedTokenStrategy,
    } = testEnv;
    const [userWithRewards] = users;

    await waitForTx(
      await rewardsController.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: '2000',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
        },
      ])
    );
    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    // Claim from third party claimer
    await expect(
      rewardsController
        .connect(userWithRewards.signer)
        .claimRewards([aDaiMockV2.address], MAX_UINT_AMOUNT, ZERO_ADDRESS, reward)
    ).to.be.revertedWith('INVALID_TO_ADDRESS');
  });

  it('Should claimRewards revert if to argument is ZERO_ADDRESS', async () => {
    const {
      aDaiMockV2,
      users,
      rewardsController,
      distributionEnd,
      stakedAave: { address: reward },
      stakedTokenStrategy,
    } = testEnv;
    const [userWithRewards] = users;

    await waitForTx(
      await rewardsController.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: '2000',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
        },
      ])
    );
    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    // Claim from third party claimer
    await expect(
      rewardsController
        .connect(userWithRewards.signer)
        .claimAllRewards([aDaiMockV2.address], ZERO_ADDRESS)
    ).to.be.revertedWith('INVALID_TO_ADDRESS');
  });

  it('Should claimRewards revert if performTransfer strategy call returns false', async () => {
    const {
      aDaiMockV2,
      users,
      rewardsController,
      distributionEnd,
      rewardToken: { address: reward },
      deployer,
    } = testEnv;
    const [userWithRewards] = users;

    const mockStrategy = await hre.deployments.deploy('MockBadTransferStrategy', {
      from: deployer.address,
      args: [rewardsController.address, deployer.address],
    });

    await waitForTx(
      await rewardsController.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: '2000',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: mockStrategy.address,
        },
      ])
    );
    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    await expect(
      rewardsController.connect(userWithRewards.signer).claimAllRewardsToSelf([aDaiMockV2.address])
    ).to.be.revertedWith('TRANSFER_ERROR');
  });
});
