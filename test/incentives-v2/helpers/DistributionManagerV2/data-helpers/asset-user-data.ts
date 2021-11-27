import { BigNumber } from 'ethers';
import { IncentivesControllerV2 } from '../../../../../types/IncentivesControllerV2';

export async function getUserIndex(
  distributionManager: IncentivesControllerV2,
  user: string,
  asset: string,
  reward: string
): Promise<BigNumber> {
  return await distributionManager.getUserAssetData(user, asset, reward);
}
