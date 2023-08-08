// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {WETH9} from '@aave/core-v3/contracts/dependencies/weth/WETH9.sol';
import {Ownable} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol';

contract WETH9Mock is WETH9, Ownable {
  constructor(string memory mockName, string memory mockSymbol, address owner) {
    name = mockName;
    symbol = mockSymbol;

    transferOwnership(owner);
  }

  function mint(address account, uint256 value) public onlyOwner returns (bool) {
    balanceOf[account] += value;
    emit Transfer(address(0), account, value);
    return true;
  }
}
