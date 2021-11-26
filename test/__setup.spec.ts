import hre from 'hardhat';

before(async () => {
  await hre.deployments.fixture(['market']);

  console.log('-> Deployed market');

  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
