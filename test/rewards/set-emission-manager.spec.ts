import { makeSuite, TestEnv } from '../helpers/make-suite';

const { expect } = require('chai');

makeSuite('RewardsController EmissionManager Role', (testEnv: TestEnv) => {
  it('getEmissionManager should return current admin', async () => {
    const { rewardsController, deployer } = testEnv;

    const emissionManager = await rewardsController.EMISSION_MANAGER();

    expect(emissionManager).to.be.equal(deployer.address);
  });
});
