// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.7;

import {IERC20Detailed} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol';
import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';
import {IUiPoolDataProvider} from './interfaces/IUiPoolDataProvider.sol';
import {IPool} from '@aave/core-v3/contracts/interfaces/IPool.sol';
import {IPriceOracleGetter} from '@aave/core-v3/contracts/interfaces/IPriceOracleGetter.sol';
import {IAToken} from '@aave/core-v3/contracts/interfaces/IAToken.sol';
import {IVariableDebtToken} from '@aave/core-v3/contracts/interfaces/IVariableDebtToken.sol';
import {IStableDebtToken} from '@aave/core-v3/contracts/interfaces/IStableDebtToken.sol';
import {WadRayMath} from '@aave/core-v3/contracts/protocol/libraries/math/WadRayMath.sol';
import {ReserveConfiguration} from '@aave/core-v3/contracts/protocol/libraries/configuration/ReserveConfiguration.sol';
import {UserConfiguration} from '@aave/core-v3/contracts/protocol/libraries/configuration/UserConfiguration.sol';
import {DataTypes} from '@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol';
import {
  DefaultReserveInterestRateStrategy
} from '@aave/core-v3/contracts/protocol/pool/DefaultReserveInterestRateStrategy.sol';
import {IEACAggregatorProxy} from './interfaces/IEACAggregatorProxy.sol';

