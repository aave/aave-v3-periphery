import { makeSuite, TestEnv } from '../helpers/make-suite';
import { ZERO_ADDRESS } from '@aave/deploy-v3';
import hre from 'hardhat';

const { expect } = require('chai');

makeSuite('AaveIncentivesControllerV2 setTransferStrategy', (testEnv: TestEnv) => {
  it('Revert at setTransferStrategy if not emissionManager', async () => {
    const {
      rewardsController,
      users: [user1],
    } = testEnv;

    await expect(
      rewardsController.connect(user1.signer).setTransferStrategy(ZERO_ADDRESS, ZERO_ADDRESS)
    ).to.be.revertedWith('ONLY_EMISSION_MANAGER');
  });
  it('Revert at setTransferStrategy if transfer strategy address is not a contract', async () => {
    const {
      rewardsController,
      users: [user1],
    } = testEnv;

    await expect(
      rewardsController.setTransferStrategy(ZERO_ADDRESS, user1.address)
    ).to.be.revertedWith('STRATEGY_MUST_BE_CONTRACT');
  });

  it('Revert at setTransferStrategy if transfer strategy address is zero', async () => {
    const { rewardsController } = testEnv;

    await expect(
      rewardsController.setTransferStrategy(ZERO_ADDRESS, ZERO_ADDRESS)
    ).to.be.revertedWith('STRATEGY_CAN_NOT_BE_ZERO');
  });

  it('Update transfer strategy of a incentivized asset', async () => {
    const { rewardsController, deployer, rewardToken, rewardsVault } = testEnv;

    const newStrategy = await hre.deployments.deploy('PullRewardsTransferStrategy', {
      args: [rewardsController.address, deployer.address, rewardsVault.address],
      from: deployer.address,
    });

    const action = await rewardsController
      .connect(deployer.signer)
      .setTransferStrategy(rewardToken.address, newStrategy.address);

    await expect(action)
      .to.emit(rewardsController, 'TransferStrategyInstalled')
      .withArgs(rewardToken.address, newStrategy.address);

    const rewardStrategy = await rewardsController.getTransferStrategy(rewardToken.address);

    expect(rewardStrategy).to.be.equal(newStrategy.address);
  });
});
