import { makeSuite, TestEnv } from '../helpers/make-suite';
import { ZERO_ADDRESS } from '@aave/deploy-v3';

const { expect } = require('chai');

makeSuite('AaveIncentivesControllerV2 initialize', (testEnv: TestEnv) => {
  it('Tries to call initialize second time, should be reverted', async () => {
    const { incentivesControllerV2 } = testEnv;
    await expect(incentivesControllerV2.initialize()).to.be.reverted;
  });
});
