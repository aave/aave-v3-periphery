import hre from 'hardhat';
import { fail } from 'assert';
import { increaseTime, waitForTx, getBlockTimestamp } from '@aave/deploy-v3';
import { makeSuite } from '../helpers/make-suite';
import { eventLogChecker } from './helpers/comparator-engine';
import {
  getRewardsData,
  getRewards,
  assetDataComparator,
} from './helpers/RewardsDistributor/data-helpers/asset-data';
import { getUserIndex } from './helpers/RewardsDistributor/data-helpers/asset-user-data';

const { expect } = require('chai');

type ScenarioAction = {
  caseName: string;
  emissionPerSecond?: string;
  userBalance: string;
  totalSupply: string;
  customTimeMovement?: number;
};

const handleActionScenarios: ScenarioAction[] = [
  {
    caseName: 'All 0',
    emissionPerSecond: '0',
    userBalance: '0',
    totalSupply: '0',
  },
  {
    caseName: 'Accrued rewards are 0, 0 emission',
    emissionPerSecond: '0',
    userBalance: '22',
    totalSupply: '22',
  },
  {
    caseName: 'Accrued rewards are 0, 0 user balance',
    emissionPerSecond: '100',
    userBalance: '0',
    totalSupply: '22',
  },
  {
    caseName: '1. Accrued rewards are not 0',
    userBalance: '22',
    totalSupply: '22',
  },
  {
    caseName: '2. Accrued rewards are not 0',
    emissionPerSecond: '1000',
    userBalance: '2332',
    totalSupply: '3232',
  },
];

makeSuite('AaveIncentivesController handleAction tests', (testEnv) => {
  for (const {
    caseName,
    totalSupply,
    userBalance,
    customTimeMovement,
    emissionPerSecond,
  } of handleActionScenarios) {
    it(caseName, async () => {
      await increaseTime(100);

      const {
        rewardsController,
        users,
        aDaiMockV2,
        stakedAave: { address: reward },
        stakedTokenStrategy,
        distributionEnd,
      } = testEnv;
      const userAddress = users[1].address;
      const underlyingAsset = aDaiMockV2.address;

      // update emissionPerSecond in advance to not affect user calculations
      if (emissionPerSecond) {
        await waitForTx(
          await rewardsController.configureAssets([
            {
              asset: underlyingAsset,
              reward,
              rewardOracle: testEnv.aavePriceAggregator,
              emissionPerSecond: emissionPerSecond,
              distributionEnd,
              totalSupply: '0',
              transferStrategy: stakedTokenStrategy.address,
            },
          ])
        );
      }

      const rewardsBalanceBefore = await rewardsController.getUserAccruedRewards(
        userAddress,
        reward
      );
      const userIndexBefore = await getUserIndex(
        rewardsController,
        userAddress,
        underlyingAsset,
        reward
      );
      const assetDataBefore = (
        await getRewardsData(rewardsController, [underlyingAsset], [reward])
      )[0];

      if (customTimeMovement) {
        await increaseTime(customTimeMovement);
      }

      await waitForTx(await aDaiMockV2.setUserBalanceAndSupply(userBalance, totalSupply));
      const handleActionReceipt = await waitForTx(
        await aDaiMockV2.handleActionOnAic(userAddress, totalSupply, userBalance)
      );
      const eventsEmitted =
        handleActionReceipt.events?.map((e) => rewardsController.interface.parseLog(e)) || [];
      const actionBlockTimestamp = await getBlockTimestamp(handleActionReceipt.blockNumber);

      const userIndexAfter = await getUserIndex(
        rewardsController,
        userAddress,
        underlyingAsset,
        reward
      );

      const assetDataAfter = (
        await getRewardsData(rewardsController, [underlyingAsset], [reward])
      )[0];

      const expectedAccruedRewards = getRewards(
        userBalance,
        userIndexAfter,
        userIndexBefore
      ).toString();

      const rewardsBalanceAfter = await rewardsController.getUserRewards(
        [underlyingAsset],
        userAddress,
        reward
      );

      // ------- Distribution Manager tests START -----
      await assetDataComparator(
        { underlyingAsset, totalSupply: totalSupply },
        assetDataBefore,
        assetDataAfter,
        actionBlockTimestamp,
        distributionEnd,
        {}
      );
      expect(userIndexAfter.toString()).to.be.equal(
        assetDataAfter.index.toString(),
        'user index are not correctly updated'
      );

      if (!assetDataAfter.index.eq(assetDataBefore.index)) {
        const eventAccrued = eventsEmitted.find(({ name }) => name === 'Accrued');

        if (!eventAccrued) {
          fail('missing AssetIndexUpdated event');
        }
        eventLogChecker(eventAccrued, 'Accrued', [
          assetDataAfter.underlyingAsset,
          reward,
          userAddress,
          assetDataAfter.index,
          assetDataAfter.index,
          expectedAccruedRewards,
        ]);
      }
      // ------- Distribution Manager tests END -----

      // ------- PEI tests START -----
      expect(rewardsBalanceAfter.toString()).to.be.equal(
        rewardsBalanceBefore.add(expectedAccruedRewards).toString(),
        'rewards balance are incorrect'
      );

      // ------- PEI tests END -----
    });
  }
});
