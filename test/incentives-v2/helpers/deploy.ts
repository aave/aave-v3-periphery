import { ATokenMock } from './../../../types/ATokenMock.d';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

declare var hre: HardhatRuntimeEnvironment;

export const deployATokenMock = async (
  incentivesController: string,
  slug: string
): Promise<ATokenMock> => {
  const { deployer } = await hre.getNamedAccounts();
  const artifact = await hre.deployments.deploy(`${slug}-ATokenMock`, {
    contract: 'ATokenMock',
    from: deployer,
    args: [incentivesController],
    log: true,
  });
  return hre.ethers.getContractAt(artifact.abi, artifact.address);
};
