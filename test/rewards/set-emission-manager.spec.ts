import { makeSuite, TestEnv } from '../helpers/make-suite';
import { ZERO_ADDRESS, waitForTx } from '@aave/deploy-v3';

const { expect } = require('chai');

makeSuite('RewardsController EmissionManager Role', (testEnv: TestEnv) => {
  it('getEmissionManager should return current admin', async () => {
    const { rewardsController, deployer } = testEnv;

    const emissionManager = await rewardsController.getEmissionManager();

    expect(emissionManager).to.be.equal(deployer.address);
  });
  it('Revert at setEmissionManager if not emissionManager', async () => {
    const {
      rewardsController,
      users: [user1],
    } = testEnv;

    await expect(
      rewardsController.connect(user1.signer).setEmissionManager(user1.address)
    ).to.be.revertedWith('ONLY_EMISSION_MANAGER');
  });

  it('Successfully call setEmissionManager if called by emission manager', async () => {
    const {
      rewardsController,
      users: [user1],
      deployer,
    } = testEnv;

    await waitForTx(await rewardsController.setEmissionManager(user1.address));

    const emissionManager = await rewardsController.getEmissionManager();

    expect(emissionManager).to.be.equal(user1.address);
    expect(emissionManager).to.not.be.equal(deployer.address);
  });

  it('Successfully call setEmissionManager if called by updated emission manager', async () => {
    const {
      rewardsController,
      users: [user1],
      deployer,
    } = testEnv;

    await waitForTx(
      await rewardsController.connect(user1.signer).setEmissionManager(deployer.address)
    );

    const emissionManager = await rewardsController.getEmissionManager();

    expect(emissionManager).to.not.be.equal(user1.address);
    expect(emissionManager).to.be.equal(deployer.address);
  });
});
