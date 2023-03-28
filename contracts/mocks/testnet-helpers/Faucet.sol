// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {IFaucet} from './IFaucet.sol';
import {TestnetERC20} from './TestnetERC20.sol';
import {Ownable} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol';

/**
 * @title Faucet
 * @dev Ownable Faucet Contract
 */
contract Faucet is IFaucet, Ownable {
  // If _permissioned is enabled, then only owner can mint Testnet ERC20 tokens
  // If disabled, anyone can call mint at the faucet, for PoC environments
  bool internal _permissioned;

  // Maximum amount of tokens per mint allowed
  uint256 private _maxMintAmountPerTx;

  constructor(
    address owner,
    bool permissioned,
    uint256 maxMintAmountPerTx
  ) {
    require(owner != address(0));
    transferOwnership(owner);

    _permissioned = permissioned;
    _maxMintAmountPerTx = maxMintAmountPerTx;
  }

  /**
   * @dev Function modifier, if _permissioned is enabled then msg.sender is required to be the owner
   */
  modifier onlyOwnerIfPermissioned() {
    if (_permissioned == true) {
      require(owner() == _msgSender(), 'Ownable: caller is not the owner');
    }
    _;
  }

  /// @inheritdoc IFaucet
  function mint(
    address token,
    address to,
    uint256 amount
  ) external override onlyOwnerIfPermissioned returns (uint256) {
    uint8 decimals = TestnetERC20(token).decimals();
    require(amount < _maxMintAmountPerTx, 'Error: Mint limit transaction exceeded');

    TestnetERC20(token).mint(to, amount);
    return amount;
  }

  /// @inheritdoc IFaucet
  function setPermissioned(bool permissioned) external override onlyOwner {
    _permissioned = permissioned;
  }

  /// @inheritdoc IFaucet
  function isPermissioned() external view override returns (bool) {
    return _permissioned;
  }
}
