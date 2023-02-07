import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const admin = deployer.address;

  const proxy = await ethers.getContractAt(
    'InitializableAdminUpgradeabilityProxy',
    '0xda25Ded8373B7984Ce6b2e0E35f204AcC2382Fd2'
  );

  // const SimpleStrategy = await ethers.getContractFactory('SimpleRewardsTransferStrategy');
  // const strategy = await SimpleStrategy.deploy(proxy.address, admin);
  // await strategy.deployed();
  // console.log(`strategy: ${strategy.address} -> tx hash: ${strategy.deployTransaction.hash}`);

  // const EmissionManager = await ethers.getContractFactory('EmissionManager');
  // const emissionManager = await EmissionManager.deploy(proxy.address, admin);
  // await emissionManager.deployed();
  // console.log(
  //   `emissionManager: ${emissionManager.address} -> tx hash: ${emissionManager.deployTransaction.hash}`
  // );

  const RewardsController = await ethers.getContractFactory('RewardsController');
  // const emissionManager = await EmissionManager.deploy(proxy.address, admin);
  // await emissionManager.deployed();
  // console.log(
  //   `emissionManager: ${emissionManager.address} -> tx hash: ${emissionManager.deployTransaction.hash}`
  // );

  const incentivesInit = RewardsController.interface.encodeFunctionData('initialize', [
    '0xB47CCB21Fb288Fe0171f7dce85EC304dF218fE23',
  ]);

  console.log(incentivesInit);
  await proxy.initialize(
    '0x7fE182180BdC756c555164F2D515BD767C990F5C', // address logic,
    incentivesInit // bytes memory data
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
