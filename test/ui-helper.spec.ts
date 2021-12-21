import {
  getMintableERC20,
  getSubTokensByPrefix,
  TESTNET_TOKEN_PREFIX,
  waitForTx,
  MAX_UINT_AMOUNT,
  increaseTime,
} from '@aave/deploy-v3';
import { UiIncentiveDataProviderV3 } from './../types/UiIncentiveDataProviderV3';
import hre from 'hardhat';
import { makeSuite } from './helpers/make-suite';
import { BigNumber } from 'ethers';
import util from 'util';

const debugLog = (methodName: string, response: any) => {
  if (process.env.UI_TEST_DEBUG === 'true') {
    console.log('Method: ', methodName);
    console.log(util.inspect(response, false, null, true));
  }
};

makeSuite('UI Incentives Helper', (testEnv) => {
  let uiHelper: UiIncentiveDataProviderV3;

  before(async () => {
    const { deployer: from } = await hre.getNamedAccounts();
    const {
      pool,
      users: [user1],
    } = testEnv;
    // Deploy UI Helper
    const artifact = await hre.deployments.deploy('UiIncentiveDataProviderV3', { from, args: [] });
    uiHelper = await hre.ethers.getContractAt('UiIncentiveDataProviderV3', artifact.address);

    // Deposit
    const [reserve] = await getSubTokensByPrefix(TESTNET_TOKEN_PREFIX);
    const reserveToken = (await getMintableERC20(reserve.artifact.address)).connect(user1.signer);
    const depositAmount = BigNumber.from('100000000');
    await waitForTx(
      await reserveToken['mint(address,uint256)'](user1.address, depositAmount.mul(2))
    );
    await waitForTx(await reserveToken.approve(pool.address, MAX_UINT_AMOUNT));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .deposit(reserve.artifact.address, depositAmount, user1.address, '0')
    );
    await increaseTime(3000);
    await waitForTx(
      await pool
        .connect(user1.signer)
        .deposit(reserve.artifact.address, depositAmount, user1.address, '0')
    );
  });

  it('Call "getReservesIncentivesData"', async () => {
    const { addressesProvider } = testEnv;
    const response = await uiHelper.getReservesIncentivesData(addressesProvider.address, {
      gasLimit: '12000000',
    });
    debugLog('getReservesIncentivesData', response);
  });

  it('Call "getFullReservesIncentiveData"', async () => {
    const {
      addressesProvider,
      users: [user1],
    } = testEnv;
    const response = await uiHelper.getFullReservesIncentiveData(
      addressesProvider.address,
      user1.address,
      {
        gasLimit: '12000000',
      }
    );
    debugLog('getFullReservesIncentiveData', response);
  });

  it('Call "getUserReservesIncentivesData"', async () => {
    const {
      addressesProvider,

      users: [user1],
    } = testEnv;
    const response = await uiHelper.getUserReservesIncentivesData(
      addressesProvider.address,
      user1.address,
      {
        gasLimit: '12000000',
      }
    );
    debugLog('getUserReservesIncentivesData', response);
  });
});
