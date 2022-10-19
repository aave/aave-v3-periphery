# Rewards Controller

## Introduction

The Rewards Controller and Rewards Distributor contracts are aimed to bootstrap and incentive liquidity of deposits and borrows in the different Aave Markets with support of multiple rewards instead of only one as the previous version.

The `RewardsController` contract is responsible of configuring the different rewards and the claim process. Inherits `RewardsDistributor`.

The `Transfer Strategies` are isolated contracts that manages the procedure of the rewards transfer at claim. This allows the RewardsController to support any custom rewards, from Staked Aave incentives, common ERC20 transfers from vaults, or even NFT rewards.

The `RewardsDistributor` abstract contract manages the distribution and accountability logic of the multiple rewards per asset over time.

## Rewards Controller

The Rewards Controller is the main contract and where the user interacts to claim the rewards of their positions. It inherits `RewardsDistributor` to handle the distribution of rewards. The users of the incentivised ERC20 assets will accrue value if they hold their tokens in possession without the need of staking or blocking the assets inside a contract. At every transfer the asset must call the `handleAction` method to account for the accumulated rewards of the user prior to balance change.

The users can claim all the rewards or an individual reward per transaction, with a variety of functions that allow more granularity at claim.

## Roles
| Role Name          | Access                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                          |
|--------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Emission Manager   | Immutable                          | Allows to setup the emission configuration of the different rewards and enabling the *Authorized Claimer* role for an address. Declared at RewardsDistribution contract as immutable at constructor.                                                                                                                                                                                                                                 |
| Authorized Claimer | Mutable by *Emission Manager* role | Allows whitelisted addresses to claim on behalf of another specified address. Useful for contracts that hold tokens that are incentivized but don't have any native logic to claim Liquidity Mining rewards. Declared at RewardsController contract, at the `_authorizedClaimers` internal mapping. Addreses can be enabled or disabled as *Authorized Claimer* via `setClaimer` function, only callable by *Emission Manager* role. |

# External Methods

## setClaimer

Whitelists an address to claim the rewards on behalf of another address

### Interface

`function setClaimer(address user, address claimer) external;`

### Input parameters

| Parameter Name | Type    | Description                |
| -------------- | ------- | -------------------------- |
| user           | address | The address of the user    |
| claimer        | address | The address of the claimer |

## setTransferStrategy

Add a TransferStrategy contract that determines the logic and the source of the rewards transfer

### Interface

`function setTransferStrategy(address reward, ITransferStrategyBase transferStrategy) external;`

### Input parameters

| Parameter Name   | Type    | Description                                   |
| ---------------- | ------- | --------------------------------------------- |
| reward           | address | The address of the reward token               |
| transferStrategy | address | The address of the TransferStratregy contract |

## setRewardOracle

Sets an Aave Oracle contract to enforce rewards with a source of value.

At the moment of reward configuration, the Incentives Controller performs a check to see if the reward asset oracle is compatible with IEACAggregator proxy.

This check is enforced for integrators to be able to show incentives at the current open source Aave UI without the need to setup an external price registry.

### Interface

` function setRewardOracle(address reward, IEACAggregatorProxy rewardOracle) external;`

### Input parameters

| Parameter Name | Type                | Description                                                                |
| -------------- | ------------------- | -------------------------------------------------------------------------- |
| reward         | address             | The address of the reward to set the price aggregator                      |
| rewardOracle   | IEACAggregatorProxy | The address of price aggregator that follows IEACAggregatorProxy interface |

## getRewardOracle

Get the price aggregator oracle address

### Interface

`function getRewardOracle(address reward) external view returns (address);`

### Input parameters

| Parameter Name | Type    | Description                     |
| -------------- | ------- | ------------------------------- |
| reward         | address | The address of the reward token |

### Returns

| Type    | Description               |
| ------- | ------------------------- |
| address | The address of the oracle |

## getClaimer

Returns the whitelisted claimer for a certain address. It returns 0x0 address if not set.

### Interface

`function getClaimer(address user) external view returns (address);`

### Input parameters

| Parameter Name | Type    | Description             |
| -------------- | ------- | ----------------------- |
| user           | address | The address of the user |

### Returns

| Type    | Description                           |
| ------- | ------------------------------------- |
| address | The address of the authorized claimer |

## getTransferStrategy

Returns the Transfer Strategy implementation contract address being used for a reward address

### Interface

`function getTransferStrategy(address reward) external view returns (address);`

### Input parameters

| Parameter Name | Type    | Description               |
| -------------- | ------- | ------------------------- |
| reward         | address | The address of the reward |

## configureAssets

Configure assets to incentivize with an emission of rewards per second until the end of distribution.

### Interface

`function configureAssets(RewardsDistributorTypes.RewardsConfigInput[] memory config) external;`

### Input parameters

| Parameter Name | Type                                                | Description                    |
| -------------- | --------------------------------------------------- | ------------------------------ |
| config         | RewardsDistributorTypes.RewardsConfigInput[] memory | The assets configuration input |

The `RewardsDistributorTypes.RewardsConfigInput` struct is composed with the following fields:

| Name              | Type                | Description                                                                                                                                                   |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| emissionPerSecond | uint104             | The emission per second following rewards unit decimals.                                                                                                      |
| totalSupply       | uint256             | The total supply of the asset to incentivize                                                                                                                  |
| distributionEnd   | uint40              | The end of the distribution of the incentives for an asset                                                                                                    |
| asset             | address             | The asset address to incentivize                                                                                                                              |
| reward            | address             | The reward token address                                                                                                                                      |
| transferStrategy  | ITransferStrategy   | The TransferStrategy address with the install hook and claim logic.                                                                                           |
| rewardOracle      | IEACAggregatorProxy | The Price Oracle of a reward to visualize the incentives at the UI Frontend. Must follow Chainlink Aggregator IEACAggregatorProxy interface to be compatible. |

