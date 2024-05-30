import { makeSuite, TestEnv } from '../helpers/make-suite';
import { ZERO_ADDRESS } from '@aave/deploy-v3';
import hre from 'hardhat';

const { expect } = require('chai');

const temporaryOverrideAdmin = '0xA1b5f2cc9B407177CD8a4ACF1699fa0b99955A22';

makeSuite('AaveIncentivesControllerV2 setUserData', (testEnv: TestEnv) => {
  it('Revert at setUserData if not temporaryOverrideAdmin', async () => {
    const {
      rewardsController,
      users: [user1],
    } = testEnv;

    await expect(
      rewardsController
        .connect(user1.signer)
        .setUserData([ZERO_ADDRESS], [ZERO_ADDRESS], [ZERO_ADDRESS], [0], [0])
    ).to.be.revertedWith('ONLY_TEMPORARY_OVERRIDE_ADMIN');
  });

  it('Revert at setUserData if array parameters are not same length', async () => {
    const {
      rewardsController,
    } = testEnv;

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [temporaryOverrideAdmin],
    });

    await hre.network.provider.send('hardhat_setBalance', [
      temporaryOverrideAdmin,
      '0xDE0B6B3A7640000',
    ]);

    const temporaryOverrideAdminSigner = await hre.ethers.getSigner(temporaryOverrideAdmin);

    await expect(
      rewardsController
        .connect(temporaryOverrideAdminSigner)
        .setUserData(
          [ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [0, 0],
          [0, 0]
        )
    ).to.be.revertedWith('INVALID_PARAMETER_LENGTH');

    await expect(
      rewardsController
        .connect(temporaryOverrideAdminSigner)
        .setUserData(
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [0, 0],
          [0, 0]
        )
    ).to.be.revertedWith('INVALID_PARAMETER_LENGTH');

    await expect(
      rewardsController
        .connect(temporaryOverrideAdminSigner)
        .setUserData(
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS],
          [0, 0],
          [0, 0]
        )
    ).to.be.revertedWith('INVALID_PARAMETER_LENGTH');

    await expect(
      rewardsController
        .connect(temporaryOverrideAdminSigner)
        .setUserData(
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [0],
          [0, 0]
        )
    ).to.be.revertedWith('INVALID_PARAMETER_LENGTH');

    await expect(
      rewardsController
        .connect(temporaryOverrideAdminSigner)
        .setUserData(
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [ZERO_ADDRESS, ZERO_ADDRESS],
          [0, 0],
          [0]
        )
    ).to.be.revertedWith('INVALID_PARAMETER_LENGTH');

    await hre.network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [temporaryOverrideAdmin],
    });
  });

  it('Update user data', async () => {
    const {
      rewardsController,
      rewardTokens,
      users: [user1, user2],
      aWethMockV2,
      aDaiMockV2,
    } = testEnv;

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [temporaryOverrideAdmin],
    });

    await hre.network.provider.send('hardhat_setBalance', [
      temporaryOverrideAdmin,
      '0xDE0B6B3A7640000',
    ]);

    const temporaryOverrideAdminSigner = await hre.ethers.getSigner(temporaryOverrideAdmin);

    const assets = [aWethMockV2.address, aDaiMockV2.address];
    const rewards = [rewardTokens[0].address, rewardTokens[1].address];
    const users = [user1.address, user2.address];
    const newIndexes = [467001, 562458];
    const newAccruedAmounts = [546266, 965783];

    const action = await rewardsController
      .connect(temporaryOverrideAdminSigner)
      .setUserData(
        assets,
        rewards,
        users,
        newIndexes,
        newAccruedAmounts
      );

    await expect(action)
      .to.emit(rewardsController, 'AccruedIndexChange')
      .withArgs(
        assets[0],
        rewards[0],
        users[0],
        0,
        0,
        newIndexes[0],
        newAccruedAmounts[0]
      );

    await expect(action)
      .to.emit(rewardsController, 'AccruedIndexChange')
      .withArgs(
        assets[1],
        rewards[1],
        users[1],
        0,
        0,
        newIndexes[1],
        newAccruedAmounts[1]
      );

    const userIndex0 = await rewardsController.getUserAssetIndex(
      users[0],
      assets[0],
      rewards[0]
    );

    expect(userIndex0).to.be.equal(newIndexes[0]);

    const userAccrued0 = await rewardsController.getUserRewards(
      [assets[0]],
      users[0],
      rewards[0]
    );

    expect(userAccrued0).to.be.equal(newAccruedAmounts[0]);

    const userIndex1 = await rewardsController.getUserAssetIndex(
      users[1],
      assets[1],
      rewards[1]
    );

    expect(userIndex1).to.be.equal(newIndexes[1]);

    const userAccrued1 = await rewardsController.getUserRewards(
      [assets[1]],
      users[1],
      rewards[1]
    );

    expect(userAccrued1).to.be.equal(newAccruedAmounts[1]);

    await hre.network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [temporaryOverrideAdmin],
    });
  });
});
