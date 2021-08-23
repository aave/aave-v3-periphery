import { task } from 'hardhat/config';
import {
  deployPoolAddressesProvider,
  deployPoolAddressesProviderRegistry,
} from '../../helpers/contracts-deployments';
import { waitForTx } from '../../helpers/misc-utils';
import { getFirstSigner } from '../../helpers/wallet-helpers';
import { AaveConfig } from '../../markets/aave';

task(
  'dev:deploy-address-provider',
  'Deploy address provider, registry and fee provider for dev environment'
)
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');

    const admin = await (await getFirstSigner()).getAddress();

    const addressesProvider = await deployPoolAddressesProvider(AaveConfig.MarketId, verify);
    await waitForTx(await addressesProvider.setPoolAdmin(admin));
    await waitForTx(await addressesProvider.setEmergencyAdmin(admin));

    const addressesProviderRegistry = await deployPoolAddressesProviderRegistry(verify);
    await waitForTx(
      await addressesProviderRegistry.registerAddressesProvider(addressesProvider.address, 1)
    );
  });
