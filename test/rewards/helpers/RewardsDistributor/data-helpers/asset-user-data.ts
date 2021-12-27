import { BigNumber } from 'ethers';
import { RewardsController } from '../../../../../types/RewardsController';

export async function getUserIndex(
  distributionManager: RewardsController,
  user: string,
  asset: string,
  reward: string
): Promise<BigNumber> {
  return await distributionManager.getUserAssetData(user, asset, reward);
}
