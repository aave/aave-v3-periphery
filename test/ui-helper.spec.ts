import { advanceBlock } from '@aave/deploy-v3';
import { UiIncentiveDataProviderV3 } from './../types/UiIncentiveDataProviderV3';
import hre from 'hardhat';
import { makeSuite } from './helpers/make-suite';
import { expect } from 'chai';

makeSuite('UI Incentives Helper', (testEnv) => {
  let uiHelper: UiIncentiveDataProviderV3;

  before(async () => {
    const { deployer: from } = await hre.getNamedAccounts();
    const artifact = await hre.deployments.deploy('UiIncentiveDataProviderV3', { from, args: [] });
    uiHelper = await hre.ethers.getContractAt('UiIncentiveDataProviderV3', artifact.address);
  });

  it('Call "getReservesIncentivesData"', async () => {
    const { addressesProvider } = testEnv;
    const response = await uiHelper.getReservesIncentivesData(addressesProvider.address, {
      gasLimit: '12000000',
    });
    console.log('debug', response);
    expect('getReservesIncentivesData').to.be.calledOnContractWith(uiHelper, [
      addressesProvider.address,
    ]);
  });

  it('Call "getFullReservesIncentiveData"', async () => {
    const {
      addressesProvider,
      users: [user1],
    } = testEnv;
    const response = await uiHelper.getFullReservesIncentiveData(
      addressesProvider.address,
      user1.address,
      {
        gasLimit: '12000000',
      }
    );
    console.log('debug', response);
    expect('getFullReservesIncentiveData').to.be.calledOnContractWith(uiHelper, [
      addressesProvider.address,
      user1.address,
    ]);
  });

  it('Call "getUserReservesIncentivesData"', async () => {
    const {
      addressesProvider,

      users: [user1],
    } = testEnv;
    const response = await uiHelper.getUserReservesIncentivesData(
      addressesProvider.address,
      user1.address,
      {
        gasLimit: '12000000',
      }
    );
    console.log('debug', response);
    expect('getUserReservesIncentivesData').to.be.calledOnContractWith(uiHelper, [
      addressesProvider.address,
      user1.address,
    ]);
  });
});
