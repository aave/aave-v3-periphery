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
  uint256 internal maximumMintAmount;

  // Mapping to control mint of assets (allowed by default)
  mapping(address => bool) internal _nonMintable;

  // If _permissioned is enabled, then only owner can mint Testnet ERC20 tokens
  // If disabled, anyone can call mint at the faucet, for PoC environments
  bool internal _permissioned;

  constructor(address owner, bool permissioned, uint256 maxMinAmount) {
    require(owner != address(0));
    transferOwnership(owner);
    _permissioned = permissioned;
    maximumMintAmount = maxMinAmount;
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
      amount <= maximumMintAmount * (10 ** TestnetERC20(token).decimals()),
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

  /// @inheritdoc IFaucet
  function setProtectedOfChild(
    address[] calldata childContracts,
    bool state
  ) external override onlyOwner {
    for (uint256 i = 0; i < childContracts.length; i++) {
      TestnetERC20(childContracts[i]).setProtected(state);
    }
  }


  /// @inheritdoc IFaucet
  function setMaximumMintAmount(uint256 newMaxMintAmount) external override onlyOwner {
    maximumMintAmount = newMaxMintAmount;
  }

  /// @inheritdoc IFaucet
  function getMaximumMintAmount() external view override returns (uint256) {
    return maximumMintAmount;
  }
}
