# RewardsDistributor

The RewardsDistributor abstract contract, inherited by RewardsController contract, contains all the storage and logic functions for proper accounting of the rewards supported.

The contract support multiple incentivized assets and multiple rewards with different emissions and distribution end per reward. The reward must be an ERC20 compatible contract that exposes the "decimals" function.

## Rewards Distribution Logic

The contract that inherits RewardsDistributor is in charge to provide the `userBalance` and the `totalSupply` of each incentivized asset to the RewardsDistributor.

To track the accounting of the rewards, the inherited contract must call to the internal function `_updateUserRewardsInternal` to update all rewards of a single incentivized asset, or call `_distributeRewards` to synchronize all rewards in a batch of incentivized assets.

At `_updateUserRewardsInternal`, the function first updates a global index based of the asset and a specific reward following the next formula:

> ### Asset Index Formula:
>
> ```
> Emission Per Second * Time Delta * (10 ** Asset Decimals)
> ----------------------------------------------------------  + Current Asset Index
>                       Total Balance
> ```
>
> Where time delta is `current block timestamp - last update timestamp`.

Then if the compared global asset index is different than the previous saved user index, the `_updateUserRewardsInternal` performs a call to `_getRewards` function to distribute the rewards between the old index and the newest asset index, that represents the timeframe between the last distribution and the new distribution and the weight of the user balance versus the total supply during that distribution, following the next formula:

> ### Rewards Distribution Formula
>
> ```
> User Balance * (Global Asset Index - Prior Stored User Index)
> --------------------------------------------------------------
>                     10 ** Asset Decimals
> ```

# External Methods

## setDistributionEnd

Sets the end date for the distribution of a reward to for an incentivized asset. Only callable by the emissions manager admin role. This method is available to extend an already configured distribution.

### Interface

`function setDistributionEnd( address asset, address reward, uint32 distributionEnd ) external;`

### Input parameters

| Parameter Name  | Type    | Description                                              |
| --------------- | ------- | -------------------------------------------------------- |
| asset           | address | The asset to incentivize                                 |
| reward          | address | The reward token that incentives the asset               |
| distributionEnd | uint32  | The end date of the incentivization, in unix time format |

## getDistributionEnd

Gets the end date for the distribution of a reward of an incentivized asset

### Interface

`function getDistributionEnd(address asset, address reward) external view returns (uint256);`

### Input parameters

| Parameter Name | Type    | Description                                |
| -------------- | ------- | ------------------------------------------ |
| asset          | address | The incentivized asset                     |
| reward         | address | The reward token that incentives the asset |

### Returns

| Type    | Description                                                     |
| ------- | --------------------------------------------------------------- |
| uint256 | The end date of the distribution of rewards in unix time format |

## getUserAssetData

Returns the latest distribution index of an user on a reward distribution for a determined incentivized asset.

### Interface

`function getUserAssetData( address user, address asset, address reward ) external view returns (uint256);`

### Input parameters

| Parameter Name | Type    | Description            |
| -------------- | ------- | ---------------------- |
| user           | address | The user address       |
| asset          | address | The incentivized asset |
| reward         | address | The reward token       |

### Returns

| Type    | Description                        |
| ------- | ---------------------------------- |
| uint256 | The latest user distribution index |

## getRewardsData

Returns the configuration of the rewards distribution for a certain asset.

### Interface

`function getRewardsData(address asset, address reward) external view returns ( uint256, uint256, uint256, uint256 );`

### Input parameters

| Parameter Name | Type    | Description            |
| -------------- | ------- | ---------------------- |
| asset          | address | The incentivized asset |
| reward         | address | The reward token       |

### Returns

| Type    | Description                               |
| ------- | ----------------------------------------- |
| uint256 | Asset and Reward index                    |
| uint256 | Emission per second                       |
| uint256 | Last update timestamp                     |
| uint256 | Distribution end date in unix time format |

## getRewardsByAsset

Returns the list of available reward token addresses of an incentivized asset.

### Interface

`function getRewardsByAsset(address asset) external view returns (address[] memory);`

### Input parameters

| Parameter Name | Type    | Description            |
| -------------- | ------- | ---------------------- |
| asset          | address | The incentivized asset |

### Returns

| Type             | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| address[] memory | The list of rewards from the asset passed by the first input parameter |

## getRewardsList

Returns the list of all reward addresses configured.

### Interface

`function getRewardsList() external view returns (address[] memory);`

### Returns

| Type             | Description                       |
| ---------------- | --------------------------------- |
| address[] memory | The list of all rewards addresses |

## getUserUnclaimedRewardsFromStorage

Returns a single rewards balance of an user from contract storage state, not including virtually accrued or pending rewards since last distribution.

### Interface

`function getUserUnclaimedRewardsFromStorage(address user, address reward) external view returns (uint256);`

### Input parameters

| Parameter Name | Type    | Description      |
| -------------- | ------- | ---------------- |
| user           | address | The user address |
| reward         | address | The reward token |

### Returns

| Type    | Description                     |
| ------- | ------------------------------- |
| uint256 | The amount of unclaimed rewards |

## getUserRewardsBalance

Returns a single rewards balance of an user, including virtually accrued and unrealized claimable rewards.

#### Interface

`function getUserRewardsBalance( address[] calldata assets, address user, address reward ) external view returns (uint256);`

### Input parameters

| Parameter Name | Type               | Description                                    |
| -------------- | ------------------ | ---------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions |
| user           | address            | The user address                               |
| reward         | address            | The reward token                               |

### Returns

| Type    | Description                     |
| ------- | ------------------------------- |
| uint256 | The amount of unclaimed rewards |

## getAllUserRewardsBalance

Returns a list all rewards of an user, including already accrued and unrealized claimable rewards.

### Interface

`function getAllUserRewardsBalance(address[] calldata assets, address user) external view returns (address[] memory, uint256[] memory);`

### Input parameters

| Parameter Name | Type               | Description                                    |
| -------------- | ------------------ | ---------------------------------------------- |
| assets         | address[] calldata | List of assets to check eligible distributions |
| user           | address            | The user address                               |

### Returns

| Type             | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| address[] memory | The list of user rewards                                            |
| uint256[] memory | The claimable amounts, following the previous list of rewards order |

### getAssetDecimals

Returns the decimals of an asset to calculate the distribution delta.

### Interface

`function getAssetDecimals(address asset) external view returns (uint8);`

### Input parameters

| Parameter Name | Type    | Description                           |
| -------------- | ------- | ------------------------------------- |
| asset          | address | Asset to retrieve the stored decimals |

### Returns

| Type  | Description                                               |
| ----- | --------------------------------------------------------- |
| uint8 | Decimals of the asset passed by the first input parameter |
