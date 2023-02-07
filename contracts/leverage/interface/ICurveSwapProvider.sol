// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title ICurveSwapProvider
 * @author At
 * @notice Interface for the Curve Swap Address Provider.
 **/
interface ICurveSwapProvider {
    function get_address(uint256 _id) external view returns (address);
}
