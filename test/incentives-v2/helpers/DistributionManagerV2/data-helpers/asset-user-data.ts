import { DistributionManagerV2 } from './../../../types/DistributionManagerV2.d';
import { BigNumber } from 'ethers';
import { IncentivesControllerV2 } from '../../../types';

export async function getUserIndex(
  distributionManager: DistributionManagerV2 | IncentivesControllerV2,
  user: string,
  asset: string,
  reward: string
): Promise<BigNumber> {
  return await distributionManager.getUserAssetData(user, asset, reward);
}
