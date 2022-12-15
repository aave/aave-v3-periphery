// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {IERC20} from "./interface/IERC20.sol";
import {IPool} from "./interface/IPool.sol";
import {IPoolAddressesProvider} from "./interface/IPoolAddressesProvider.sol";
import {ICurveAddressesProvider} from "./interface/ICurveAddressesProvider.sol";
import {ICurveSwaps} from "./interface/ICurveSwaps.sol";
import {IWETH9} from "./interface/IWETH9.sol";
import {IPriceOracleGetter} from "./interface/IPriceOracleGetter.sol";
import {Ownable} from "./access/Ownable.sol";

contract Leverage is Ownable {
    //main configuration parameters
    address public POOL_PROVIDER;
    address public POOL;
    address public CURVE_SWAPS;
    address payable public WETH9;
    address public ARTH;

    mapping(address => mapping(address => uint256)) public userBalances;
    address[] reserveList = new address[](0);

    function init(
        address _poolProvider,
        address _curveProvider,
        address payable _weth9,
        address _arthAddress
    ) external onlyOwner {
        POOL_PROVIDER = _poolProvider;
        POOL = IPoolAddressesProvider(POOL_PROVIDER).getPool();
        CURVE_SWAPS = ICurveAddressesProvider(_curveProvider).get_address(2);
        WETH9 = _weth9;
        ARTH = _arthAddress;
    }

    /**
     * @notice Deposit token to lendingPool
     * @param _reserve reserve token to deposit
     * @param _reserveAmount reserve amount to deposit
     * @param _onBehalfOf The beneficiary of the supplied assets, receiving the aTokens
     **/
    function _deposit(
        address _reserve,
        uint256 _reserveAmount,
        address _onBehalfOf,
        bool _isETH
    ) internal returns (address, uint256) {
        uint16 referral = 0;
        if (_isETH) {
            IWETH9(WETH9).deposit{value: msg.value}();
            IPool(POOL).deposit(WETH9, msg.value, _onBehalfOf, referral);
            return (WETH9, msg.value);
        } else {
            IERC20(_reserve).transferFrom(
                msg.sender,
                address(this),
                _reserveAmount
            );
            IPool(POOL).deposit(
                _reserve,
                _reserveAmount,
                _onBehalfOf,
                referral
            );
            return (_reserve, _reserveAmount);
        }
    }

    /**
     * @notice Swap on curve swap
     * @param _route curve swap route data
     * @param _swap_params params for swap
     * @param _amount amount to send
     **/
    function _swap_new(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount
    ) internal returns (uint256 amountOut) {
        amountOut = ICurveSwaps(CURVE_SWAPS).get_exchange_multiple_amount(
            _route,
            _swap_params,
            _amount
        );
        address[4] memory _pools;
        ICurveSwaps(CURVE_SWAPS).exchange_multiple(
            _route,
            _swap_params,
            _amount,
            0,
            _pools,
            address(this)
        );
        return amountOut;
    }

    /**
     * @notice get available loan amount for reserve amount.
     * @param _reserve reserve token address
     * @param _loan loan token address
     * @param _reserveAmount amount of _reserve
     **/
    function _calcAvailalbleLoanAmount(
        address _reserve,
        address _loan,
        uint256 _reserveAmount
    ) internal view returns (uint256 _loanAmount) {
        IPriceOracleGetter PRICE_ORACLE_GETTER;
        uint256 reservePrice;
        uint256 loanPrice;
        uint256 ltv;
        (, , , , ltv, ) = IPool(POOL).getUserAccountData(address(this));
        PRICE_ORACLE_GETTER = IPriceOracleGetter(
            IPoolAddressesProvider(POOL_PROVIDER).getPriceOracle()
        );
        reservePrice = PRICE_ORACLE_GETTER.getAssetPrice(_reserve);
        loanPrice = PRICE_ORACLE_GETTER.getAssetPrice(_loan);
        _loanAmount =
            (((reservePrice * _reserveAmount) / loanPrice) * ltv) /
            100;
    }

    /**
     * @notice add funds of user
     * @param _token token address
     * @param _amount amount of _token
     **/
    function _addUserBalances(address _token, uint256 _amount) internal {
        userBalances[msg.sender][_token] += _amount;
    }

    /**
     * @notice remove funds of users
     **/
    function _removeUserBalances() internal {
        for (uint i = 0; i < reserveList.length; i++) {
            address token = reserveList[i];
            userBalances[msg.sender][token] = 0;
        }
    }

    /**
     * @notice add new token to reserveList
     * @param _token token address
     **/
    function _updateReserveList(
        address _token
    ) internal returns (bool _alreadyExist) {
        for (uint i = 0; i < reserveList.length; i++) {
            if (reserveList[i] == _token) {
                _alreadyExist = true;
                break;
            }
        }
        reserveList.push(_token);
        _alreadyExist = false;
    }

    /**
     * @notice deposit reserve to leverage
     * @param _reserve reserve token to deposit
     * @param _reserveAmount reserve amount to deposit
     * @param _isETH flag whether the reserve token is ETH
     * @param _route_arth_to_dai route for arth_to_dai
     * @param _swap_params_arth_to_dai swap_params forarth_to_dai
     * @param _route_arth_to_reserve route for arth_to_reserve
     * @param _swap_params_arth_to_reserve swap_params forarth_to_reserve
     * **/
    function depositLeverage(
        address _reserve,
        uint256 _reserveAmount,
        bool _isETH,
        address[9] memory _route_arth_to_dai,
        uint256[3][4] memory _swap_params_arth_to_dai,
        address[9] memory _route_arth_to_reserve,
        uint256[3][4] memory _swap_params_arth_to_reserve
    ) external payable {
        // first deposit
        (_reserve, _reserveAmount) = _deposit(
            _reserve,
            _reserveAmount,
            address(this),
            _isETH
        );

        // borrow
        uint256 availableLoanAmount;
        uint256 interestRateMode = 1;
        uint16 referral = 0;
        availableLoanAmount = _calcAvailalbleLoanAmount(
            _reserve,
            ARTH,
            _reserveAmount
        );
        IPool(POOL).borrow(
            ARTH,
            availableLoanAmount,
            interestRateMode,
            referral,
            address(this)
        );

        // swap on curve swap
        uint256 firstSwapAmount = _swap_new(
            _route_arth_to_dai,
            _swap_params_arth_to_dai,
            availableLoanAmount
        );
        uint256 secondSwapAmount = _swap_new(
            _route_arth_to_reserve,
            _swap_params_arth_to_reserve,
            firstSwapAmount
        );

        // second desposit
        _deposit(_reserve, secondSwapAmount, address(this), _isETH);

        // update user balances and reserve list
        _addUserBalances(_reserve, secondSwapAmount);
        _updateReserveList(_reserve);
    }

    /**
     * @notice withdraw total loan from leverage
     * @param _loan loan token to withdraw
     **/
    function withdrawLeverage(
        address _loan
    ) external returns (uint256 totalLoanAmount) {
        uint256 interestRateMode = 1;
        uint16 referral = 0;
        for (uint i = 0; i < reserveList.length; i++) {
            address reservedToken = reserveList[i];
            uint256 balance = userBalances[msg.sender][reservedToken];
            if (balance > 0) {
                totalLoanAmount += _calcAvailalbleLoanAmount(
                    reservedToken,
                    _loan,
                    balance
                );
            }
        }
        IPool(POOL).borrow(
            _loan,
            totalLoanAmount,
            interestRateMode,
            referral,
            msg.sender
        );
    }
}
