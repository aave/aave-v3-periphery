// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {Ownable} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol';
import {TestnetERC20} from './TestnetERC20.sol';
import {IFaucet} from './IFaucet.sol';

/**
 * @title Faucet
 * @dev Ownable Faucet Contract
 */
contract Faucet is IFaucet, Ownable {
  /// @inheritdoc IFaucet
  uint256 public constant MAX_MINT_AMOUNT = 10000;

  // Mapping to control mint of assets (allowed by default)
  mapping(address => bool) internal _nonMintable;

  // If _permissioned is enabled, then only owner can mint Testnet ERC20 tokens
  // If disabled, anyone can call mint at the faucet, for PoC environments
  bool internal _permissioned;

  constructor(address owner, bool permissioned) {
    require(owner != address(0));
    transferOwnership(owner);
    _permissioned = permissioned;
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
    require(!_nonMintable[token], 'Error: not mintable');
    require(
      amount <= MAX_MINT_AMOUNT * (10 ** TestnetERC20(token).decimals()),
      'Error: Mint limit transaction exceeded'
    );

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

  /// @inheritdoc IFaucet
  function setMintable(address asset, bool active) external override onlyOwner {
    _nonMintable[asset] = !active;
  }

  /// @inheritdoc IFaucet
  function isMintable(address asset) external view override returns (bool) {
    return !_nonMintable[asset];
  }

  /// @inheritdoc IFaucet
  function transferOwnershipOfChild(
    address[] calldata childContracts,
    address newOwner
  ) external override onlyOwner {
    for (uint256 i = 0; i < childContracts.length; i++) {
      Ownable(childContracts[i]).transferOwnership(newOwner);
    }
  }
}
