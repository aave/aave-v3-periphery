// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IStakedToken} from '../interfaces/IStakedToken.sol';
import {IStakedTokenTransferStrategy} from '../interfaces/IStakedTokenTransferStrategy.sol';
import {ITransferStrategyBase} from '../interfaces/ITransferStrategyBase.sol';
import {TransferStrategyBase} from './TransferStrategyBase.sol';
import {SafeERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol';
import {IERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol';

/**
 * @title StakedTokenTransferStrategy
 * @notice Transfer strategy that stakes the rewards into a staking contract and transfers the staking contract token.
 * The underlying token must be transferred to this contract to be able to stake it on demand.
 * @author Aave
 **/
contract StakedTokenTransferStrategy is TransferStrategyBase, IStakedTokenTransferStrategy {
  using SafeERC20 for IERC20;

  IStakedToken public immutable STAKE_CONTRACT;
  address public immutable UNDERLYING_TOKEN;

  constructor(
    address incentivesController,
    address rewardsAdmin,
    IStakedToken stakeToken
  ) TransferStrategyBase(incentivesController, rewardsAdmin) {
    STAKE_CONTRACT = stakeToken;
    UNDERLYING_TOKEN = STAKE_CONTRACT.STAKED_TOKEN();

    IERC20(UNDERLYING_TOKEN).safeApprove(address(STAKE_CONTRACT), 0);
    IERC20(UNDERLYING_TOKEN).safeApprove(address(STAKE_CONTRACT), type(uint256).max);
  }

  /// @inheritdoc TransferStrategyBase
  function performTransfer(
    address to,
    address reward,
    uint256 amount
  )
    external
    override(TransferStrategyBase, ITransferStrategyBase)
    onlyIncentivesController
    returns (bool)
  {
    require(reward == address(STAKE_CONTRACT), 'Reward token is not the staked token');

    STAKE_CONTRACT.stake(to, amount);

    return true;
  }

  /// @inheritdoc IStakedTokenTransferStrategy
  function renewApproval() external onlyRewardsAdmin {
    IERC20(UNDERLYING_TOKEN).safeApprove(address(STAKE_CONTRACT), 0);
    IERC20(UNDERLYING_TOKEN).safeApprove(address(STAKE_CONTRACT), type(uint256).max);
  }

  /// @inheritdoc IStakedTokenTransferStrategy
  function dropApproval() external onlyRewardsAdmin {
    IERC20(UNDERLYING_TOKEN).safeApprove(address(STAKE_CONTRACT), 0);
  }
}
