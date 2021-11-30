pragma solidity 0.8.10;

import {SafeERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol';
import {IERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol';
import {ITransferStrategy} from '../interfaces/ITransferStrategy.sol';
import {TransferStrategyStorage} from './TransferStrategyStorage.sol';

/**
 * @title PullRewardsTransferStrategy
 * @notice Transfer strategy that pulls ERC20 rewards from an external account to the user address.
 * The external account could be a smart contract or EOA that must approve to the IncentivesController address that uses this logic contract.
 * @author Aave
 **/
contract PullRewardsTransferStrategy is TransferStrategyStorage, ITransferStrategy {
  using SafeERC20 for IERC20;

  address internal immutable REWARDS_VAULT;

  constructor(address rewardsVault) TransferStrategyStorage() {
    REWARDS_VAULT = rewardsVault;
  }

  /// @inheritdoc ITransferStrategy
  function installHook(bytes memory) external override onlyDelegateCall returns (bool) {
    return true;
  }

  /// @inheritdoc ITransferStrategy
  function performTransfer(
    address to,
    address reward,
    uint256 amount
  ) external onlyDelegateCall returns (bool) {
    IERC20(reward).safeTransferFrom(REWARDS_VAULT, to, amount);

    return true;
  }

  function getRewardsVault() external view returns (address) {
    return REWARDS_VAULT;
  }
}
