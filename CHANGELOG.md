# Changelog

## [1.20.2](https://github.com/aave/aave-v3-periphery/compare/v1.20.1...v1.20.2) (2022-11-17)


### Miscellaneous Chores

* release 1.20.2 ([28ec2ad](https://github.com/aave/aave-v3-periphery/commit/28ec2adb46d0230265192b3dc86e64c62cea935f))

## [1.20.1](https://github.com/aave/aave-v3-periphery/compare/v1.20.0...v1.20.1) (2022-11-09)


### Bug Fixes

* Add already accrued rewards ([4dcac4f](https://github.com/aave/aave-v3-periphery/commit/4dcac4f418c515ec59d568f8c4e18644e80cc156))

## [1.20.0](https://github.com/aave/aave-v3-periphery/compare/v1.19.2...v1.20.0) (2022-10-21)


### Features

* Add ability to specify collector ([79c2377](https://github.com/aave/aave-v3-periphery/commit/79c23779a567b95110020fa5a9d0d9d938f2d6b8))
* Add Treasury Controller contract ([8a536b6](https://github.com/aave/aave-v3-periphery/commit/8a536b67f08f840ab1134a3fdeccd842cb67b27e))


### Bug Fixes

* Adjust treasury contracts to reflect mainnet deployment ([e0580a8](https://github.com/aave/aave-v3-periphery/commit/e0580a81a83fa4e217b9f18a891e58c63deb1f3b))
* Fix README docs ([abd7465](https://github.com/aave/aave-v3-periphery/commit/abd7465a83cde8133083d10b0aa8f8f1a1445441))
* Fix version of aave-deploy ([e946268](https://github.com/aave/aave-v3-periphery/commit/e9462689046bee725c002d710565b0a999614137))
* Move ecosystem contracts to treasury folder ([e84c6a4](https://github.com/aave/aave-v3-periphery/commit/e84c6a4bed4b69727f6f22611b6c2e6ffc907e44))
* Remove unused sol compiler from hh config ([5d7574e](https://github.com/aave/aave-v3-periphery/commit/5d7574e2326c0151176c9ecfced6466ff24e9c8b))

## [1.19.2](https://github.com/aave/aave-v3-periphery/compare/v1.10.0...v1.19.2) (2022-08-03)


### Features

* adapted paraswap liquidity swap tests for Aave V3 ([d00379d](https://github.com/aave/aave-v3-periphery/commit/d00379d5d72ba043eb25b3b94fa33f5de04ee221))
* add Collector implementation and controller ([56a39c2](https://github.com/aave/aave-v3-periphery/commit/56a39c2daf502ffe3da36072ffdfd8e73d8b47b9))
* Add emission manager contract ([abcb674](https://github.com/aave/aave-v3-periphery/commit/abcb6746557efc214462b0c7bdbe0bacdf775eaf))
* Add owner constructor parameter to EmissionManager contract to support CREATE2 factory deployments ([a36fc32](https://github.com/aave/aave-v3-periphery/commit/a36fc32437eee04da125e5f467231eb99354923e))
* add owner constructor parameters to contracts that inherit Ownable. ([a3fcaff](https://github.com/aave/aave-v3-periphery/commit/a3fcaff5377c427f8ae0941fa77357aab9e95a5a))
* Add previousEmissionManager event parameter and remove zero address check ([b0c18a2](https://github.com/aave/aave-v3-periphery/commit/b0c18a2d681b5384d790ad721566b112e67a10c9))
* Add setEmissionsPerSecond function in Rewards contract ([8cbacf5](https://github.com/aave/aave-v3-periphery/commit/8cbacf5370db433ab6e0435610194f9238108a6b))
* add siloed flag to reserve response ([090d201](https://github.com/aave/aave-v3-periphery/commit/090d2017f1a5c682b3b4fc1e97a4b8b523ef15b8))
* added base rates ([b04d26e](https://github.com/aave/aave-v3-periphery/commit/b04d26e91cb8d795ccd75eba44fc0f350180debf))
* Added beta deploy package. Fix test that hangs due multiple deployments. ([444139a](https://github.com/aave/aave-v3-periphery/commit/444139af5f216d9946c90ac833be4839749e9bc6))
* added new fields for client calculations ([499c5dc](https://github.com/aave/aave-v3-periphery/commit/499c5dcc996f4998aa1a0636c8d3106598fb45b0))
* Allow Emission Manager owner of RewardsController to be mutable by current admin ([902e524](https://github.com/aave/aave-v3-periphery/commit/902e524e2740199fa594885863d6a5a94c441272))
* Emit old and new values when updating asset reward distribution ([e786427](https://github.com/aave/aave-v3-periphery/commit/e78642755ee7284eda1745c10fa2bca15e195995))
* initial commit ([a428051](https://github.com/aave/aave-v3-periphery/commit/a4280519dbb48e176f277b117046bda55097ec89))
* port Paraswap Repay Adapter from Aave V2 to Aave V3, add tests ([d1887a8](https://github.com/aave/aave-v3-periphery/commit/d1887a8e90b0d59ba98c27102045cd287e341ddf))
* removed duplicated import ([cb2eba8](https://github.com/aave/aave-v3-periphery/commit/cb2eba824811322f6db12b09fd2cb149bd9d1b90))
* rename script release please origin ([a87dd68](https://github.com/aave/aave-v3-periphery/commit/a87dd688a567540151fb0db8ec5f09399a523d5a))
* use latest aave@deploy-v3 and aave@core-v3 package, use the Test market at tests ([4b3a8f4](https://github.com/aave/aave-v3-periphery/commit/4b3a8f488e3520d85093a908ea898e845e16cbc3))
* use simple flash loan ([e715175](https://github.com/aave/aave-v3-periphery/commit/e715175c899f95dcde98099965aad2fabdbdc1f2))


### Bug Fixes

* Add clean ups to UIIncentiveDataProvider and PoolDataProvider ([4d80e42](https://github.com/aave/aave-v3-periphery/commit/4d80e425ab301d8e9573f8457a1cf534314ec957))
* Add missing docs to modifier ([ad663df](https://github.com/aave/aave-v3-periphery/commit/ad663df941f8b675aea16658ca6f7ae8e0465c1b))
* add name to response ([78a976f](https://github.com/aave/aave-v3-periphery/commit/78a976f519845e6dd5e1e52649df9f1659013206))
* add value to struct ([5ab18b5](https://github.com/aave/aave-v3-periphery/commit/5ab18b5bca1d7247d63ac01c41a09d235a5e5067))
* added proper overflows check ([e4eb148](https://github.com/aave/aave-v3-periphery/commit/e4eb14832160a90958f821e2afad1d50fe814425))
* assign variable to stack to deep ([8f2b68b](https://github.com/aave/aave-v3-periphery/commit/8f2b68b452a19197c0b6664598f1f7a940b958c7))
* Cache rewardList length in claimAllRewards function ([be71bc8](https://github.com/aave/aave-v3-periphery/commit/be71bc810ff9bb572c8d808cdb5745b5fc74087e))
* Fix docs ([7b0b0fd](https://github.com/aave/aave-v3-periphery/commit/7b0b0fdffb5f6305be865576edf3e20c0d12d8c6))
* Fix docs ([70e1c0f](https://github.com/aave/aave-v3-periphery/commit/70e1c0f3c5ec71dd7195f0a287e8b0cfc2327ae5))
* Fix docs ([3751fcf](https://github.com/aave/aave-v3-periphery/commit/3751fcfbdc9bcf1e7e2de22e9614bc5faaefce27))
* Fix docstring and function param of setEmissionPerSecond ([080648c](https://github.com/aave/aave-v3-periphery/commit/080648ca502150828424a59efda0c9222a603d1e))
* Fix docstrings in Rewards contracts ([3ee0184](https://github.com/aave/aave-v3-periphery/commit/3ee01840b6f3bfb306850b9f7163369f487195b9))
* Fix EmissionManagerUpdated event docstring ([49fe12b](https://github.com/aave/aave-v3-periphery/commit/49fe12b61b6633444d4522ad66c357f4d41fe5c9))
* Fix EmissionManagerUpdated event docstring ([6e0ae79](https://github.com/aave/aave-v3-periphery/commit/6e0ae79ad5446fc1c21be703d6f68c50fad18e78))
* Fix function docstrings ([bb2a3af](https://github.com/aave/aave-v3-periphery/commit/bb2a3afef5a790218171b17780ab7d917111d986))
* Fix logic of setEmissionsPerSecond function ([45f8030](https://github.com/aave/aave-v3-periphery/commit/45f8030b1976b587c4fa3c0a7fd4fb1d2c80ed8e))
* fix tests for executeOperation ([2f98828](https://github.com/aave/aave-v3-periphery/commit/2f98828abb3832886ec14d7651a437137c93bbec))
* Fix the emission of old values in AssetConfigUpdate ([faf8cdc](https://github.com/aave/aave-v3-periphery/commit/faf8cdc05438d41531833c184426679b037597a4))
* Fix typo in docstring ([a343d47](https://github.com/aave/aave-v3-periphery/commit/a343d47fbb51be32358a6a243b3efa0e94df639b))
* fixed revert messages ([57e6906](https://github.com/aave/aave-v3-periphery/commit/57e690686208911b86fa911aa13b7ccb41543125))
* fixed syntax error coming from merge ([8c26b9d](https://github.com/aave/aave-v3-periphery/commit/8c26b9d31063d46f3b5e49d25339e7414c39c68a))
* fixed wrong calculations in claimRewards ([5b81da2](https://github.com/aave/aave-v3-periphery/commit/5b81da20c15380171a831a91313ceb7821195e7a))
* Make emission manager variables internal ([37966a1](https://github.com/aave/aave-v3-periphery/commit/37966a15965941efe872d1ce2ab0555674214b2d))
* npm test script ([496092b](https://github.com/aave/aave-v3-periphery/commit/496092b09b3c7d507093f6df06cd2046eef96025))
* Optimize logic of setEmissionPerSecond ([9bd97e2](https://github.com/aave/aave-v3-periphery/commit/9bd97e20f3422e6703d9392c18b9ec8d764cb18e))
* package-lock ([068ba75](https://github.com/aave/aave-v3-periphery/commit/068ba754fb68df080d30dce25755b7c64d01fb04))
* Refactor indexUpdated flag in updateRewardData function ([d6584d7](https://github.com/aave/aave-v3-periphery/commit/d6584d723186d46757fbd8e263d5607abbabc838))
* Remove test case of ZERO new emissionManager ([837c949](https://github.com/aave/aave-v3-periphery/commit/837c9494c947b7b3dbf80812c1f3dccacdc2a8f2))
* remove typo ([70dd011](https://github.com/aave/aave-v3-periphery/commit/70dd011d5661c6f22dda968bca8b06587ddc82d2))
* Remove unnecessary import in IRewardsDistributor ([b7951bb](https://github.com/aave/aave-v3-periphery/commit/b7951bb4de7f20116c3f823c34945774c3f8727f))
* Remove unneeded events in Rewards ([5634fb1](https://github.com/aave/aave-v3-periphery/commit/5634fb151fa1a77017395ad5ff41068548ade490))
* Rename _getUserBalances to _getUserAssetBalances ([bc5d1be](https://github.com/aave/aave-v3-periphery/commit/bc5d1be2a7c36a249eed4277a008a562eae78345))
* Rename DataTypes lib to RewardsDataTypes to avoid name clashing ([85aee46](https://github.com/aave/aave-v3-periphery/commit/85aee46132a8073527694d809af2c16018de0b15))
* Rename function getUserAssetData by getUserDataIndex ([353366f](https://github.com/aave/aave-v3-periphery/commit/353366ffde5b306a81cd26f8e0f04af0697144c9))
* Rename getUserRewardsBalance function by getUserRewards ([66ed861](https://github.com/aave/aave-v3-periphery/commit/66ed86194e1293a3468a04d78d5fd47dd6ab9eda))
* Rename getUserUnclaimedRewards fn by getUserAccruedRewards ([9332f3c](https://github.com/aave/aave-v3-periphery/commit/9332f3c236c75d32ed8182625b59d49493020994))
* Rename lendingPool to pool in UiProvider contract ([2e50d3f](https://github.com/aave/aave-v3-periphery/commit/2e50d3f57bd0ccc4d2649ec8c7b36770158829ee))
* Rename principalUserBalance variable to userBalance ([c4a77a9](https://github.com/aave/aave-v3-periphery/commit/c4a77a9acef5a4ce652df60d7aabe765cc732b21))
* Rename UserAssetStatsInput struct to UserAssetBalance in Rewards ([3194c8a](https://github.com/aave/aave-v3-periphery/commit/3194c8a076afa1b194b6740f1665ec9ebde78b74))
* rollback to 1.9.1 ([1f256db](https://github.com/aave/aave-v3-periphery/commit/1f256db71ef46a2aaca43a14e268deced07e3579))
* Update tests to check emission of old values in events ([07c1879](https://github.com/aave/aave-v3-periphery/commit/07c1879ec93b1e59b0e8f61f7d14761edaa39b5f))
* use simple receiver ([3aa2b26](https://github.com/aave/aave-v3-periphery/commit/3aa2b266850c46f861b77dbbaffd1c67b422124a))


### Miscellaneous Chores

* release 1.10.0 ([6b27d2f](https://github.com/aave/aave-v3-periphery/commit/6b27d2f5721db4d2a9caa6bda9e8ca5e3136c22f))
* release 1.11.0 ([a4dee72](https://github.com/aave/aave-v3-periphery/commit/a4dee72c618c0512ed2bf2e6902c7b27e520f767))
* release 1.11.1 ([701fede](https://github.com/aave/aave-v3-periphery/commit/701fedeb9430385f6e7e3d275eba221782361040))
* release 1.18.0 ([63c4695](https://github.com/aave/aave-v3-periphery/commit/63c4695a2d4ce4a12c2aaf9b3fce4b998abf0203))
* release 1.19.2 ([007621c](https://github.com/aave/aave-v3-periphery/commit/007621cced60cd9bb7062ab5dafee3c33959150b))
* release 1.9.0 ([3856ca6](https://github.com/aave/aave-v3-periphery/commit/3856ca69c84ddcf27e957ae1e5f0eb0e01047f4e))
* release 1.9.1 ([834f1c7](https://github.com/aave/aave-v3-periphery/commit/834f1c7eb9a78e05a9117dc7bc94b8c8b413bff8))

## [1.10.0](https://github.com/aave/aave-v3-periphery/compare/v1.10.0...v1.10.0) (2022-08-03)


### Features

* adapted paraswap liquidity swap tests for Aave V3 ([d00379d](https://github.com/aave/aave-v3-periphery/commit/d00379d5d72ba043eb25b3b94fa33f5de04ee221))
* add Collector implementation and controller ([56a39c2](https://github.com/aave/aave-v3-periphery/commit/56a39c2daf502ffe3da36072ffdfd8e73d8b47b9))
* Add emission manager contract ([abcb674](https://github.com/aave/aave-v3-periphery/commit/abcb6746557efc214462b0c7bdbe0bacdf775eaf))
* Add owner constructor parameter to EmissionManager contract to support CREATE2 factory deployments ([a36fc32](https://github.com/aave/aave-v3-periphery/commit/a36fc32437eee04da125e5f467231eb99354923e))
* add owner constructor parameters to contracts that inherit Ownable. ([a3fcaff](https://github.com/aave/aave-v3-periphery/commit/a3fcaff5377c427f8ae0941fa77357aab9e95a5a))
* Add previousEmissionManager event parameter and remove zero address check ([b0c18a2](https://github.com/aave/aave-v3-periphery/commit/b0c18a2d681b5384d790ad721566b112e67a10c9))
* Add setEmissionsPerSecond function in Rewards contract ([8cbacf5](https://github.com/aave/aave-v3-periphery/commit/8cbacf5370db433ab6e0435610194f9238108a6b))
* add siloed flag to reserve response ([090d201](https://github.com/aave/aave-v3-periphery/commit/090d2017f1a5c682b3b4fc1e97a4b8b523ef15b8))
* added base rates ([b04d26e](https://github.com/aave/aave-v3-periphery/commit/b04d26e91cb8d795ccd75eba44fc0f350180debf))
* Added beta deploy package. Fix test that hangs due multiple deployments. ([444139a](https://github.com/aave/aave-v3-periphery/commit/444139af5f216d9946c90ac833be4839749e9bc6))
* added new fields for client calculations ([499c5dc](https://github.com/aave/aave-v3-periphery/commit/499c5dcc996f4998aa1a0636c8d3106598fb45b0))
* Allow Emission Manager owner of RewardsController to be mutable by current admin ([902e524](https://github.com/aave/aave-v3-periphery/commit/902e524e2740199fa594885863d6a5a94c441272))
* Emit old and new values when updating asset reward distribution ([e786427](https://github.com/aave/aave-v3-periphery/commit/e78642755ee7284eda1745c10fa2bca15e195995))
* initial commit ([a428051](https://github.com/aave/aave-v3-periphery/commit/a4280519dbb48e176f277b117046bda55097ec89))
* port Paraswap Repay Adapter from Aave V2 to Aave V3, add tests ([d1887a8](https://github.com/aave/aave-v3-periphery/commit/d1887a8e90b0d59ba98c27102045cd287e341ddf))
* removed duplicated import ([cb2eba8](https://github.com/aave/aave-v3-periphery/commit/cb2eba824811322f6db12b09fd2cb149bd9d1b90))
* rename script release please origin ([a87dd68](https://github.com/aave/aave-v3-periphery/commit/a87dd688a567540151fb0db8ec5f09399a523d5a))
* use latest aave@deploy-v3 and aave@core-v3 package, use the Test market at tests ([4b3a8f4](https://github.com/aave/aave-v3-periphery/commit/4b3a8f488e3520d85093a908ea898e845e16cbc3))
* use simple flash loan ([e715175](https://github.com/aave/aave-v3-periphery/commit/e715175c899f95dcde98099965aad2fabdbdc1f2))


### Bug Fixes

* Add clean ups to UIIncentiveDataProvider and PoolDataProvider ([4d80e42](https://github.com/aave/aave-v3-periphery/commit/4d80e425ab301d8e9573f8457a1cf534314ec957))
* Add missing docs to modifier ([ad663df](https://github.com/aave/aave-v3-periphery/commit/ad663df941f8b675aea16658ca6f7ae8e0465c1b))
* add name to response ([78a976f](https://github.com/aave/aave-v3-periphery/commit/78a976f519845e6dd5e1e52649df9f1659013206))
* add value to struct ([5ab18b5](https://github.com/aave/aave-v3-periphery/commit/5ab18b5bca1d7247d63ac01c41a09d235a5e5067))
* added proper overflows check ([e4eb148](https://github.com/aave/aave-v3-periphery/commit/e4eb14832160a90958f821e2afad1d50fe814425))
* assign variable to stack to deep ([8f2b68b](https://github.com/aave/aave-v3-periphery/commit/8f2b68b452a19197c0b6664598f1f7a940b958c7))
* Cache rewardList length in claimAllRewards function ([be71bc8](https://github.com/aave/aave-v3-periphery/commit/be71bc810ff9bb572c8d808cdb5745b5fc74087e))
* Fix docs ([7b0b0fd](https://github.com/aave/aave-v3-periphery/commit/7b0b0fdffb5f6305be865576edf3e20c0d12d8c6))
* Fix docs ([70e1c0f](https://github.com/aave/aave-v3-periphery/commit/70e1c0f3c5ec71dd7195f0a287e8b0cfc2327ae5))
* Fix docs ([3751fcf](https://github.com/aave/aave-v3-periphery/commit/3751fcfbdc9bcf1e7e2de22e9614bc5faaefce27))
* Fix docstring and function param of setEmissionPerSecond ([080648c](https://github.com/aave/aave-v3-periphery/commit/080648ca502150828424a59efda0c9222a603d1e))
* Fix docstrings in Rewards contracts ([3ee0184](https://github.com/aave/aave-v3-periphery/commit/3ee01840b6f3bfb306850b9f7163369f487195b9))
* Fix EmissionManagerUpdated event docstring ([49fe12b](https://github.com/aave/aave-v3-periphery/commit/49fe12b61b6633444d4522ad66c357f4d41fe5c9))
* Fix EmissionManagerUpdated event docstring ([6e0ae79](https://github.com/aave/aave-v3-periphery/commit/6e0ae79ad5446fc1c21be703d6f68c50fad18e78))
* Fix function docstrings ([bb2a3af](https://github.com/aave/aave-v3-periphery/commit/bb2a3afef5a790218171b17780ab7d917111d986))
* Fix logic of setEmissionsPerSecond function ([45f8030](https://github.com/aave/aave-v3-periphery/commit/45f8030b1976b587c4fa3c0a7fd4fb1d2c80ed8e))
* fix tests for executeOperation ([2f98828](https://github.com/aave/aave-v3-periphery/commit/2f98828abb3832886ec14d7651a437137c93bbec))
* Fix the emission of old values in AssetConfigUpdate ([faf8cdc](https://github.com/aave/aave-v3-periphery/commit/faf8cdc05438d41531833c184426679b037597a4))
* Fix typo in docstring ([a343d47](https://github.com/aave/aave-v3-periphery/commit/a343d47fbb51be32358a6a243b3efa0e94df639b))
* fixed revert messages ([57e6906](https://github.com/aave/aave-v3-periphery/commit/57e690686208911b86fa911aa13b7ccb41543125))
* fixed syntax error coming from merge ([8c26b9d](https://github.com/aave/aave-v3-periphery/commit/8c26b9d31063d46f3b5e49d25339e7414c39c68a))
* fixed wrong calculations in claimRewards ([5b81da2](https://github.com/aave/aave-v3-periphery/commit/5b81da20c15380171a831a91313ceb7821195e7a))
* Make emission manager variables internal ([37966a1](https://github.com/aave/aave-v3-periphery/commit/37966a15965941efe872d1ce2ab0555674214b2d))
* npm test script ([496092b](https://github.com/aave/aave-v3-periphery/commit/496092b09b3c7d507093f6df06cd2046eef96025))
* Optimize logic of setEmissionPerSecond ([9bd97e2](https://github.com/aave/aave-v3-periphery/commit/9bd97e20f3422e6703d9392c18b9ec8d764cb18e))
* package-lock ([068ba75](https://github.com/aave/aave-v3-periphery/commit/068ba754fb68df080d30dce25755b7c64d01fb04))
* Refactor indexUpdated flag in updateRewardData function ([d6584d7](https://github.com/aave/aave-v3-periphery/commit/d6584d723186d46757fbd8e263d5607abbabc838))
* Remove test case of ZERO new emissionManager ([837c949](https://github.com/aave/aave-v3-periphery/commit/837c9494c947b7b3dbf80812c1f3dccacdc2a8f2))
* remove typo ([70dd011](https://github.com/aave/aave-v3-periphery/commit/70dd011d5661c6f22dda968bca8b06587ddc82d2))
* Remove unnecessary import in IRewardsDistributor ([b7951bb](https://github.com/aave/aave-v3-periphery/commit/b7951bb4de7f20116c3f823c34945774c3f8727f))
* Remove unneeded events in Rewards ([5634fb1](https://github.com/aave/aave-v3-periphery/commit/5634fb151fa1a77017395ad5ff41068548ade490))
* Rename _getUserBalances to _getUserAssetBalances ([bc5d1be](https://github.com/aave/aave-v3-periphery/commit/bc5d1be2a7c36a249eed4277a008a562eae78345))
* Rename DataTypes lib to RewardsDataTypes to avoid name clashing ([85aee46](https://github.com/aave/aave-v3-periphery/commit/85aee46132a8073527694d809af2c16018de0b15))
* Rename function getUserAssetData by getUserDataIndex ([353366f](https://github.com/aave/aave-v3-periphery/commit/353366ffde5b306a81cd26f8e0f04af0697144c9))
* Rename getUserRewardsBalance function by getUserRewards ([66ed861](https://github.com/aave/aave-v3-periphery/commit/66ed86194e1293a3468a04d78d5fd47dd6ab9eda))
* Rename getUserUnclaimedRewards fn by getUserAccruedRewards ([9332f3c](https://github.com/aave/aave-v3-periphery/commit/9332f3c236c75d32ed8182625b59d49493020994))
* Rename lendingPool to pool in UiProvider contract ([2e50d3f](https://github.com/aave/aave-v3-periphery/commit/2e50d3f57bd0ccc4d2649ec8c7b36770158829ee))
* Rename principalUserBalance variable to userBalance ([c4a77a9](https://github.com/aave/aave-v3-periphery/commit/c4a77a9acef5a4ce652df60d7aabe765cc732b21))
* Rename UserAssetStatsInput struct to UserAssetBalance in Rewards ([3194c8a](https://github.com/aave/aave-v3-periphery/commit/3194c8a076afa1b194b6740f1665ec9ebde78b74))
* Update tests to check emission of old values in events ([07c1879](https://github.com/aave/aave-v3-periphery/commit/07c1879ec93b1e59b0e8f61f7d14761edaa39b5f))
* use simple receiver ([3aa2b26](https://github.com/aave/aave-v3-periphery/commit/3aa2b266850c46f861b77dbbaffd1c67b422124a))


### Miscellaneous Chores

* release 1.10.0 ([6b27d2f](https://github.com/aave/aave-v3-periphery/commit/6b27d2f5721db4d2a9caa6bda9e8ca5e3136c22f))
* release 1.11.0 ([a4dee72](https://github.com/aave/aave-v3-periphery/commit/a4dee72c618c0512ed2bf2e6902c7b27e520f767))
* release 1.11.1 ([701fede](https://github.com/aave/aave-v3-periphery/commit/701fedeb9430385f6e7e3d275eba221782361040))
* release 1.18.0 ([63c4695](https://github.com/aave/aave-v3-periphery/commit/63c4695a2d4ce4a12c2aaf9b3fce4b998abf0203))
* release 1.9.0 ([3856ca6](https://github.com/aave/aave-v3-periphery/commit/3856ca69c84ddcf27e957ae1e5f0eb0e01047f4e))
* release 1.9.1 ([834f1c7](https://github.com/aave/aave-v3-periphery/commit/834f1c7eb9a78e05a9117dc7bc94b8c8b413bff8))
