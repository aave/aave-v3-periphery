// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {IERC20Detailed} from "./interface/IERC20Detailed.sol";
import {IPool} from "./interface/IPool.sol";
import {IPoolAddressesProvider} from "./interface/IPoolAddressesProvider.sol";
import {ICurveSwaps} from "./interface/ICurveSwaps.sol";
import {IWETH} from "./interface/IWETH.sol";
import {IPriceOracleGetter} from "./interface/IPriceOracleGetter.sol";
import {Ownable} from "./access/Ownable.sol";
import {DataTypes} from "./libraries/DataTypes.sol";
import {WadRayMath} from "./libraries/math/WadRayMath.sol";
import {PercentageMath} from "./libraries/math/PercentageMath.sol";

library LeverageDataTypes {
    struct LeverageSwapParams {
        address[9] route_first;
        uint256[3][4] params_first;
        address[9] route_second;
        uint256[3][4] params_second;
    }
}

contract Leverage is Ownable {
    using WadRayMath for uint256;
    using PercentageMath for uint256;

    //main configuration parameters
    address public ADDR_poolProvider;
    address public ADDR_pool;
    address public ADDR_curveSwap;
    address payable public ADDR_weth;
    address public ADDR_arth;

    uint16 immutable MIN_LEVERAGE_RATIO = 100;
    uint16 immutable MAX_LEVERAGE_RATIO = 500;

    address public currentLeverageAsset = address(0);

    constructor(
        address _poolProvider,
        address _curveSwap,
        address payable _weth,
        address _arthAddress
    ) {
        ADDR_poolProvider = _poolProvider;
        ADDR_pool = IPoolAddressesProvider(ADDR_poolProvider).getPool();
        ADDR_curveSwap = _curveSwap;
        ADDR_weth = _weth;
        ADDR_arth = _arthAddress;
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    function calcLoanableBaseForReserve(
        address _reserve,
        uint256 _reserveAmount
    ) public view returns (uint256 _baseAmount) {
        uint256 reserveBase = calcAssetAmountToBase(_reserve, _reserveAmount);
        (, , , , uint256 ltv, ) = IPool(ADDR_pool).getUserAccountData(
            address(this)
        );

        _baseAmount = (reserveBase * ltv) / 10000;
    }

    function calcAssetAmountToBase(
        address _asset,
        uint256 _assetAmount
    ) public view returns (uint256 baseAmount) {
        uint8 decimal;
        decimal = IERC20Detailed(_asset).decimals();
        IPriceOracleGetter PRICE_ORACLE_GETTER = IPriceOracleGetter(
            IPoolAddressesProvider(ADDR_poolProvider).getPriceOracle()
        );
        uint256 price = PRICE_ORACLE_GETTER.getAssetPrice(_asset);
        baseAmount = (_assetAmount * price) / (10 ** decimal);
    }

    function calcBaseAmountToAsset(
        address _asset,
        uint256 _baseAmount
    ) public view returns (uint256 assetAmount) {
        uint8 decimal;
        decimal = IERC20Detailed(_asset).decimals();
        IPriceOracleGetter PRICE_ORACLE_GETTER = IPriceOracleGetter(
            IPoolAddressesProvider(ADDR_poolProvider).getPriceOracle()
        );
        uint256 price = PRICE_ORACLE_GETTER.getAssetPrice(_asset);
        assetAmount = (_baseAmount * (10 ** decimal)) / price;
    }

    function checkCanBeReserved(
        address _asset
    ) public view returns (bool _possible) {
        _possible = false;
        address[] memory reserveList = IPool(ADDR_pool).getReservesList();
        for (uint i = 0; i < reserveList.length; i++) {
            if (reserveList[i] == _asset) {
                _possible = true;
            }
        }
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    function getMaxWithdrawableBase()
        public
        view
        returns (uint256 _withdrawableAmount)
    {
        (
            ,
            uint256 totalDebtBase,
            ,
            uint256 currentLiquidationThreshold,
            ,
            uint256 healthFactor
        ) = IPool(ADDR_pool).getUserAccountData(address(this));
        if (healthFactor > 101e16) {
            _withdrawableAmount = (healthFactor - 1e18)
                .wadMul(totalDebtBase)
                .percentDiv(currentLiquidationThreshold);
        } else {
            _withdrawableAmount = 0;
        }
    }

    function getAtokenBalanceForReserve(
        address _asset
    ) internal view returns (uint256 _aTokenBalance) {
        DataTypes.ReserveData memory reserveData = IPool(ADDR_pool)
            .getReserveData(_asset);
        _aTokenBalance = IERC20Detailed(reserveData.aTokenAddress).balanceOf(
            address(this)
        );
    }

    function getDebtTokenBalanceForReserve(
        address _asset
    ) internal view returns (uint256 _aTokenBalance) {
        DataTypes.ReserveData memory reserveData = IPool(ADDR_pool)
            .getReserveData(_asset);
        _aTokenBalance = IERC20Detailed(reserveData.stableDebtTokenAddress)
            .balanceOf(address(this));
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    function _depositToPool(
        address _asset,
        uint256 _amount,
        address _onBehalfOf
    ) internal {
        uint16 referral = 0;
        IERC20Detailed(_asset).approve(ADDR_pool, _amount);
        IPool(ADDR_pool).supply(_asset, _amount, _onBehalfOf, referral);
    }

    function _swapOnCurve(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount
    ) internal returns (uint256 amountOut) {
        IERC20Detailed(_route[0]).approve(ADDR_curveSwap, _amount);
        amountOut = ICurveSwaps(ADDR_curveSwap).exchange_multiple(
            _route,
            _swap_params,
            _amount,
            0
        );
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    function _borrowFromPool(
        address _asset,
        uint256 _amount,
        address _borrower
    ) internal {
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
            IERC20Detailed(_asset).transfer(_borrower, _amount);
        }
    }

    // function _deleverage() returns () {}

    function _repayToPool(
        address _asset,
        uint256 _amount,
        address _repayer
    ) internal returns (uint256 _finalRepaid) {
        uint256 interestRateMode = 1;
        address onBehalfOf = address(this);
        IERC20Detailed(_asset).approve(ADDR_pool, _amount);
        _finalRepaid = IPool(ADDR_pool).repay(
            _asset,
            _amount,
            interestRateMode,
            onBehalfOf
        );
        if (_repayer != onBehalfOf) {
            IERC20Detailed(_asset).transfer(_repayer, _amount - _finalRepaid);
        }
    }

    function _withdrawFromPool(
        address _asset,
        uint256 _amount,
        address _withdrawer
    ) internal returns (uint256 _withdrawn) {
        address onBehalfOf = address(this);
        _withdrawn = IPool(ADDR_pool).withdraw(_asset, _amount, onBehalfOf);
        if (_withdrawer != onBehalfOf) {
            IERC20Detailed(_asset).transfer(_withdrawer, _withdrawn);
        }
    }

    function _withdrawMaxFromPool(
        address _asset
    ) internal returns (uint256 _withdrawn) {
        uint256 debtTokenBalance = getDebtTokenBalanceForReserve(_asset);
        uint256 aTokenBalance = getAtokenBalanceForReserve(_asset);
        uint256 withdrawableBase = getMaxWithdrawableBase();
        if (debtTokenBalance == 0 || aTokenBalance <= withdrawableBase) {
            _withdrawn = type(uint256).max;
        } else {
            _withdrawn = calcBaseAmountToAsset(_asset, withdrawableBase);
        }
        _withdrawFromPool(_asset, _withdrawn, address(this));
    }

    function _leverage(
        address _asset,
        uint256 _amount,
        uint256 _maxDeposit,
        LeverageDataTypes.LeverageSwapParams calldata _params
    ) internal returns (uint256 _deposited, uint256 _borrowed) {
        require(checkCanBeReserved(_asset), "This asset can't be reserved.");
        // deposit Reserve to pool
        _depositToPool(_asset, _amount, address(this));
        _deposited += _amount;
        // borrow ARTH from pool
        uint256 loanableBase = calcLoanableBaseForReserve(_asset, _amount);
        uint256 maxDepositBase = calcAssetAmountToBase(_asset, _maxDeposit);
        if (maxDepositBase < loanableBase) {
            loanableBase = maxDepositBase;
        }
        uint256 loanableAmount = calcBaseAmountToAsset(ADDR_arth, loanableBase);
        _borrowFromPool(ADDR_arth, loanableAmount, address(this));
        _borrowed = loanableAmount;
        // sell ARTH for DAI on curvefi
        uint256 boughtAmount = _swapOnCurve(
            _params.route_first,
            _params.params_first,
            loanableAmount
        );
        // sell DAI for Reserve on curvefi
        boughtAmount = _swapOnCurve(
            _params.route_second,
            _params.params_second,
            boughtAmount
        );
        // deposit Reserve to pool again
        _depositToPool(_asset, boughtAmount, address(this));
        _deposited += boughtAmount;
    }

    function _deleverage(
        address _asset,
        uint256 _amount,
        LeverageDataTypes.LeverageSwapParams calldata _params
    ) internal returns (uint256 _withdrawn) {
        // sell Reserve for DAI on curvefi
        uint256 boughtAmount = _swapOnCurve(
            _params.route_first,
            _params.params_first,
            _amount
        );
        // sell DAI for ARTH on curvefi
        boughtAmount = _swapOnCurve(
            _params.route_second,
            _params.params_second,
            boughtAmount
        );
        // repay ARTH to pool
        boughtAmount = IERC20Detailed(ADDR_arth).balanceOf(address(this));
        _repayToPool(ADDR_arth, boughtAmount, address(this));
        // withdraw Reserve again
        _withdrawn = _withdrawMaxFromPool(_asset);
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

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
            _amount = IERC20Detailed(_asset).balanceOf(_onBehalfOf);
        }
        IERC20Detailed(_asset).transfer(_onBehalfOf, _amount);
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    function borrow(uint256 _amount) external onlyOwner {
        if (_amount == type(uint256).max) {
            (, , uint256 borrowableBase, , , ) = IPool(ADDR_pool)
                .getUserAccountData(address(this));
            _amount = calcBaseAmountToAsset(ADDR_arth, borrowableBase);
        }
        _borrowFromPool(ADDR_arth, _amount, msg.sender);
    }

    function repay(uint256 _amount) external onlyOwner {
        if (_amount == type(uint256).max) {
            (, uint256 totalDebtBase, , , , ) = IPool(ADDR_pool)
                .getUserAccountData(address(this));
            _amount = calcBaseAmountToAsset(ADDR_arth, totalDebtBase);
        }
        IERC20Detailed(ADDR_arth).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        _repayToPool(ADDR_arth, _amount, msg.sender);
    }

    function withdraw(address _asset, uint256 _amount) external onlyOwner {
        if (_amount == type(uint256).max) {
            uint256 withdrawableBase = getMaxWithdrawableBase();
            _amount = calcBaseAmountToAsset(ADDR_arth, withdrawableBase);
        }
        _withdrawFromPool(_asset, _amount, msg.sender);
    }

    function leverage(
        address _asset,
        uint256 _amount,
        uint16 _leverageRatio,
        LeverageDataTypes.LeverageSwapParams calldata _params,
        bool _isETH
    ) external payable onlyOwner {
        require(
            currentLeverageAsset == address(0) ||
                currentLeverageAsset == _asset,
            "Can't leverage with this asset."
        );
        if (currentLeverageAsset == address(0)) {
            if (_isETH) {
                currentLeverageAsset = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
            } else {
                currentLeverageAsset = _asset;
            }
        }
        require(
            _leverageRatio >= MIN_LEVERAGE_RATIO,
            "The leverage ratio must be greater than or equal to MIN_LEVERAGE_RATIO."
        );
        require(
            _leverageRatio <= MAX_LEVERAGE_RATIO,
            "The leverage ratio must be less than or equal to MAX_LEVERAGE_RATIO."
        );
        if (_isETH) {
            _asset = ADDR_weth;
            _amount = msg.value;
            IWETH(ADDR_weth).deposit{value: msg.value}();
            IWETH(ADDR_weth).approve(ADDR_pool, _amount);
        }
        require(_amount > 0, "Amount should be greater than 0.");
        IERC20Detailed(_asset).transferFrom(msg.sender, address(this), _amount);
        uint256 maxDeposit = (_amount * _leverageRatio) / 100;
        uint256 depositedTotal;
        uint256 borrowedTotal;
        while (maxDeposit > depositedTotal) {
            uint256 _amountLoanable;
            (, , _amountLoanable, , , ) = IPool(ADDR_pool).getUserAccountData(
                address(this)
            );
            if (_amountLoanable > 0) {
                _amountLoanable = calcBaseAmountToAsset(
                    _asset,
                    _amountLoanable
                );
                IPool(ADDR_pool).borrow(
                    _asset,
                    _amountLoanable,
                    1,
                    0,
                    address(this)
                );
                _amount = _amountLoanable;
            }
            (uint256 deposited, uint256 borrowed) = _leverage(
                _asset,
                _amount,
                maxDeposit - depositedTotal,
                _params
            );
            depositedTotal += deposited;
            borrowedTotal += borrowed;
        }
    }

    function deleverage(
        uint256 _amount,
        LeverageDataTypes.LeverageSwapParams calldata _paramsForDeleverage,
        LeverageDataTypes.LeverageSwapParams calldata _paramsForRecoverAsset,
        bool _isETH
    ) external payable onlyOwner {
        require(currentLeverageAsset != address(0), "Nothing is leveraged.");
        address _currentLeverageAsset;
        if (
            currentLeverageAsset == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
        ) {
            _currentLeverageAsset = ADDR_weth;
        } else {
            _currentLeverageAsset = currentLeverageAsset;
        }
        uint256 aTokenBalance = getAtokenBalanceForReserve(
            _currentLeverageAsset
        );
        require(aTokenBalance > 0, "Leveraged balance is zero.");
        uint256 withdrawn = _withdrawMaxFromPool(_currentLeverageAsset);
        if (_isETH) {
            require(_currentLeverageAsset == ADDR_weth, "Invaild asset.");
            _amount = msg.value;
            IWETH(ADDR_weth).deposit{value: _amount}();
            IWETH(ADDR_weth).approve(ADDR_pool, _amount);
        }
        IERC20Detailed(_currentLeverageAsset).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        _amount += withdrawn;
        while (getAtokenBalanceForReserve(_currentLeverageAsset) > 0) {
            _amount = _deleverage(
                _currentLeverageAsset,
                _amount,
                _paramsForDeleverage
            );
        }
        uint256 balanceAsset = IERC20Detailed(ADDR_arth).balanceOf(
            address(this)
        );
        if (balanceAsset > 0) {
            // sell ARTH for DAI on curvefi
            balanceAsset = _swapOnCurve(
                _paramsForRecoverAsset.route_first,
                _paramsForRecoverAsset.params_first,
                balanceAsset
            );
            // sell DAI for Reserve on curvefi
            _swapOnCurve(
                _paramsForRecoverAsset.route_second,
                _paramsForRecoverAsset.params_second,
                balanceAsset
            );
        }
        balanceAsset = IERC20Detailed(_currentLeverageAsset).balanceOf(
            address(this)
        );
        if (balanceAsset > 0) {
            IERC20Detailed(ADDR_arth).transfer(msg.sender, balanceAsset);
        }
        _currentLeverageAsset = address(0);
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

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
