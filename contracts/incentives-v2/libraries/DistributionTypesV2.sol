// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.10;

import {ITransferStrategy} from '../interfaces/ITransferStrategy.sol';
import {IEACAggregatorProxy} from '../../misc/interfaces/IEACAggregatorProxy.sol';

library DistributionTypesV2 {
  struct RewardsConfigInput {
    uint88 emissionPerSecond;
    uint256 totalSupply;
    uint32 distributionEnd;
    address asset;
    address reward;
    ITransferStrategy transferStrategy;
    bytes transferStrategyParams;
    IEACAggregatorProxy rewardOracle;
  }

  struct UserAssetStatsInput {
    address underlyingAsset;
    uint256 userBalance;
    uint256 totalSupply;
  }
}
