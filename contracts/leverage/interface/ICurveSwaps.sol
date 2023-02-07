// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title ICurveSwaps
 * @author At
 * @notice Interface for the Curve Swaps.
 **/
interface ICurveSwaps {
    function get_calculator(address _pool) external view returns (address);

    function exchange_multiple(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount,
        uint256 _expected
    ) external payable returns (uint256);

    function exchange_multiple(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount,
        uint256 _expected,
        address[4] memory _pools
    ) external payable returns (uint256);

    function exchange_multiple(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount,
        uint256 _expected,
        address[4] memory _pools,
        address _receiver
    ) external payable returns (uint256);

    function get_exchange_multiple_amount(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount
    ) external view returns (uint256);

    function get_exchange_multiple_amount(
        address[9] memory _route,
        uint256[3][4] memory _swap_params,
        uint256 _amount,
        address[4] memory _pools
    ) external view returns (uint256);

    // no need
    function get_best_rate(
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (address, uint256);

    function get_best_rate(
        address _from,
        address _to,
        uint256 _amount,
        address[] memory _exclude_pools
    ) external view returns (address, uint256);

    function get_exchange_amount(
        address _pool,
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (uint256);

    function exchange(
        address _pool,
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected
    ) external payable returns (uint256);

    function exchange(
        address _pool,
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected,
        address _receiver
    ) external payable returns (uint256);

    function exchange_with_best_rate(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected
    ) external payable returns (uint256);

    function exchange_with_best_rate(
        address _from,
        address _to,
        uint256 _amount,
        uint256 _expected,
        address _receiver
    ) external payable returns (uint256);
}
