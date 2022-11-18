// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {Ownable} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol';
import {IERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol';
import {ICollector} from './interfaces/ICollector.sol';

/**
 * @title CollectorController
 * @notice The CollectorController contracts allows the owner of the contract
           to approve or transfer tokens from the specified collector proxy contract.
           The admin of the Collector proxy can't be the same as the fundsAdmin address.
           This is needed due the usage of transparent proxy pattern.
 * @author Aave
 **/
contract CollectorController is Ownable {
  /**
   * @dev Constructor setups the ownership of the contract
   * @param owner The address of the owner of the CollectorController
   */
  constructor(address owner) {
    transferOwnership(owner);
  }

  /**
   * @dev Transfer an amount of tokens to the recipient.
   * @param collector The address of the collector contract
   * @param token The address of the asset
   * @param recipient The address of the entity to transfer the tokens.
   * @param amount The amount to be transferred.
   */
  function approve(
    address collector,
    IERC20 token,
    address recipient,
    uint256 amount
  ) external onlyOwner {
    ICollector(collector).approve(token, recipient, amount);
  }

  /**
   * @dev Transfer an amount of tokens to the recipient.
   * @param collector The address of the collector contract to retrieve funds from (e.g. Aave ecosystem reserve)
   * @param token The address of the asset
   * @param recipient The address of the entity to transfer the tokens.
   * @param amount The amount to be transferred.
   */
  function transfer(
    address collector,
    IERC20 token,
    address recipient,
    uint256 amount
  ) external onlyOwner {
    ICollector(collector).transfer(token, recipient, amount);
  }
}
