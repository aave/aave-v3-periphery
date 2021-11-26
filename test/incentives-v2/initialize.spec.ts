import { makeSuite, TestEnv } from '../helpers/make-suite';
import { MAX_UINT_AMOUNT, ZERO_ADDRESS } from '../../helpers/constants';

const { expect } = require('chai');

makeSuite('AaveIncentivesControllerV2 initialize', (testEnv: TestEnv) => {
  it('Tries to call initialize second time, should be reverted', async () => {
    const { aaveIncentivesController } = testEnv;
    await expect(aaveIncentivesController.initialize(ZERO_ADDRESS)).to.be.reverted;
  });
});
