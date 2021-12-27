// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IRewardsController} from '../rewards/interfaces/IRewardsController.sol';

contract ATokenMock {
  IRewardsController public _aic;
  uint256 internal _userBalance;
  uint256 internal _totalSupply;
  uint256 internal immutable _decimals;

  // hack to be able to test event from EI properly
  event RewardsAccrued(address indexed user, uint256 amount);

  // hack to be able to test event from Distribution manager properly
  event AssetConfigUpdated(address indexed asset, uint256 emission);
  event AssetIndexUpdated(address indexed asset, uint256 index);
  event UserIndexUpdated(address indexed user, address indexed asset, uint256 index);

  constructor(IRewardsController aic, uint256 decimals) {
    _aic = aic;
    _decimals = decimals;
  }

  function handleActionOnAic(
    address user,
    uint256 totalSupply,
    uint256 userBalance
  ) external {
    _aic.handleAction(user, totalSupply, userBalance);
  }

  function doubleHandleActionOnAic(
    address user,
    uint256 totalSupply,
    uint256 userBalance
  ) external {
    _aic.handleAction(user, totalSupply, userBalance);
    _aic.handleAction(user, totalSupply, userBalance);
  }

  function setUserBalanceAndSupply(uint256 userBalance, uint256 totalSupply) public {
    _userBalance = userBalance;
    _totalSupply = totalSupply;
  }

  function getScaledUserBalanceAndSupply(address) external view returns (uint256, uint256) {
    return (_userBalance, _totalSupply);
  }

  function scaledTotalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function cleanUserState() external {
    _userBalance = 0;
    _totalSupply = 0;
  }

  function decimals() external view returns (uint256) {
    return _decimals;
  }
}
