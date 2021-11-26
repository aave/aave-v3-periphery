// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {DistributionTypesV2} from '../libraries/DistributionTypesV2.sol';

interface IAaveDistributionManagerV2 {
  event AssetConfigUpdated(
    address indexed asset,
    address indexed reward,
    uint256 emission,
    uint256 distributionEnd
  );
  event AssetIndexUpdated(address indexed asset, address indexed reward, uint256 index);
  event UserIndexUpdated(
    address indexed user,
    address indexed asset,
    address indexed reward,
    uint256 index
  );

  event RewardsAccrued(address indexed user, address indexed reward, uint256 amount);

  /**
   * @dev Sets the end date for the distribution
   * @param distributionEnd The end date timestamp
   **/
  function setDistributionEnd(
    address asset,
    address reward,
    uint40 distributionEnd
  ) external;

  /**
   * @dev Gets the end date for the distribution
   * @return The end of the distribution
   **/
  function getDistributionEnd(address asset, address reward) external view returns (uint256);

  /**
   * @dev Returns the data of an user on a distribution
   * @param user Address of the user
   * @param asset The address of the reference asset of the distribution
   * @return The new index
   **/
  function getUserAssetData(
    address user,
    address asset,
    address reward
  ) external view returns (uint256);

  /**
   * @dev Returns the configuration of the distribution for a certain asset
   * @param asset The address of the reference asset of the distribution
   * @return The asset index, the emission per second and the last updated timestamp
   **/
  function getRewardsData(address asset, address reward)
    external
    view
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    );

  /**
   * @dev Returns the list of available reward addresses of an asset
   * @param asset The address of the reference asset of the distribution
   * @return List of rewards addresses of the input asset
   **/
  function getRewardsByAsset(address asset) external view returns (address[] memory);

  /**
   * @dev Returns the list of available reward addresses
   * @return List of rewards supported in this contract
   **/
  function getRewardsList() external view returns (address[] memory);

  /**
   * @dev Returns a single rewards balance of an user from contract storage state, not including virtually accrued rewards since last distribution.
   * @param user The address of the user
   * @param reward The address of the reward token
   * @return Unclaimed rewards from storage
   **/
  function getUserUnclaimedRewardsFromStorage(address user, address reward)
    external
    view
    returns (uint256);

  /**
   * @dev Returns a single rewards balance of an user, including virtually accrued and unrealized claimable rewards.
   * @param assets The list of assets to retrieve rewards
   * @param user The address of the user
   * @param reward The address of the reward token
   * @return The rewards
   **/
  function getUserRewardsBalance(
    address[] calldata assets,
    address user,
    address reward
  ) external view returns (uint256);

  /**
   * @dev Returns a list all rewards of an user, including already accrued and unrealized claimable rewards
   * @param assets The list of assets to retrieve rewards
   * @param user The address of the user
   * @return The function returns a Tuple of rewards list and the unclaimed rewards list
   **/
  function getAllUserRewardsBalance(address[] calldata assets, address user)
    external
    view
    returns (address[] memory, uint256[] memory);

  /**
   * @dev Returns the precision to calculate the distribution delta
   * @return The precision of the calculation
   */
  function PRECISION() external view returns (uint8);
}
