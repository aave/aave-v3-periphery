import { BigNumber, BigNumberish, BytesLike } from 'ethers';
import { RewardsController } from '../../../../../types/RewardsController';
import { comparatorEngine, CompareRules } from '../../comparator-engine';
import { getNormalizedDistribution } from '../../ray-math';
import { BigNumberValue, valueToZDBigNumber } from '../../ray-math/bignumber';

export type AssetUpdateDataV2 = {
  emissionPerSecond: BigNumberish;
  totalSupply: BigNumberish;
  distributionEnd: BigNumberish;
  asset: string;
  reward: string;
  rewardOracle: string;
  transferStrategy: string;
};

export type RewardData = {
  emissionPerSecond: BigNumber;
  index: BigNumber;
  lastUpdateTimestamp: BigNumber;
  distributionEnd: BigNumber;
};

export type AssetData = {
  emissionPerSecond: BigNumber;
  index: BigNumber;
  lastUpdateTimestamp: BigNumber;
};

export async function getRewardsData(
  peiContract: RewardsController,
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
              stateUpdate.totalSupply.toString(),
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

export function getRewards(
  balance: BigNumberValue,
  assetIndex: BigNumberValue,
  userIndex: BigNumberValue,
  precision: number = 18
): BigNumber {
  return BigNumber.from(
    valueToZDBigNumber(balance)
      .multipliedBy(valueToZDBigNumber(assetIndex).minus(userIndex.toString()))
      .dividedBy(valueToZDBigNumber(10).exponentiatedBy(precision))
      .toString()
  );
}

export function assetDataComparator<
  Input extends { underlyingAsset: string; totalSupply: BigNumberish },
  State extends AssetData
>(
  assetConfigUpdateInput: Input,
  assetConfigBefore: State,
  assetConfigAfter: State,
  actionBlockTimestamp: number,
  emissionEndTimestamp: number,
  compareRules: CompareRules<Input, State>,
  decimals = 18
) {
  return comparatorEngine(
    ['emissionPerSecond', 'index', 'lastUpdateTimestamp'],
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
              stateUpdate.totalSupply.toString(),
              stateBefore.index,
              stateBefore.emissionPerSecond,
              stateBefore.lastUpdateTimestamp,
              txTimestamp,
              emissionEndTimestamp,
              decimals
            ).toString(10);
          },
        },
        ...(compareRules.fieldsWithCustomLogic || []),
      ],
    }
  );
}
