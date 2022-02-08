pragma solidity 0.8.10;

import {IERC20Detailed} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {SafeCast} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeCast.sol';
import {IRewardsDistributor} from './interfaces/IRewardsDistributor.sol';
import {RewardsDistributorTypes} from './libraries/RewardsDistributorTypes.sol';

/**
 * @title RewardsDistributor
 * @notice Accounting contract to manage multiple staking distributions with multiple rewards
 * @author Aave
 **/
abstract contract RewardsDistributor is IRewardsDistributor {

  using SafeCast for uint256;
  
  struct UserData {
    uint104 index; // matches reward index
    uint128 accrued;
  }

  struct RewardData {
    uint104 index;
    uint88 emissionPerSecond;
    uint32 lastUpdateTimestamp;
    uint32 distributionEnd;
    mapping(address => UserData) usersData;
  }

  struct AssetData {
    mapping(address => RewardData) rewards;
    mapping(uint128 => address) availableRewards;
    uint128 availableRewardsCount;
    uint8 decimals;
  }

  // manager of incentives
  address public immutable EMISSION_MANAGER;

  // asset => AssetData
  mapping(address => AssetData) internal _assets;

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
  function getUserAssetIndex(
    address user,
    address asset,
    address reward
  ) public view override returns (uint256) {
    return _assets[asset].rewards[reward].usersData[user].index;
  }

  /// @inheritdoc IRewardsDistributor
  function getUserAccruedRewards(address user, address reward)
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
  function getUserRewards(
    address[] calldata assets,
    address user,
    address reward
  ) external view override returns (uint256) {
    return _getUserReward(user, reward, _getUserStake(assets, user));
  }

  /// @inheritdoc IRewardsDistributor
  function getAllUserRewards(address[] calldata assets, address user)
    external
    view
    override
    returns (address[] memory rewardsList, uint256[] memory unclaimedAmounts)
  {
    RewardsDistributorTypes.UserAssetStatsInput[] memory userState = _getUserStake(assets, user);
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
      if (_assets[rewardsInput[i].asset].decimals == 0) {
        //never initialized before, adding to the list of assets
        _assetsList.push(rewardsInput[i].asset);
      }

      uint256 decimals = _assets[rewardsInput[i].asset].decimals = IERC20Detailed(
        rewardsInput[i].asset
      ).decimals();

      RewardData storage rewardConfig = _assets[rewardsInput[i].asset].rewards[
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
      _updateAssetStateInternal(
        rewardsInput[i].asset,
        rewardsInput[i].reward,
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
   * @param assetUnit One unit of asset (10^decimals)
   * @return The new distribution index
   **/
  function _updateAssetStateInternal(
    address asset,
    address reward,
    RewardData storage rewardConfig,
    uint256 totalSupply,
    uint256 assetUnit
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
      assetUnit
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
   * @dev Updates the state of a user in a distribution
   * @param user The user's address
   * @param asset The address of the reference asset of the distribution
   * @param reward The address of the reward
   * @param assetUnit One unit of asset (10^decimals)
   * @param userBalance Amount of tokens staked by the user in the distribution at the moment
   * @param totalSupply Total tokens staked in the distribution
   * @return The accrued rewards for the user until the moment
   **/
  function _updateUserRewardsInternal(
    address user,
    address asset,
    address reward,
    uint256 assetUnit,
    uint256 userBalance,
    uint256 totalSupply
  ) internal returns (uint256) {
    RewardData storage rewardData = _assets[asset].rewards[reward];
    uint256 userIndex = rewardData.usersData[user].index;
    uint256 accruedRewards = 0;

    uint256 newIndex = _updateAssetStateInternal(asset, reward, rewardData, totalSupply, assetUnit);

    if (userIndex != newIndex) {
      if (userBalance != 0) {
        accruedRewards = _getRewards(userBalance, newIndex, userIndex, assetUnit);
      }

      require(userIndex <= type(uint104).max, 'Index overflow');
      rewardData.usersData[user].index = uint104(newIndex);
    
      emit UserIndexUpdated(user, asset, reward, newIndex);
    }

    return accruedRewards;
  }

  /**
   * @dev Iterates and accrues all the rewards for asset of the specifc user
   * @param asset The address of the reference asset of the distribution
   * @param user The user address
   * @param userBalance The current user asset balance
   * @param totalSupply Total supply of the asset
   **/
  function _accrue(
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
        uint256 accruedRewards = _updateUserRewardsInternal(
          user,
          asset,
          reward,
          assetUnit,
          userBalance,
          totalSupply
        );
        if (accruedRewards != 0) {
          _assets[asset].rewards[reward].usersData[user].accrued += accruedRewards.toUint128();

          emit RewardsAccrued(user, reward, accruedRewards);
        }
      }
    }
  }

  /**
   * @dev Accrues all the rewards of the assets specified in the userState list
   * @param user The address of the user
   * @param userState List of structs of the user data related with his stake
   **/
  function _accrueMultiple(
    address user,
    RewardsDistributorTypes.UserAssetStatsInput[] memory userState
  ) internal {
    for (uint256 i = 0; i < userState.length; i++) {
      _accrue(
        userState[i].underlyingAsset,
        user,
        userState[i].userBalance,
        userState[i].totalSupply
      );
    }
  }

  /**
   * @dev Return the accrued unclaimed amount of a reward from a user over a list of distribution
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
      unclaimedRewards +=
        _getUnrealizedRewardsFromStake(user, reward, userState[i]) +
        _assets[userState[i].underlyingAsset].rewards[reward].usersData[user].accrued;
    }

    return unclaimedRewards;
  }

  /**
   * @dev Return the unrealized amount of one reward from a user over a list of distribution
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
    uint256 assetUnit = 10**_assets[stake.underlyingAsset].decimals;
    uint256 assetIndex = _getAssetIndex(
      rewardData.index,
      rewardData.emissionPerSecond,
      rewardData.lastUpdateTimestamp,
      rewardData.distributionEnd,
      stake.totalSupply,
      assetUnit
    );

    return _getRewards(stake.userBalance, assetIndex, rewardData.usersData[user].index, assetUnit);
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
   * @param currentIndex Current index of the distribution
   * @param emissionPerSecond Representing the total rewards distributed per second per asset unit, on the distribution
   * @param lastUpdateTimestamp Last moment this distribution was updated
   * @param totalBalance of tokens considered for the distribution
   * @param assetUnit One unit of asset (10^decimals)
   * @return The new index.
   **/
  function _getAssetIndex(
    uint256 currentIndex,
    uint256 emissionPerSecond,
    uint128 lastUpdateTimestamp,
    uint256 distributionEnd,
    uint256 totalBalance,
    uint256 assetUnit
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
    uint256 firstTerm = emissionPerSecond * timeDelta * assetUnit;
    assembly {
      firstTerm := div(firstTerm, totalBalance)
    }
    return firstTerm + currentIndex;
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
