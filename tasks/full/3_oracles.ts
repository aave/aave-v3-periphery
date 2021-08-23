import { task } from 'hardhat/config';
import { ethers } from 'ethers';
import { ICommonConfiguration, eNetwork, SymbolMap } from '../../helpers/types';
import { waitForTx, notFalsyOrZeroAddress } from '../../helpers/misc-utils';
import { logTenderlyError, usingTenderly } from '../../helpers/tenderly-utils';
import {
  ConfigNames,
  loadPoolConfig,
  getWethAddress,
  getGenesisPoolAdmin,
  getRateOracles,
} from '../../helpers/configuration';
import {
  getPoolAddressesProvider,
  getPairsTokenAggregator,
  getAaveOracle,
  getRateOracle,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { deployAaveOracle, deployRateOracle } from '../../helpers/contracts-deployments';
import { setInitialMarketRatesInRatesOracleByHelper } from '../../helpers/oracles-helpers';

import { AaveOracle, RateOracle } from '@aave/core-v3/types';

task('full:deploy-oracles', 'Deploy oracles')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const {
        ProtocolGlobalParams: { UsdAddress },
        ReserveAssets,
        FallbackOracle,
        ChainlinkAggregator,
      } = poolConfig as ICommonConfiguration;
      const rateOracles = getRateOracles(poolConfig);
      const addressesProvider = await getPoolAddressesProvider();
      const admin = await getGenesisPoolAdmin(poolConfig);
      const aaveOracleAddress = getParamPerNetwork(poolConfig.AaveOracle, network);
      const rateOracleAddressmockPool = getParamPerNetwork(poolConfig.RateOracle, network);
      const fallbackOracleAddress = await getParamPerNetwork(FallbackOracle, network);
      const reserveAssets = await getParamPerNetwork(ReserveAssets, network);
      const chainlinkAggregators = await getParamPerNetwork(ChainlinkAggregator, network);

      const tokensToWatch: SymbolMap<string> = {
        ...reserveAssets,
        USD: UsdAddress,
      };
      const [tokens, aggregators] = getPairsTokenAggregator(tokensToWatch, chainlinkAggregators);

      let aaveOracle: AaveOracle;
      let rateOracle: RateOracle;

      if (notFalsyOrZeroAddress(aaveOracleAddress)) {
        aaveOracle = await getAaveOracle(aaveOracleAddress);
      } else {
        aaveOracle = await deployAaveOracle(
          [
            tokens,
            aggregators,
            fallbackOracleAddress,
            await getWethAddress(poolConfig),
            ethers.constants.WeiPerEther.toString(),
          ],
          verify
        );
        await waitForTx(await aaveOracle.setAssetSources(tokens, aggregators));
      }

      if (notFalsyOrZeroAddress(rateOracleAddressmockPool)) {
        rateOracle = await getRateOracle(rateOracleAddressmockPool);
      } else {
        rateOracle = await deployRateOracle(verify);
        const { USD, ...tokensAddressesWithoutUsd } = tokensToWatch;
        await setInitialMarketRatesInRatesOracleByHelper(
          rateOracles,
          tokensAddressesWithoutUsd,
          rateOracle,
          admin
        );
      }

      console.log('\tAave Oracle:', rateOracle.address);
      console.log('\tRate Oracle:', rateOracle.address);

      // Register the proxy price provider on the addressesProvider
      await waitForTx(await addressesProvider.setPriceOracle(aaveOracle.address));
      await waitForTx(await addressesProvider.setRateOracle(rateOracle.address));
    } catch (error) {
      if (usingTenderly()) {
        logTenderlyError();
      }
      throw error;
    }
  });
