import { BigNumber, BigNumberish, BytesLike } from 'ethers';
import { comparatorEngine, CompareRules } from '../../helpers/comparator-engine';
import { getNormalizedDistribution } from '../../helpers/ray-math';
import { DistributionManagerV2, IncentivesControllerV2 } from '../../../types';

export type AssetUpdateDataV2 = {
  emissionPerSecond: BigNumberish;
  totalStaked: BigNumberish;
  distributionEnd: BigNumberish;
  asset: string;
  reward: string;
  transferStrategy: string;
  transferStrategyParams: BytesLike;
};

export type RewardData = {
  emissionPerSecond: BigNumber;
  index: BigNumber;
  lastUpdateTimestamp: BigNumber;
  distributionEnd: BigNumber;
};

export async function getRewardsData(
  peiContract: DistributionManagerV2 | IncentivesControllerV2,
  assets: string[],
  rewards: string[]
) {
  return await Promise.all(
    assets.map(async (underlyingAsset, i) => {
      const response = await peiContract.getRewardsData(underlyingAsset, rewards[i]);
      return {
        index: response[0],
        emissionPerSecond: response[1],
        lastUpdateTimestamp: response[2],
        distributionEnd: response[3],
        underlyingAsset,
      };
    })
  );
}

export function rewardsDataComparator<Input extends AssetUpdateDataV2, State extends RewardData>(
  assetConfigUpdateInput: Input,
  assetConfigBefore: State,
  assetConfigAfter: State,
  actionBlockTimestamp: number,
  compareRules: CompareRules<Input, State>
) {
  return comparatorEngine(
    ['emissionPerSecond', 'index', 'lastUpdateTimestamp', 'distributionEnd'],
    assetConfigUpdateInput,
    assetConfigBefore,
    assetConfigAfter,
    actionBlockTimestamp,
    {
      ...compareRules,
      fieldsWithCustomLogic: [
        // should happen on any update
        {
          fieldName: 'lastUpdateTimestamp',
          logic: (stateUpdate, stateBefore, stateAfter, txTimestamp) => txTimestamp.toString(),
        },
        {
          fieldName: 'index',
          logic: async (stateUpdate, stateBefore, stateAfter, txTimestamp) => {
            return getNormalizedDistribution(
              stateUpdate.totalStaked.toString(),
              stateBefore.index,
              stateBefore.emissionPerSecond,
              stateBefore.lastUpdateTimestamp,
              txTimestamp,
              stateBefore.distributionEnd
            ).toString(10);
          },
        },
        ...(compareRules.fieldsWithCustomLogic || []),
      ],
    }
  );
}
