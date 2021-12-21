import { makeSuite, TestEnv } from '../helpers/make-suite';
import { ZERO_ADDRESS } from '@aave/deploy-v3';

const { expect } = require('chai');

makeSuite('AaveIncentivesControllerV2 setDistributionEnd', (testEnv: TestEnv) => {
  it('Revert at setDistributionEnd if not emissionManager', async () => {
    const {
      incentivesControllerV2,
      users: [user1],
    } = testEnv;

    await expect(
      incentivesControllerV2.connect(user1.signer).setDistributionEnd(ZERO_ADDRESS, ZERO_ADDRESS, 0)
    ).to.be.revertedWith('ONLY_EMISSION_MANAGER');
  });
  it('Update distribution end of a rewarded asset', async () => {
    const { incentivesControllerV2, deployer, aDai, stakedAave } = testEnv;

    const action = await incentivesControllerV2
      .connect(deployer.signer)
      .setDistributionEnd(aDai.address, stakedAave.address, '1010');

    await expect(action)
      .to.emit(incentivesControllerV2, 'AssetConfigUpdated')
      .withArgs(aDai.address, stakedAave.address, '0', '1010');

    const afterData = await incentivesControllerV2.getRewardsData(aDai.address, stakedAave.address);

    expect(afterData[3].toString()).to.be.equal('1010');
  });
});
