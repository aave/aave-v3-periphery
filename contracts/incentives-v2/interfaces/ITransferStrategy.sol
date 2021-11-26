pragma solidity 0.8.10;

interface ITransferStrategy {
  /**
   * @dev Function to perform actions after configuring a transfer strategy, can only be run once.
   * @param params Custom input optional parameters to load at installHook call.
   * @return Returns true if installation succeeds
   */
  function installHook(bytes memory params) external returns (bool);

  /**
   * @dev Perform custom transfer logic via delegate call from source contract to a TransferStrategy implementation
   * @param to Account to transfer rewards
   * @param reward Address of the reward token
   * @param amount Amount to transfer to the "to" address parameter
   * @return Returns true bool if transfer logic succeeds
   */
  function performTransfer(
    address to,
    address reward,
    uint256 amount
  ) external returns (bool);
}
