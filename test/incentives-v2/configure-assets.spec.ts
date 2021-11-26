import { MAX_UINT_AMOUNT } from './../../helpers/constants';
import { getBlockTimestamp } from './../../helpers/contracts-helpers';
const { expect } = require('chai');

import { makeSuite, TestEnv } from '../helpers/make-suite';
import { increaseTime, waitForTx } from '../../helpers/misc-utils';
import { CompareRules, eventChecker } from '../helpers/comparator-engine';
import { BigNumberish } from '@ethersproject/bignumber';
import {
  getRewardsData,
  RewardData,
  rewardsDataComparator,
  AssetUpdateDataV2,
} from '../DistributionManagerV2/data-helpers/asset-data';

type ScenarioAction = {
  caseName: string;
  customTimeMovement?: number;
  assets: Pick<
    AssetUpdateDataV2,
    'emissionPerSecond' | 'totalStaked' | 'distributionEnd' | 'reward'
  >[];
  compareRules?: CompareRules<AssetUpdateDataV2, RewardData>;
};

makeSuite('AaveIncentivesController V2 configureAssets', (testEnv: TestEnv) => {
  let configureAssetScenarios: ScenarioAction[] = [];
  before(async () => {
    const { stakedAave, rewardToken } = testEnv;
    const time = await getBlockTimestamp();
    configureAssetScenarios = [
      {
        caseName: 'Submit initial config for the assets',
        assets: [
          {
            emissionPerSecond: '11',
            totalStaked: '0',
            distributionEnd: time + 1000 * 60 * 60,
            reward: stakedAave.address,
          },
        ],
        compareRules: {
          fieldsEqualToInput: ['emissionPerSecond', 'distributionEnd'],
        },
      },
      {
        caseName: 'Submit updated config for the assets',
        assets: [
          {
            emissionPerSecond: '33',
            totalStaked: '0',
            distributionEnd: time + 2000 * 60 * 60,
            reward: stakedAave.address,
          },
          {
            emissionPerSecond: '22',
            totalStaked: '0',
            distributionEnd: time + 3000 * 60 * 60,
            reward: rewardToken.address,
          },
        ],
        compareRules: {
          fieldsEqualToInput: ['emissionPerSecond', 'distributionEnd'],
        },
      },
      {
        caseName:
          'Indexes should change if emission are set not to 0, and pool has deposited and borrowed funds',
        assets: [
          {
            emissionPerSecond: '33',
            totalStaked: '100000',
            distributionEnd: time + 2000 * 60 * 60,
            reward: stakedAave.address,
          },
          {
            emissionPerSecond: '22',
            totalStaked: '200000',
            distributionEnd: time + 3000 * 60 * 60,
            reward: rewardToken.address,
          },
        ],
        compareRules: {
          fieldsEqualToInput: ['emissionPerSecond', 'distributionEnd'],
        },
      },
      {
        caseName: 'Indexes should cumulate rewards if next emission is 0',
        assets: [
          {
            emissionPerSecond: '0',
            totalStaked: '100000',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '0',
            totalStaked: '200000',
            reward: rewardToken.address,
            distributionEnd: time + 3000 * 60 * 60,
          },
        ],
        compareRules: {
          fieldsEqualToInput: ['emissionPerSecond'],
        },
      },
      {
        caseName: 'Indexes should not change if no emission',
        assets: [
          {
            emissionPerSecond: '0',
            totalStaked: '100000',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '0',
            totalStaked: '200000',
            reward: rewardToken.address,
            distributionEnd: time + 3000 * 60 * 60,
          },
        ],
        compareRules: {
          fieldsEqualToInput: ['emissionPerSecond'],
        },
      },
      {
        caseName: 'Should go to the limit if distribution ended',
        customTimeMovement: 4000 * 60 * 60,
        assets: [
          {
            emissionPerSecond: '222',
            totalStaked: '213213213213',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '333',
            totalStaked: '313213213213',
            reward: rewardToken.address,
            distributionEnd: time + 3000 * 60 * 60,
          },
        ],
        compareRules: {
          fieldsEqualToInput: ['emissionPerSecond', 'distributionEnd'],
        },
      },
      {
        caseName: 'Should not accrue any rewards after end or distribution',
        customTimeMovement: 1000,
        assets: [
          {
            emissionPerSecond: '222',
            totalStaked: '213213213213',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '333',
            totalStaked: '313213213213',
            reward: rewardToken.address,
            distributionEnd: time + 3000 * 60 * 60,
          },
        ],
        compareRules: {
          fieldsEqualToInput: ['emissionPerSecond', 'distributionEnd'],
        },
      },
    ];
    await asyncTestSuite();
  });

  // custom checks
  it('Tries to submit config updates not from emission manager', async () => {
    const { incentivesControllerV2, users } = testEnv;
    await expect(
      incentivesControllerV2.connect(users[2].signer).configureAssets([])
    ).to.be.revertedWith('ONLY_EMISSION_MANAGER');
  });

  const asyncTestSuite = () => {
    describe('Scenario Tests', () => {
      for (const {
        assets: assetsConfig,
        caseName,
        compareRules,
        customTimeMovement,
      } of configureAssetScenarios) {
        it(caseName, async () => {
          const {
            incentivesControllerV2,
            stakedAave,
            aaveToken,
            rewardToken,
            stakedTokenStrategy,
            pullRewardsStrategy,
            aDaiMockV2,
            aWethMockV2,
          } = testEnv;
          const deployedAssets = [aDaiMockV2, aWethMockV2];

          const rewardStrategy = {
            [stakedAave.address]: stakedTokenStrategy.address,
            [rewardToken.address]: pullRewardsStrategy.address,
          };

          const assets: string[] = [];
          const assetsEmissions: BigNumberish[] = [];
          const assetConfigsUpdate: AssetUpdateDataV2[] = [];

          for (let i = 0; i < assetsConfig.length; i++) {
            const { emissionPerSecond, totalStaked, reward, distributionEnd } = assetsConfig[i];
            if (i > deployedAssets.length) {
              throw new Error('to many assets to test');
            }

            // Change current supply
            await deployedAssets[i].setUserBalanceAndSupply('0', totalStaked);

            // Push configs
            assets.push(deployedAssets[i].address);
            assetsEmissions.push(emissionPerSecond);
            assetConfigsUpdate.push({
              emissionPerSecond,
              totalStaked,
              reward,
              distributionEnd,
              asset: deployedAssets[i].address,
              transferStrategy: rewardStrategy[reward],
              transferStrategyParams: '0x',
            });
          }

          const assetsConfigBefore = await getRewardsData(
            incentivesControllerV2,
            assetConfigsUpdate.map(({ asset }) => asset),
            assetConfigsUpdate.map(({ reward }) => reward)
          );

          if (customTimeMovement) {
            await increaseTime(customTimeMovement);
          }

          // Perform action
          const action = await incentivesControllerV2.configureAssets(assetConfigsUpdate);
          const txReceipt = await waitForTx(action);

          // Assert action output
          const configsUpdateBlockTimestamp = await getBlockTimestamp(txReceipt.blockNumber);
          const assetsConfigAfter = await getRewardsData(
            incentivesControllerV2,
            assetConfigsUpdate.map(({ asset }) => asset),
            assetConfigsUpdate.map(({ reward }) => reward)
          );
          const eventsEmitted = txReceipt.events || [];

          let eventArrayIndex = 0;

          // Check installation events
          for (let i = 0; i < assetsConfigBefore.length; i++) {
            // Check ERC20 approval installHook if stake transfer strategy
            if (assetConfigsUpdate[i].reward == stakedAave.address) {
              // Check Approve 0 amount of AAVE to StakeAave
              await expect(eventsEmitted[0].address).to.equal(aaveToken.address);
              await expect(eventsEmitted[0].data).to.equal(
                '0x0000000000000000000000000000000000000000000000000000000000000000'
              );
              // Check Approve MAX_UINT amount of AAVE to StakeAave
              await expect(eventsEmitted[1].address).to.equal(aaveToken.address);
              await expect(eventsEmitted[1].data).to.equal(
                '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
              );

              eventArrayIndex += 2;
            }

            // Check TransferStrategy installation event
            await expect(action)
              .to.emit(incentivesControllerV2, 'TransferStrategyInstalled')
              .withArgs(assetConfigsUpdate[i].reward, assetConfigsUpdate[i].transferStrategy);
            eventArrayIndex += 1;
          }

          // Check Assets events
          for (let i = 0; i < assetsConfigBefore.length; i++) {
            const assetConfigBefore = assetsConfigBefore[i];
            const assetConfigUpdateInput = assetConfigsUpdate[i];
            const assetConfigAfter = assetsConfigAfter[i];

            // Check AssetIndexUpdate if asset already configured and index moved
            if (!assetConfigAfter.index.eq(assetConfigBefore.index)) {
              await expect(action)
                .to.emit(incentivesControllerV2, 'AssetIndexUpdated')
                .withArgs(
                  assetConfigAfter.underlyingAsset,
                  assetConfigsUpdate[i].reward,
                  assetConfigAfter.index
                );
              eventArrayIndex += 1;
            }

            // Check Asset Configuration
            await expect(action)
              .to.emit(incentivesControllerV2, 'AssetConfigUpdated')
              .withArgs(
                assetConfigAfter.underlyingAsset,
                assetConfigsUpdate[i].reward,
                assetConfigAfter.emissionPerSecond,
                assetConfigAfter.distributionEnd
              );

            eventArrayIndex += 1;

            await rewardsDataComparator(
              assetConfigUpdateInput,
              assetConfigBefore,
              assetConfigAfter,
              configsUpdateBlockTimestamp,
              compareRules || {}
            );
          }
          expect(eventsEmitted[eventArrayIndex]).to.be.equal(undefined, 'Too many events emitted');
        });
      }
    });
  };
});
