import { increaseTime, waitForTx, advanceBlock, getBlockTimestamp } from '@aave/deploy-v3';
import { BigNumber } from 'ethers';
const { expect } = require('chai');

import { makeSuite } from '../helpers/make-suite';
import { timeLatest } from '../helpers/utils';
import { getRewardsData, getRewards } from './helpers/RewardsDistributor/data-helpers/asset-data';
import { getUserIndex } from './helpers/RewardsDistributor/data-helpers/asset-user-data';
import { getNormalizedDistribution } from './helpers/ray-math';

type ScenarioAction = {
  caseName: string;
  emissionPerSecond: string[];
  shouldAccrue: boolean;
  userBalance: string;
};

const getRewardsBalanceScenarios: ScenarioAction[] = [
  {
    caseName: 'Accrued rewards are 0',
    emissionPerSecond: ['0', '0'],
    userBalance: '101010',
    shouldAccrue: false,
  },
  {
    caseName: 'No accrued rewards due token balance is 0',
    emissionPerSecond: ['2432424', '2432424'],
    userBalance: '0',
    shouldAccrue: false,
  },
  {
    caseName: 'Accrued rewards are not 0',
    emissionPerSecond: ['2432424', '2432424'],
    userBalance: '101010',
    shouldAccrue: true,
  },
  {
    caseName: 'No accrued rewards due token balance is 0',
    emissionPerSecond: ['2432424', '2432424'],
    userBalance: '0',
    shouldAccrue: false,
  },
  {
    caseName: 'Accrued rewards for first reward but second reward emission is 0',
    emissionPerSecond: ['2432424', '0'],
    userBalance: '101010',
    shouldAccrue: true,
  },
  {
    caseName: 'No accrued rewards for first reward but accrued for second',
    emissionPerSecond: ['0', '2432424'],
    userBalance: '101010',
    shouldAccrue: true,
  },
  {
    caseName: 'Accrued rewards are 0',
    userBalance: '101010',
    emissionPerSecond: ['0', '0'],
    shouldAccrue: false,
  },
];

makeSuite('AaveIncentivesController getRewardsBalance tests', (testEnv) => {
  for (const {
    caseName,
    emissionPerSecond,
    shouldAccrue,
    userBalance,
  } of getRewardsBalanceScenarios) {
    it(caseName, async () => {
      await increaseTime(100);

      const {
        rewardsController,
        users,
        aDaiMockV2,
        distributionEnd,
        stakedTokenStrategy,
        stakedAave: { address: firstReward },
        rewardToken: { address: secondReward },
      } = testEnv;

      const userAddress = users[1].address;
      const stakedByUser = userBalance;
      const totalSupply = 33 * caseName.length;
      const underlyingAsset = aDaiMockV2.address;
      const rewards = [firstReward, secondReward];
      // update emissionPerSecond in advance to not affect user calculations
      await advanceBlock((await timeLatest()).add(100).toNumber());
      await aDaiMockV2.setUserBalanceAndSupply('0', totalSupply);
      await waitForTx(
        await rewardsController.configureAssets(
          emissionPerSecond.map((eps, index) => ({
            asset: underlyingAsset,
            reward: rewards[index],
            rewardOracle: testEnv.aavePriceAggregator,
            emissionPerSecond: eps,
            distributionEnd,
            totalSupply,
            transferStrategy: stakedTokenStrategy.address,
          }))
        )
      );
      await aDaiMockV2.handleActionOnAic(userAddress, totalSupply, stakedByUser);
      await advanceBlock((await timeLatest()).add(100).toNumber());

      const lastTxReceipt = await waitForTx(
        await aDaiMockV2.setUserBalanceAndSupply(stakedByUser, totalSupply)
      );
      const lastTxTimestamp = await getBlockTimestamp(lastTxReceipt.blockNumber);

      const unclaimedRewardsOneBefore = await rewardsController.getUserAccruedRewards(
        userAddress,
        rewards[0]
      );

      const unclaimedRewardsTwoBefore = await rewardsController.getUserAccruedRewards(
        userAddress,
        rewards[1]
      );

      const allUnclaimedRewardsBefore = unclaimedRewardsOneBefore.add(unclaimedRewardsTwoBefore);

      const [, unclaimedRewards] = await rewardsController.getAllUserRewards(
        [underlyingAsset],
        userAddress
      );
      const allUnclaimedRewards = unclaimedRewards.reduce(
        (acc, value) => acc.add(value),
        BigNumber.from('0')
      );

      const userIndexOne = await getUserIndex(
        rewardsController,
        userAddress,
        underlyingAsset,
        rewards[0]
      );
      const userIndexTwo = await getUserIndex(
        rewardsController,
        userAddress,
        underlyingAsset,
        rewards[1]
      );
      const assetDataOne = (
        await getRewardsData(rewardsController, [underlyingAsset], [rewards[0]])
      )[0];
      const assetDataTwo = (
        await getRewardsData(rewardsController, [underlyingAsset], [rewards[1]])
      )[0];
      await aDaiMockV2.cleanUserState();

      const expectedAssetIndexOne = getNormalizedDistribution(
        totalSupply,
        assetDataOne.index,
        assetDataOne.emissionPerSecond,
        assetDataOne.lastUpdateTimestamp,
        lastTxTimestamp,
        distributionEnd
      );
      const expectedAssetIndexTwo = getNormalizedDistribution(
        totalSupply,
        assetDataTwo.index,
        assetDataTwo.emissionPerSecond,
        assetDataTwo.lastUpdateTimestamp,
        lastTxTimestamp,
        distributionEnd
      );
      const expectedAccruedRewardsOne = getRewards(
        stakedByUser,
        expectedAssetIndexOne,
        userIndexOne
      );

      const expectedAccruedRewardsTwo = getRewards(
        stakedByUser,
        expectedAssetIndexTwo,
        userIndexTwo
      );
      const expectedAccruedRewards = expectedAccruedRewardsOne.add(expectedAccruedRewardsTwo);

      if (shouldAccrue) {
        expect(expectedAccruedRewards).gt('0');
        expect(unclaimedRewards[0]).to.be.equal(
          unclaimedRewardsOneBefore.add(expectedAccruedRewardsOne)
        );
        expect(unclaimedRewards[1]).to.be.equal(
          unclaimedRewardsTwoBefore.add(expectedAccruedRewardsTwo)
        );
        expect(allUnclaimedRewards.toString()).to.be.equal(
          allUnclaimedRewardsBefore.add(expectedAccruedRewards).toString()
        );
      } else {
        expect(expectedAccruedRewards).to.be.eq('0');
        expect(allUnclaimedRewards.toString()).to.be.equal(allUnclaimedRewardsBefore.toString());
      }
    });
  }
});
