import { makeSuite, TestEnv } from '../helpers/make-suite';
import { ZERO_ADDRESS } from '@aave/deploy-v3';
import hre from 'hardhat';

const { expect } = require('chai');

const temporaryOverrideAdmin = "0xA1b5f2cc9B407177CD8a4ACF1699fa0b99955A22";

makeSuite('AaveIncentivesControllerV2 renounceTemporaryOverrideAdmin', (testEnv: TestEnv) => {
  it('Revert at renounceTemporaryOverrideAdmin if not temporaryOverrideAdmin', async () => {
    const {
      rewardsController,
      users: [user1],
    } = testEnv;

    await expect(
      rewardsController.connect(user1.signer).renounceTemporaryOverrideAdmin()
    ).to.be.revertedWith('ONLY_TEMPORARY_OVERRIDE_ADMIN');
  });

  it('Renounce successful', async () => {
    const { rewardsController } = testEnv;

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [temporaryOverrideAdmin],
    });

    await hre.network.provider.send("hardhat_setBalance", [
      temporaryOverrideAdmin,
      "0xDE0B6B3A7640000",
    ]);

    const temporaryOverrideAdminSigner = await hre.ethers.getSigner(temporaryOverrideAdmin);

    const action = await rewardsController.connect(temporaryOverrideAdminSigner).renounceTemporaryOverrideAdmin();

    await expect(action)
      .to.emit(rewardsController, 'TemporaryOverrideAdminSet')
      .withArgs(temporaryOverrideAdmin, ZERO_ADDRESS);

    const newTemporaryOverrideAdmin = await rewardsController.temporaryOverrideAdmin();

    expect(newTemporaryOverrideAdmin).to.be.equal(ZERO_ADDRESS);

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [temporaryOverrideAdmin],
    });
  });
});
