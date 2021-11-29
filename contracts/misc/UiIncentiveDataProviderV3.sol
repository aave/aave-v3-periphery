// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';
import {IAaveIncentivesControllerV2} from '../incentives-v2/interfaces/IAaveIncentivesControllerV2.sol';
import {IUiIncentiveDataProviderV3} from './interfaces/IUiIncentiveDataProviderV3.sol';
import {IPool} from '@aave/core-v3/contracts/interfaces/IPool.sol';
import {IncentivizedERC20} from '@aave/core-v3/contracts/protocol/tokenization/IncentivizedERC20.sol';
import {UserConfiguration} from '@aave/core-v3/contracts/protocol/libraries/configuration/UserConfiguration.sol';
import {DataTypes} from '@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol';
import {IERC20Detailed} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {IPriceOracleGetter} from '@aave/core-v3/contracts/interfaces/IPriceOracleGetter.sol';
import {IEACAggregatorProxy} from './interfaces/IEACAggregatorProxy.sol';

contract UiIncentiveDataProvider is IUiIncentiveDataProviderV3 {
  using UserConfiguration for DataTypes.UserConfigurationMap;

  constructor() {}

  function getFullReservesIncentiveData(IPoolAddressesProvider provider, address user)
    external
    view
    override
    returns (AggregatedReserveIncentiveData[] memory, UserReserveIncentiveData[] memory)
  {
    return (_getReservesIncentivesData(provider), _getUserReservesIncentivesData(provider, user));
  }

  function getReservesIncentivesData(IPoolAddressesProvider provider)
    external
    view
    override
    returns (AggregatedReserveIncentiveData[] memory)
  {
    return _getReservesIncentivesData(provider);
  }

  function _getReservesIncentivesData(IPoolAddressesProvider provider)
    private
    view
    returns (AggregatedReserveIncentiveData[] memory)
  {
    IPool lendingPool = IPool(provider.getPool());
    address[] memory reserves = lendingPool.getReservesList();
    AggregatedReserveIncentiveData[] memory reservesIncentiveData =
      new AggregatedReserveIncentiveData[](reserves.length);

    // Iterate through the reserves to get all the information from the (a/s/v) Tokens
    for (uint256 i = 0; i < reserves.length; i++) {
      AggregatedReserveIncentiveData memory reserveIncentiveData = reservesIncentiveData[i];
      reserveIncentiveData.underlyingAsset = reserves[i];

      DataTypes.ReserveData memory baseData = lendingPool.getReserveData(reserves[i]);

      // Get aTokens rewards information
      IAaveIncentivesControllerV2 aTokenIncentiveController = IncentivizedERC20(baseData.aTokenAddress).getIncentivesController();
      address[] memory aTokenRewardAddresses = aTokenIncentiveController.getRewardsByAsset(baseData.aTokenAddress);

      RewardInfo memory aRewardsInformation = new RewardInfo[](aTokenRewardAddresses.length);
      for(uint256 j = 0; j < aTokenRewardAddresses.length; ++j) {
        RewardInfo memory rewardInformation = aRewardsInformation[i];
        rewardInformation.rewardTokenAddress = aTokenRewardAddresses[i];

        (
          rewardInformation.tokenIncentivesIndex,
          rewardInformation.emissionPerSecond,
          rewardInformation.incentivesLastUpdateTimestamp,
          rewardInformation.emissionEndTimestamp,
        ) = aTokenIncentiveController.getRewardsData(baseData.aTokenAddress, rewardInformation.rewardTokenAddress);

        rewardInformation.precision = aTokenIncentiveController.PRECISION();
        rewardInformation.rewardTokenDecimals = IERC20Detailed(rewardInformation.rewardTokenAddress).decimals();
        rewardInformation.rewardTokenSymbol = IERC20Detailed(rewardInformation.rewardTokenAddress).symbol();

        // Get price of reward token from Chainlink Proxy Oracle
        rewardInformation.rewardOracleAddress = aTokenIncentiveController.getRewardOracle(rewardInformation.rewardTokenAddress);
        rewardInformation.priceFeedDecimals = IEACAggregatorProxy(rewardInformation.rewardOracle).latestAnswer();
        rewardInformation.rewardPriceFeed = IEACAggregatorProxy(rewardInformation.rewardOracle).decimals();

      }
      
      reserveIncentiveData.aIncentiveData = IncentiveData(
        baseData.aTokenAddress,
        address(aTokenIncentiveController),
        aRewardsInformation 
      ); 

      // Get vTokens rewards information
      IAaveIncentivesControllerV2 vTokenIncentiveController = IncentivizedERC20(baseData.variableDebtTokenAddress).getIncentivesController();
      address[] memory vTokenRewardAddresses = vTokenIncentiveController.getRewardsByAsset(baseData.variableDebtTokenAddress);

      RewardInfo memory vRewardsInformation = new RewardInfo[](vTokenRewardAddresses.length);
      for(uint256 j = 0; j < vTokenRewardAddresses.length; ++j) {
        RewardInfo memory rewardInformation = vRewardsInformation[i];
        rewardInformation.rewardTokenAddress = vTokenRewardAddresses[i];

        (
          rewardInformation.tokenIncentivesIndex,
          rewardInformation.emissionPerSecond,
          rewardInformation.incentivesLastUpdateTimestamp,
          rewardInformation.emissionEndTimestamp,
        ) = vTokenIncentiveController.getRewardsData(baseData.variableDebtTokenAddress, rewardInformation.rewardTokenAddress);

        rewardInformation.precision = vTokenIncentiveController.PRECISION();
        rewardInformation.rewardTokenDecimals = IERC20Detailed(rewardInformation.rewardTokenAddress).decimals();
        rewardInformation.rewardTokenSymbol = IERC20Detailed(rewardInformation.rewardTokenAddress).symbol();

        // Get price of reward token from Chainlink Proxy Oracle
        rewardInformation.rewardOracleAddress = vTokenIncentiveController.getRewardOracle(rewardInformation.rewardTokenAddress);
        rewardInformation.priceFeedDecimals = IEACAggregatorProxy(rewardInformation.rewardOracle).latestAnswer();
        rewardInformation.rewardPriceFeed = IEACAggregatorProxy(rewardInformation.rewardOracle).decimals();

      }
      
      reserveIncentiveData.vIncentiveData = IncentiveData(
        baseData.variableDebtTokenAddress,
        address(vTokenIncentiveController),
        vRewardsInformation 
      ); 

      // Get sTokens rewards information
      IAaveIncentivesControllerV2 sTokenIncentiveController = IncentivizedERC20(baseData.stableDebtTokenAddress).getIncentivesController();
      address[] memory sTokenRewardAddresses = sTokenIncentiveController.getRewardsByAsset(baseData.stableDebtTokenAddress);

      RewardInfo memory sRewardsInformation = new RewardInfo[](sTokenRewardAddresses.length);
      for(uint256 j = 0; j < sTokenRewardAddresses.length; ++j) {
        RewardInfo memory rewardInformation = sRewardsInformation[i];
        rewardInformation.rewardTokenAddress = sTokenRewardAddresses[i];

        (
          rewardInformation.tokenIncentivesIndex,
          rewardInformation.emissionPerSecond,
          rewardInformation.incentivesLastUpdateTimestamp,
          rewardInformation.emissionEndTimestamp,
        ) = sTokenIncentiveController.getRewardsData(baseData.stableDebtTokenAddress, rewardInformation.rewardTokenAddress);

        rewardInformation.precision = sTokenIncentiveController.PRECISION();
        rewardInformation.rewardTokenDecimals = IERC20Detailed(rewardInformation.rewardTokenAddress).decimals();
        rewardInformation.rewardTokenSymbol = IERC20Detailed(rewardInformation.rewardTokenAddress).symbol();

        // Get price of reward token from Chainlink Proxy Oracle
        rewardInformation.rewardOracleAddress = sTokenIncentiveController.getRewardOracle(rewardInformation.rewardTokenAddress);
        rewardInformation.priceFeedDecimals = IEACAggregatorProxy(rewardInformation.rewardOracle).latestAnswer();
        rewardInformation.rewardPriceFeed = IEACAggregatorProxy(rewardInformation.rewardOracle).decimals();
      }
      
      reserveIncentiveData.sIncentiveData = IncentiveData(
        baseData.stableDebtTokenAddress,
        address(sTokenIncentiveController),
        sRewardsInformation 
      );
    }

    return (reservesIncentiveData);
  }

  function getUserReservesIncentivesData(IPoolAddressesProvider provider, address user)
    external
    view
    override
    returns (UserReserveIncentiveData[] memory)
  {
    return _getUserReservesIncentivesData(provider, user);
  }

  function _getUserReservesIncentivesData(IPoolAddressesProvider provider, address user)
    private
    view
    returns (UserReserveIncentiveData[] memory)
  {
    IPriceOracleGetter oracle = IPriceOracleGetter(provider.getPriceOracle());
    IPool lendingPool = IPool(provider.getPool());
    address[] memory reserves = lendingPool.getReservesList();

    UserReserveIncentiveData[] memory userReservesIncentivesData =
      new UserReserveIncentiveData[](user != address(0) ? reserves.length : 0);

    for (uint256 i = 0; i < reserves.length; i++) {
      DataTypes.ReserveData memory baseData = lendingPool.getReserveData(reserves[i]);

      // user reserve data
      userReservesIncentivesData[i].underlyingAsset = reserves[i];

      IAaveIncentivesControllerV2 aTokenIncentiveController = IncentivizedERC20(baseData.aTokenAddress).getIncentivesController();      
      if (address(aTokenIncentiveController) != address(0)) {
        // get all rewards information from the asset
        address[] memory aTokenRewardAddresses = aTokenIncentiveController.getRewardsByAsset(baseData.aTokenAddress);
        UserRewardInfo memory aUserRewardsInformation = new UserRewardInfo[](aTokenRewardAddresses.length);
        for(uint256 j = 0; j < aTokenRewardAddresses.length; ++j) {
          UserRewardInfo memory userRewardInformation = aUserRewardsInformation[i];
          userRewardInformation.rewardTokenAddress = aTokenRewardAddresses[i];

          userRewardInformation.tokenIncentivesUserIndex = aTokenIncentiveController.getUserAssetData(
            user,
            baseData.atokenAddress,
            userRewardInformation.rewardTokenAddress
          );
          
          userRewardInformation.userUnclaimedRewards = aTokenIncentiveController.getUserUnclaimedRewardsFromStorage(
            user,
            userRewardInformation.rewardTokenAddress
          );
          userRewardInformation.rewardTokenDecimals = IERC20Detailed(userRewardInformation.rewardTokenAddress).decimals();
          userRewardInformation.rewardTokenSymbol = IERC20Detailed(userRewardInformation.rewardTokenAddress).symbol();

          // Get price of reward token from Chainlink Proxy Oracle
          userRewardInformation.rewardOracleAddress = aTokenIncentiveController.getRewardOracle(userRewardInformation.rewardTokenAddress);
          userRewardInformation.priceFeedDecimals = IEACAggregatorProxy(userRewardInformation.rewardOracle).latestAnswer();
          userRewardInformation.rewardPriceFeed = IEACAggregatorProxy(userRewardInformation.rewardOracle).decimals();
        }
        
        userReservesIncentivesData[i].aTokenIncentivesUserData = UserIncentiveData(
          baseData.aTokenAddress,
          address(aTokenIncentiveController),
          aUserRewardsInformation 
        );
      }

      // variable debt token
      IAaveIncentivesControllerV2 vTokenIncentiveController = IncentivizedERC20(baseData.variableDebtTokenAddress).getIncentivesController();      
      if (address(vTokenIncentiveController) != address(0)) {
        // get all rewards information from the asset
        address[] memory vTokenRewardAddresses = vTokenIncentiveController.getRewardsByAsset(baseData.variableDebtTokenAddress);
        UserRewardInfo memory vUserRewardsInformation = new UserRewardInfo[](vTokenRewardAddresses.length);
        for(uint256 j = 0; j < vTokenRewardAddresses.length; ++j) {
          UserRewardInfo memory userRewardInformation = vUserRewardsInformation[i];
          userRewardInformation.rewardTokenAddress = vTokenRewardAddresses[i];

          userRewardInformation.tokenIncentivesUserIndex = vTokenIncentiveController.getUserAssetData(
            user,
            baseData.variableDebtTokenAddress,
            userRewardInformation.rewardTokenAddress
          );
          
          userRewardInformation.userUnclaimedRewards = vTokenIncentiveController.getUserUnclaimedRewardsFromStorage(
            user,
            userRewardInformation.rewardTokenAddress
          );
          userRewardInformation.rewardTokenDecimals = IERC20Detailed(userRewardInformation.rewardTokenAddress).decimals();
          userRewardInformation.rewardTokenSymbol = IERC20Detailed(userRewardInformation.rewardTokenAddress).symbol();

          // Get price of reward token from Chainlink Proxy Oracle
          userRewardInformation.rewardOracleAddress = vTokenIncentiveController.getRewardOracle(userRewardInformation.rewardTokenAddress);
          userRewardInformation.priceFeedDecimals = IEACAggregatorProxy(userRewardInformation.rewardOracle).latestAnswer();
          userRewardInformation.rewardPriceFeed = IEACAggregatorProxy(userRewardInformation.rewardOracle).decimals();
        }
        
        userReservesIncentivesData[i].vTokenIncentivesUserData = UserIncentiveData(
          baseData.variableDebtTokenAddress,
          address(aTokenIncentiveController),
          vUserRewardsInformation 
        );
      }

      // stable debt toekn
      IAaveIncentivesControllerV2 sTokenIncentiveController = IncentivizedERC20(baseData.stableDebtTokenAddress).getIncentivesController();      
      if (address(sTokenIncentiveController) != address(0)) {
        // get all rewards information from the asset
        address[] memory sTokenRewardAddresses = sTokenIncentiveController.getRewardsByAsset(baseData.stableDebtTokenAddress);
        UserRewardInfo memory sUserRewardsInformation = new UserRewardInfo[](sTokenRewardAddresses.length);
        for(uint256 j = 0; j < sTokenRewardAddresses.length; ++j) {
          UserRewardInfo memory userRewardInformation = sUserRewardsInformation[i];
          userRewardInformation.rewardTokenAddress = sTokenRewardAddresses[i];

          userRewardInformation.tokenIncentivesUserIndex = sTokenIncentiveController.getUserAssetData(
            user,
            baseData.stableDebtTokenAddress,
            userRewardInformation.rewardTokenAddress
          );
          
          userRewardInformation.userUnclaimedRewards = sTokenIncentiveController.getUserUnclaimedRewardsFromStorage(
            user,
            userRewardInformation.rewardTokenAddress
          );
          userRewardInformation.rewardTokenDecimals = IERC20Detailed(userRewardInformation.rewardTokenAddress).decimals();
          userRewardInformation.rewardTokenSymbol = IERC20Detailed(userRewardInformation.rewardTokenAddress).symbol();


          // Get price of reward token from Chainlink Proxy Oracle
          userRewardInformation.rewardOracleAddress = sTokenIncentiveController.getRewardOracle(userRewardInformation.rewardTokenAddress);
          userRewardInformation.priceFeedDecimals = IEACAggregatorProxy(userRewardInformation.rewardOracle).latestAnswer();
          userRewardInformation.rewardPriceFeed = IEACAggregatorProxy(userRewardInformation.rewardOracle).decimals();
        }
        
        userReservesIncentivesData[i].sTokenIncentivesUserData = UserIncentiveData(
          baseData.stableDebtTokenAddress,
          address(aTokenIncentiveController),
          sUserRewardsInformation 
        );
      }
    }

    return (userReservesIncentivesData);
  }
} 
