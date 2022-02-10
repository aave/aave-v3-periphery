import {
  getBlockTimestamp,
  increaseTime,
  waitForTx,
  MAX_UINT_AMOUNT,
  advanceTimeAndBlock,
} from '@aave/deploy-v3';
import { BigNumber } from 'ethers';
import { makeSuite } from '../helpers/make-suite';
import { comparatorEngine } from './helpers/comparator-engine';
import {
  assetDataComparator,
  getRewards,
  getRewardsData,
} from './helpers/RewardsDistributor/data-helpers/asset-data';
import { getUserIndex } from './helpers/RewardsDistributor/data-helpers/asset-user-data';
import hre from 'hardhat';

const { expect } = require('chai');

type ScenarioAction = {
  caseName: string;
  emissionPerSecond?: string;
  amountToClaim: string;
};

const getRewardsBalanceScenarios: ScenarioAction[] = [
  {
    caseName: 'Accrued rewards are 0, claim 0',
    emissionPerSecond: '0',
    amountToClaim: '0',
  },
  {
    caseName: 'Accrued rewards are 0, claim not 0',
    emissionPerSecond: '0',
    amountToClaim: '100',
  },
  {
    caseName: 'Accrued rewards are not 0',
    emissionPerSecond: '2432424',
    amountToClaim: '10',
  },
  {
    caseName: 'Should allow -1',
    emissionPerSecond: '2432424',
    amountToClaim: MAX_UINT_AMOUNT,
  },
  {
    caseName: 'Should withdraw everything if amountToClaim more then rewards balance',
    emissionPerSecond: '100',
    amountToClaim: '1034',
  },
];

makeSuite('AaveIncentivesController claimRewardsToSelf tests', (testEnv) => {
  for (const {
    caseName,
    amountToClaim: _amountToClaim,
    emissionPerSecond,
  } of getRewardsBalanceScenarios) {
    let amountToClaim = _amountToClaim;
    it(caseName, async () => {
      const { timestamp } = await hre.ethers.provider.getBlock('latest');
      const timePerTest = 31536000;
      const distributionEnd = timestamp + timePerTest * getRewardsBalanceScenarios.length;
      await advanceTimeAndBlock(timePerTest);
      const { rewardsController, stakedAave, aDaiMockV2, stakedTokenStrategy } = testEnv;

      const userAddress = await rewardsController.signer.getAddress();

      const underlyingAsset = aDaiMockV2.address;
      const stakedByUser = 22 * caseName.length;
      const totalSupply = 33 * caseName.length;
      const reward = stakedAave.address;

      await aDaiMockV2.setUserBalanceAndSupply(stakedByUser, totalSupply);

      // update emissionPerSecond in advance to not affect user calculations
      if (emissionPerSecond) {
        await waitForTx(
          await rewardsController.configureAssets([
            {
              asset: aDaiMockV2.address,
              emissionPerSecond,
              totalSupply,
              reward,
              rewardOracle: testEnv.aavePriceAggregator,
              distributionEnd,
              transferStrategy: stakedTokenStrategy.address,
            },
          ])
        );
      }
      const destinationAddress = userAddress;

      const destinationAddressBalanceBefore = await stakedAave.balanceOf(destinationAddress);
      await aDaiMockV2.handleActionOnAic(userAddress, totalSupply, stakedByUser);

      const unclaimedRewardsBefore = await rewardsController.getUserRewards(
        [underlyingAsset],
        userAddress,
        reward
      );
      const unclaimedRewardsStorageBefore = await rewardsController.getUserAccruedRewards(
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

      const action = await rewardsController.claimRewardsToSelf(
        [underlyingAsset],
        amountToClaim,
        reward
      );
      const claimRewardsReceipt = await waitForTx(action);
      const eventsEmitted = claimRewardsReceipt.events || [];

      const actionBlockTimestamp = await getBlockTimestamp(claimRewardsReceipt.blockNumber);

      const userIndexAfter = await getUserIndex(
        rewardsController,
        userAddress,
        underlyingAsset,
        reward
      );
      const assetDataAfter = (
        await getRewardsData(rewardsController, [underlyingAsset], [reward])
      )[0];

      const unclaimedRewardsAfter = await rewardsController.getUserRewards(
        [underlyingAsset],
        userAddress,
        reward
      );
      const unclaimedRewardsStorageAfter = await rewardsController.getUserAccruedRewards(
        userAddress,
        reward
      );

      const destinationAddressBalanceAfter = await stakedAave.balanceOf(destinationAddress);

      const claimedAmount = destinationAddressBalanceAfter.sub(destinationAddressBalanceBefore);

      // Only calculate expected accrued rewards if unclaimedRewards is below the amount to claim due gas optimization
      const expectedAccruedRewards = getRewards(
        stakedByUser,
        userIndexAfter,
        userIndexBefore
      ).toString();

      await aDaiMockV2.cleanUserState();

      if (amountToClaim === '0') {
        // state should not change
        expect(userIndexBefore.toString()).to.be.equal(
          userIndexAfter.toString(),
          'userIndexAfter should not change'
        );
        expect(unclaimedRewardsBefore.toString()).to.be.equal(
          unclaimedRewardsAfter.toString(),
          'unclaimedRewards should not change'
        );
        expect(destinationAddressBalanceBefore.toString()).to.be.equal(
          destinationAddressBalanceAfter.toString(),
          'destinationAddressBalance should not change'
        );
        await comparatorEngine(
          ['emissionPerSecond', 'index', 'lastUpdateTimestamp'],
          { underlyingAsset, totalSupply },
          assetDataBefore,
          assetDataAfter,
          actionBlockTimestamp,
          {}
        );
        expect(eventsEmitted.length).to.be.equal(0, 'no events should be emitted');
        return;
      }

      // ------- Distribution Manager tests START -----
      await assetDataComparator(
        { underlyingAsset, totalSupply },
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
        await expect(action)
          .to.emit(rewardsController, 'Accrued')
          .withArgs(
            assetDataAfter.underlyingAsset,
            reward,
            userAddress,
            assetDataAfter.index,
            assetDataAfter.index,
            expectedAccruedRewards
          );
      }
      // ------- Distribution Manager tests END -----

      let unclaimedRewardsCalc = unclaimedRewardsStorageBefore.add(expectedAccruedRewards);

      let expectedClaimedAmount: BigNumber;
      if (unclaimedRewardsCalc.lte(amountToClaim)) {
        expectedClaimedAmount = unclaimedRewardsCalc;
        expect(unclaimedRewardsStorageAfter.toString()).to.be.equal(
          '0',
          'unclaimed amount after should go to 0'
        );
      } else {
        expectedClaimedAmount = BigNumber.from(amountToClaim);
        expect(unclaimedRewardsStorageAfter.toString()).to.be.equal(
          unclaimedRewardsCalc.sub(amountToClaim).toString(),
          'unclaimed rewards after are wrong'
        );
      }

      expect(claimedAmount.toString()).to.be.equal(
        expectedClaimedAmount.toString(),
        'claimed amount are wrong'
      );

      if (expectedClaimedAmount.gt(0)) {
        await expect(action)
          .to.emit(rewardsController, 'RewardsClaimed')
          .withArgs(userAddress, reward, destinationAddress, userAddress, expectedClaimedAmount);
      }
    });
  }
});
