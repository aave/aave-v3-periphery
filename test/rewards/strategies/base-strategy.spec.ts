import { waitForTx, ZERO_ADDRESS } from '@aave/deploy-v3';
import { makeSuite, TestEnv } from '../../helpers/make-suite';
import { parseEther } from '@ethersproject/units';
import { PullRewardsTransferStrategy__factory } from '../../../types';

import { RANDOM_ADDRESSES } from '../../helpers/constants';
import hre from 'hardhat';

const { expect } = require('chai');

makeSuite('Base Transfer Strategy', (testEnv: TestEnv) => {
  it('Emergency withdrawal will fail if not reward admin', async () => {
    const {
      pullRewardsStrategy,
      users: [user1],
    } = testEnv;

    await expect(
      pullRewardsStrategy
        .connect(user1.signer)
        .emergencyWithdrawal(ZERO_ADDRESS, ZERO_ADDRESS, '10')
    ).to.be.revertedWith('ONLY_REWARDS_ADMIN');
  });

  it('Emergency withdrawal will allow to transfer tokens from the contract', async () => {
    const {
      pullRewardsStrategy,
      deployer,
      users: [user1],
      dai,
    } = testEnv;
    const amountToRecover = parseEther('10');
    await waitForTx(
      await dai['mint(address,uint256)'](pullRewardsStrategy.address, amountToRecover)
    );

    const userBalanceBefore = await dai.balanceOf(user1.address);
    const contractBalanceBefore = await dai.balanceOf(pullRewardsStrategy.address);

    const action = await pullRewardsStrategy
      .connect(deployer.signer)
      .emergencyWithdrawal(dai.address, user1.address, amountToRecover);

    await waitForTx(action);

    const userBalanceAfter = await dai.balanceOf(user1.address);
    const contractBalanceAfter = await dai.balanceOf(pullRewardsStrategy.address);

    expect(userBalanceAfter).to.be.equal(userBalanceBefore.add(amountToRecover));
    expect(contractBalanceAfter).to.be.equal(contractBalanceBefore.sub(amountToRecover));
  });

  it('Constructor parameters should be saved at deployment', async () => {
    const { deployer } = testEnv;
    const incentivesController = RANDOM_ADDRESSES[0];
    const rewardsAdmin = RANDOM_ADDRESSES[1];

    const artifact = await hre.deployments.deploy('PullRewardsTransferStrategy-Tests', {
      contract: 'PullRewardsTransferStrategy',
      from: deployer.address,
      args: [incentivesController, rewardsAdmin, ZERO_ADDRESS],
    });

    const instance = PullRewardsTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    const savedIncentivesController = await instance.getIncentivesController();
    const savedRewardsAdmin = await instance.getRewardsAdmin();

    expect(savedIncentivesController).to.be.equal(incentivesController);
    expect(savedRewardsAdmin).to.be.equal(rewardsAdmin);
  });
});