## handleAction

Called by the corresponding asset on transfer hook in order to update the rewards distribution.

### Interface

`function handleAction(address user, uint256 userBalance, uint256 totalSupply) external;`

### Input parameters

| Parameter Name | Type    | Description                                                |
| -------------- | ------- | ---------------------------------------------------------- |
| user           | address | The address of the user whose asset balance has changed    |
| userBalance    | uint256 | The previous user balance prior to balance change          |
| totalSupply    | uint256 | The total supply of the asset prior to user balance change |

## claimRewards

Claims reward for an user to the desired address, on all the assets of the lending pool, accumulating the pending rewards

### Interface

`function claimRewards( address[] calldata assets, uint256 amount, address to, address reward ) external returns (uint256);`

### Input parameters

| Parameter Name | Type               | Description                                                            |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions before claiming rewards |
| amount         | uint256            | Amount of rewards to claim                                             |
| to             | address            | Address that will be receiving the rewards                             |
| reward         | address            | Address of the reward token                                            |

### Returns

| Type    | Description                                       |
| ------- | ------------------------------------------------- |
| uint256 | Amount of rewards claimed for one specific reward |

## claimRewardsOnBehalf

Claims reward for an user on behalf, accumulating the pending rewards of the assets passed by the first argument. The caller must be whitelisted via "allowClaimOnBehalf" function by the RewardsAdmin role manager.

### Interface

`function claimRewardsOnBehalf( address[] calldata assets, uint256 amount, address user, address to, address reward ) external returns (uint256);`

### Input parameters

| Parameter Name | Type               | Description                                                            |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions before claiming rewards |
| amount         | uint256            | Amount of rewards to claim                                             |
| user           | address            | Address to check and claim rewards                                     |
| to             | address            | Address that will be receiving the rewards                             |
| reward         | address            | Address of the reward token                                            |

### Returns

| Type    | Description                                       |
| ------- | ------------------------------------------------- |
| uint256 | Amount of rewards claimed for one specific reward |

## claimRewardsToSelf

Claims reward for msg.sender, on all the assets of the lending pool, accumulating the pending rewards passed by the first input parameter. This function have been requested to support smart contract wallets to prevent risk of collusion by the smart contract wallet operator.

### Interface

`function claimRewardsToSelf( address[] calldata assets, uint256 amount, address reward ) external returns (uint256);`

### Input parameters

| Parameter Name | Type               | Description                                                            |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions before claiming rewards |
| amount         | uint256            | Amount of rewards to claim                                             |
| reward         | address            | Address of the reward token                                            |

### Returns

| Type    | Description                                       |
| ------- | ------------------------------------------------- |
| uint256 | Amount of rewards claimed for one specific reward |

## claimAllRewards

Claims all rewards for an user to the desired address, on all the assets of the lending pool, accumulating the pending rewards passed by the first input parameter

### Interface

`function claimAllRewards(address[] calldata assets, address to) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);`

### Input parameters

| Parameter Name | Type               | Description                                                            |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions before claiming rewards |
| to             | address            | Address that will be receiving the rewards                             |

### Returns

| Name           | Type             | Description                                                                                                                                           |
| -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| rewardList     | address[] memory | List of addresses of the reward tokens and claimedAmounts, the list that contains the claimed amount per reward, following same order as "rewardList" |
| claimedAmounts | uint256[] memory | List that contains the claimed amount per reward, following same order as "rewardList"                                                                |

## claimAllRewardsOnBehalf

Claims all rewards for an user on behalf, on all the assets of the lending pool, accumulating the pending rewards passed by the first input parameter. The caller must be whitelisted via "allowClaimOnBehalf" function by the RewardsAdmin role manager.

### Interface

`function claimAllRewardsOnBehalf( address[] calldata assets, address user, address to ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);`

### Input parameters

| Parameter Name | Type               | Description                                                            |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions before claiming rewards |
| user           | address            | Address to check and claim rewards                                     |
| to             | address            | Address that will be receiving the rewards                             |

### Returns

| Name           | Type             | Description                                                                                                                                           |
| -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| rewardList     | address[] memory | List of addresses of the reward tokens and claimedAmounts, the list that contains the claimed amount per reward, following same order as "rewardList" |
| claimedAmounts | uint256[] memory | List that contains the claimed amount per reward, following same order as "rewardList"                                                                |

## claimAllRewardsToSelf

Claims all reward for msg.sender, on all the assets of the lending pool, accumulating the pending rewards passed by the first input parameter. This function have been requested to support smart contract wallets to prevent risk of collusion by the smart contract wallet operator.

### Interface

`function claimAllRewardsToSelf(address[] calldata assets) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);`

### Input parameters

| Parameter Name | Type               | Description                                                            |
| -------------- | ------------------ | ---------------------------------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions before claiming rewards |

### Returns

| Name           | Type             | Description                                                                                                                                           |
| -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| rewardList     | address[] memory | List of addresses of the reward tokens and claimedAmounts, the list that contains the claimed amount per reward, following same order as "rewardList" |
| claimedAmounts | uint256[] memory | List that contains the claimed amount per reward, following same order as "rewardList"                                                                |
