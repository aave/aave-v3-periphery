// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';

interface IUiPoolDataProviderV3 {
  struct InterestRates {
    uint256 variableRateSlope1;
    uint256 variableRateSlope2;
    uint256 stableRateSlope1;
    uint256 stableRateSlope2;
    uint256 baseStableBorrowRate;
    uint256 baseVariableBorrowRate;
    uint256 optimalUsageRatio;
  }

  struct AggregatedReserveData {
    address underlyingAsset;
    string name;
    string symbol;
    uint256 decimals;
    uint256 baseLTVasCollateral;
    uint256 reserveLiquidationThreshold;
    uint256 reserveLiquidationBonus;
    uint256 reserveFactor;
    bool usageAsCollateralEnabled;
    bool borrowingEnabled;
    bool stableBorrowRateEnabled;
    bool isActive;
    bool isFrozen;
    // base data
    uint128 liquidityIndex;
    uint128 variableBorrowIndex;
    uint128 liquidityRate;
    uint128 variableBorrowRate;
    uint128 stableBorrowRate;
    uint40 lastUpdateTimestamp;
    address aTokenAddress;
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;
    address interestRateStrategyAddress;
    //
    uint256 availableLiquidity;
    uint256 totalPrincipalStableDebt;
    uint256 averageStableRate;
    uint256 stableDebtLastUpdateTimestamp;
    uint256 totalScaledVariableDebt;
    uint256 priceInMarketReferenceCurrency;
    address priceOracle;
    uint256 variableRateSlope1;
    uint256 variableRateSlope2;
    uint256 stableRateSlope1;
    uint256 stableRateSlope2;
    uint256 baseStableBorrowRate;
    uint256 baseVariableBorrowRate;
    uint256 optimalUsageRatio;
    // v3 only
    bool isPaused;
    bool isSiloedBorrowing;
    uint128 accruedToTreasury;
    uint128 unbacked;
    uint128 isolationModeTotalDebt;
    bool flashLoanEnabled;
    //
    uint256 debtCeiling;
    uint256 debtCeilingDecimals;
    uint8 eModeCategoryId;
    uint256 borrowCap;
    uint256 supplyCap;
    // eMode
    uint16 eModeLtv;
    uint16 eModeLiquidationThreshold;
    uint16 eModeLiquidationBonus;
    address eModePriceSource;
    string eModeLabel;
    bool borrowableInIsolation;
  }

  struct UserReserveData {
    address underlyingAsset;
    uint256 scaledATokenBalance;
    bool usageAsCollateralEnabledOnUser;
    uint256 stableBorrowRate;
    uint256 scaledVariableDebt;
    uint256 principalStableDebt;
    uint256 stableBorrowLastUpdateTimestamp;
  }

  struct BaseCurrencyInfo {
    uint256 marketReferenceCurrencyUnit;
    int256 marketReferenceCurrencyPriceInUsd;
    int256 networkBaseTokenPriceInUsd;
    uint8 networkBaseTokenPriceDecimals;
  }

  function getReservesList(IPoolAddressesProvider provider)
    external
    view
    returns (address[] memory);

  function getReservesData(IPoolAddressesProvider provider)
    external
    view
    returns (AggregatedReserveData[] memory, BaseCurrencyInfo memory);

  function getUserReservesData(IPoolAddressesProvider provider, address user)
    external
    view
    returns (UserReserveData[] memory, uint8);
}
