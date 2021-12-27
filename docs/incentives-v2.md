# Incentives Controller V2

## Introduction

The Incentives Controller V2 and Distribution Manager V2 contracts are aimed to bootstrap and incentive liquidity in the different Aave Markets with support of multiple rewards instead of only one as the previous version.

The `RewardsController` contract is responsible of configuring the different rewards and the claim process. Inherits `RewardsDistributor`.

The `Transfer Strategies` are small implementation contracts that manages the procedure of the rewards transfer at claim. This allows the RewardsController to support many custom rewards, from Staked Aave incentives, common ERC20 transfers from vaults, or even NFT rewards.

The `RewardsDistributor` contract manages the distribution and accountability of the multiple rewards per asset over time.

## Incentives Controller V2 [wip]

The Incentives Controller is the main contract and where the user interacts to claim the rewards of their incetivized positions.

## Transfer Strategies

Transfer Strategies are implementation contracts to support different reward systems. Currently there is `StakedTokenStrategy` and `PullRewardsStrategy` to support StkAave rewards and common ERC20 incentives pulled from a external vault. The `RewardsController` performs delegate calls to the transfer strategy contracts. The Transfer Strategies has two main functions:

- `installHook(bytes params)`
  The `installHook` function is called at the moment of configuring the IncentivesController assets. The function allows initial setups of one reward, for example perform `approve` to a staking contract that would save gas costs at claim. Contains optional `params` that can be parsed using `abi.decode` method.
- `performTransfer(address to, address reward, uint256 amount)`
  The `performTransfer` function is called at `claimRewards`, and holds the custom logic to transfer the rewards from the source of the reward to the destination.

![alt text](./img/ClaimFlow.png)

### Supported Transfer Strategies

#### Pull Rewards Transfer Strategy

The strategy contract allows to integrate any ERC20 token that want to incentivize deposits or borrows at Aave markets. At the deployment you must provide the "vault" address where to pull rewards at the moment of claim.

Installation hook does not contain any logic, returns true.

At transfer hook, does a external call `transferFrom` to the ERC20 token, from the `vault` address to the claimer address.

#### Staked Token Transfer Strategy

The strategy contract allows to integrate the Staked Aave token as rewards. The strategy needs AAVE to be deposited at the Incentives Controller V2 proxy contract. At the deployment you must provide the Stake Aave token address.

At installation hook, the strategy sets MAX_UINT allowance approval to the Stake Aave contract to save gas costs at claim.

At transfer hook, stakes the AAVE rewards while transferring the obtained stkAAVE to the claiming user.

## RewardsDistributor [wip]
