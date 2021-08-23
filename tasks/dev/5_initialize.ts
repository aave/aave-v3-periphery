import { task } from 'hardhat/config';
import { eNetwork } from '../../helpers/types';
import { ZERO_ADDRESS } from '../../helpers/constants';
import { filterMapBy } from '../../helpers/misc-utils';
import { tEthereumAddress, AavePools, eContractid } from '../../helpers/types';
import {
  ConfigNames,
  getReservesConfigByPool,
  getTreasuryAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import {
  deployMockFlashLoanReceiver,
  deployAaveProtocolDataProvider,
} from '../../helpers/contracts-deployments';
import { getAllTokenAddresses } from '../../helpers/mock-helpers';
import { insertContractAddressInDb } from '../../helpers/contracts-helpers';
import { getAllMockedTokens, getPoolAddressesProvider } from '../../helpers/contracts-getters';

task('dev:initialize-pool', 'Initialize pool configuration.')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run('set-DRE');
    const network = <eNetwork>localBRE.network.name;
    const poolConfig = loadPoolConfig(pool);
    const {
      ATokenNamePrefix,
      StableDebtTokenNamePrefix,
      VariableDebtTokenNamePrefix,
      SymbolPrefix,
    } = poolConfig;
    const mockTokens = await getAllMockedTokens();
    const allTokenAddresses = getAllTokenAddresses(mockTokens);

    const addressesProvider = await getPoolAddressesProvider();

    const protoPoolReservesAddresses = <{ [symbol: string]: tEthereumAddress }>(
      filterMapBy(allTokenAddresses, (key: string) => !key.includes('UNI_'))
    );

    const testHelpers = await deployAaveProtocolDataProvider(addressesProvider.address, verify);

    const reservesParams = getReservesConfigByPool(AavePools.proto);

    const admin = await addressesProvider.getPoolAdmin();

    const treasuryAddress = await getTreasuryAddress(poolConfig);

    await initReservesByHelper(
      reservesParams,
      protoPoolReservesAddresses,
      ATokenNamePrefix,
      StableDebtTokenNamePrefix,
      VariableDebtTokenNamePrefix,
      SymbolPrefix,
      admin,
      treasuryAddress,
      ZERO_ADDRESS,
      verify
    );
    await configureReservesByHelper(reservesParams, protoPoolReservesAddresses, testHelpers, admin);

    const mockFlashLoanReceiver = await deployMockFlashLoanReceiver(
      addressesProvider.address,
      verify
    );
    await insertContractAddressInDb(
      eContractid.MockFlashLoanReceiver,
      mockFlashLoanReceiver.address
    );

    await insertContractAddressInDb(eContractid.AaveProtocolDataProvider, testHelpers.address);
  });
