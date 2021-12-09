import { IncentivesControllerV2 } from './../../types/IncentivesControllerV2.d';
import hre from 'hardhat';
import { getBlockTimestamp, increaseTime, waitForTx } from '@aave/deploy-v3';
import { BigNumberish } from 'ethers';
import { makeSuite, TestEnv } from '../helpers/make-suite';
import { CompareRules } from './helpers/comparator-engine';
import {
  AssetUpdateDataV2,
  RewardData,
  getRewardsData,
  rewardsDataComparator,
} from './helpers/DistributionManagerV2/data-helpers/asset-data';
const { expect } = require('chai');

type ScenarioAction = {
  caseName: string;
  customTimeMovement?: number;
  assets: Pick<
    AssetUpdateDataV2,
    'emissionPerSecond' | 'totalSupply' | 'distributionEnd' | 'reward'
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
            totalSupply: '0',
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
            totalSupply: '0',
            distributionEnd: time + 2000 * 60 * 60,
            reward: stakedAave.address,
          },
          {
            emissionPerSecond: '22',
            totalSupply: '0',
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
            totalSupply: '100000',
            distributionEnd: time + 2000 * 60 * 60,
            reward: stakedAave.address,
          },
          {
            emissionPerSecond: '22',
            totalSupply: '200000',
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
            totalSupply: '100000',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '0',
            totalSupply: '200000',
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
            totalSupply: '100000',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '0',
            totalSupply: '200000',
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
            totalSupply: '213213213213',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '333',
            totalSupply: '313213213213',
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
            totalSupply: '213213213213',
            reward: stakedAave.address,
            distributionEnd: time + 2000 * 60 * 60,
          },
          {
            emissionPerSecond: '333',
            totalSupply: '313213213213',
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
            const { emissionPerSecond, totalSupply, reward, distributionEnd } = assetsConfig[i];
            if (i > deployedAssets.length) {
              throw new Error('to many assets to test');
            }

            // Change current supply
            await waitForTx(await deployedAssets[i].setUserBalanceAndSupply('0', totalSupply));

            // Push configs
            assets.push(deployedAssets[i].address);
            assetsEmissions.push(emissionPerSecond);
            assetConfigsUpdate.push({
              emissionPerSecond,
              totalSupply,
              reward,
              rewardOracle: testEnv.aavePriceAggregator,
              distributionEnd,
              asset: deployedAssets[i].address,
              transferStrategy: rewardStrategy[reward],
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
          const allRewards = await incentivesControllerV2.getRewardsList();
          const configsUpdateBlockTimestamp = await getBlockTimestamp(txReceipt.blockNumber);
          const assetsConfigAfter = await getRewardsData(
            incentivesControllerV2,
            assetConfigsUpdate.map(({ asset }) => asset),
            assetConfigsUpdate.map(({ reward }) => reward)
          );
          const eventsEmitted = txReceipt.events || [];

          let eventArrayIndex = 0;

          expect(allRewards.length).to.gte(0);
          expect(allRewards).to.have.members(assetConfigsUpdate.map(({ reward }) => reward));
          // Check installation events
          for (let i = 0; i < assetsConfigBefore.length; i++) {
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

            const rewardsList = await incentivesControllerV2.getRewardsByAsset(
              assetConfigUpdateInput.asset
            );
            expect(rewardsList.length).to.gte(0);
            expect(rewardsList).to.include(assetConfigUpdateInput.reward);
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
            await expect(
              await incentivesControllerV2.getDistributionEnd(
                assetConfigAfter.underlyingAsset,
                assetConfigsUpdate[i].reward
              )
            ).to.be.eq(assetsConfig[i].distributionEnd);

            await expect(action)
              .to.emit(incentivesControllerV2, 'AssetConfigUpdated')
              .withArgs(
                assetConfigAfter.underlyingAsset,
                assetConfigsUpdate[i].reward,
                assetConfigAfter.emissionPerSecond,
                assetConfigAfter.distributionEnd
              );

            eventArrayIndex += 1;

            await expect(action)
              .to.emit(incentivesControllerV2, 'RewardOracleUpdated')
              .withArgs(assetConfigsUpdate[i].reward, assetConfigsUpdate[i].rewardOracle);

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

          // Check Rewards config
          for (let i = 0; i < allRewards.length; i++) {
            const contractReward = allRewards[i];
            const oracle = await incentivesControllerV2.getRewardOracle(allRewards[i]);
            const strategy = await incentivesControllerV2.getTransferStrategy(allRewards[i]);

            expect(oracle).to.be.eq(testEnv.aavePriceAggregator);
            expect(strategy).to.be.eq(rewardStrategy[contractReward]);
          }
        });
      }
    });
  };
});
