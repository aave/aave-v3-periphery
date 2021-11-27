import { waitForTx } from '../../helpers/misc-utils';

import { expect } from 'chai';

import { makeSuite } from '../helpers/make-suite';
import { deployAaveIncentivesControllerV2 } from '../../helpers/contracts-accessors';
import { MAX_UINT_AMOUNT, RANDOM_ADDRESSES, ZERO_ADDRESS } from '../../helpers/constants';

makeSuite('AaveIncentivesController misc tests', (testEnv) => {
  it('constructor should assign correct params', async () => {
    const peiEmissionManager = RANDOM_ADDRESSES[1];

    const incentivesControllerV2 = await deployAaveIncentivesControllerV2([peiEmissionManager]);
    await expect((await incentivesControllerV2.EMISSION_MANAGER()).toString()).to.be.equal(
      peiEmissionManager
    );
  });

  it('Should return same index while multiple asset index updates', async () => {
    const {
      aDaiMockV2,
      incentivesControllerV2,
      users,
      stakedAave: { address: reward },
      distributionEnd,
      stakedTokenStrategy,
    } = testEnv;
    await waitForTx(
      await incentivesControllerV2.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          emissionPerSecond: '100',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
          transferStrategyParams: '0x',
        },
      ])
    );
    await waitForTx(await aDaiMockV2.doubleHandleActionOnAic(users[1].address, '2000', '100'));
  });

  it('Should overflow index if passed a large emission', async () => {
    const {
      aDaiMockV2,
      incentivesControllerV2,
      users,
      distributionEnd,
      stakedAave: { address: reward },
      stakedTokenStrategy,
    } = testEnv;
    const MAX_104_UINT = '20282409603651670423947251286015';

    await waitForTx(
      await incentivesControllerV2.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          emissionPerSecond: MAX_104_UINT,
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
          transferStrategyParams: '0x',
        },
      ])
    );
    await expect(
      aDaiMockV2.doubleHandleActionOnAic(users[1].address, '2000', '100')
    ).to.be.revertedWith('Index overflow');
  });

  it('Should claimRewards revert if to argument is ZERO_ADDRESS', async () => {
    const {
      aDaiMockV2,
      users,
      incentivesControllerV2,
      distributionEnd,
      stakedAave: { address: reward },
      stakedTokenStrategy,
    } = testEnv;
    const [userWithRewards] = users;

    await waitForTx(
      await incentivesControllerV2.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          emissionPerSecond: '2000',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
          transferStrategyParams: '0x',
        },
      ])
    );
    await waitForTx(await aDaiMockV2.setUserBalanceAndSupply('300000', '30000'));

    // Claim from third party claimer
    await expect(
      incentivesControllerV2
        .connect(userWithRewards.signer)
        .claimRewards([aDaiMockV2.address], MAX_UINT_AMOUNT, ZERO_ADDRESS, reward)
    ).to.be.revertedWith('INVALID_TO_ADDRESS');
  });
});
