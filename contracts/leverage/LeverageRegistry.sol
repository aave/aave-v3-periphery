// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {Ownable} from "./access/Ownable.sol";
import {ICurveSwapProvider} from "./interface/ICurveSwapProvider.sol";
import {IPoolAddressesProvider} from "./interface/IPoolAddressesProvider.sol";
import {Leverage} from "./Leverage.sol";

contract LeverageRegistry is Ownable {
    mapping(address => address) public leverageList;
    event CreateLeverage(address creator, address new_leverage);
    event RemoveLeverage(address creator);
    event TransferLeverage(address owner, address new_owner);

    address public ADDR_pool;
    address public ADDR_priceOracle;
    address public ADDR_curveSwap;
    address payable public ADDR_weth;
    address public ADDR_arth;

    constructor(
        address _poolProvider,
        address _curveProvider,
        address payable _weth,
        address _arth
    ) {
        ADDR_pool = IPoolAddressesProvider(_poolProvider).getPool();
        ADDR_priceOracle = IPoolAddressesProvider(_poolProvider)
            .getPriceOracle();
        ADDR_curveSwap = ICurveSwapProvider(_curveProvider).get_address(2);
        ADDR_weth = _weth;
        ADDR_arth = _arth;
    }

    function createLeverage() external {
        Leverage new_leverage = new Leverage(
            ADDR_pool,
            ADDR_priceOracle,
            ADDR_curveSwap,
            ADDR_weth,
            ADDR_arth
        );
        leverageList[msg.sender] = address(new_leverage);
        new_leverage.transferOwnership(msg.sender);
        emit CreateLeverage(msg.sender, address(new_leverage));
    }

    function removeLeverage() external {
        leverageList[msg.sender] = address(0);
        emit RemoveLeverage(msg.sender);
    }

    function getLeverageOf(
        address _owner
    ) public view returns (address _leverage) {
        return leverageList[_owner];
    }
}
