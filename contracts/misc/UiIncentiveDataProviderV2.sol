// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';
import {IAaveIncentivesController} from '@aave/core-v3/contracts/interfaces/IAaveIncentivesController.sol';
import {IUiIncentiveDataProviderV3} from './interfaces/IUiIncentiveDataProviderV3.sol';
import {IPool} from '@aave/core-v3/contracts/interfaces/IPool.sol';
import {IncentivizedERC20} from '@aave/core-v3/contracts/protocol/tokenization/IncentivizedERC20.sol';
import {UserConfiguration} from '@aave/core-v3/contracts/protocol/libraries/configuration/UserConfiguration.sol';
import {DataTypes} from '@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol';
import {IERC20Detailed} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol';

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

    for (uint256 i = 0; i < reserves.length; i++) {
      AggregatedReserveIncentiveData memory reserveIncentiveData = reservesIncentiveData[i];
      reserveIncentiveData.underlyingAsset = reserves[i];

      DataTypes.ReserveData memory baseData = lendingPool.getReserveData(reserves[i]);

      try IncentivizedERC20(baseData.aTokenAddress).getIncentivesController() returns (IAaveIncentivesController aTokenIncentiveController) {
        RewardInfo[] memory aRewardsInformation = new RewardInfo[](1);
        if (address(aTokenIncentiveController) != address(0)) {
          address aRewardToken = aTokenIncentiveController.REWARD_TOKEN();

          try aTokenIncentiveController.getAssetData(baseData.aTokenAddress) returns (
            uint256 aTokenIncentivesIndex,
            uint256 aEmissionPerSecond,
            uint256 aIncentivesLastUpdateTimestamp
          ) {
            aRewardsInformation[0] = RewardInfo(
              IERC20Detailed(aRewardToken).symbol(),
              aRewardToken,
              address(0),
              aEmissionPerSecond,
              aIncentivesLastUpdateTimestamp,
              aTokenIncentivesIndex,
              aTokenIncentiveController.DISTRIBUTION_END(),
              0,
              0,
              aTokenIncentiveController.PRECISION(),
              IERC20Detailed(aRewardToken).decimals()
            );
            
            reserveIncentiveData.aIncentiveData = IncentiveData(
              baseData.aTokenAddress,
              address(aTokenIncentiveController),
              aRewardsInformation 
            ); 
          } catch (bytes memory /*lowLevelData*/) {
            (
              uint256 aEmissionPerSecond,
              uint256 aIncentivesLastUpdateTimestamp,
              uint256 aTokenIncentivesIndex
            ) = aTokenIncentiveController.assets(baseData.aTokenAddress);

            aRewardsInformation[0] = RewardInfo(
              IERC20Detailed(aRewardToken).symbol(),
              aRewardToken,
              address(0),
              aEmissionPerSecond,
              aIncentivesLastUpdateTimestamp,
              aTokenIncentivesIndex,
              aTokenIncentiveController.DISTRIBUTION_END(),
              0,
              0,
              aTokenIncentiveController.PRECISION(),
              IERC20Detailed(aRewardToken).decimals()
            );
            
            reserveIncentiveData.aIncentiveData = IncentiveData(
              baseData.aTokenAddress,
              address(aTokenIncentiveController),
              aRewardsInformation 
            ); 
          } 
        }
      } catch(bytes memory /*lowLevelData*/) {
        // Will not get here
      } 

      try IncentivizedERC20(baseData.stableDebtTokenAddress).getIncentivesController() returns (IAaveIncentivesController sTokenIncentiveController) {
        RewardInfo[] memory sRewardsInformation = new RewardInfo[](1);
        if (address(sTokenIncentiveController) != address(0)) {

          address sRewardToken = sTokenIncentiveController.REWARD_TOKEN();
          try sTokenIncentiveController.getAssetData(baseData.stableDebtTokenAddress) returns (
            uint256 sTokenIncentivesIndex,
            uint256 sEmissionPerSecond,
            uint256 sIncentivesLastUpdateTimestamp
          ) {
            sRewardsInformation[0] = RewardInfo(
              IERC20Detailed(sRewardToken).symbol(),
              sRewardToken,
              address(0),
              sEmissionPerSecond,
              sIncentivesLastUpdateTimestamp,
              sTokenIncentivesIndex,
              sTokenIncentiveController.DISTRIBUTION_END(),
              0,
              0,
              sTokenIncentiveController.PRECISION(),
              IERC20Detailed(sRewardToken).decimals()
            );
            
            reserveIncentiveData.sIncentiveData = IncentiveData(
              baseData.stableDebtTokenAddress,
              address(sTokenIncentiveController),
              sRewardsInformation 
            ); 
          } catch (bytes memory /*lowLevelData*/) {
            (
              uint256 sEmissionPerSecond,
              uint256 sIncentivesLastUpdateTimestamp,
              uint256 sTokenIncentivesIndex
            ) = sTokenIncentiveController.assets(baseData.stableDebtTokenAddress);

            sRewardsInformation[0] = RewardInfo(
              IERC20Detailed(sRewardToken).symbol(),
              sRewardToken,
              address(0),
              sEmissionPerSecond,
              sIncentivesLastUpdateTimestamp,
              sTokenIncentivesIndex,
              sTokenIncentiveController.DISTRIBUTION_END(),
              0,
              0,
              sTokenIncentiveController.PRECISION(),
              IERC20Detailed(sRewardToken).decimals()
            );
            
            reserveIncentiveData.sIncentiveData = IncentiveData(
              baseData.stableDebtTokenAddress,
              address(sTokenIncentiveController),
              sRewardsInformation 
            ); 
          } 
        }
      } catch(bytes memory /*lowLevelData*/) {
        // Will not get here
      }

      try IncentivizedERC20(baseData.variableDebtTokenAddress).getIncentivesController() returns (IAaveIncentivesController vTokenIncentiveController) {
        RewardInfo[] memory vRewardsInformation = new RewardInfo[](1);
        if (address(vTokenIncentiveController) != address(0)) {
          address vRewardToken = vTokenIncentiveController.REWARD_TOKEN();

          try vTokenIncentiveController.getAssetData(baseData.variableDebtTokenAddress) returns (
            uint256 vTokenIncentivesIndex,
            uint256 vEmissionPerSecond,
            uint256 vIncentivesLastUpdateTimestamp
          ) {
            vRewardsInformation[0] = RewardInfo(
              IERC20Detailed(vRewardToken).symbol(),
              vRewardToken,
              address(0),
              vEmissionPerSecond,
              vIncentivesLastUpdateTimestamp,
              vTokenIncentivesIndex,
              vTokenIncentiveController.DISTRIBUTION_END(),
              0,
              0,
              vTokenIncentiveController.PRECISION(),
              IERC20Detailed(vRewardToken).decimals()
            );
            
            reserveIncentiveData.sIncentiveData = IncentiveData(
              baseData.variableDebtTokenAddress,
              address(vTokenIncentiveController),
              vRewardsInformation 
            ); 
          } catch (bytes memory /*lowLevelData*/) {
            (
              uint256 vEmissionPerSecond,
              uint256 vIncentivesLastUpdateTimestamp,
              uint256 vTokenIncentivesIndex
            ) = vTokenIncentiveController.assets(baseData.variableDebtTokenAddress);

            vRewardsInformation[0] = RewardInfo(
              IERC20Detailed(vRewardToken).symbol(),
              vRewardToken,
              address(0),
              vEmissionPerSecond,
              vIncentivesLastUpdateTimestamp,
              vTokenIncentivesIndex,
              vTokenIncentiveController.DISTRIBUTION_END(),
              0,
              0,
              vTokenIncentiveController.PRECISION(),
              IERC20Detailed(vRewardToken).decimals()
            );
            
            reserveIncentiveData.sIncentiveData = IncentiveData(
              baseData.variableDebtTokenAddress,
              address(vTokenIncentiveController),
              vRewardsInformation 
            ); 
          }
        }
      } catch(bytes memory /*lowLevelData*/) {
        // Will not get here
      }
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
    IPool lendingPool = IPool(provider.getPool());
    address[] memory reserves = lendingPool.getReservesList();

    UserReserveIncentiveData[] memory userReservesIncentivesData =
      new UserReserveIncentiveData[](user != address(0) ? reserves.length : 0);

    for (uint256 i = 0; i < reserves.length; i++) {
      DataTypes.ReserveData memory baseData = lendingPool.getReserveData(reserves[i]);

      // user reserve data
      userReservesIncentivesData[i].underlyingAsset = reserves[i];

      try IncentivizedERC20(baseData.aTokenAddress).getIncentivesController() returns (IAaveIncentivesController aTokenIncentiveController) {
        if (address(aTokenIncentiveController) != address(0)) {
          UserRewardInfo[] memory aUserRewardsInformation = new UserRewardInfo[](1);

          address aRewardToken = aTokenIncentiveController.REWARD_TOKEN();

          aUserRewardsInformation[0] = UserRewardInfo(
            IERC20Detailed(aRewardToken).symbol(),
            address(0),
            aRewardToken,
            aTokenIncentiveController.getUserUnclaimedRewards(
              user
            ),
            aTokenIncentiveController.getUserAssetData(
              user,
              baseData.aTokenAddress
            ),
            0,
            0,
            IERC20Detailed(aRewardToken).decimals()
          );

          userReservesIncentivesData[i].aTokenIncentivesUserData = UserIncentiveData(
            baseData.aTokenAddress,
            address(aTokenIncentiveController),
            aUserRewardsInformation 
          );
        }
      } catch (bytes memory /*lowLevelData*/) {}

      try IncentivizedERC20(baseData.variableDebtTokenAddress).getIncentivesController() returns(IAaveIncentivesController vTokenIncentiveController) {
        if (address(vTokenIncentiveController) != address(0)) {
          UserRewardInfo[] memory vUserRewardsInformation = new UserRewardInfo[](1);

          address vRewardToken = vTokenIncentiveController.REWARD_TOKEN();

          vUserRewardsInformation[0] = UserRewardInfo(
            IERC20Detailed(vRewardToken).symbol(),
            address(0),
            vRewardToken,
            vTokenIncentiveController.getUserUnclaimedRewards(
              user
            ),
            vTokenIncentiveController.getUserAssetData(
              user,
              baseData.variableDebtTokenAddress
            ),
            0,
            0,
            IERC20Detailed(vRewardToken).decimals()
          );

          userReservesIncentivesData[i].aTokenIncentivesUserData = UserIncentiveData(
            baseData.variableDebtTokenAddress,
            address(vTokenIncentiveController),
            vUserRewardsInformation 
          );
        }
      } catch (bytes memory /*lowLevelData*/) {}

      try IncentivizedERC20(baseData.stableDebtTokenAddress).getIncentivesController() returns (IAaveIncentivesController sTokenIncentiveController) {
        if (address(sTokenIncentiveController) != address(0)) {
          UserRewardInfo[] memory sUserRewardsInformation = new UserRewardInfo[](1);

          address sRewardToken = sTokenIncentiveController.REWARD_TOKEN();

          sUserRewardsInformation[0] = UserRewardInfo(
            IERC20Detailed(sRewardToken).symbol(),
            address(0),
            sRewardToken,
            sTokenIncentiveController.getUserUnclaimedRewards(
              user
            ),
            sTokenIncentiveController.getUserAssetData(
              user,
              baseData.stableDebtTokenAddress
            ),
            0,
            0,
            IERC20Detailed(sRewardToken).decimals()
          );

          userReservesIncentivesData[i].aTokenIncentivesUserData = UserIncentiveData(
            baseData.stableDebtTokenAddress,
            address(sTokenIncentiveController),
            sUserRewardsInformation 
          );
        }
      } catch (bytes memory /*lowLevelData*/) {}
    }

    return (userReservesIncentivesData);
  }
} 
