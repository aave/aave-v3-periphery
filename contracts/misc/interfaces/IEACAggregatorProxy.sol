// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

interface IEACAggregatorProxy {
  function decimals() external view returns (uint8);

  function latestAnswer() external view returns (int256);
}
