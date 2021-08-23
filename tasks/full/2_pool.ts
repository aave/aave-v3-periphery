import { task } from 'hardhat/config';
import { eContractid, eNetwork } from '../../helpers/types';
import { logTenderlyError, usingTenderly } from '../../helpers/tenderly-utils';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import { loadPoolConfig, ConfigNames } from '../../helpers/configuration';
import {
  getPoolAddressesProvider,
  getPool,
  getPoolConfiguratorProxy,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork, insertContractAddressInDb } from '../../helpers/contracts-helpers';
import {
  deployATokensAndRatesHelper,
  deployPool,
  deployPoolConfigurator,
  deployStableAndVariableTokensHelper,
} from '../../helpers/contracts-deployments';

task('full:deploy-pool', 'Deploy pool')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const addressesProvider = await getPoolAddressesProvider();

      const { Pool, PoolConfigurator } = poolConfig;

      // Reuse/deploy pool implementation
      let poolImplAddress = getParamPerNetwork(Pool, network);
      if (!notFalsyOrZeroAddress(poolImplAddress)) {
        console.log('\tDeploying new pool implementation & libraries...');
        const poolImpl = await deployPool(verify);
        poolImplAddress = poolImpl.address;
        await poolImpl.initialize(addressesProvider.address);
      }
      console.log('\tSetting pool implementation with address:', poolImplAddress);
      // Set pool impl to Address provider
      await waitForTx(await addressesProvider.setPoolImpl(poolImplAddress));

      const address = await addressesProvider.getPool();
      const poolProxy = await getPool(address);

      await insertContractAddressInDb(eContractid.Pool, poolProxy.address);

      // Reuse/deploy pool configurator
      let poolConfiguratorImplAddress = getParamPerNetwork(PoolConfigurator, network); //await deployPoolConfigurator(verify);
      if (!notFalsyOrZeroAddress(poolConfiguratorImplAddress)) {
        console.log('\tDeploying new configurator implementation...');
        const poolConfigurator = await deployPoolConfigurator(verify);
        poolConfiguratorImplAddress = poolConfigurator.address;
      }
      console.log(
        '\tSetting pool configurator implementation with address:',
        poolConfiguratorImplAddress
      );
      // Set pool conf impl to Address Provider
      await waitForTx(await addressesProvider.setPoolConfiguratorImpl(poolConfiguratorImplAddress));

      const poolConfiguratorProxy = await getPoolConfiguratorProxy(
        await addressesProvider.getPoolConfigurator()
      );

      await insertContractAddressInDb(eContractid.PoolConfigurator, poolConfiguratorProxy.address);
      // Deploy deployment helpers
      await deployStableAndVariableTokensHelper(
        [poolProxy.address, addressesProvider.address],
        verify
      );
      await deployATokensAndRatesHelper(
        [poolProxy.address, addressesProvider.address, poolConfiguratorProxy.address],
        verify
      );
    } catch (error) {
      if (usingTenderly()) {
        logTenderlyError();
      }
      throw error;
    }
  });
