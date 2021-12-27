import { makeSuite, TestEnv } from '../helpers/make-suite';
import { deployMockAggregator, ZERO_ADDRESS } from '@aave/deploy-v3';
import { hrtime } from 'process';
import { parseEther } from '@ethersproject/units';

const { expect } = require('chai');

makeSuite('AaveIncentivesControllerV2 setRewardOracle', (testEnv: TestEnv) => {
  it('Revert at setRewardOracle if not emissionManager', async () => {
    const {
      rewardsController,
      users: [user1],
    } = testEnv;

    await expect(
      rewardsController.connect(user1.signer).setRewardOracle(ZERO_ADDRESS, ZERO_ADDRESS)
    ).to.be.revertedWith('ONLY_EMISSION_MANAGER');
  });
  it("Revert at setRewardOracle if oracle doesn't have correct interface", async () => {
    const { rewardsController, deployer } = testEnv;

    await expect(
      rewardsController.connect(deployer.signer).setRewardOracle(ZERO_ADDRESS, ZERO_ADDRESS)
    ).to.be.reverted;
  });
  it('Revert at setRewardOracle if oracle price is zero', async () => {
    const { rewardsController, deployer, aaveToken } = testEnv;

    const zeroPriceOracle = await deployMockAggregator('0');

    await expect(
      rewardsController
        .connect(deployer.signer)
        .setRewardOracle(aaveToken.address, zeroPriceOracle.address)
    ).to.be.revertedWith('ORACLE_MUST_RETURN_PRICE');
  });
  it('Update oracle of a incentivized asset', async () => {
    const { rewardsController, deployer, stakedAave } = testEnv;

    const newPriceOracle = await deployMockAggregator(parseEther('600').toString());

    const action = await rewardsController
      .connect(deployer.signer)
      .setRewardOracle(stakedAave.address, newPriceOracle.address);

    await expect(action)
      .to.emit(rewardsController, 'RewardOracleUpdated')
      .withArgs(stakedAave.address, newPriceOracle.address);

    const priceOracle = await rewardsController.getRewardOracle(stakedAave.address);

    expect(priceOracle).to.be.equal(newPriceOracle.address);
  });
});
