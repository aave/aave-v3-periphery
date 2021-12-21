import { BigNumber } from 'ethers';
import hre from 'hardhat';

export const timeLatest = async () => {
  const block = await hre.ethers.provider.getBlock('latest');
  return BigNumber.from(block.timestamp);
};
