pragma solidity 0.8.10;

import {IERC20Detailed} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {SafeCast} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeCast.sol';
import {IRewardsDistributor} from './interfaces/IRewardsDistributor.sol';
import {DataTypes} from './libraries/DataTypes.sol';

/**
 * @title RewardsDistributor
 * @notice Accounting contract to manage multiple staking distributions with multiple rewards
 * @author Aave
 **/
abstract contract RewardsDistributor is IRewardsDistributor {
  using SafeCast for uint256;
  // manager of incentives
  address public immutable EMISSION_MANAGER;

  // asset => AssetData
  mapping(address => DataTypes.AssetData) internal _assets;

  // reward => enabled
  mapping(address => bool) internal _isRewardEnabled;

  // global rewards list
  address[] internal _rewardsList;

  //global assets list
  address[] internal _assetsList;

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
    uint128 rewardsCount = _assets[asset].availableRewardsCount;
    address[] memory availableRewards = new address[](rewardsCount);

    for (uint128 i = 0; i < rewardsCount; i++) {
      availableRewards[i] = _assets[asset].availableRewards[i];
    }
    return availableRewards;
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
    return _assets[asset].rewards[reward].usersData[user].index;
  }

  /// @inheritdoc IRewardsDistributor
  function getUserUnclaimedRewardsFromStorage(address user, address reward)
    external
    view
    override
    returns (uint256)
  {
    uint256 totalAccrued;
    for (uint256 i = 0; i < _assetsList.length; i++) {
      totalAccrued += _assets[_assetsList[i]].rewards[reward].usersData[user].accrued;
    }

    return totalAccrued;
  }

  /// @inheritdoc IRewardsDistributor
  function getUserRewardsBalance(
    address[] calldata assets,
    address user,
    address reward
  ) external view override returns (uint256) {
    return _getUserReward(user, reward, _getUserBalances(assets, user));
  }

  /// @inheritdoc IRewardsDistributor
  function getAllUserRewardsBalance(address[] calldata assets, address user)
    external
    view
    override
    returns (address[] memory rewardsList, uint256[] memory unclaimedAmounts)
  {
    DataTypes.UserAssetStatsInput[] memory userState = _getUserBalances(assets, user);
    rewardsList = new address[](_rewardsList.length);
    unclaimedAmounts = new uint256[](rewardsList.length);

    // Add unrealized rewards from user to unclaimedRewards
    for (uint256 i = 0; i < userState.length; i++) {
      for (uint256 r = 0; r < rewardsList.length; r++) {
        rewardsList[r] = _rewardsList[r];
        unclaimedAmounts[r] += _assets[userState[i].underlyingAsset]
          .rewards[rewardsList[r]]
          .usersData[user]
          .accrued;

        if (userState[i].userBalance == 0) {
          continue;
        }
        unclaimedAmounts[r] += _getUnrealizedRewardsFromStake(user, rewardsList[r], userState[i]);
      }
    }
    return (rewardsList, unclaimedAmounts);
  }

  /// @inheritdoc IRewardsDistributor
  function setDistributionEnd(
    address asset,
    address reward,
    uint32 newDistributionEnd
  ) external override onlyEmissionManager {
    uint256 oldDistributionEnd = _assets[asset].rewards[reward].distributionEnd;
    _assets[asset].rewards[reward].distributionEnd = newDistributionEnd;

    emit AssetConfigUpdated(
      asset,
      reward,
      _assets[asset].rewards[reward].emissionPerSecond,
      _assets[asset].rewards[reward].emissionPerSecond,
      oldDistributionEnd,
      newDistributionEnd,
      _assets[asset].rewards[reward].index
    );
  }

  /// @inheritdoc IRewardsDistributor
  function setEmissionPerSecond(
    address asset,
    address[] calldata rewards,
    uint88[] calldata newEmissionsPerSecond
  ) external override onlyEmissionManager {
    require(rewards.length == newEmissionsPerSecond.length, 'INVALID_INPUT');
    for (uint256 i = 0; i < rewards.length; i++) {
      DataTypes.AssetData storage assetConfig = _assets[asset];
      DataTypes.RewardData storage rewardConfig = _assets[asset].rewards[rewards[i]];
      uint256 decimals = assetConfig.decimals;
      require(decimals != 0 && rewardConfig.lastUpdateTimestamp != 0, 'DISTRIBUTION_NOT_EXISTS');

      (uint256 newIndex, ) = _updateRewardData(
        rewardConfig,
        IERC20Detailed(asset).totalSupply(),
        10**decimals
      );

      uint256 oldEmissionPerSecond = rewardConfig.emissionPerSecond;
      rewardConfig.emissionPerSecond = newEmissionsPerSecond[i];

      emit AssetConfigUpdated(
        asset,
        rewards[i],
        oldEmissionPerSecond,
        newEmissionsPerSecond[i],
        rewardConfig.distributionEnd,
        rewardConfig.distributionEnd,
        newIndex
      );
    }
  }

  /**
   * @dev Configure the _assets for a specific emission
   * @param rewardsInput The array of each asset configuration
   **/
  function _configureAssets(DataTypes.RewardsConfigInput[] memory rewardsInput) internal {
    for (uint256 i = 0; i < rewardsInput.length; i++) {
      if (_assets[rewardsInput[i].asset].decimals == 0) {
        //never initialized before, adding to the list of assets
        _assetsList.push(rewardsInput[i].asset);
      }

      uint256 decimals = _assets[rewardsInput[i].asset].decimals = IERC20Detailed(
        rewardsInput[i].asset
      ).decimals();

      DataTypes.RewardData storage rewardConfig = _assets[rewardsInput[i].asset].rewards[
        rewardsInput[i].reward
      ];

      // Add reward address to asset available rewards if latestUpdateTimestamp is zero
      if (rewardConfig.lastUpdateTimestamp == 0) {
        _assets[rewardsInput[i].asset].availableRewards[
          _assets[rewardsInput[i].asset].availableRewardsCount
        ] = rewardsInput[i].reward;
        _assets[rewardsInput[i].asset].availableRewardsCount++;
      }

      // Add reward address to global rewards list if still not enabled
      if (_isRewardEnabled[rewardsInput[i].reward] == false) {
        _isRewardEnabled[rewardsInput[i].reward] = true;
        _rewardsList.push(rewardsInput[i].reward);
      }

      // Due emissions is still zero, updates only latestUpdateTimestamp
      (uint256 newIndex, ) = _updateRewardData(
        rewardConfig,
        rewardsInput[i].totalSupply,
        10**decimals
      );

      // Configure emission and distribution end of the reward per asset
      rewardConfig.emissionPerSecond = rewardsInput[i].emissionPerSecond;
      rewardConfig.distributionEnd = rewardsInput[i].distributionEnd;

      emit AssetConfigUpdated(
        rewardsInput[i].asset,
        rewardsInput[i].reward,
        0,
        rewardsInput[i].emissionPerSecond,
        0,
        rewardsInput[i].distributionEnd,
        newIndex
      );
    }
  }

  /**
   * @dev Updates the state of the distribution for the specified reward
   * @param rewardData Storage pointer to the distribution reward config
   * @param totalSupply Current total of underlying assets for this distribution
   * @param assetUnit One unit of asset (10^decimals)
   * @return The new distribution index
   **/
  function _updateRewardData(
    DataTypes.RewardData storage rewardData,
    uint256 totalSupply,
    uint256 assetUnit
  ) internal returns (uint256, bool) {
    (uint256 oldIndex, uint256 newIndex) = _getAssetIndex(rewardData, totalSupply, assetUnit);
    bool dataUpdated;
    if ((dataUpdated = newIndex != oldIndex)) {
      require(newIndex <= type(uint104).max, 'Index overflow');
      //optimization: storing one after another saves one SSTORE
      rewardData.index = uint104(newIndex);
      rewardData.lastUpdateTimestamp = uint32(block.timestamp);
    } else {
      rewardData.lastUpdateTimestamp = uint32(block.timestamp);
    }

    return (newIndex, dataUpdated);
  }

  /**
   * @dev Updates the state of the distribution for the specific user
   * @param rewardData Storage pointer to the distribution reward config
   * @param user The address of the user
   * @param assetUnit One unit of asset (10^decimals)
   * @return The rewards accrued since the last update
   **/
  function _updateUserData(
    DataTypes.RewardData storage rewardData,
    address user,
    uint256 userBalance,
    uint256 newAssetIndex,
    uint256 assetUnit
  ) internal returns (uint256, bool) {
    uint256 userIndex = rewardData.usersData[user].index;
    uint256 rewardsAccrued;
    bool dataUpdated;
    if ((dataUpdated = userIndex != newAssetIndex)) {
      // already checked for overflow in _updateRewardData
      rewardData.usersData[user].index = uint104(newAssetIndex);
      if (userBalance != 0) {
        rewardsAccrued = _getRewards(userBalance, newAssetIndex, userIndex, assetUnit);

        rewardData.usersData[user].accrued += rewardsAccrued.toUint128();
      }
    }
    return (rewardsAccrued, dataUpdated);
  }

  /**
   * @dev Iterates and accrues all the rewards for asset of the specifc user
   * @param asset The address of the reference asset of the distribution
   * @param user The user address
   * @param userBalance The current user asset balance
   * @param totalSupply Total supply of the asset
   **/
  function _updateData(
    address asset,
    address user,
    uint256 userBalance,
    uint256 totalSupply
  ) internal {
    uint256 assetUnit;
    uint256 numAvailableRewards = _assets[asset].availableRewardsCount;
    unchecked {
      assetUnit = 10**_assets[asset].decimals;
    }

    if (numAvailableRewards == 0) {
      return;
    }
    unchecked {
      for (uint128 r = 0; r < numAvailableRewards; r++) {
        address reward = _assets[asset].availableRewards[r];
        DataTypes.RewardData storage rewardData = _assets[asset].rewards[reward];

        (uint256 newAssetIndex, bool rewardDataUpdated) = _updateRewardData(
          rewardData,
          totalSupply,
          assetUnit
        );

        (uint256 rewardsAccrued, bool userDataUpdated) = _updateUserData(
          rewardData,
          user,
          userBalance,
          newAssetIndex,
          assetUnit
        );

        if (rewardDataUpdated || userDataUpdated) {
          emit Accrued(asset, reward, user, newAssetIndex, newAssetIndex, rewardsAccrued);
        }
      }
    }
  }

  /**
   * @dev Accrues all the rewards of the assets specified in the userState list
   * @param user The address of the user
   * @param userState List of structs of the user data related with his stake
   **/
  function _updateDataMultiple(address user, DataTypes.UserAssetStatsInput[] memory userState)
    internal
  {
    for (uint256 i = 0; i < userState.length; i++) {
      _updateData(
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
    DataTypes.UserAssetStatsInput[] memory userState
  ) internal view returns (uint256 unclaimedRewards) {
    // Add unrealized rewards
    for (uint256 i = 0; i < userState.length; i++) {
      if (userState[i].userBalance == 0) {
        continue;
      }
      unclaimedRewards +=
        _getUnrealizedRewardsFromStake(user, reward, userState[i]) +
        _assets[userState[i].underlyingAsset].rewards[reward].usersData[user].accrued;
    }

    return unclaimedRewards;
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
    DataTypes.UserAssetStatsInput memory stake
  ) internal view returns (uint256) {
    DataTypes.RewardData storage rewardData = _assets[stake.underlyingAsset].rewards[reward];
    uint256 assetUnit = 10**_assets[stake.underlyingAsset].decimals;
    (, uint256 nextIndex) = _getAssetIndex(rewardData, stake.totalSupply, assetUnit);

    return _getRewards(stake.userBalance, nextIndex, rewardData.usersData[user].index, assetUnit);
  }

  /**
   * @dev Internal function for the calculation of user's rewards on a distribution
   * @param principalUserBalance Balance of the user asset on a distribution
   * @param reserveIndex Current index of the distribution
   * @param userIndex Index stored for the user, representation his staking moment
   * @param assetUnit One unit of asset (10^decimals)
   * @return The rewards
   **/
  function _getRewards(
    uint256 principalUserBalance,
    uint256 reserveIndex,
    uint256 userIndex,
    uint256 assetUnit
  ) internal pure returns (uint256) {
    uint256 result = principalUserBalance * (reserveIndex - userIndex);
    assembly {
      result := div(result, assetUnit)
    }
    return result;
  }

  /**
   * @dev Calculates the next value of an specific distribution index, with validations
   * @param totalSupply of the asset being rewarded
   * @param assetUnit One unit of asset (10^decimals)
   * @return The new index.
   **/
  function _getAssetIndex(
    DataTypes.RewardData storage rewardData,
    uint256 totalSupply,
    uint256 assetUnit
  ) internal view returns (uint256, uint256) {
    uint256 oldIndex = rewardData.index;
    uint256 distributionEnd = rewardData.distributionEnd;
    uint256 emissionPerSecond = rewardData.emissionPerSecond;
    uint256 lastUpdateTimestamp = rewardData.lastUpdateTimestamp;

    if (
      emissionPerSecond == 0 ||
      totalSupply == 0 ||
      lastUpdateTimestamp == block.timestamp ||
      lastUpdateTimestamp >= distributionEnd
    ) {
      return (oldIndex, oldIndex);
    }

    uint256 currentTimestamp = block.timestamp > distributionEnd
      ? distributionEnd
      : block.timestamp;
    uint256 timeDelta = currentTimestamp - lastUpdateTimestamp;
    uint256 firstTerm = emissionPerSecond * timeDelta * assetUnit;
    assembly {
      firstTerm := div(firstTerm, totalSupply)
    }
    return (oldIndex, (firstTerm + oldIndex));
  }

  /**
   * @dev Get user staking distribution of a list of assets
   * @dev To be fulfilled with custom logic of the underlying asset to get total staked supply and user stake balance
   * @param assets List of asset addresses of the user
   * @param user Address of the user
   */
  function _getUserBalances(address[] calldata assets, address user)
    internal
    view
    virtual
    returns (DataTypes.UserAssetStatsInput[] memory userState);

  /// @inheritdoc IRewardsDistributor
  function getAssetDecimals(address asset) external view returns (uint8) {
    return _assets[asset].decimals;
  }
}
