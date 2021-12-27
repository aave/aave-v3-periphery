# Rewards Controller

## Introduction

The Rewards Controller and Rewards Distributor contracts are aimed to bootstrap and incentive liquidity in the different Aave Markets with support of multiple rewards instead of only one as the previous version.

The `RewardsController` contract is responsible of configuring the different rewards and the claim process. Inherits `RewardsDistributor`.

The `Transfer Strategies` are small implementation contracts that manages the procedure of the rewards transfer at claim. This allows the RewardsController to support many custom rewards, from Staked Aave incentives, common ERC20 transfers from vaults, or even NFT rewards.

The `RewardsDistributor` contract manages the distribution and accountability of the multiple rewards per asset over time.

## Rewards Controller [wip]

The Rewards Controller is the main contract and where the user interacts to claim the rewards of their positions. It inherits `RewardsDistributor` to handle the distribution of rewards. The users of the incentivised assets will accrue value if they hold their tokens in possession without the need of staking or blocking the assets inside a contract. At every transfer the asset must call to handleAction

## Transfer Strategies

Transfer Strategies are isolated contracts to manage and support different reward systems. Currently there is `StakedTokenStrategy` to support StkAave rewards, and `PullRewardsStrategy` to support common ERC20 incentives pulled from a external vault. The `RewardsController` performs calls to the transfer strategy contracts. The Transfer Strategies has one main function:

- `performTransfer(address to, address reward, uint256 amount)`
  The `performTransfer` function hook is called at `claimRewards`, and holds the custom logic to transfer the rewards from the source of the reward to the destination.

Due they are inmmutable contracts, the transfer strategy contracts contains an ERC20 recovery method in case of a transfer mistake to the contracts.

### Supported Transfer Strategies

#### Pull Rewards Transfer Strategy

The strategy contract allows to integrate any ERC20 token that want to incentivize deposits or borrows at Aave markets. At the deployment you must provide the "vault" address where to pull rewards at the moment of claim.

At transfer hook, does a external call `transferFrom` to the ERC20 token, from the `vault` address to the claimer address.

#### Staked Token Transfer Strategy

The strategy contract allows to integrate the Staked Aave token as rewards. The strategy needs AAVE to be deposited at the Incentives Controller V2 proxy contract. At the deployment you must provide the Stake Aave token address.

At transfer hook, stakes the AAVE rewards while transferring the obtained stkAAVE to the claiming user.

## RewardsDistributor [wip]
