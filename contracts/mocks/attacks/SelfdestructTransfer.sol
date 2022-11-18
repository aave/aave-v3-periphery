// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

contract SelfdestructTransfer {
  function destroyAndTransfer(address payable to) external payable {
    selfdestruct(to);
  }
}
