// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IRewardsDistributor} from './interfaces/IRewardsDistributor.sol';
import {RewardsDistributorTypes} from './libraries/RewardsDistributorTypes.sol';
import {IERC20Detailed} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol';

/**
 * @title RewardsDistributor
 * @notice Accounting contract to manage multiple staking distributions with multiple rewards
 * @author Aave
 **/
abstract contract RewardsDistributor is IRewardsDistributor {
  struct RewardData {
    uint88 emissionPerSecond;
    uint104 index;
    uint32 lastUpdateTimestamp;
    uint32 distributionEnd;
    mapping(address => uint256) usersIndex;
  }

  struct AssetData {
    mapping(address => RewardData) rewards;
    address[] availableRewards;
    uint8 decimals;
  }

  // manager of incentives
  address public immutable EMISSION_MANAGER;

  // asset => AssetData
  mapping(address => AssetData) internal _assets;

  // user => reward => unclaimed rewards
  mapping(address => mapping(address => uint256)) internal _usersUnclaimedRewards;

  // reward => enabled
  mapping(address => bool) internal _isRewardEnabled;

  // global rewards list
  address[] internal _rewardsList;

  modifier onlyEmissionManager() {
    require(msg.sender == EMISSION_MANAGER, 'ONLY_EMISSION_MANAGER');
    _;
  }

  constructor(address emissionManager) {
    EMISSION_MANAGER = emissionManager;
  }

  /// @inheritdoc IRewardsDistributor
  function getRewardsData(address asset, address reward)
    public
    view
    override
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    return (
      _assets[asset].rewards[reward].index,
      _assets[asset].rewards[reward].emissionPerSecond,
      _assets[asset].rewards[reward].lastUpdateTimestamp,
      _assets[asset].rewards[reward].distributionEnd
    );
  }

  /// @inheritdoc IRewardsDistributor
  function getDistributionEnd(address asset, address reward)
    external
    view
    override
    returns (uint256)
  {
    return _assets[asset].rewards[reward].distributionEnd;
  }

  /// @inheritdoc IRewardsDistributor
  function getRewardsByAsset(address asset) external view override returns (address[] memory) {
    return _assets[asset].availableRewards;
  }

  /// @inheritdoc IRewardsDistributor
  function getRewardsList() external view override returns (address[] memory) {
    return _rewardsList;
  }

  /// @inheritdoc IRewardsDistributor
  function getUserAssetData(
    address user,
    address asset,
    address reward
  ) public view override returns (uint256) {
    return _assets[asset].rewards[reward].usersIndex[user];
  }

  /// @inheritdoc IRewardsDistributor
  function getUserUnclaimedRewardsFromStorage(address user, address reward)
    external
    view
    override
    returns (uint256)
  {
    return _usersUnclaimedRewards[user][reward];
  }

  /// @inheritdoc IRewardsDistributor
  function getUserRewardsBalance(
    address[] calldata assets,
    address user,
    address reward
  ) external view override returns (uint256) {
    return _getUserReward(user, reward, _getUserStake(assets, user));
  }

  /// @inheritdoc IRewardsDistributor
  function getAllUserRewardsBalance(address[] calldata assets, address user)
    external
    view
    override
    returns (address[] memory rewardsList, uint256[] memory unclaimedAmounts)
  {
    return _getAllUserRewards(user, _getUserStake(assets, user));
  }

  /// @inheritdoc IRewardsDistributor
  function setDistributionEnd(
    address asset,
    address reward,
    uint32 distributionEnd
  ) external override onlyEmissionManager {
    _assets[asset].rewards[reward].distributionEnd = distributionEnd;

    emit AssetConfigUpdated(
      asset,
      reward,
      _assets[asset].rewards[reward].emissionPerSecond,
      distributionEnd
    );
  }

  /**
   * @dev Configure the _assets for a specific emission
   * @param rewardsInput The array of each asset configuration
   **/
  function _configureAssets(RewardsDistributorTypes.RewardsConfigInput[] memory rewardsInput)
    internal
  {
    for (uint256 i = 0; i < rewardsInput.length; i++) {
      _assets[rewardsInput[i].asset].decimals = IERC20Detailed(rewardsInput[i].asset).decimals();

      RewardData storage rewardConfig = _assets[rewardsInput[i].asset].rewards[
        rewardsInput[i].reward
      ];

      // Add reward address to asset available rewards if latestUpdateTimestamp is zero
      if (rewardConfig.lastUpdateTimestamp == 0) {
        _assets[rewardsInput[i].asset].availableRewards.push(rewardsInput[i].reward);
      }

      // Add reward address to global rewards list if still not enabled
      if (_isRewardEnabled[rewardsInput[i].reward] == false) {
        _isRewardEnabled[rewardsInput[i].reward] = true;
        _rewardsList.push(rewardsInput[i].reward);
      }

      // Due emissions is still zero, updates only latestUpdateTimestamp
      _updateAssetStateInternal(
        rewardsInput[i].asset,
        rewardsInput[i].reward,
        rewardConfig,
        rewardsInput[i].totalSupply,
        _assets[rewardsInput[i].asset].decimals
      );

      // Configure emission and distribution end of the reward per asset
      rewardConfig.emissionPerSecond = rewardsInput[i].emissionPerSecond;
      rewardConfig.distributionEnd = rewardsInput[i].distributionEnd;

      emit AssetConfigUpdated(
        rewardsInput[i].asset,
        rewardsInput[i].reward,
        rewardsInput[i].emissionPerSecond,
        rewardsInput[i].distributionEnd
      );
    }
  }

  /**
   * @dev Updates the state of one distribution, mainly rewards index and timestamp
   * @param asset The address of the asset being updated
   * @param reward The address of the reward being updated
   * @param rewardConfig Storage pointer to the distribution's reward config
   * @param totalSupply Current total of underlying assets for this distribution
   * @param decimals The decimals of the underlying asset
   * @return The new distribution index
   **/
  function _updateAssetStateInternal(
    address asset,
    address reward,
    RewardData storage rewardConfig,
    uint256 totalSupply,
    uint8 decimals
  ) internal returns (uint256) {
    uint256 oldIndex = rewardConfig.index;

    if (block.timestamp == rewardConfig.lastUpdateTimestamp) {
      return oldIndex;
    }

    uint256 newIndex = _getAssetIndex(
      oldIndex,
      rewardConfig.emissionPerSecond,
      rewardConfig.lastUpdateTimestamp,
      rewardConfig.distributionEnd,
      totalSupply,
      decimals
    );

    if (newIndex != oldIndex) {
      require(newIndex <= type(uint104).max, 'Index overflow');
      //optimization: storing one after another saves one SSTORE
      rewardConfig.index = uint104(newIndex);
      rewardConfig.lastUpdateTimestamp = uint32(block.timestamp);
      emit AssetIndexUpdated(asset, reward, newIndex);
    } else {
      rewardConfig.lastUpdateTimestamp = uint32(block.timestamp);
    }

    return newIndex;
  }

  /**
   * @dev Updates the state of an user in a distribution
   * @param user The user's address
   * @param asset The address of the reference asset of the distribution
   * @param reward The address of the reward
   * @param userBalance Amount of tokens staked by the user in the distribution at the moment
   * @param totalSupply Total tokens staked in the distribution
   * @return The accrued rewards for the user until the moment
   **/
  function _updateUserRewardsInternal(
    address user,
    address asset,
    address reward,
    uint256 userBalance,
    uint256 totalSupply
  ) internal returns (uint256) {
    RewardData storage rewardData = _assets[asset].rewards[reward];
    uint256 userIndex = rewardData.usersIndex[user];
    uint256 accruedRewards = 0;

    uint256 newIndex = _updateAssetStateInternal(
      asset,
      reward,
      rewardData,
      totalSupply,
      _assets[asset].decimals
    );

    if (userIndex != newIndex) {
      if (userBalance != 0) {
        accruedRewards = _getRewards(userBalance, newIndex, userIndex, _assets[asset].decimals);
      }

      rewardData.usersIndex[user] = newIndex;
      emit UserIndexUpdated(user, asset, reward, newIndex);
    }

    return accruedRewards;
  }

  /**
   * @dev Iterates and updates all rewards of an asset that belongs to an user
   * @param asset The address of the reference asset of the distribution
   * @param user The user address
   * @param userBalance The current user asset balance
   * @param totalSupply Total supply of the asset
   **/
  function _updateUserRewardsPerAssetInternal(
    address asset,
    address user,
    uint256 userBalance,
    uint256 totalSupply
  ) internal {
    for (uint256 r = 0; r < _assets[asset].availableRewards.length; r++) {
      address reward = _assets[asset].availableRewards[r];
      uint256 accruedRewards = _updateUserRewardsInternal(
        user,
        asset,
        reward,
        userBalance,
        totalSupply
      );
      if (accruedRewards != 0) {
        _usersUnclaimedRewards[user][reward] += accruedRewards;

        emit RewardsAccrued(user, reward, accruedRewards);
      }
    }
  }

  /**
   * @dev Used by "frontend" stake contracts to update the data of an user when claiming rewards from there
   * @param user The address of the user
   * @param userState List of structs of the user data related with his stake
   **/
  function _distributeRewards(
    address user,
    RewardsDistributorTypes.UserAssetStatsInput[] memory userState
  ) internal {
    for (uint256 i = 0; i < userState.length; i++) {
      _updateUserRewardsPerAssetInternal(
        userState[i].underlyingAsset,
        user,
        userState[i].userBalance,
        userState[i].totalSupply
      );
    }
  }

  /**
   * @dev Return the accrued unclaimed amount of a reward from an user over a list of distribution
   * @param user The address of the user
   * @param reward The address of the reward token
   * @param userState List of structs of the user data related with his stake
   * @return unclaimedRewards The accrued rewards for the user until the moment
   **/
  function _getUserReward(
    address user,
    address reward,
    RewardsDistributorTypes.UserAssetStatsInput[] memory userState
  ) internal view returns (uint256 unclaimedRewards) {
    // Add unrealized rewards
    for (uint256 i = 0; i < userState.length; i++) {
      if (userState[i].userBalance == 0) {
        continue;
      }
      unclaimedRewards += _getUnrealizedRewardsFromStake(user, reward, userState[i]);
    }

    // Return unrealized rewards plus stored unclaimed rewardss
    return unclaimedRewards + _usersUnclaimedRewards[user][reward];
  }

  /**
   * @dev Return the accrued rewards for an user over a list of distribution
   * @param user The address of the user
   * @param userState List of structs of the user data related with his stake
   * @return rewardsList List of reward token addresses
   * @return unclaimedRewards List of unclaimed + unrealized rewards, order matches "rewardsList" items
   **/
  function _getAllUserRewards(
    address user,
    RewardsDistributorTypes.UserAssetStatsInput[] memory userState
  ) internal view returns (address[] memory rewardsList, uint256[] memory unclaimedRewards) {
    rewardsList = new address[](_rewardsList.length);
    unclaimedRewards = new uint256[](rewardsList.length);

    // Add stored rewards from user to unclaimedRewards
    for (uint256 y = 0; y < rewardsList.length; y++) {
      rewardsList[y] = _rewardsList[y];
      unclaimedRewards[y] = _usersUnclaimedRewards[user][rewardsList[y]];
    }

    // Add unrealized rewards from user to unclaimedRewards
    for (uint256 i = 0; i < userState.length; i++) {
      if (userState[i].userBalance == 0) {
        continue;
      }
      for (uint256 r = 0; r < rewardsList.length; r++) {
        unclaimedRewards[r] += _getUnrealizedRewardsFromStake(user, rewardsList[r], userState[i]);
      }
    }
    return (rewardsList, unclaimedRewards);
  }

  /**
   * @dev Return the unrealized amount of one reward from an user over a list of distribution
   * @param user The address of the user
   * @param reward The address of the reward token
   * @param stake Data of the user related with his stake
   * @return The unrealized rewards for the user until the moment
   **/
  function _getUnrealizedRewardsFromStake(
    address user,
    address reward,
    RewardsDistributorTypes.UserAssetStatsInput memory stake
  ) internal view returns (uint256) {
    RewardData storage rewardData = _assets[stake.underlyingAsset].rewards[reward];
    uint8 assetDecimals = _assets[stake.underlyingAsset].decimals;
    uint256 assetIndex = _getAssetIndex(
      rewardData.index,
      rewardData.emissionPerSecond,
      rewardData.lastUpdateTimestamp,
      rewardData.distributionEnd,
      stake.totalSupply,
      assetDecimals
    );

    return _getRewards(stake.userBalance, assetIndex, rewardData.usersIndex[user], assetDecimals);
  }

  /**
   * @dev Internal function for the calculation of user's rewards on a distribution
   * @param principalUserBalance Balance of the user asset on a distribution
   * @param reserveIndex Current index of the distribution
   * @param userIndex Index stored for the user, representation his staking moment
   * @param decimals The decimals of the underlying asset
   * @return The rewards
   **/
  function _getRewards(
    uint256 principalUserBalance,
    uint256 reserveIndex,
    uint256 userIndex,
    uint8 decimals
  ) internal pure returns (uint256) {
    return (principalUserBalance * (reserveIndex - userIndex)) / 10**decimals;
  }

  /**
   * @dev Calculates the next value of an specific distribution index, with validations
   * @param currentIndex Current index of the distribution
   * @param emissionPerSecond Representing the total rewards distributed per second per asset unit, on the distribution
   * @param lastUpdateTimestamp Last moment this distribution was updated
   * @param totalBalance of tokens considered for the distribution
   * @param decimals The decimals of the underlying asset
   * @return The new index.
   **/
  function _getAssetIndex(
    uint256 currentIndex,
    uint256 emissionPerSecond,
    uint128 lastUpdateTimestamp,
    uint256 distributionEnd,
    uint256 totalBalance,
    uint8 decimals
  ) internal view returns (uint256) {
    if (
      emissionPerSecond == 0 ||
      totalBalance == 0 ||
      lastUpdateTimestamp == block.timestamp ||
      lastUpdateTimestamp >= distributionEnd
    ) {
      return currentIndex;
    }

    uint256 currentTimestamp = block.timestamp > distributionEnd
      ? distributionEnd
      : block.timestamp;
    uint256 timeDelta = currentTimestamp - lastUpdateTimestamp;
    return (emissionPerSecond * timeDelta * (10**decimals)) / totalBalance + currentIndex;
  }

  /**
   * @dev Get user staking distribution of a list of assets
   * @dev To be fulfilled with custom logic of the underlying asset to get total staked supply and user stake balance
   * @param assets List of asset addresses of the user
   * @param user Address of the user
   */
  function _getUserStake(address[] calldata assets, address user)
    internal
    view
    virtual
    returns (RewardsDistributorTypes.UserAssetStatsInput[] memory userState);

  /// @inheritdoc IRewardsDistributor
  function getAssetDecimals(address asset) external view returns (uint8) {
    return _assets[asset].decimals;
  }
}
