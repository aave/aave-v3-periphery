// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {Ownable} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol';
import {IStreamable} from './interfaces/IStreamable.sol';
import {IAdminControlledEcosystemReserve} from './interfaces/IAdminControlledEcosystemReserve.sol';
import {IAaveEcosystemReserveController} from './interfaces/IAaveEcosystemReserveController.sol';
import {IERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol';

contract AaveEcosystemReserveController is Ownable, IAaveEcosystemReserveController {
  /**
   * @notice Constructor.
   * @param aaveGovShortTimelock The address of the Aave's governance executor, owning this contract
   */
  constructor(address aaveGovShortTimelock) {
    transferOwnership(aaveGovShortTimelock);
  }

  /// @inheritdoc IAaveEcosystemReserveController
  function approve(
    address collector,
    IERC20 token,
    address recipient,
    uint256 amount
  ) external onlyOwner {
    IAdminControlledEcosystemReserve(collector).approve(token, recipient, amount);
  }

  /// @inheritdoc IAaveEcosystemReserveController
  function transfer(
    address collector,
    IERC20 token,
    address recipient,
    uint256 amount
  ) external onlyOwner {
    IAdminControlledEcosystemReserve(collector).transfer(token, recipient, amount);
  }

  /// @inheritdoc IAaveEcosystemReserveController
  function createStream(
    address collector,
    address recipient,
    uint256 deposit,
    IERC20 tokenAddress,
    uint256 startTime,
    uint256 stopTime
  ) external onlyOwner returns (uint256) {
    return
      IStreamable(collector).createStream(
        recipient,
        deposit,
        address(tokenAddress),
        startTime,
        stopTime
      );
  }

  /// @inheritdoc IAaveEcosystemReserveController
  function withdrawFromStream(
    address collector,
    uint256 streamId,
    uint256 funds
  ) external onlyOwner returns (bool) {
    return IStreamable(collector).withdrawFromStream(streamId, funds);
  }

  /// @inheritdoc IAaveEcosystemReserveController
  function cancelStream(address collector, uint256 streamId) external onlyOwner returns (bool) {
    return IStreamable(collector).cancelStream(streamId);
  }
}
