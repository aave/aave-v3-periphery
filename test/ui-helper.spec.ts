import { UiIncentiveDataProviderV3 } from './../types/UiIncentiveDataProviderV3';
import hre from 'hardhat';
import { makeSuite } from './helpers/make-suite';

makeSuite('UI Incentives Helper', (testEnv) => {
  let uiHelper: UiIncentiveDataProviderV3;

  before(async () => {
    const { deployer: from } = await hre.getNamedAccounts();
    const artifact = await hre.deployments.deploy('UiIncentiveDataProviderV3', { from, args: [] });
    uiHelper = await hre.ethers.getContractAt('UiIncentiveDataProviderV3', artifact.address);
  });

  it('Test getter', async () => {
    const { addressesProvider } = testEnv;
    const response = await uiHelper.getReservesIncentivesData(addressesProvider.address, {
      gasLimit: '12000000',
    });
    console.log('RES', response);
  });
});