contract UiPoolDataProvider is IUiPoolDataProvider {
  using WadRayMath for uint256;
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
  using UserConfiguration for DataTypes.UserConfigurationMap;

  IEACAggregatorProxy public immutable networkBaseTokenPriceInUsdProxyAggregator;
  IEACAggregatorProxy public immutable marketReferenceCurrencyPriceInUsdProxyAggregator;
  uint256 public constant ETH_CURRENCY_UNIT = 1 ether;


  constructor(
    IEACAggregatorProxy _networkBaseTokenPriceInUsdProxyAggregator, 
    IEACAggregatorProxy _marketReferenceCurrencyPriceInUsdProxyAggregator
  ) {
    networkBaseTokenPriceInUsdProxyAggregator = _networkBaseTokenPriceInUsdProxyAggregator;
    marketReferenceCurrencyPriceInUsdProxyAggregator = _marketReferenceCurrencyPriceInUsdProxyAggregator;
  }

  function getInterestRateStrategySlopes(DefaultReserveInterestRateStrategy interestRateStrategy)
    internal
    view
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    return (
      interestRateStrategy.getVariableRateSlope1(),
      interestRateStrategy.getVariableRateSlope2(),
      interestRateStrategy.getStableRateSlope1(),
      interestRateStrategy.getStableRateSlope2()
    );
  }

  function getReservesList(IPoolAddressesProvider provider)
    public
    view
    override
    returns (address[] memory)
  {
    IPool pool = IPool(provider.getPool());
    return pool.getReservesList();
  }

  function getReservesData(IPoolAddressesProvider provider)
    public
    view
    override
    returns (
      AggregatedReserveData[] memory,
      BaseCurrencyInfo memory
    )
  {
    IPriceOracleGetter oracle = IPriceOracleGetter(provider.getPriceOracle());
    IPool pool = IPool(provider.getPool());
    address[] memory reserves = pool.getReservesList();
    AggregatedReserveData[] memory reservesData = new AggregatedReserveData[](reserves.length);

    for (uint256 i = 0; i < reserves.length; i++) {
      AggregatedReserveData memory reserveData = reservesData[i];
      reserveData.underlyingAsset = reserves[i];

      // reserve current state
      DataTypes.ReserveData memory baseData =
        pool.getReserveData(reserveData.underlyingAsset);
      //the liquidity index. Expressed in ray
      reserveData.liquidityIndex = baseData.liquidityIndex;
      //variable borrow index. Expressed in ray
      reserveData.variableBorrowIndex = baseData.variableBorrowIndex;
      //the current supply rate. Expressed in ray
      reserveData.liquidityRate = baseData.currentLiquidityRate;
      //the current variable borrow rate. Expressed in ray
      reserveData.variableBorrowRate = baseData.currentVariableBorrowRate;
      //the current stable borrow rate. Expressed in ray
      reserveData.stableBorrowRate = baseData.currentStableBorrowRate;
      reserveData.lastUpdateTimestamp = baseData.lastUpdateTimestamp;
      reserveData.aTokenAddress = baseData.aTokenAddress;
      reserveData.stableDebtTokenAddress = baseData.stableDebtTokenAddress;
      reserveData.variableDebtTokenAddress = baseData.variableDebtTokenAddress;
      //address of the interest rate strategy
      reserveData.interestRateStrategyAddress = baseData.interestRateStrategyAddress;
      reserveData.priceInMarketReferenceCurrency = oracle.getAssetPrice(reserveData.underlyingAsset);

      reserveData.availableLiquidity = IERC20Detailed(reserveData.underlyingAsset).balanceOf(
        reserveData.aTokenAddress
      );
      (
        reserveData.totalPrincipalStableDebt,
        ,
        reserveData.averageStableRate,
        reserveData.stableDebtLastUpdateTimestamp
      ) = IStableDebtToken(reserveData.stableDebtTokenAddress).getSupplyData();
      reserveData.totalScaledVariableDebt = IVariableDebtToken(reserveData.variableDebtTokenAddress)
        .scaledTotalSupply();

      // we're getting this info from the aToken, because some of assets can be not compliant with ETC20Detailed
      reserveData.symbol = IERC20Detailed(reserveData.underlyingAsset).symbol();
      reserveData.name = '';

      (
        reserveData.variableRateSlope1,
        reserveData.variableRateSlope2,
        reserveData.stableRateSlope1,
        reserveData.stableRateSlope2
      ) = getInterestRateStrategySlopes(
        DefaultReserveInterestRateStrategy(reserveData.interestRateStrategyAddress)
      );


      //stores the reserve configuration
      DataTypes.ReserveConfigurationMap memory reserveConfigurationMap = baseData.configuration;
      reserveData.debtCeiling = reserveConfigurationMap.getDebtCeiling();
      (reserveData.borrowCap, reserveData.supplyCap) = reserveConfigurationMap.getCaps();

      uint256 eModeCategoryId;
      (
        reserveData.baseLTVasCollateral,
        reserveData.reserveLiquidationThreshold,
        reserveData.reserveLiquidationBonus,
        reserveData.decimals,
        reserveData.reserveFactor,
        eModeCategoryId
      ) = reserveConfigurationMap.getParams();
      reserveData.eModeCategoryId = uint8(eModeCategoryId);

      (
        reserveData.isActive,
        reserveData.isFrozen,
        reserveData.borrowingEnabled,
        reserveData.stableBorrowRateEnabled,
        reserveData.isPaused
      ) = reserveConfigurationMap.getFlags();
      reserveData.usageAsCollateralEnabled = reserveData.baseLTVasCollateral != 0;
      
      DataTypes.EModeCategory memory categoryData = pool.getEModeCategoryData(reserveData.eModeCategoryId);
      reserveData.eModeLtv = categoryData.ltv;
      reserveData.eModeLiquidationThreshold =categoryData.liquidationThreshold;
      reserveData.eModeLiquidationBonus =categoryData.liquidationBonus;
      // each eMode category may or may not have a custom oracle to override the individual assets price oracles
      reserveData.eModePriceSource =categoryData.priceSource;
      reserveData.eModeLabel = categoryData.label;
    }

    BaseCurrencyInfo memory baseCurrencyInfo;
    baseCurrencyInfo.networkBaseTokenPriceInUsd = networkBaseTokenPriceInUsdProxyAggregator.latestAnswer();
    baseCurrencyInfo.networkBaseTokenPriceDecimals = networkBaseTokenPriceInUsdProxyAggregator.decimals();

    try oracle.BASE_CURRENCY_UNIT() returns (uint256 baseCurrencyUnit) {
      baseCurrencyInfo.marketReferenceCurrencyUnit = baseCurrencyUnit;
      baseCurrencyInfo.marketReferenceCurrencyPriceInUsd = int256(baseCurrencyUnit);
    } catch (bytes memory /*lowLevelData*/) {  
      baseCurrencyInfo.marketReferenceCurrencyUnit = ETH_CURRENCY_UNIT;
      baseCurrencyInfo.marketReferenceCurrencyPriceInUsd = marketReferenceCurrencyPriceInUsdProxyAggregator.latestAnswer();
    }

    return (reservesData, baseCurrencyInfo);
  }

  function getUserReservesData(IPoolAddressesProvider provider, address user)
    external
    view
    override
    returns (UserReserveData[] memory, uint8)
  {
    IPool pool = IPool(provider.getPool());
    address[] memory reserves = pool.getReservesList();
    DataTypes.UserConfigurationMap memory userConfig = pool.getUserConfiguration(user);

    uint8 userEmodeCategoryId = uint8(pool.getUserEMode((user)));
    
    UserReserveData[] memory userReservesData =
      new UserReserveData[](user != address(0) ? reserves.length : 0);

    for (uint256 i = 0; i < reserves.length; i++) {
      DataTypes.ReserveData memory baseData = pool.getReserveData(reserves[i]);

      // user reserve data
      userReservesData[i].underlyingAsset = reserves[i];
      userReservesData[i].scaledATokenBalance = IAToken(baseData.aTokenAddress).scaledBalanceOf(
        user
      );
      userReservesData[i].usageAsCollateralEnabledOnUser = userConfig.isUsingAsCollateral(i);

      if (userConfig.isBorrowing(i)) {
        userReservesData[i].scaledVariableDebt = IVariableDebtToken(
          baseData
            .variableDebtTokenAddress
        )
          .scaledBalanceOf(user);
        userReservesData[i].principalStableDebt = IStableDebtToken(baseData.stableDebtTokenAddress)
          .principalBalanceOf(user);
        if (userReservesData[i].principalStableDebt != 0) {
          userReservesData[i].stableBorrowRate = IStableDebtToken(baseData.stableDebtTokenAddress)
            .getUserStableRate(user);
          userReservesData[i].stableBorrowLastUpdateTimestamp = IStableDebtToken(
            baseData
              .stableDebtTokenAddress
          )
            .getUserLastUpdated(user);
        }
      }
    }

    return (userReservesData, userEmodeCategoryId);
  }
}
