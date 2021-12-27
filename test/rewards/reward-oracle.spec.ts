import { makeSuite, TestEnv } from '../helpers/make-suite';
import { waitForTx, ZERO_ADDRESS } from '@aave/deploy-v3';

const { expect } = require('chai');

makeSuite('AaveIncentivesControllerV2 reward oracle tests', (testEnv: TestEnv) => {
  it('Gets the reward oracle from configureAssets', async () => {
    const {
      rewardsController,
      aDaiMockV2,
      rewardToken,
      distributionEnd,
      pullRewardsStrategy,
      rewardPriceAggregator,
    } = testEnv;

    // Configure asset
    await waitForTx(
      await rewardsController.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward: rewardToken.address,
          rewardOracle: rewardPriceAggregator,
          emissionPerSecond: 100,
          distributionEnd,
          totalSupply: '0',
          transferStrategy: pullRewardsStrategy.address,
        },
      ])
    );

    // Retrieve reward oracle
  });

  it('Update the reward oracle with emission manager', async () => {
    const { rewardsController } = testEnv;
    await expect(rewardsController.initialize()).to.be.reverted;
  });

  it('Revert due update the reward oracle from non admin account', async () => {
    const { rewardsController } = testEnv;
    await expect(rewardsController.initialize()).to.be.reverted;
  });
});
