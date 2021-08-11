import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DRE } from './misc-utils';

export const usingTenderly = () =>
  DRE &&
  ((DRE as HardhatRuntimeEnvironment).network.name.includes('tenderly') ||
    process.env.TENDERLY === 'true');

export const setNewHead = (head: string) => {
  const net = DRE.tenderly.network();
  net.setFork(process.env.TENDERLY_FORK_ID);
  net.setHead(head);
  const provider = new DRE.ethers.providers.Web3Provider(net);
  DRE.ethers.provider = provider;
};

export const logError = () => {
  if (DRE.network.name.includes('tenderly')) {
    const transactionLink = `https://dashboard.tenderly.co/${DRE.config.tenderly.username}/${
      DRE.config.tenderly.project
    }/fork/${DRE.tenderly.network().getFork()}/simulation/${DRE.tenderly.network().getHead()}`;
    console.error(
      '[TENDERLY] Transaction Reverted. Check TX simulation error at:',
      transactionLink
    );
  }
};
