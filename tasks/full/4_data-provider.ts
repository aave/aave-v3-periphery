import { task } from 'hardhat/config';
import { getPoolAddressesProvider } from '../../helpers/contracts-getters';
import { deployAaveProtocolDataProvider } from '../../helpers/contracts-deployments';
import { logTenderlyError, usingTenderly } from '../../helpers/tenderly-utils';

task('full:data-provider', 'Deploy AaveProtocolDataProvider.')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, DRE) => {
    try {
      await DRE.run('set-DRE');

      const addressesProvider = await getPoolAddressesProvider();

      const dataProvider = await deployAaveProtocolDataProvider(addressesProvider.address, verify);

      console.log('\AaveProtocolDataProvider:', dataProvider.address);
    } catch (error) {
      if (usingTenderly()) {
        logTenderlyError();
      }
      throw error;
    }
  });
