// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.10;

import {Ownable} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/Ownable.sol';
import {IERC20} from '@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol';
import {IERC20WithPermit} from '@aave/core-v3/contracts/interfaces/IERC20WithPermit.sol';
import {GPv2SafeERC20} from '@aave/core-v3/contracts/dependencies/gnosis/contracts/GPv2SafeERC20.sol';
import {IPool} from '@aave/core-v3/contracts/interfaces/IPool.sol';
import {IAToken} from '@aave/core-v3/contracts/interfaces/IAToken.sol';

/**
 * @title BaseTokenWrapper
 * @author Aave
 * @notice Base contract to enable intermediate wrap/unwrap of a token upon supply/withdraw from a Pool
 */
abstract contract BaseTokenWrapper is Ownable {
  using GPv2SafeERC20 for IERC20;
  using GPv2SafeERC20 for IERC20WithPermit;

  struct PermitSignature {
    uint256 deadline;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  address public immutable TOKEN_IN;
  address public immutable TOKEN_OUT;
  IPool public immutable POOL;

  /**
   * @dev Constructor
   * @param tokenIn ERC-20 token that will be wrapped in supply operations
   * @param tokenOut ERC-20 token received upon wrapping
   * @param pool The address of the Aave Pool
   * @param owner The address to transfer ownership to
   */
  constructor(address tokenIn, address tokenOut, address pool, address owner) {
    TOKEN_IN = tokenIn;
    TOKEN_OUT = tokenOut;
    POOL = IPool(pool);
    transferOwnership(owner);
    IERC20(tokenOut).approve(address(pool), type(uint256).max);
  }

  /**
   * @notice Converts amount of token to wrapped version and supplies to Pool
   * @param amount The amount of the token to wrap and supply to the Pool
   * @param onBehalfOf The address that will receive the aTokens
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards
   */
  function supplyToken(uint256 amount, address onBehalfOf, uint16 referralCode) external {
    _supplyToken(amount, onBehalfOf, referralCode);
  }

  /**
   * @notice Converts amount of token to wrapped version and supplies to Pool, using permit for allowance
   * @param amount The amount of the token to wrap and supply to the Pool
   * @param onBehalfOf The address that will receive the aTokens
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards
   * @param signature The EIP-712 signature data used for permit
   */
  function supplyTokenWithPermit(
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode,
    PermitSignature calldata signature
  ) external {
    IERC20WithPermit(TOKEN_IN).permit(
      msg.sender,
      address(this),
      amount,
      signature.deadline,
      signature.v,
      signature.r,
      signature.s
    );
    _supplyToken(amount, onBehalfOf, referralCode);
  }

  /**
   * @notice Withdraws the wrapped token from the Pool and unwraps it, sending to the recipient
   * @param amount The amount of the token to withdraw from the Pool and unwrap
   * @param to The address that will receive the unwrapped token
   */
  function withdrawToken(uint256 amount, address to) external {
    IAToken aTokenOut = IAToken(POOL.getReserveData(TOKEN_OUT).aTokenAddress);
    _withdrawToken(amount, to, aTokenOut);
  }

  /**
   * @notice Withdraws the wrapped token from the Pool and unwraps it, sending to the recipient, using permit for allowance
   * @param amount The amount of the token to withdraw from the Pool and unwrap
   * @param to The address that will receive the unwrapped token
   * @param signature The EIP-712 signature data used for permit
   */
  function withdrawTokenWithPermit(
    uint256 amount,
    address to,
    PermitSignature calldata signature
  ) external {
    IAToken aTokenOut = IAToken(POOL.getReserveData(TOKEN_OUT).aTokenAddress);
    aTokenOut.permit(
      msg.sender,
      address(this),
      amount,
      signature.deadline,
      signature.v,
      signature.r,
      signature.s
    );
    _withdrawToken(amount, to, aTokenOut);
  }

  /**
   * @notice Provides way for the contract owner to rescue ERC-20 tokens
   * @param token The address of the token to withdraw from this contract
   */
  function rescueTokens(IERC20 token) external onlyOwner {
    token.safeTransfer(owner(), token.balanceOf(address(this)));
  }

  /**
   * @notice Computes the amount of tokenOut received for a provided amount of tokenIn
   * @param amount The amount of tokenIn
   * @return The amount of tokenOut
   */
  function getTokenOutForTokenIn(uint256 amount) external view virtual returns (uint256);

  /**
   * @notice Computes the amount of tokenIn received for a provided amount of tokenOut
   * @param amount The amount of tokenOut
   * @return The amount of tokenIn
   */
  function getTokenInForTokenOut(uint256 amount) external view virtual returns (uint256);

  /**
   * @dev Helper to convert an amount of token to wrapped version and supplies to Pool
   * @param amount The amount of the token to wrap and supply to the Pool
   * @param onBehalfOf The address that will receive the aTokens
   * @param referralCode Code used to register the integrator originating the operation, for potential rewards
   */
  function _supplyToken(uint256 amount, address onBehalfOf, uint16 referralCode) internal {
    require(amount > 0, 'INSUFFICIENT_AMOUNT_TO_SUPPLY');
    IERC20(TOKEN_IN).safeTransferFrom(msg.sender, address(this), amount);
    uint256 amountWrapped = _wrapTokenIn(amount);
    require(amountWrapped > 0, 'INSUFFICIENT_WRAPPED_TOKEN_RECEIVED');
    POOL.supply(TOKEN_OUT, amountWrapped, onBehalfOf, referralCode);
  }

  /**
   * @notice Helper to withdraw the wrapped token from the Pool and unwraps it, sending to the recipient
   * @param amount The amount of the token to withdraw from the Pool and unwrap
   * @param to The address that will receive the unwrapped token
   * @param aTokenOut The AToken that will be withdrawn from the Pool
   */
  function _withdrawToken(uint256 amount, address to, IAToken aTokenOut) internal {
    require(amount > 0, 'INSUFFICIENT_AMOUNT_TO_WITHDRAW');
    if (amount == type(uint256).max) {
      amount = aTokenOut.balanceOf(msg.sender);
    }
    aTokenOut.transferFrom(msg.sender, address(this), amount);
    POOL.withdraw(TOKEN_OUT, amount, address(this));
    uint256 amountUnwrapped = _unwrapTokenOut(amount);
    require(amountUnwrapped > 0, 'INSUFFICIENT_UNWRAPPED_TOKEN_RECEIVED');
    IERC20(TOKEN_IN).safeTransfer(to, amountUnwrapped);
  }

  /**
   * @notice Helper to wrap an amount of tokenIn, receiving tokenOut
   * @param amount The amount of tokenIn to wrap
   * @return The amount of tokenOut received
   */
  function _wrapTokenIn(uint256 amount) internal virtual returns (uint256);

  /**
   * @notice Helper to unwrap an amount of tokenOut, receiving tokenIn
   * @param amount The amount of tokenOut to unwrap
   * @return The amount of tokenIn received
   */
  function _unwrapTokenOut(uint256 amount) internal virtual returns (uint256);
}
