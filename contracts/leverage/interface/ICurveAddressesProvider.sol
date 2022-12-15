// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title ICurveAddressesProvider
 * @author Curve
 * @notice Defines the basic interface for a Curve Addresses Provider.
 **/
interface ICurveAddressesProvider {
    /**
     * @notice Returns an address by its identifier.
     * @param _id The id
     * @return The address of the registered for the specified id
     */
    function get_address(uint256 _id) external view returns (address);
}
