// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {IERC20Metadata} from "./interface/IERC20Metadata.sol";
import {IPool} from "./interface/IPool.sol";
import {ICurveSwaps} from "./interface/ICurveSwaps.sol";
import {IWETH} from "./interface/IWETH.sol";
import {IPriceOracleGetter} from "./interface/IPriceOracleGetter.sol";
import {Ownable} from "./access/Ownable.sol";
import {DataTypes} from "./libraries/DataTypes.sol";

library LeverageDataTypes {
    struct LeverageSwapParams {
        address[9] route_first;
        uint256[3][4] params_first;
        address[9] route_second;
        uint256[3][4] params_second;
    }
}

contract Leverage is Ownable {
    //main configuration parameters
    address public ADDR_pool;
    address public ADDR_priceOracle;
    address public ADDR_curveSwap;
    address payable public ADDR_weth;
    address public ADDR_arth;

    uint16 immutable MIN_LEVERAGE_RATIO = 100;
    uint16 immutable MAX_LEVERAGE_RATIO = 500;

    address public currentLeverageAsset = address(0);

    constructor(
        address _pool,
        address _priceOracle,
        address _curveSwap,
        address payable _weth,
        address _arth
    ) {
        ADDR_pool = _pool;
        ADDR_priceOracle = _priceOracle;
        ADDR_curveSwap = _curveSwap;
        ADDR_weth = _weth;
        ADDR_arth = _arth;
    }

    function calcAssetAmountToBase(
        address _asset,
        uint256 _assetAmount
    ) external view returns (uint256 baseAmount) {
        uint8 decimal;
        decimal = IERC20Metadata(_asset).decimals();
        IPriceOracleGetter PRICE_ORACLE_GETTER = IPriceOracleGetter(
            ADDR_priceOracle
        );
        uint256 price = PRICE_ORACLE_GETTER.getAssetPrice(_asset);
        baseAmount = (_assetAmount * price) / (10 ** decimal);
    }

    function calcBaseAmountToAsset(
        address _asset,
        uint256 _baseAmount
    ) public view returns (uint256 assetAmount) {
        uint8 decimal;
        decimal = IERC20Metadata(_asset).decimals();
        IPriceOracleGetter PRICE_ORACLE_GETTER = IPriceOracleGetter(
            ADDR_priceOracle
        );
        uint256 price = PRICE_ORACLE_GETTER.getAssetPrice(_asset);
        assetAmount = (_baseAmount * (10 ** decimal)) / price;
    }

    function getAtokenBalanceForReserve(
        address _asset
    ) internal view returns (uint256 _aTokenBalance) {
        DataTypes.ReserveData memory reserveData = IPool(ADDR_pool)
            .getReserveData(_asset);
        _aTokenBalance = IERC20Metadata(reserveData.aTokenAddress).balanceOf(
            address(this)
        );
    }

    function _depositToPool(
        address _asset,
        uint256 _amount,
        address _onBehalfOf
    ) internal {
        uint16 referral = 0;
        IERC20Metadata(_asset).approve(ADDR_pool, _amount);
        IPool(ADDR_pool).supply(_asset, _amount, _onBehalfOf, referral);
    }

    function _swapOnCurve(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount
    ) internal returns (uint256 amountOut) {
        IERC20Metadata(_route[0]).approve(ADDR_curveSwap, _amount);
        amountOut = ICurveSwaps(ADDR_curveSwap).exchange_multiple(
            _route,
            _swap_params,
            _amount,
            0
        );
    }

    function _borrowFromPool(
        address _asset,
        uint256 _amount,
        address _borrower
    ) internal returns (uint256) {
        if (_amount == type(uint256).max) {
            (, , uint256 borrowableBase, , , ) = IPool(ADDR_pool)
                .getUserAccountData(address(this));
            _amount = calcBaseAmountToAsset(_asset, borrowableBase);
        }
        uint256 interestRateMode = 1;
        uint16 referralCode = 0;
        address onBehalfOf = address(this);
        IPool(ADDR_pool).borrow(
            _asset,
            _amount,
            interestRateMode,
            referralCode,
            onBehalfOf
        );
        if (_borrower != onBehalfOf) {
            IERC20Metadata(_asset).transfer(_borrower, _amount);
        }
        return _amount;
    }

    function _repayToPool(
        address _asset,
        uint256 _amount,
        address _repayer
    ) internal returns (uint256 _repaid) {
        uint256 interestRateMode = 1;
        address onBehalfOf = address(this);
        IERC20Metadata(_asset).approve(ADDR_pool, _amount);
        _repaid = IPool(ADDR_pool).repay(
            _asset,
            _amount,
            interestRateMode,
            onBehalfOf
        );
        if (_repayer != onBehalfOf) {
            IERC20Metadata(_asset).transfer(_repayer, _amount - _repaid);
        }
    }

    function _withdrawFromPool(
        address _asset,
        uint256 _amount,
        address _withdrawer
    ) internal returns (uint256 _withdrawn) {
        address onBehalfOf = address(this);
        if (_amount == type(uint256).max) {
            (
                ,
                uint256 totalDebtBase,
                uint256 availableBorrowsBase,
                ,
                ,

            ) = IPool(ADDR_pool).getUserAccountData(address(this));
            if (totalDebtBase != 0) {
                _amount = calcBaseAmountToAsset(_asset, availableBorrowsBase);
            }
        }
        _withdrawn = IPool(ADDR_pool).withdraw(_asset, _amount, onBehalfOf);
        if (_withdrawer != onBehalfOf) {
            IERC20Metadata(_asset).transfer(_withdrawer, _withdrawn);
        }
    }

    function _leverage(
        address _asset,
        LeverageDataTypes.LeverageSwapParams calldata _params
    ) internal returns (uint256) {
        // borrow available ARTH from pool
        uint256 amount_temp = _borrowFromPool(
            ADDR_arth,
            type(uint256).max,
            address(this)
        );
        // sell ARTH for DAI on curvefi
        amount_temp = _swapOnCurve(
            _params.route_first,
            _params.params_first,
            amount_temp
        );
        // sell DAI for Reserve on curvefi
        _swapOnCurve(_params.route_second, _params.params_second, amount_temp);
        // deposit available Reserve to pool again
        amount_temp = IERC20Metadata(_asset).balanceOf(address(this));
        _depositToPool(_asset, amount_temp, address(this));
        return amount_temp;
    }

    function _deleverage(
        address _asset,
        LeverageDataTypes.LeverageSwapParams calldata _params
    ) internal returns (uint256 _withdrawn) {
        uint256 amount_temp = IERC20Metadata(_asset).balanceOf(address(this));
        // sell available Reserve for DAI on curvefi
        amount_temp = _swapOnCurve(
            _params.route_first,
            _params.params_first,
            amount_temp
        );
        // sell DAI for ARTH on curvefi
        _swapOnCurve(_params.route_second, _params.params_second, amount_temp);
        // repay available ARTH to pool
        amount_temp = IERC20Metadata(ADDR_arth).balanceOf(address(this));
        _repayToPool(ADDR_arth, amount_temp, address(this));
        // withdraw Reserve again
        _withdrawn = _withdrawFromPool(
            _asset,
            type(uint256).max,
            address(this)
        );
    }

    function _withdrawLockedETH(uint256 _amount, address _onBehalfOf) internal {
        if (_amount == type(uint256).max) {
            _amount = address(this).balance;
            payable(_onBehalfOf).transfer(_amount);
        }
    }

    function _withdrawLockedAsset(
        address _asset,
        uint256 _amount,
        address _onBehalfOf
    ) internal {
        if (_amount == type(uint256).max) {
            _amount = IERC20Metadata(_asset).balanceOf(_onBehalfOf);
        }
        IERC20Metadata(_asset).transfer(_onBehalfOf, _amount);
    }

    function borrow(
        address _asset,
        uint256 _amount
    ) external onlyOwner returns (uint256) {
        _borrowFromPool(_asset, _amount, msg.sender);
        return _amount;
    }

    function repay(address _asset, uint256 _amount) external onlyOwner {
        if (_amount == type(uint256).max) {
            (, uint256 totalDebtBase, , , , ) = IPool(ADDR_pool)
                .getUserAccountData(address(this));
            _amount = calcBaseAmountToAsset(_asset, totalDebtBase);
        }
        IERC20Metadata(_asset).transferFrom(msg.sender, address(this), _amount);
        _repayToPool(_asset, _amount, msg.sender);
    }

    function withdraw(address _asset, uint256 _amount) external onlyOwner {
        _withdrawFromPool(_asset, _amount, msg.sender);
    }

    function leverage(
        address _asset,
        uint256 _amount,
        uint16 _leverageRatio,
        LeverageDataTypes.LeverageSwapParams calldata _params,
        bool _isETH
    ) external payable onlyOwner {
        // Check asset and amount.
        if (_isETH) {
            _asset = ADDR_weth;
            _amount = msg.value;
            IWETH(payable(_asset)).deposit{value: _amount}();
        } else {
            IERC20Metadata(_asset).transferFrom(
                msg.sender,
                address(this),
                _amount
            );
        }
        // validate
        require(
            currentLeverageAsset == address(0) ||
                _asset == currentLeverageAsset,
            "Can't leverage with this asset."
        );
        require(
            _leverageRatio >= MIN_LEVERAGE_RATIO &&
                _leverageRatio <= MAX_LEVERAGE_RATIO,
            "The leverage ratio must be greater than or equal to MIN_LEVERAGE_RATIO and must be less than or equal to MAX_LEVERAGE_RATIO."
        );
        require(_amount > 0, "Amount should be greater than 0.");
        // Begin leverage.
        uint256 maxDeposit = (_amount * _leverageRatio) / 100;
        _amount = IERC20Metadata(_asset).balanceOf(address(this));
        _depositToPool(_asset, _amount, address(this));
        uint256 depositedTotal = _amount;
        while (maxDeposit > depositedTotal) {
            uint256 deposited = _leverage(_asset, _params);
            depositedTotal += deposited;
        }
        // set current leverage asset
        currentLeverageAsset = _asset;
    }

    event Deleverage(uint256, uint256);

    function deleverage(
        uint256 _amount,
        LeverageDataTypes.LeverageSwapParams calldata _paramsForDeleverage,
        LeverageDataTypes.LeverageSwapParams calldata _paramsForRecoverAsset,
        bool _isETH
    ) external payable onlyOwner {
        // Confirmation of the need for deleveraging.
        require(currentLeverageAsset != address(0), "Nothing is leveraged.");
        address _asset = currentLeverageAsset;
        uint256 aTokenBalance = getAtokenBalanceForReserve(_asset);
        require(aTokenBalance > 0, "Leveraged balance is zero.");
        // Check asset and amount.
        if (_isETH) {
            _amount = msg.value;
            IWETH(payable(_asset)).deposit{value: _amount}();
        } else {
            IERC20Metadata(_asset).transferFrom(
                msg.sender,
                address(this),
                _amount
            );
        }
        // Begin deleverage.
        _withdrawFromPool(_asset, type(uint256).max, address(this));
        while (getAtokenBalanceForReserve(_asset) > 0) {
            _deleverage(_asset, _paramsForDeleverage);
        }
        emit Deleverage(
            IERC20Metadata(ADDR_arth).balanceOf(address(this)),
            IERC20Metadata(_asset).balanceOf(address(this))
        );
        // Send deleveraged asset to user.
        uint256 balanceRemainAsset = IERC20Metadata(ADDR_arth).balanceOf(
            address(this)
        );
        if (balanceRemainAsset > 0) {
            // sell ARTH for DAI on curvefi
            balanceRemainAsset = _swapOnCurve(
                _paramsForRecoverAsset.route_first,
                _paramsForRecoverAsset.params_first,
                balanceRemainAsset
            );
            // sell DAI for Reserve on curvefi
            _swapOnCurve(
                _paramsForRecoverAsset.route_second,
                _paramsForRecoverAsset.params_second,
                balanceRemainAsset
            );
        }
        balanceRemainAsset = IERC20Metadata(_asset).balanceOf(address(this));
        if (balanceRemainAsset > 0) {
            if (_isETH) {
                IWETH(ADDR_weth).withdraw(balanceRemainAsset);
                _withdrawLockedETH(type(uint256).max, msg.sender);
            } else {
                _withdrawLockedAsset(_asset, type(uint256).max, msg.sender);
            }
        }
        // remove current leverage asset
        currentLeverageAsset = address(0);
    }

    function withdrawLockedAsset(
        address _asset,
        uint256 _amount
    ) external onlyOwner {
        _withdrawLockedAsset(_asset, _amount, msg.sender);
    }

    function withdrawLockedETH(uint256 _amount) external onlyOwner {
        _withdrawLockedETH(_amount, msg.sender);
    }
}
