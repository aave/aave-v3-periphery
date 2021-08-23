import { task } from 'hardhat/config';
import { loadPoolConfig, ConfigNames, getTreasuryAddress } from '../../helpers/configuration';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';
import { waitForTx } from '../../helpers/misc-utils';
import { logTenderlyError, usingTenderly } from '../../helpers/tenderly-utils';
import { initReservesByHelper, configureReservesByHelper } from '../../helpers/init-helpers';
import {
  getAaveProtocolDataProvider,
  getPoolAddressesProvider,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';

task('full:initialize-pool', 'Initialize pool configuration.')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const {
        ATokenNamePrefix,
        StableDebtTokenNamePrefix,
        VariableDebtTokenNamePrefix,
        SymbolPrefix,
        ReserveAssets,
        ReservesConfig,
        IncentivesController,
      } = poolConfig as ICommonConfiguration;

      const reserveAssets = await getParamPerNetwork(ReserveAssets, network);
      const incentivesController = await getParamPerNetwork(IncentivesController, network);
      const addressesProvider = await getPoolAddressesProvider();

      const testHelpers = await getAaveProtocolDataProvider();

      const admin = await addressesProvider.getPoolAdmin();
      if (!reserveAssets) {
        throw 'Reserve assets is undefined. Check ReserveAssets configuration at config directory';
      }

      const treasuryAddress = await getTreasuryAddress(poolConfig);

      await initReservesByHelper(
        ReservesConfig,
        reserveAssets,
        ATokenNamePrefix,
        StableDebtTokenNamePrefix,
        VariableDebtTokenNamePrefix,
        SymbolPrefix,
        admin,
        treasuryAddress,
        incentivesController,
        verify
      );
      await configureReservesByHelper(ReservesConfig, reserveAssets, testHelpers, admin);

      console.log('\tSetting AaveProtocolDataProvider at AddressesProvider at id: 0x01');
      const aaveProtocolDataProvider = await getAaveProtocolDataProvider();
      await waitForTx(
        await addressesProvider.setAddress(
          '0x0100000000000000000000000000000000000000000000000000000000000000',
          aaveProtocolDataProvider.address
        )
      );
    } catch (error) {
      if (usingTenderly()) {
        logTenderlyError();
      }
      throw error;
    }
  });
