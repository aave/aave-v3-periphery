import { expect } from 'chai';
import { waitForTx, getBlockTimestamp, ZERO_ADDRESS } from '@aave/deploy-v3';
import { makeSuite, TestEnv } from '../helpers/make-suite';

makeSuite('AaveIncentivesController - Claim rewards on behalf', (testEnv: TestEnv) => {
  beforeEach(async () => {
    const { rewardsController, aDaiMockV2, stakedAave, stakedTokenStrategy } = testEnv;

    const distributionEndTimestamp = (await getBlockTimestamp()) + 1000 * 60 * 60;

    await waitForTx(
      await rewardsController.configureAssets([
        {
          asset: aDaiMockV2.address,
          emissionPerSecond: '2000',
          totalSupply: '0',
          reward: stakedAave.address,
          rewardOracle: testEnv.aavePriceAggregator,
          distributionEnd: distributionEndTimestamp,
          transferStrategy: stakedTokenStrategy.address,
        },
      ])
    );
  });

  it('Should claimRewardsOnBehalf revert if called claimer is not authorized', async () => {
    const { rewardsController, users, aDaiMockV2, stakedAave } = testEnv;
    const [userWithRewards, thirdClaimer] = users;

    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    // Claim from third party claimer
    const priorStkBalance = await stakedAave.balanceOf(thirdClaimer.address);

    await expect(
      rewardsController
        .connect(thirdClaimer.signer)
        .claimAllRewardsOnBehalf(
          [aDaiMockV2.address],
          userWithRewards.address,
          thirdClaimer.address
        )
    ).to.be.revertedWith('CLAIMER_UNAUTHORIZED');

    const afterStkBalance = await stakedAave.balanceOf(thirdClaimer.address);
    expect(afterStkBalance).to.be.eq(priorStkBalance);
  });
  it('Should setClaimer pass if called by emission manager', async () => {
    const { rewardsController, users, deployer } = testEnv;
    const [userWithRewards, thirdClaimer] = users;
    const emissionManager = deployer;

    await expect(
      rewardsController
        .connect(emissionManager.signer)
        .setClaimer(userWithRewards.address, thirdClaimer.address)
    )
      .to.emit(rewardsController, 'ClaimerSet')
      .withArgs(userWithRewards.address, thirdClaimer.address);
    await expect(await rewardsController.getClaimer(userWithRewards.address)).to.be.equal(
      thirdClaimer.address
    );
  });
  it('Should claimRewardsOnBehalf pass if called by the assigned claimer', async () => {
    const { rewardsController, users, aDaiMockV2, stakedAave } = testEnv;
    const [userWithRewards, thirdClaimer] = users;

    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    // Claim from third party claimer
    const priorStkBalance = await stakedAave.balanceOf(thirdClaimer.address);

    const action = await rewardsController
      .connect(thirdClaimer.signer)
      .claimAllRewardsOnBehalf([aDaiMockV2.address], userWithRewards.address, thirdClaimer.address);
    const txReceipt = await waitForTx(action);
    await expect(action).to.emit(rewardsController, 'RewardsClaimed');
    const afterStkBalance = await stakedAave.balanceOf(thirdClaimer.address);
    expect(afterStkBalance).to.be.gt(priorStkBalance);
  });

  it('Should claimRewardsOnBehalf revert if to argument address is ZERO_ADDRESS', async () => {
    const { rewardsController, users, aDaiMockV2, stakedAave } = testEnv;
    const [userWithRewards, thirdClaimer] = users;

    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    await expect(
      rewardsController
        .connect(thirdClaimer.signer)
        .claimAllRewardsOnBehalf([aDaiMockV2.address], userWithRewards.address, ZERO_ADDRESS)
    ).to.be.revertedWith('INVALID_TO_ADDRESS');
  });

  it('Should claimRewardsOnBehalf revert if user argument is ZERO_ADDRESS', async () => {
    const { rewardsController, users, aDaiMockV2, deployer, stakedAave } = testEnv;
    const [, thirdClaimer] = users;

    const emissionManager = deployer;

    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    await expect(
      rewardsController
        .connect(emissionManager.signer)
        .setClaimer(ZERO_ADDRESS, thirdClaimer.address)
    )
      .to.emit(rewardsController, 'ClaimerSet')
      .withArgs(ZERO_ADDRESS, thirdClaimer.address);

    await expect(
      rewardsController
        .connect(thirdClaimer.signer)
        .claimAllRewardsOnBehalf([aDaiMockV2.address], ZERO_ADDRESS, thirdClaimer.address)
    ).to.be.revertedWith('INVALID_USER_ADDRESS');
  });
});
