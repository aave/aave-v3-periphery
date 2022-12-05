// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import "./interface/IERC20.sol";
import "./interface/IPool.sol";
import "./interface/IPoolAddressesProvider.sol";
import "./interface/IWrappedTokenGatewayV3.sol";
import "./interface/IUniswapV2Router01.sol";
import "./interface/IPriceOracleGetter.sol";

contract Leverage {
    //main configuration parameters
    ILendingPool public pool;
    IWrappedTokenGatewayV3 public wethGateway;
    IUniswapV2Router01 public uniswapRouter;
    IPoolAddressesProvider public poolProvider;

    constructor(
        address _poolProviderAddress,
        address _wethGatewayAddress,
        address _uniswapRouterAddress
    ) {
        poolProvider = IPoolAddressesProvider(_poolProviderAddress);
        pool = ILendingPool(poolProvider.getLendingPool());
        wethGateway = IWrappedTokenGatewayV3(_wethGatewayAddress);
        uniswapRouter = IUniswapV2Router01(_uniswapRouterAddress);
    }

    /**
     * @notice main function of this contract
     * @param _reserve reserve token to deposit
     * @param _reserveAmount reserve amount to deposit
     * @param _loan loan token to borrow
     * @param _isETH flag whether the reserve token is ETH
     **/
    function takeLeverage(
        address _reserve,
        uint256 _reserveAmount,
        address _loan,
        bool _isETH
    ) external payable returns (uint _loanAmount) {
        // first deposit
        _deposit(_reserve, _reserveAmount, address(this), _isETH);

        // first borrow
        address tempCurrency;
        uint256 availableLoanAmount;
        uint256 interestRateMode;
        uint256 referral;
        tempCurrency = IPriceOracleGetter(poolProvider.getPriceOracle())
            .BASE_CURRENCY();
        (, , availableLoanAmount, , , ) = pool.getUserAccountData(msg.sender);
        interestRateMode = 1;
        referral = 0;
        pool.borrow(
            tempCurrency,
            availableLoanAmount,
            interestRateMode,
            referral,
            address(this)
        );

        // swap on uniswap
        uint256[] memory swapAmounts = _swap(
            _stable,
            _reserve,
            availableLoanAmount
        );

        // second desposit
        _deposit(_reserve, swapAmounts, msg.sender, _isETH);
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
        uint256 referral = 0;
        if (_isETH) {
            _WETHGateway.depositETH{value: msg.value}(
                address(pool),
                _onBehalfOf,
                referral
            );
            return (address(_WETHGateway), msg.value);
        } else {
            IERC20(_reserve).transferFrom(
                msg.sender,
                address(this),
                _reserveAmount
            );
            pool.deposit(_reserve, _reserveAmount, _onBehalfOf, referral);
            return (_reserve, _reserveAmount);
        }
    }

    /**
     * @notice Swap on uniswap
     * @param _addressA
     * @param _addressB
     * @param _amountA
     **/
    function _swap(
        address _addressA,
        address _addressB,
        uint256 _amountA
    ) internal returns (uint256[] memory) {
        address[] memory path = new address[](3);
        path[0] = _addressA;
        path[1] = uniswapRouter.WETH();
        path[2] = _addressB;
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            _amountA,
            0,
            path,
            msg.sender,
            block.timestamp
        );
        return amounts;
    }

    /**
     * @notice Repays a borrowed `amount` on a specific reserve, burning the equivalent debt tokens owned
     * @param _asset The address of the borrowed underlying asset previously borrowed
     * @param _amount The amount to repay
     * @param _interestRateMode The interest rate mode at of the debt the user wants to repay: 1 for Stable, 2 for Variable
     * @param _isETH flag whether the reserve token is ETH
     **/
    function _repay(
        address _asset,
        uint256 _amount,
        uint256 _interestRateMode,
        bool _isETH
    ) internal {
        if (_isETH) {
            _WETHGateway.repayETH(
                address(_LendingPool),
                _amount,
                _interestRateMode,
                msg.sender
            );
        } else {
            _LendingPool.repay(_asset, _amount, _interestRateMode, msg.sender);
        }
    }
}
