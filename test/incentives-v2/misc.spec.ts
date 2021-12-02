import { IncentivesControllerV2 } from './../../types/IncentivesControllerV2.d';
import { waitForTx, MAX_UINT_AMOUNT, ZERO_ADDRESS } from '@aave/deploy-v3';
import { expect } from 'chai';
import { makeSuite } from '../helpers/make-suite';
import { RANDOM_ADDRESSES } from '../helpers/constants';
import hre from 'hardhat';

makeSuite('AaveIncentivesController misc tests', (testEnv) => {
  it('constructor should assign correct params', async () => {
    const peiEmissionManager = RANDOM_ADDRESSES[1];
    const { deployer } = await hre.getNamedAccounts();

    if (process.env.COVERAGE === 'true') {
      console.log('Skip due coverage loss of data');
      return;
    }
    const artifact = await hre.deployments.deploy('IncentivesControllerV2', {
      from: deployer,
      args: [peiEmissionManager],
    });
    const incentivesControllerV2 = (await hre.ethers.getContractAt(
      artifact.abi,
      artifact.address
    )) as IncentivesControllerV2;
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
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: '100',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
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
    const MAX_88_UINT = '309485009821345068724781055';

    await waitForTx(
      await incentivesControllerV2.configureAssets([
        {
          asset: aDaiMockV2.address,
          reward,
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: MAX_88_UINT,
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
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
          rewardOracle: testEnv.aavePriceAggregator,
          emissionPerSecond: '2000',
          distributionEnd,
          totalSupply: '0',
          transferStrategy: stakedTokenStrategy.address,
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
