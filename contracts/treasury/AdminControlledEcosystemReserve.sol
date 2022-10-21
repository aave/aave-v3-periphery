// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import {IERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol';
import {IAdminControlledEcosystemReserve} from './interfaces/IAdminControlledEcosystemReserve.sol';
import {VersionedInitializable} from './libs/VersionedInitializable.sol';
import {SafeERC20} from './libs/SafeERC20.sol';
import {ReentrancyGuard} from './libs/ReentrancyGuard.sol';
import {Address} from './libs/Address.sol';

/**
 * @title AdminControlledEcosystemReserve
 * @notice Stores ERC20 tokens, and allows to dispose of them via approval or transfer dynamics
 * Adapted to be an implementation of a transparent proxy
 * @dev Done abstract to add an `initialize()` function on the child, with `initializer` modifier
 * @author BGD Labs
 **/
abstract contract AdminControlledEcosystemReserve is
  VersionedInitializable,
  IAdminControlledEcosystemReserve
{
  using SafeERC20 for IERC20;
  using Address for address payable;

  address internal _fundsAdmin;

  uint256 public constant REVISION = 4;

  /// @inheritdoc IAdminControlledEcosystemReserve
  address public constant ETH_MOCK_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  modifier onlyFundsAdmin() {
    require(msg.sender == _fundsAdmin, 'ONLY_BY_FUNDS_ADMIN');
    _;
  }

  function getRevision() internal pure override returns (uint256) {
    return REVISION;
  }

  /// @inheritdoc IAdminControlledEcosystemReserve
  function getFundsAdmin() external view returns (address) {
    return _fundsAdmin;
  }

  /// @inheritdoc IAdminControlledEcosystemReserve
  function approve(
    IERC20 token,
    address recipient,
    uint256 amount
  ) external onlyFundsAdmin {
    token.safeApprove(recipient, amount);
  }

  /// @inheritdoc IAdminControlledEcosystemReserve
  function transfer(
    IERC20 token,
    address recipient,
    uint256 amount
  ) external onlyFundsAdmin {
    require(recipient != address(0), 'INVALID_0X_RECIPIENT');

    if (address(token) == ETH_MOCK_ADDRESS) {
      payable(recipient).sendValue(amount);
    } else {
      token.safeTransfer(recipient, amount);
    }
  }

  /// @dev needed in order to receive ETH from the Aave v1 ecosystem reserve
  receive() external payable {}

  function _setFundsAdmin(address admin) internal {
    _fundsAdmin = admin;
    emit NewFundsAdmin(admin);
  }
}
