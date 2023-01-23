import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const emissionManager = await ethers.getContractAt(
    'EmissionManager',
    '0xB47CCB21Fb288Fe0171f7dce85EC304dF218fE23'
  );

  const asset = '0xe6b683868d1c168da88cfe5081e34d9d80e4d1a6';
  const maha = '0xb4d930279552397bba2ee473229f89ec245bc365';
  const transferStrategy = '0xE61469bF75142A1b4757A66eCaC54CdE78290149';
  const rewardOracle = '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9';

  const tx = await emissionManager.configureAssets([
    {
      emissionPerSecond: '380520000000000',
      totalSupply: '0',
      distributionEnd: Math.floor(Date.now() / 1000) + Number(365 * 86400),
      asset,
      reward: maha,
      transferStrategy,
      rewardOracle,
    },
  ]);

  console.log('done', tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
