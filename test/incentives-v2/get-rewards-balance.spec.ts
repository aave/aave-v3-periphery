const { expect } = require('chai');

import { makeSuite } from '../helpers/make-suite';
import { getRewards } from '../DistributionManager/data-helpers/base-math';
import { advanceBlock, timeLatest, waitForTx, increaseTime } from '../../helpers/misc-utils';
import { getNormalizedDistribution } from '../helpers/ray-math';
import { getBlockTimestamp } from '../../helpers/contracts-helpers';
import { getUserIndex } from '../DistributionManagerV2/data-helpers/asset-user-data';
import { getRewardsData } from '../DistributionManagerV2/data-helpers/asset-data';
import { BigNumber } from '@ethersproject/bignumber';

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
        incentivesControllerV2,
        users,
        aDaiMockV2,
        distributionEnd,
        stakedTokenStrategy,
        stakedAave: { address: reward },
      } = testEnv;

      const userAddress = users[1].address;
      const stakedByUser = 22 * caseName.length;
      const totalStaked = 33 * caseName.length;
      const underlyingAsset = aDaiMockV2.address;

      // update emissionPerSecond in advance to not affect user calculations
      await advanceBlock((await timeLatest()).plus(100).toNumber());
      if (emissionPerSecond) {
        await aDaiMockV2.setUserBalanceAndSupply('0', totalStaked);
        await waitForTx(
          await incentivesControllerV2.configureAssets([
            {
              asset: underlyingAsset,
              reward,
              emissionPerSecond,
              distributionEnd,
              totalStaked,
              transferStrategy: stakedTokenStrategy.address,
              transferStrategyParams: '0x',
            },
          ])
        );
      }
      await aDaiMockV2.handleActionOnAic(userAddress, totalStaked, stakedByUser);
      await advanceBlock((await timeLatest()).plus(100).toNumber());

      const lastTxReceipt = await waitForTx(
        await aDaiMockV2.setUserBalanceAndSupply(stakedByUser, totalStaked)
      );
      const lastTxTimestamp = await getBlockTimestamp(lastTxReceipt.blockNumber);

      const unclaimedRewardsBefore = await incentivesControllerV2.getUserUnclaimedRewardsFromStorage(
        userAddress,
        reward
      );

      const unclaimedRewards = await incentivesControllerV2.getUserRewardsBalance(
        [underlyingAsset],
        userAddress,
        reward
      );

      const userIndex = await getUserIndex(
        incentivesControllerV2,
        userAddress,
        underlyingAsset,
        reward
      );
      const assetData = (
        await getRewardsData(incentivesControllerV2, [underlyingAsset], [reward])
      )[0];

      await aDaiMockV2.cleanUserState();

      const expectedAssetIndex = getNormalizedDistribution(
        totalStaked,
        assetData.index,
        assetData.emissionPerSecond,
        assetData.lastUpdateTimestamp,
        lastTxTimestamp,
        distributionEnd
      );
      const expectedAccruedRewards = getRewards(stakedByUser, expectedAssetIndex, userIndex);

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
