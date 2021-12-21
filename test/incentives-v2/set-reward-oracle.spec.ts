import { makeSuite, TestEnv } from '../helpers/make-suite';
import { deployMockAggregator, ZERO_ADDRESS } from '@aave/deploy-v3';
import { hrtime } from 'process';
import { parseEther } from '@ethersproject/units';

const { expect } = require('chai');

makeSuite('AaveIncentivesControllerV2 setRewardOracle', (testEnv: TestEnv) => {
  it('Revert at setRewardOracle if not emissionManager', async () => {
    const {
      incentivesControllerV2,
      users: [user1],
    } = testEnv;

    await expect(
      incentivesControllerV2.connect(user1.signer).setRewardOracle(ZERO_ADDRESS, ZERO_ADDRESS)
    ).to.be.revertedWith('ONLY_EMISSION_MANAGER');
  });
  it("Revert at setRewardOracle if oracle doesn't have correct interface", async () => {
    const { incentivesControllerV2, deployer } = testEnv;

    await expect(
      incentivesControllerV2.connect(deployer.signer).setRewardOracle(ZERO_ADDRESS, ZERO_ADDRESS)
    ).to.be.reverted;
  });
  it('Revert at setRewardOracle if oracle price is zero', async () => {
    const { incentivesControllerV2, deployer, aaveToken } = testEnv;

    const zeroPriceOracle = await deployMockAggregator('0');

    await expect(
      incentivesControllerV2
        .connect(deployer.signer)
        .setRewardOracle(aaveToken.address, zeroPriceOracle.address)
    ).to.be.revertedWith('ORACLE_MUST_RETURN_PRICE');
  });
  it('Update oracle of a incentivized asset', async () => {
    const { incentivesControllerV2, deployer, stakedAave } = testEnv;

    const newPriceOracle = await deployMockAggregator(parseEther('600').toString());

    const action = await incentivesControllerV2
      .connect(deployer.signer)
      .setRewardOracle(stakedAave.address, newPriceOracle.address);

    await expect(action)
      .to.emit(incentivesControllerV2, 'RewardOracleUpdated')
      .withArgs(stakedAave.address, newPriceOracle.address);

    const priceOracle = await incentivesControllerV2.getRewardOracle(stakedAave.address);

    expect(priceOracle).to.be.equal(newPriceOracle.address);
  });
});
