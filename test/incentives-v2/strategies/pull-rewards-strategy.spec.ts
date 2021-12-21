import { makeSuite, TestEnv } from '../../helpers/make-suite';
import {
  MAX_UINT_AMOUNT,
  PullRewardsTransferStrategy__factory,
  waitForTx,
  ZERO_ADDRESS,
} from '@aave/deploy-v3';
import { RANDOM_ADDRESSES } from '../../helpers/constants';
import hre from 'hardhat';
import { parseEther } from '@ethersproject/units';

const { expect } = require('chai');

makeSuite('Pull Rewards Transfer Strategy', (testEnv: TestEnv) => {
  it('Constructor parameters should be saved at deployment', async () => {
    const { deployer } = testEnv;
    const incentivesController = RANDOM_ADDRESSES[0];
    const rewardsAdmin = RANDOM_ADDRESSES[1];
    const rewardVault = RANDOM_ADDRESSES[2];

    const artifact = await hre.deployments.deploy('transfer-strategy-0', {
      contract: 'PullRewardsTransferStrategy',
      from: deployer.address,
      args: [incentivesController, rewardsAdmin, rewardVault],
    });

    const instance = PullRewardsTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    const savedIncentivesController = await instance.getIncentivesController();
    const savedRewardsAdmin = await instance.getRewardsAdmin();
    const savedRewardsVault = await instance.getRewardsVault();

    expect(savedIncentivesController).to.be.equal(incentivesController);
    expect(savedRewardsAdmin).to.be.equal(rewardsAdmin);
    expect(savedRewardsVault).to.be.equal(rewardVault);
  });

  it('Should revert at performTransfer due not approval funds from reward vault', async () => {
    const {
      deployer,
      users: [user1],
      rewardsVault,
      dai,
    } = testEnv;

    const artifact = await hre.deployments.deploy('transfer-strategy-1', {
      contract: 'PullRewardsTransferStrategy',
      from: deployer.address,
      args: [deployer.address, deployer.address, rewardsVault.address],
    });

    const instance = PullRewardsTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    const rewardAmount = parseEther('20');

    const balanceBefore = await dai.balanceOf(user1.address);

    await expect(instance.performTransfer(user1.address, dai.address, rewardAmount)).to.be.reverted;

    const balanceAfter = await dai.balanceOf(user1.address);

    expect(balanceAfter).to.be.equal(balanceBefore);
  });

  it('Should revert at performTransfer due out of funds from reward vault', async () => {
    const {
      deployer,
      users: [user1],
      rewardsVault,
      dai,
    } = testEnv;

    const artifact = await hre.deployments.deploy('transfer-strategy-2', {
      contract: 'PullRewardsTransferStrategy',
      from: deployer.address,
      args: [deployer.address, deployer.address, rewardsVault.address],
    });

    const instance = PullRewardsTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    await waitForTx(
      await dai.connect(rewardsVault.signer).approve(instance.address, MAX_UINT_AMOUNT)
    );

    const rewardAmount = parseEther('20');

    const balanceBefore = await dai.balanceOf(user1.address);

    await expect(instance.performTransfer(user1.address, dai.address, rewardAmount)).to.be.reverted;

    const balanceAfter = await dai.balanceOf(user1.address);

    expect(balanceAfter).to.be.equal(balanceBefore);
  });

  it('Should transfer rewards from incentives controller to the user', async () => {
    const {
      deployer,
      users: [user1],
      rewardsVault,
      rewardToken,
    } = testEnv;

    const artifact = await hre.deployments.deploy('transfer-strategy-3', {
      contract: 'PullRewardsTransferStrategy',
      from: deployer.address,
      args: [deployer.address, deployer.address, rewardsVault.address],
    });

    const instance = PullRewardsTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    await waitForTx(
      await rewardToken
        .connect(rewardsVault.signer)
        ['mint(address,uint256)'](rewardsVault.address, parseEther('2000000'))
    );
    await waitForTx(
      await rewardToken.connect(rewardsVault.signer).approve(instance.address, MAX_UINT_AMOUNT)
    );

    const rewardAmount = parseEther('20');

    const balanceBefore = await rewardToken.balanceOf(user1.address);

    const action = await instance.performTransfer(user1.address, rewardToken.address, rewardAmount);

    await waitForTx(action);

    const balanceAfter = await rewardToken.balanceOf(user1.address);

    expect(balanceAfter).to.be.equal(balanceBefore.add(rewardAmount));
  });

  it('Should revert at transfer rewards if caller not incentives controller', async () => {
    const {
      deployer,
      users: [user1],
      rewardsVault,
      rewardToken,
    } = testEnv;

    const artifact = await hre.deployments.deploy('transfer-strategy-4', {
      contract: 'PullRewardsTransferStrategy',
      from: deployer.address,
      args: [deployer.address, deployer.address, rewardsVault.address],
    });

    const instance = PullRewardsTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    await waitForTx(
      await rewardToken
        .connect(rewardsVault.signer)
        ['mint(address,uint256)'](rewardsVault.address, parseEther('2000000'))
    );
    await waitForTx(
      await rewardToken.connect(rewardsVault.signer).approve(instance.address, MAX_UINT_AMOUNT)
    );

    await expect(
      instance.connect(user1.signer).performTransfer(user1.address, rewardToken.address, '10')
    ).to.be.revertedWith('CALLER_NOT_INCENTIVES_CONTROLLER');
  });
});
