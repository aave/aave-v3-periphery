import { increaseTime, waitForTx, advanceBlock, getBlockTimestamp } from '@aave/deploy-v3';
const { expect } = require('chai');

import { makeSuite } from '../helpers/make-suite';
import { timeLatest } from '../helpers/utils';
import { getRewardsData, getRewards } from './helpers/RewardsDistributor/data-helpers/asset-data';
import { getUserIndex } from './helpers/RewardsDistributor/data-helpers/asset-user-data';
import { getNormalizedDistribution } from './helpers/ray-math';

type ScenarioAction = {
  caseName: string;
  emissionPerSecond: string;
  shouldAccrue: boolean;
};

const getRewardsBalanceScenarios: ScenarioAction[] = [
  {
    caseName: 'Accrued rewards are 0',
    emissionPerSecond: '0',
    shouldAccrue: false,
  },
  {
    caseName: 'Accrued rewards are not 0',
    emissionPerSecond: '2432424',
    shouldAccrue: true,
  },
  {
    caseName: 'Accrued rewards are not 0',
    emissionPerSecond: '2432424',
    shouldAccrue: true,
  },
  {
    caseName: 'Accrued rewards are 0',
    emissionPerSecond: '0',
    shouldAccrue: false,
  },
];

makeSuite('AaveIncentivesController getRewardsBalance tests', (testEnv) => {
  for (const { caseName, emissionPerSecond, shouldAccrue } of getRewardsBalanceScenarios) {
    it(caseName, async () => {
      await increaseTime(100);

      const {
        rewardsController,
        users,
        aDaiMockV2,
        distributionEnd,
        stakedTokenStrategy,
        stakedAave: { address: reward },
      } = testEnv;

      const userAddress = users[1].address;
      const stakedByUser = 22 * caseName.length;
      const totalSupply = 33 * caseName.length;
      const underlyingAsset = aDaiMockV2.address;

      // update emissionPerSecond in advance to not affect user calculations
      await advanceBlock((await timeLatest()).add(100).toNumber());
      if (emissionPerSecond) {
        await aDaiMockV2.setUserBalanceAndSupply('0', totalSupply);
        await waitForTx(
          await rewardsController.configureAssets([
            {
              asset: underlyingAsset,
              reward,
              rewardOracle: testEnv.aavePriceAggregator,
              emissionPerSecond,
              distributionEnd,
              totalSupply,
              transferStrategy: stakedTokenStrategy.address,
            },
          ])
        );
      }
      await aDaiMockV2.handleActionOnAic(userAddress, totalSupply, stakedByUser);
      await advanceBlock((await timeLatest()).add(100).toNumber());

      const lastTxReceipt = await waitForTx(
        await aDaiMockV2.setUserBalanceAndSupply(stakedByUser, totalSupply)
      );
      const lastTxTimestamp = await getBlockTimestamp(lastTxReceipt.blockNumber);

      const unclaimedRewardsBefore = await rewardsController.getUserAccruedRewards(
        userAddress,
        reward
      );

      const unclaimedRewards = await rewardsController.getUserRewards(
        [underlyingAsset],
        userAddress,
        reward
      );

      const userIndex = await getUserIndex(rewardsController, userAddress, underlyingAsset, reward);
      const assetData = (await getRewardsData(rewardsController, [underlyingAsset], [reward]))[0];
      const assetIndex = await rewardsController.getAssetIndex(underlyingAsset, reward);

      await aDaiMockV2.cleanUserState();

      const expectedAssetIndex = getNormalizedDistribution(
        totalSupply,
        assetData.index,
        assetData.emissionPerSecond,
        assetData.lastUpdateTimestamp,
        lastTxTimestamp,
        distributionEnd
      );
      const expectedAccruedRewards = getRewards(stakedByUser, expectedAssetIndex, userIndex);

      expect(assetIndex[0].toString()).to.be.equal(assetData.index.toString());
      expect(assetIndex[1].toString()).to.be.equal(expectedAssetIndex.toFixed());
      if (shouldAccrue) {
        expect(expectedAccruedRewards).gt('0');
        expect(unclaimedRewards.toString()).to.be.equal(
          unclaimedRewardsBefore.add(expectedAccruedRewards).toString()
        );
      } else {
        expect(expectedAccruedRewards).to.be.eq('0');
        expect(unclaimedRewards.toString()).to.be.equal(unclaimedRewardsBefore.toString());
      }
    });
  }
});
