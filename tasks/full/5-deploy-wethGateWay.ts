import { task } from 'hardhat/config';
import {
  loadPoolConfig,
  ConfigNames,
  getWrappedNativeTokenAddress,
} from '../../helpers/configuration';
import { deployWETHGateway } from '../../helpers/contracts-deployments';
import { logTenderlyError, usingTenderly } from '../../helpers/tenderly-utils';

task(`full-deploy-weth-gateway`, `Deploy the WETHGateway contract`)
  .addFlag('verify', `Verify WETHGateway contract via Etherscan API.`)
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const poolConfig = loadPoolConfig(pool);
      const Weth = await getWrappedNativeTokenAddress(poolConfig);
      const wethGateWay = await deployWETHGateway([Weth], verify);
      console.log(`\tWETHGateway:`, wethGateWay.address);
    } catch (error) {
      if (usingTenderly()) {
        logTenderlyError();
      }
      throw error;
    }
  });
