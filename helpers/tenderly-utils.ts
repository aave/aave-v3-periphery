import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract } from 'ethers';

declare var hre: HardhatRuntimeEnvironment;

export const usingTenderly = () =>
  hre &&
  ((hre as HardhatRuntimeEnvironment).network.name.includes('tenderly') ||
    process.env.TENDERLY === 'true');

export const setNewHead = (head: string) => {
  const net = hre.tenderly.network();
  net.setFork(process.env.TENDERLY_FORK_ID);
  net.setHead(head);
  const provider = new hre.ethers.providers.Web3Provider(net);
  hre.ethers.provider = provider;
};

export const logError = () => {
  if (hre.network.name.includes('tenderly')) {
    const transactionLink = `https://dashboard.tenderly.co/${hre.config.tenderly.username}/${
      hre.config.tenderly.project
    }/fork/${hre.tenderly.network().getFork()}/simulation/${hre.tenderly.network().getHead()}`;
    console.error(
      '[TENDERLY] Transaction Reverted. Check TX simulation error at:',
      transactionLink
    );
  }
};
