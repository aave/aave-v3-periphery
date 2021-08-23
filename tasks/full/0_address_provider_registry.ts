import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { deployPoolAddressesProviderRegistry } from '../../helpers/contracts-deployments';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress } from '../../helpers/misc-utils';
import { logTenderlyError, usingTenderly } from '../../helpers/tenderly-utils';
import { eNetwork } from '../../helpers/types';

task('full:deploy-address-provider-registry', 'Deploy address provider registry')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const poolConfig = loadPoolConfig(pool);
      const network = <eNetwork>DRE.network.name;

      const providerRegistryAddress = getParamPerNetwork(poolConfig.ProviderRegistry, network);

      if (notFalsyOrZeroAddress(providerRegistryAddress)) {
        console.log('\tAlready deployed Provider Registry Address at', providerRegistryAddress);
      } else {
        const contract = await deployPoolAddressesProviderRegistry(verify);
        console.log('\tDeployed Registry Address:', contract.address);
      }
    } catch (error) {
      if (usingTenderly()) {
        logTenderlyError();
      }
      throw error;
    }
  });
