// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {Ownable} from "./access/Ownable.sol";
import {ICurveSwapProvider} from "./interface/ICurveSwapProvider.sol";
import {Leverage} from "./Leverage.sol";

contract LeverageRegistry is Ownable {
    mapping(address => address) public leverageList;
    event CreateLeverage(address creator, address new_leverage);

    address public ADDR_poolProvider;
    address public ADDR_curveSwap;
    address payable public ADDR_weth;
    address public ADDR_arth;

    constructor(
        address _poolProvider,
        address _curveProvider,
        address payable _weth,
        address _arthAddress
    ) {
        ADDR_poolProvider = _poolProvider;
        ADDR_curveSwap = ICurveSwapProvider(_curveProvider).get_address(2);
        ADDR_weth = _weth;
        ADDR_arth = _arthAddress;
    }

    function createLeverage() external {
        Leverage new_leverage = new Leverage(
            ADDR_poolProvider,
            ADDR_curveSwap,
            ADDR_weth,
            ADDR_arth
        );
        leverageList[msg.sender] = address(new_leverage);
        new_leverage.transferOwnership(msg.sender);
        emit CreateLeverage(msg.sender, address(new_leverage));
    }

    function getLeverageOf(
        address _owner
    ) public view returns (address _leverage) {
        return leverageList[_owner];
    }
}
