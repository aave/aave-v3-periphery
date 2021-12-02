pragma solidity 0.8.10;

import {ITransferStrategy} from '../interfaces/ITransferStrategy.sol';
import {TransferStrategyStorage} from './TransferStrategyStorage.sol';
import {SafeTransferLib, ERC20} from '@rari-capital/solmate/src/utils/SafeTransferLib.sol';

/**
 * @title PullRewardsTransferStrategy
 * @notice Transfer strategy that pulls ERC20 rewards from an external account to the user address.
 * The external account could be a smart contract or EOA that must approve to the IncentivesController address that uses this logic contract.
 * @author Aave
 **/
contract PullRewardsTransferStrategy is TransferStrategyStorage, ITransferStrategy {
  using SafeTransferLib for ERC20;

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
    ERC20(reward).safeTransferFrom(REWARDS_VAULT, to, amount);

    return true;
  }

  function getRewardsVault() external view returns (address) {
    return REWARDS_VAULT;
  }
}
