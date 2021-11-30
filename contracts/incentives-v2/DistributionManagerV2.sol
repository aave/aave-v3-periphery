// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IAaveDistributionManagerV2} from './interfaces/IAaveDistributionManagerV2.sol';
import {DistributionTypesV2} from './libraries/DistributionTypesV2.sol';

/**
 * @title DistributionManagerV2
 * @notice Accounting contract to manage multiple staking distributions with multiple rewards
 * @author Aave
 **/
abstract contract DistributionManagerV2 is IAaveDistributionManagerV2 {
  struct RewardData {
    uint104 emissionPerSecond;
    uint104 index;
    uint40 lastUpdateTimestamp;
    uint40 distributionEnd;
    mapping(address => uint256) usersIndex;
  }

  struct AssetData {
    mapping(address => RewardData) rewards;
    address[] availableRewards;
  }

  // manager of incentives
  address public immutable EMISSION_MANAGER;

  uint8 public constant PRECISION = 18;

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

  /// @inheritdoc IAaveDistributionManagerV2
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

  /// @inheritdoc IAaveDistributionManagerV2
  function getDistributionEnd(address asset, address reward)
    external
    view
    override
    returns (uint256)
  {
    return _assets[asset].rewards[reward].distributionEnd;
  }

  /// @inheritdoc IAaveDistributionManagerV2
  function getRewardsByAsset(address asset) external view override returns (address[] memory) {
    return _assets[asset].availableRewards;
  }

  /// @inheritdoc IAaveDistributionManagerV2
  function getRewardsList() external view override returns (address[] memory) {
    return _rewardsList;
  }

  /// @inheritdoc IAaveDistributionManagerV2
  function getUserAssetData(
    address user,
    address asset,
    address reward
  ) public view override returns (uint256) {
    return _assets[asset].rewards[reward].usersIndex[user];
  }

  /// @inheritdoc IAaveDistributionManagerV2
  function getUserUnclaimedRewardsFromStorage(address user, address reward)
    external
    view
    override
    returns (uint256)
  {
    return _usersUnclaimedRewards[user][reward];
  }

  /// @inheritdoc IAaveDistributionManagerV2
  function getUserRewardsBalance(
    address[] calldata assets,
    address user,
    address reward
  ) external view override returns (uint256) {
    return _getUserReward(user, reward, _getUserStake(assets, user));
  }

  /// @inheritdoc IAaveDistributionManagerV2
  function getAllUserRewardsBalance(address[] calldata assets, address user)
    external
    view
    override
    returns (address[] memory rewardsList, uint256[] memory unclaimedAmounts)
  {
    return _getAllUserRewards(user, _getUserStake(assets, user));
  }

  /// @inheritdoc IAaveDistributionManagerV2
  function setDistributionEnd(
    address asset,
    address reward,
    uint40 distributionEnd
  ) external override onlyEmissionManager {
    _assets[asset].rewards[reward].distributionEnd = distributionEnd;

    emit AssetConfigUpdated(
      asset,
      reward,
      _assets[asset].rewards[reward].emissionPerSecond,
      _assets[asset].rewards[reward].distributionEnd
    );
  }

  /**
   * @dev Configure the _assets for a specific emission
   * @param rewardsInput The array of each asset configuration
   **/
  function _configureAssets(DistributionTypesV2.RewardsConfigInput[] memory rewardsInput) internal {
    for (uint256 i = 0; i < rewardsInput.length; i++) {
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
        rewardsInput[i].totalSupply
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
   * @param totalSupply Current total of staked _assets for this distribution
   * @return The new distribution index
   **/
  function _updateAssetStateInternal(
    address asset,
    address reward,
    RewardData storage rewardConfig,
    uint256 totalSupply
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
      totalSupply
    );

    if (newIndex != oldIndex) {
      require(newIndex <= type(uint104).max, 'Index overflow');
      //optimization: storing one after another saves one SSTORE
      rewardConfig.index = uint104(newIndex);
      rewardConfig.lastUpdateTimestamp = uint40(block.timestamp);
      emit AssetIndexUpdated(asset, reward, newIndex);
    } else {
      rewardConfig.lastUpdateTimestamp = uint40(block.timestamp);
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

    uint256 newIndex = _updateAssetStateInternal(asset, reward, rewardData, totalSupply);

    if (userIndex != newIndex) {
      if (userBalance != 0) {
        accruedRewards = _getRewards(userBalance, newIndex, userIndex);
      }

      rewardData.usersIndex[user] = newIndex;
      emit UserIndexUpdated(user, asset, reward, newIndex);
    }

    return accruedRewards;
  }

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
    DistributionTypesV2.UserAssetStatsInput[] memory userState
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
    DistributionTypesV2.UserAssetStatsInput[] memory userState
  ) internal view returns (uint256 unclaimedRewards) {
    // Add unrealized rewards
    for (uint256 i = 0; i < userState.length; i++) {
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
    DistributionTypesV2.UserAssetStatsInput[] memory userState
  ) internal view returns (address[] memory rewardsList, uint256[] memory unclaimedRewards) {
    rewardsList = new address[](_rewardsList.length);
    unclaimedRewards = new uint256[](_rewardsList.length);

    // Add stored rewards from user to unclaimedRewards
    for (uint256 y = 0; y < _rewardsList.length; y++) {
      rewardsList[y] = _rewardsList[y];
      unclaimedRewards[y] = _usersUnclaimedRewards[user][_rewardsList[y]];
    }

    // Add unrealized rewards from user to unclaimedRewards
    for (uint256 i = 0; i < userState.length; i++) {
      for (uint256 r = 0; r < _rewardsList.length; r++) {
        unclaimedRewards[r] += _getUnrealizedRewardsFromStake(user, _rewardsList[r], userState[i]);
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
    DistributionTypesV2.UserAssetStatsInput memory stake
  ) internal view returns (uint256) {
    RewardData storage rewardData = _assets[stake.underlyingAsset].rewards[reward];

    uint256 assetIndex = _getAssetIndex(
      rewardData.index,
      rewardData.emissionPerSecond,
      rewardData.lastUpdateTimestamp,
      rewardData.distributionEnd,
      stake.totalSupply
    );

    return _getRewards(stake.userBalance, assetIndex, rewardData.usersIndex[user]);
  }

  /**
   * @dev Internal function for the calculation of user's rewards on a distribution
   * @param principalUserBalance Amount staked by the user on a distribution
   * @param reserveIndex Current index of the distribution
   * @param userIndex Index stored for the user, representation his staking moment
   * @return The rewards
   **/
  function _getRewards(
    uint256 principalUserBalance,
    uint256 reserveIndex,
    uint256 userIndex
  ) internal pure returns (uint256) {
    return (principalUserBalance * (reserveIndex - userIndex)) / 10**uint256(PRECISION);
  }

  /**
   * @dev Calculates the next value of an specific distribution index, with validations
   * @param currentIndex Current index of the distribution
   * @param emissionPerSecond Representing the total rewards distributed per second per asset unit, on the distribution
   * @param lastUpdateTimestamp Last moment this distribution was updated
   * @param totalBalance of tokens considered for the distribution
   * @return The new index.
   **/
  function _getAssetIndex(
    uint256 currentIndex,
    uint256 emissionPerSecond,
    uint128 lastUpdateTimestamp,
    uint256 distributionEnd,
    uint256 totalBalance
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
    return (emissionPerSecond * timeDelta * (10**uint256(PRECISION))) / totalBalance + currentIndex;
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
    returns (DistributionTypesV2.UserAssetStatsInput[] memory userState);
}
