import { makeSuite, TestEnv } from '../../helpers/make-suite';
import { RANDOM_ADDRESSES } from '../../helpers/constants';
import hre from 'hardhat';
import { StakedTokenTransferStrategy__factory } from '../../../types';
import { getERC20, MAX_UINT_AMOUNT, waitForTx } from '@aave/deploy-v3';
import { parseEther } from 'ethers/lib/utils';

const { expect } = require('chai');

makeSuite('Staked Token Transfer Strategy', (testEnv: TestEnv) => {
  it('Constructor parameters should be saved at deployment', async () => {
    const { deployer, stakedAave } = testEnv;
    const incentivesController = RANDOM_ADDRESSES[0];
    const rewardsAdmin = RANDOM_ADDRESSES[1];
    const underlyingToken = await stakedAave.STAKED_TOKEN();

    const artifact = await hre.deployments.deploy('staked-strategy-0', {
      contract: 'StakedTokenTransferStrategy',
      from: deployer.address,
      args: [incentivesController, rewardsAdmin, stakedAave.address],
    });

    const instance = StakedTokenTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    const savedIncentivesController = await instance.getIncentivesController();
    const savedRewardsAdmin = await instance.getRewardsAdmin();
    const savedStakeToken = await instance.getStakeContract();
    const savedUnderlying = await instance.getUnderlyingToken();

    expect(savedIncentivesController).to.be.equal(incentivesController);
    expect(savedRewardsAdmin).to.be.equal(rewardsAdmin);
    expect(savedStakeToken).to.be.equal(stakedAave.address);
    expect(savedUnderlying).to.be.equal(underlyingToken);
  });

  it('Should approve the movement of the underlying token to the Stake Contract', async () => {
    const { stakedTokenStrategy } = testEnv;

    const stakeContract = await stakedTokenStrategy.getStakeContract();
    const underlying = await stakedTokenStrategy.getUnderlyingToken();

    await waitForTx(await stakedTokenStrategy.renewApproval());

    const token = await getERC20(underlying);

    const allowance = await token.allowance(stakedTokenStrategy.address, stakeContract);

    expect(allowance).to.be.eq(MAX_UINT_AMOUNT);
  });
  it('Should drop the approval of the underlying token to the Stake Contract', async () => {
    const { stakedTokenStrategy } = testEnv;

    const stakeContract = await stakedTokenStrategy.getStakeContract();
    const underlying = await stakedTokenStrategy.getUnderlyingToken();

    await waitForTx(await stakedTokenStrategy.dropApproval());

    const token = await getERC20(underlying);

    const allowance = await token.allowance(stakedTokenStrategy.address, stakeContract);

    expect(allowance).to.be.eq('0');
  });

  it('Should stake underlying and send staked token rewards from incentives controller to the user', async () => {
    const {
      deployer,
      users: [user1],
      rewardsVault,
      aave,
      stakedAave,
    } = testEnv;

    const artifact = await hre.deployments.deploy('staked-strategy-0', {
      contract: 'StakedTokenTransferStrategy',
      from: deployer.address,
      args: [deployer.address, deployer.address, stakedAave.address],
    });

    const instance = StakedTokenTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    await waitForTx(
      await aave
        .connect(rewardsVault.signer)
        ['mint(address,uint256)'](instance.address, parseEther('20000000'))
    );

    const rewardAmount = parseEther('20');

    const balanceBefore = await stakedAave.balanceOf(user1.address);

    const action = await instance.performTransfer(user1.address, stakedAave.address, rewardAmount);

    await waitForTx(action);

    const balanceAfter = await stakedAave.balanceOf(user1.address);

    expect(balanceAfter).to.be.equal(balanceBefore.add(rewardAmount));
  });

  it('Should revert at performTransfer due caller is not incentives controller', async () => {
    const {
      deployer,
      users: [user1],
      stakedAave,
      dai,
    } = testEnv;

    const artifact = await hre.deployments.deploy('staked-strategy-1', {
      contract: 'StakedTokenTransferStrategy',
      from: deployer.address,
      args: [deployer.address, deployer.address, stakedAave.address],
    });

    const instance = StakedTokenTransferStrategy__factory.connect(
      artifact.address,
      deployer.signer
    );

    await expect(instance.performTransfer(user1.address, dai.address, '20')).to.be.revertedWith(
      'REWARD_TOKEN_NOT_STAKE_CONTRACT'
    );
  });
});
