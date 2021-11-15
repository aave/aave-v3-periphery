import hre from 'hardhat';

import { initializeMakeSuite } from './helpers/make-suite';

before(async () => {
  await hre.deployments.fixture(['market']);

  console.log('-> Deployed market');

  await initializeMakeSuite();

  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
