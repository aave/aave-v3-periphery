// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {Ownable} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol';
import {IEACAggregatorProxy} from '../misc/interfaces/IEACAggregatorProxy.sol';
import {IEmissionManager} from './interfaces/IEmissionManager.sol';
import {ITransferStrategyBase} from './interfaces/ITransferStrategyBase.sol';
import {IRewardsController} from './interfaces/IRewardsController.sol';
import {RewardsDataTypes} from './libraries/RewardsDataTypes.sol';

/**
 * @title EmissionManager
 * @author Aave
 * @notice It manages the list of admins of reward emissions and provides functions to control reward emissions.
 */
contract EmissionManager is Ownable, IEmissionManager {
  // Map of reward addresses and their emission admins (rewardAddress => emissionAdmin)
  mapping(address => address) public emissionAdmins;

  IRewardsController public rewardsController;

  modifier onlyEmissionAdmin(address reward) {
    require(msg.sender == emissionAdmins[reward], 'ONLY_EMISSION_ADMIN');
    _;
  }

  /**
   * Constructor.
   * @param controller The address of the RewardsController contract
   */
  constructor(address controller) {
    rewardsController = IRewardsController(controller);
  }

  /// @inheritdoc IEmissionManager
  function configureAssets(RewardsDataTypes.RewardsConfigInput[] memory config) external override {
    for (uint256 i = 0; i < config.length; i++) {
      require(emissionAdmins[config[i].reward] == msg.sender, 'ONLY_EMISSION_ADMIN');
    }
    rewardsController.configureAssets(config);
  }

  /// @inheritdoc IEmissionManager
  function setTransferStrategy(address reward, ITransferStrategyBase transferStrategy)
    external
    override
    onlyEmissionAdmin(reward)
  {
    rewardsController.setTransferStrategy(reward, transferStrategy);
  }

  /// @inheritdoc IEmissionManager
  function setRewardOracle(address reward, IEACAggregatorProxy rewardOracle)
    external
    override
    onlyEmissionAdmin(reward)
  {
    rewardsController.setRewardOracle(reward, rewardOracle);
  }

  /// @inheritdoc IEmissionManager
  function setDistributionEnd(
    address asset,
    address reward,
    uint32 newDistributionEnd
  ) external override onlyEmissionAdmin(reward) {
    rewardsController.setDistributionEnd(asset, reward, newDistributionEnd);
  }

  /// @inheritdoc IEmissionManager
  function setEmissionPerSecond(
    address asset,
    address[] calldata rewards,
    uint88[] calldata newEmissionsPerSecond
  ) external override {
    for (uint256 i = 0; i < rewards.length; i++) {
      require(emissionAdmins[rewards[i]] == msg.sender, 'ONLY_EMISSION_ADMIN');
    }
    rewardsController.setEmissionPerSecond(asset, rewards, newEmissionsPerSecond);
  }

  /// @inheritdoc IEmissionManager
  function setClaimer(address user, address claimer) external override onlyOwner {
    rewardsController.setClaimer(user, claimer);
  }

  /// @inheritdoc IEmissionManager
  function setEmissionManager(address emissionManager) external override onlyOwner {
    rewardsController.setEmissionManager(emissionManager);
  }

  /// @inheritdoc IEmissionManager
  function setEmissionAdmin(address reward, address admin) external override onlyOwner {
    address oldAdmin = emissionAdmins[reward];
    emissionAdmins[reward] = admin;
    emit EmissionAdminUpdated(reward, oldAdmin, admin);
  }

  /// @inheritdoc IEmissionManager
  function setRewardsController(address controller) external override onlyOwner {
    rewardsController = IRewardsController(controller);
  }
}
