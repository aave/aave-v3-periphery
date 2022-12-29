import hre from 'hardhat';
import { initializeMakeSuite } from './helpers/make-suite';

before(async () => {
  if (process.env.EMPTY_RUN === 'true') {
    console.log('Skipping due empty test run.');
    return;
  }
  await hre.deployments.fixture(['market', 'periphery-post']);

  console.log('-> Deployed market');

  await initializeMakeSuite();

  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
