// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {IERC20} from "./interface/IERC20.sol";
import {IPool} from "./interface/IPool.sol";
import {IPoolAddressesProvider} from "./interface/IPoolAddressesProvider.sol";
import {ICurveSwaps} from "./interface/ICurveSwaps.sol";
import {IWETH9} from "./interface/IWETH9.sol";
import {IPriceOracleGetter} from "./interface/IPriceOracleGetter.sol";
import {Ownable} from "./access/Ownable.sol";

contract Leverage is Ownable {
    //main configuration parameters
    IPool public POOL;
    IWETH9 public WETH9;
    ICurveSwaps public CURVE_SWAP;
    IPoolAddressesProvider public POOL_PROVIDER;
    address public DAI;
    address public ARTH;

    function init(
        address _poolProvider,
        address payable _weth9,
        address _curveSwaps,
        address _daiAddress,
        address _arthAddress
    ) external onlyOwner {
        POOL_PROVIDER = IPoolAddressesProvider(_poolProvider);
        POOL = IPool(POOL_PROVIDER.getPool());
        WETH9 = IWETH9(_weth9);
        CURVE_SWAP = ICurveSwaps(_curveSwaps);
        DAI = _daiAddress;
        ARTH = _arthAddress;
    }

    /**
     * @notice main function of this contract
     * @param _reserve reserve token to deposit
     * @param _reserveAmount reserve amount to deposit
     * @param _isETH flag whether the reserve token is ETH
     **/
    function takeLeverage(
        address _reserve,
        uint256 _reserveAmount,
        bool _isETH
    ) external payable {
        // first deposit
        _deposit(_reserve, _reserveAmount, address(this), _isETH);

        // first borrow
        uint256 availableLoanAmount;
        uint256 interestRateMode;
        uint16 referral;
        IPriceOracleGetter PRICE_ORACLE_GETTER = IPriceOracleGetter(
            POOL_PROVIDER.getPriceOracle()
        );
        availableLoanAmount =
            (PRICE_ORACLE_GETTER.getAssetPrice(_reserve) * _reserveAmount) /
            PRICE_ORACLE_GETTER.getAssetPrice(ARTH);
        interestRateMode = 1;
        referral = 0;
        POOL.borrow(
            ARTH,
            availableLoanAmount,
            interestRateMode,
            referral,
            address(this)
        );

        // swap on curve swap
        uint256 firstSwapAmount = _swap(ARTH, DAI, availableLoanAmount);
        uint256 secondSwapAmount = _swap(DAI, _reserve, firstSwapAmount);

        // second desposit
        _deposit(_reserve, secondSwapAmount, msg.sender, _isETH);
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
            WETH9.deposit{value: msg.value}();
            POOL.deposit(address(WETH9), msg.value, _onBehalfOf, referral);
            return (address(WETH9), msg.value);
        } else {
            IERC20(_reserve).transferFrom(
                msg.sender,
                address(this),
                _reserveAmount
            );
            POOL.deposit(_reserve, _reserveAmount, _onBehalfOf, referral);
            return (_reserve, _reserveAmount);
        }
    }

    /**
     * @notice Swap on curve swap
     * @param _tokenIn token to send
     * @param _tokenOut token to receive
     * @param _amountA amount of _tokenIn
     **/
    function _swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountA
    ) internal returns (uint256) {
        uint256 expectReceive;
        address[] memory tmp = new address[](0);
        (, expectReceive) = CURVE_SWAP.get_best_rate(
            _tokenIn,
            _tokenOut,
            _amountA,
            tmp
        );
        uint256 amountOut = CURVE_SWAP.exchange_with_best_rate(
            _tokenIn,
            _tokenOut,
            _amountA,
            (expectReceive * 94) / 100,
            address(this)
        );
        return amountOut;
    }
}
