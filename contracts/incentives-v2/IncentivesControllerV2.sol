// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {VersionedInitializable} from '@aave/core-v3/contracts/protocol/libraries/aave-upgradeability/VersionedInitializable.sol';
import {IScaledBalanceToken} from '@aave/core-v3/contracts/interfaces/IScaledBalanceToken.sol';

import {TransferStrategyStorage} from './transfer-strategies/TransferStrategyStorage.sol';
import {DistributionManagerV2} from './DistributionManagerV2.sol';
import {IAaveIncentivesControllerV2} from './interfaces/IAaveIncentivesControllerV2.sol';
import {ITransferStrategy} from './interfaces/ITransferStrategy.sol';
import {DistributionTypesV2} from './libraries/DistributionTypesV2.sol';

/**
 * @title IncentivesControllerV2
 * @notice Abstract contract template to build Distributors contracts for ERC20 rewards to protocol participants
 * @author Aave
 **/
contract IncentivesControllerV2 is
  TransferStrategyStorage,
  DistributionManagerV2,
  VersionedInitializable,
  IAaveIncentivesControllerV2
{
  uint256 public constant REVISION = 1;

  // this mapping allows whitelisted addresses to claim on behalf of others
  // useful for contracts that hold tokens to be rewarded but don't have any native logic to claim Liquidity Mining rewards
  mapping(address => address) internal _authorizedClaimers;

  // reward => transfer strategy implementation contract
  mapping(address => ITransferStrategy) internal _transferStrategy;

  modifier onlyAuthorizedClaimers(address claimer, address user) {
    require(_authorizedClaimers[user] == claimer, 'CLAIMER_UNAUTHORIZED');
    _;
  }

  constructor(address emissionManager) DistributionManagerV2(emissionManager) {}

  /**
   * @dev Empty initialize IncentivesControllerV2
   **/
  function initialize() external initializer {}

  /// @inheritdoc IAaveIncentivesControllerV2
  function getClaimer(address user) external view override returns (address) {
    return _authorizedClaimers[user];
  }

  /**
   * @dev returns the revision of the implementation contract
   */
  function getRevision() internal pure override returns (uint256) {
    return REVISION;
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function configureAssets(DistributionTypesV2.RewardsConfigInput[] memory config)
    external
    override
    onlyEmissionManager
  {
    for (uint256 i = 0; i < config.length; i++) {
      // Get the current Scaled Total Supply of AToken or Debt token
      config[i].totalSupply = IScaledBalanceToken(config[i].asset).scaledTotalSupply();

      // Install TransferStrategy logic at IncentivesController
      _installTransferStrategy(
        config[i].reward,
        config[i].transferStrategy,
        config[i].transferStrategyParams
      );
    }
    _configureAssets(config);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function setTransferStrategy(
    address reward,
    ITransferStrategy transferStrategy,
    bytes memory params
  ) external onlyEmissionManager {
    _installTransferStrategy(reward, transferStrategy, params);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function handleAction(
    address user,
    uint256 totalSupply,
    uint256 userBalance
  ) external override {
    _updateUserRewardsPerAssetInternal(msg.sender, user, userBalance, totalSupply);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function claimRewards(
    address[] calldata assets,
    uint256 amount,
    address to,
    address reward
  ) external override returns (uint256) {
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimRewards(assets, amount, msg.sender, msg.sender, to, reward);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function claimRewardsOnBehalf(
    address[] calldata assets,
    uint256 amount,
    address user,
    address to,
    address reward
  ) external override onlyAuthorizedClaimers(msg.sender, user) returns (uint256) {
    require(user != address(0), 'INVALID_USER_ADDRESS');
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimRewards(assets, amount, msg.sender, user, to, reward);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function claimRewardsToSelf(
    address[] calldata assets,
    uint256 amount,
    address reward
  ) external override returns (uint256) {
    return _claimRewards(assets, amount, msg.sender, msg.sender, msg.sender, reward);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function claimAllRewards(address[] calldata assets, address to)
    external
    override
    returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
  {
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimAllRewards(assets, msg.sender, msg.sender, to);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function claimAllRewardsOnBehalf(
    address[] calldata assets,
    address user,
    address to
  )
    external
    override
    onlyAuthorizedClaimers(msg.sender, user)
    returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
  {
    require(user != address(0), 'INVALID_USER_ADDRESS');
    require(to != address(0), 'INVALID_TO_ADDRESS');
    return _claimAllRewards(assets, msg.sender, user, to);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function claimAllRewardsToSelf(address[] calldata assets)
    external
    override
    returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
  {
    return _claimAllRewards(assets, msg.sender, msg.sender, msg.sender);
  }

  /// @inheritdoc IAaveIncentivesControllerV2
  function setClaimer(address user, address caller) external override onlyEmissionManager {
    _authorizedClaimers[user] = caller;
    emit ClaimerSet(user, caller);
  }

  /**
   * @dev Get user staking distribution of a list of assets
   * @param assets List of asset addresses of the user
   * @param user Address of the user
   */
  function _getUserStake(address[] calldata assets, address user)
    internal
    view
    override
    returns (DistributionTypesV2.UserStakeInput[] memory userState)
  {
    userState = new DistributionTypesV2.UserStakeInput[](assets.length);
    for (uint256 i = 0; i < assets.length; i++) {
      userState[i].underlyingAsset = assets[i];
      (userState[i].userBalance, userState[i].totalSupply) = IScaledBalanceToken(assets[i])
        .getScaledUserBalanceAndSupply(user);
    }
    return userState;
  }

  /**
   * @dev Claims one type of reward for an user on behalf, on all the assets of the lending pool, accumulating the pending rewards.
   * @param amount Amount of rewards to claim
   * @param claimer Address of the claimer
   * @param user Address to check and claim rewards
   * @param to Address that will be receiving the rewards
   * @param claimer Address of the reward
   * @return Rewards claimed
   **/
  function _claimRewards(
    address[] calldata assets,
    uint256 amount,
    address claimer,
    address user,
    address to,
    address reward
  ) internal returns (uint256) {
    if (amount == 0) {
      return 0;
    }
    uint256 unclaimedRewards = _usersUnclaimedRewards[user][reward];

    if (amount > unclaimedRewards) {
      _distributeRewards(user, _getUserStake(assets, user));
      unclaimedRewards = _usersUnclaimedRewards[user][reward];
    }

    if (unclaimedRewards == 0) {
      return 0;
    }

    uint256 amountToClaim = amount > unclaimedRewards ? unclaimedRewards : amount;
    _usersUnclaimedRewards[user][reward] = unclaimedRewards - amountToClaim; // Safe due to the previous line

    _transferRewards(to, reward, amountToClaim);
    emit RewardsClaimed(user, reward, to, claimer, amountToClaim);

    return amountToClaim;
  }

  /**
   * @dev Claims one type of reward for an user on behalf, on all the assets of the lending pool, accumulating the pending rewards.
   * @param claimer Address of the claimer
   * @param user Address to check and claim rewards
   * @param to Address that will be receiving the rewards
   * @return
   *   rewardsList List of reward addresses
   *   claimedAmount List of claimed amounts, follows "rewardsList" items order
   **/
  function _claimAllRewards(
    address[] calldata assets,
    address claimer,
    address user,
    address to
  ) internal returns (address[] memory rewardsList, uint256[] memory claimedAmounts) {
    _distributeRewards(user, _getUserStake(assets, user));

    for (uint256 i = 0; i < _rewardsList.length; i++) {
      address reward = _rewardsList[i];
      uint256 rewardAmount = _usersUnclaimedRewards[user][reward];

      rewardsList[i] = reward;
      claimedAmounts[i] = rewardAmount;

      if (rewardAmount != 0) {
        _usersUnclaimedRewards[user][reward] = 0;
        _transferRewards(to, reward, rewardAmount);
        emit RewardsClaimed(user, reward, to, claimer, rewardAmount);
      }
    }
    return (rewardsList, claimedAmounts);
  }

  /**
   * @dev function to transfer rewards to the desired account using delegatecall and
   * @param to Address of the reward ERC20 token
   * @param to Account address to send the rewards
   * @param amount Amount of rewards to transfer
   */
  function _transferRewards(
    address to,
    address reward,
    uint256 amount
  ) internal {
    require(
      address(_transferStrategy[reward]) != address(0),
      'Transfer implementation can not be empty'
    );
    ITransferStrategy transferStrategy = _transferStrategy[reward];

    (bool success, bytes memory returnData) = address(transferStrategy).delegatecall(
      abi.encodeWithSelector(transferStrategy.performTransfer.selector, to, reward, amount)
    );

    require(abi.decode(returnData, (bool)) == true && success == true, 'Transfer error');
  }

  /**
   * @dev Returns true if `account` is a contract.
   */
  function _isContract(address account) internal view returns (bool) {
    // This method relies on extcodesize, which returns 0 for contracts in
    // construction, since the code is only stored at the end of the
    // constructor execution.

    uint256 size;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      size := extcodesize(account)
    }
    return size > 0;
  }

  function _installTransferStrategy(
    address reward,
    ITransferStrategy transferStrategy,
    bytes memory params
  ) internal {
    require(
      _isContract(address(transferStrategy)) == true,
      'TransferStrategy Logic address must be a contract'
    );
    // Call to installHook to external contract
    (bool success, bytes memory returnData) = address(transferStrategy).delegatecall(
      abi.encodeWithSelector(transferStrategy.installHook.selector, params)
    );
    require(
      success == true && abi.decode(returnData, (bool)) == true,
      'Error at installation hook of TransferStrategy'
    );

    _transferStrategy[reward] = transferStrategy;

    emit TransferStrategyInstalled(reward, address(transferStrategy));
  }
}
