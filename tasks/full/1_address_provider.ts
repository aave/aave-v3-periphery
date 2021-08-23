import { task } from 'hardhat/config';
import { eNetwork } from '../../helpers/types';
import {
  ConfigNames,
  loadPoolConfig,
  getGenesisPoolAdmin,
  getEmergencyAdmin,
} from '../../helpers/configuration';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import { logTenderlyError, usingTenderly } from '../../helpers/tenderly-utils';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { deployPoolAddressesProvider } from '../../helpers/contracts-deployments';

task(
  'full:deploy-address-provider',
  'Deploy address provider, registry and fee provider'
)
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag('skipRegistry')
  .setAction(async ({ verify, pool, skipRegistry }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const poolConfig = loadPoolConfig(pool);
      const { MarketId: marketId } = poolConfig;

      // 1. Deploy address provider and set genesis manager
      const addressesProvider = await deployPoolAddressesProvider(marketId, verify);

      // 2. Add to registry or setup a new one
      if (!skipRegistry) {
        const providerRegistryAddress = getParamPerNetwork(
          poolConfig.ProviderRegistry,
          <eNetwork>DRE.network.name
        );

        await DRE.run('add-market-to-registry', {
          pool,
          addressesProvider: addressesProvider.address,
          deployRegistry: !notFalsyOrZeroAddress(providerRegistryAddress),
        });
      }
      // 3. Set pool admins
      await waitForTx(await addressesProvider.setPoolAdmin(await getGenesisPoolAdmin(poolConfig)));
      await waitForTx(
        await addressesProvider.setEmergencyAdmin(await getEmergencyAdmin(poolConfig))
      );

      console.log('\tPool Admin:', await addressesProvider.getPoolAdmin());
      console.log('\tEmergency Admin:', await addressesProvider.getEmergencyAdmin());
    } catch (error) {
      if (usingTenderly()) {
        logTenderlyError();
      }
      throw error;
    }
  });
