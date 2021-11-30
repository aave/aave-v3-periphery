pragma solidity 0.8.10;

/**
 * @title TransferStrategyStorage
 * @author Aave
 **/
contract TransferStrategyStorage {
  bool internal isTransferStrategy;

  constructor() {
    isTransferStrategy = true;
  }

  /**
   * @dev Modifier to prevent direct calls to this logic contract
   */
  modifier onlyDelegateCall() {
    require(isTransferStrategy == false, 'only delegate calls');
    _;
  }
}
