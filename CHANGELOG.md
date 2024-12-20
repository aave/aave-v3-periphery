# Changelog

## [2.0.0](https://github.com/OKEAMAH/aave-v3-periphery/compare/v2.5.2...v2.0.0) (2024-08-19)


### Features

* Adapt codebase and test setup to @aave/core-v3@1.1.0 ([79c8468](https://github.com/OKEAMAH/aave-v3-periphery/commit/79c8468eca13dfde6ee24b1c996e3602be5d4d95))
* adapted paraswap liquidity swap tests for Aave V3 ([d00379d](https://github.com/OKEAMAH/aave-v3-periphery/commit/d00379d5d72ba043eb25b3b94fa33f5de04ee221))
* Add a mint amount limit and ownership transfer function to Faucet  ([#162](https://github.com/OKEAMAH/aave-v3-periphery/issues/162)) ([b52f6c4](https://github.com/OKEAMAH/aave-v3-periphery/commit/b52f6c483373f1c9a1478af9e076a08fda6bf67c))
* Add ability to specify collector ([79c2377](https://github.com/OKEAMAH/aave-v3-periphery/commit/79c23779a567b95110020fa5a9d0d9d938f2d6b8))
* add Collector implementation and controller ([56a39c2](https://github.com/OKEAMAH/aave-v3-periphery/commit/56a39c2daf502ffe3da36072ffdfd8e73d8b47b9))
* Add control to block mints in Faucet ([#172](https://github.com/OKEAMAH/aave-v3-periphery/issues/172)) ([19ce4be](https://github.com/OKEAMAH/aave-v3-periphery/commit/19ce4be7fc2d4364147be907a171afa0c75826e1))
* Add emission manager contract ([abcb674](https://github.com/OKEAMAH/aave-v3-periphery/commit/abcb6746557efc214462b0c7bdbe0bacdf775eaf))
* Add Faucet contracts to periphery ([#144](https://github.com/OKEAMAH/aave-v3-periphery/issues/144)) ([ec151d9](https://github.com/OKEAMAH/aave-v3-periphery/commit/ec151d969c2c91224fc5771d5a1783b238e683ef))
* add getter for current index on rewardsController ([fe8e0e1](https://github.com/OKEAMAH/aave-v3-periphery/commit/fe8e0e1b8b4d2063efb2e62d8057d22b6db1e070))
* Add helpers for contracts deployments and accessors ([af5788f](https://github.com/OKEAMAH/aave-v3-periphery/commit/af5788f878b6ab30c8398dffd71ec93ceff458e4))
* Add owner constructor parameter to EmissionManager contract to support CREATE2 factory deployments ([a36fc32](https://github.com/OKEAMAH/aave-v3-periphery/commit/a36fc32437eee04da125e5f467231eb99354923e))
* add owner constructor parameters to contracts that inherit Ownable. ([a3fcaff](https://github.com/OKEAMAH/aave-v3-periphery/commit/a3fcaff5377c427f8ae0941fa77357aab9e95a5a))
* Add Paraswap adapters and mocks. ([c97fb0e](https://github.com/OKEAMAH/aave-v3-periphery/commit/c97fb0e6df123c7e5100006900bab4fb43a762e0))
* Add periphery contracts importing core dependencies ([eefed97](https://github.com/OKEAMAH/aave-v3-periphery/commit/eefed972df7dc54b9940ff4cba85e52fe8d0fa45))
* Add previousEmissionManager event parameter and remove zero address check ([b0c18a2](https://github.com/OKEAMAH/aave-v3-periphery/commit/b0c18a2d681b5384d790ad721566b112e67a10c9))
* Add primary Aave markets ([630fa4b](https://github.com/OKEAMAH/aave-v3-periphery/commit/630fa4b2d743b0f14e759b08e351542bcb8bddf4))
* add reward price oracle mechanism ([ab001e7](https://github.com/OKEAMAH/aave-v3-periphery/commit/ab001e71e789e75326cbeb77c1d50de7deadbfdd))
* Add SelfdsetructTransfer contract ([e87d96e](https://github.com/OKEAMAH/aave-v3-periphery/commit/e87d96e75fce326c20183501d8397b948afe107c))
* Add setEmissionsPerSecond function in Rewards contract ([8cbacf5](https://github.com/OKEAMAH/aave-v3-periphery/commit/8cbacf5370db433ab6e0435610194f9238108a6b))
* add siloed flag to reserve response ([090d201](https://github.com/OKEAMAH/aave-v3-periphery/commit/090d2017f1a5c682b3b4fc1e97a4b8b523ef15b8))
* Add test files ([662f8d6](https://github.com/OKEAMAH/aave-v3-periphery/commit/662f8d604ff0851c8a94e680f46569c0ff853f8f))
* Add Treasury Controller contract ([8a536b6](https://github.com/OKEAMAH/aave-v3-periphery/commit/8a536b67f08f840ab1134a3fdeccd842cb67b27e))
* Add withdraw and swap paraswap adapter ([#180](https://github.com/OKEAMAH/aave-v3-periphery/issues/180)) ([b7ead26](https://github.com/OKEAMAH/aave-v3-periphery/commit/b7ead26505ad699a5da31aa1abd20b47b5f27d6a))
* added base rates ([b04d26e](https://github.com/OKEAMAH/aave-v3-periphery/commit/b04d26e91cb8d795ccd75eba44fc0f350180debf))
* Added beta deploy package. Fix test that hangs due multiple deployments. ([444139a](https://github.com/OKEAMAH/aave-v3-periphery/commit/444139af5f216d9946c90ac833be4839749e9bc6))
* added borrowableInIsolation field ([272cade](https://github.com/OKEAMAH/aave-v3-periphery/commit/272cadec329489bbba6e3ffafa50017b8f840d1d))
* added debt ceiling decimals ([005fec4](https://github.com/OKEAMAH/aave-v3-periphery/commit/005fec439867746bfbdf0fdcd20f6b175ac45904))
* added extra fields ([fd56951](https://github.com/OKEAMAH/aave-v3-periphery/commit/fd56951654976a37478e151d7e1b415f8cab2a7d))
* Added gas optimizations and replace SafeERC20 to SafeTransferLib ([2d13589](https://github.com/OKEAMAH/aave-v3-periphery/commit/2d13589e0570f96b3cfbc4624001416f09acdcaf))
* Added getTransferStrategy getter to Incentives Controller V2 ([104cf60](https://github.com/OKEAMAH/aave-v3-periphery/commit/104cf607f1db4dbb64c29ce204abd8d2926fc45f))
* added missing fields in UiPoolDataProvider. Added UiIncentiveDataProvider helper ([ab7a460](https://github.com/OKEAMAH/aave-v3-periphery/commit/ab7a460c9889b311dbb8eb29a11efd6c67ad9081))
* added new fields for client calculations ([499c5dc](https://github.com/OKEAMAH/aave-v3-periphery/commit/499c5dcc996f4998aa1a0636c8d3106598fb45b0))
* added PRECISION getter to IAaveDistributionManagerV2 interface ([a2c3136](https://github.com/OKEAMAH/aave-v3-periphery/commit/a2c3136713767e8d4276f14409856d5a52aedfef))
* added price oracle mapping for easier rewards integration ([3ee5bd2](https://github.com/OKEAMAH/aave-v3-periphery/commit/3ee5bd27a6c4e7f2a4022cf462a8a96ab85ddad7))
* added UiIncentiveDataProvider helper ([774f1a9](https://github.com/OKEAMAH/aave-v3-periphery/commit/774f1a9c653b5783e8a746583fa522df7cf49345))
* Added workflow files for test during PRs and release-please integration ([80f723e](https://github.com/OKEAMAH/aave-v3-periphery/commit/80f723e30ddf020e756b49bf4d610e9442f791ad))
* Allow Emission Manager owner of RewardsController to be mutable by current admin ([902e524](https://github.com/OKEAMAH/aave-v3-periphery/commit/902e524e2740199fa594885863d6a5a94c441272))
* bump revision ([69eb00e](https://github.com/OKEAMAH/aave-v3-periphery/commit/69eb00e006924efaabfbe8976a789565270c2ea9))
* bump solc to 0.8.10 as @aave/core-v3 ([30a818f](https://github.com/OKEAMAH/aave-v3-periphery/commit/30a818f5ec574da83e174087a2c930fc4833b624))
* bump Solidity version to 0.8.7 ([a0a9758](https://github.com/OKEAMAH/aave-v3-periphery/commit/a0a9758239383898e2b193e4cc465ee2b35ca37d))
* change storage size for reward data, claim rewards and reward oracle tests ([c8ca14c](https://github.com/OKEAMAH/aave-v3-periphery/commit/c8ca14c874abf328a120ba77ec369abbdecb7237))
* Delete scripts to be replaced by @aave/deploy-v3 ([e20debc](https://github.com/OKEAMAH/aave-v3-periphery/commit/e20debcd6aba9586699d124e9be4cd7776fbe76e))
* deploy ([#169](https://github.com/OKEAMAH/aave-v3-periphery/issues/169)) ([896e082](https://github.com/OKEAMAH/aave-v3-periphery/commit/896e08237d64e8aceb68a3772ae531fbb7b96867))
* Emit old and new values when updating asset reward distribution ([e786427](https://github.com/OKEAMAH/aave-v3-periphery/commit/e78642755ee7284eda1745c10fa2bca15e195995))
* enforce source of value when adding rewards at Incentives Controller V2 ([17a8195](https://github.com/OKEAMAH/aave-v3-periphery/commit/17a8195ec56406d071925f761ef39c816aa4ea4f))
* Fix contracts compiler warnings ([0453a47](https://github.com/OKEAMAH/aave-v3-periphery/commit/0453a47d3cb56496f61dd830e36bad20a29d2c10))
* fix github packages installation in workflows. ([40727dc](https://github.com/OKEAMAH/aave-v3-periphery/commit/40727dcfcc2941aae373dd076e4097ab0c205336))
* fix new setup for transfer strategy ([5fa7ce2](https://github.com/OKEAMAH/aave-v3-periphery/commit/5fa7ce2e533c03708def497fe5ed4a0d5ea23964))
* initial commit ([a428051](https://github.com/OKEAMAH/aave-v3-periphery/commit/a4280519dbb48e176f277b117046bda55097ec89))
* move isTransferStrategy constructor to TransferStrategyStorage ([6e1a42d](https://github.com/OKEAMAH/aave-v3-periphery/commit/6e1a42d7c50377ab97b37588055502208c3eea68))
* Perform call to TransferStrategy instead of delegate calls. Added reward admin, emergency withdraw, and approval admin methods to TransferStrategyBase. ([5bf4977](https://github.com/OKEAMAH/aave-v3-periphery/commit/5bf497760be8648d5ff3adfb234d9c56d9f95870))
* perform normal call ([90c9909](https://github.com/OKEAMAH/aave-v3-periphery/commit/90c99093293f9722dc1b34572f1e8ceb8bf5b6b0))
* port Paraswap Repay Adapter from Aave V2 to Aave V3, add tests ([d1887a8](https://github.com/OKEAMAH/aave-v3-periphery/commit/d1887a8e90b0d59ba98c27102045cd287e341ddf))
* readd getter for backwards compatibility ([#129](https://github.com/OKEAMAH/aave-v3-periphery/issues/129)) ([0202aab](https://github.com/OKEAMAH/aave-v3-periphery/commit/0202aab32bdc25864714b98d8347f9ef4978bfe8))
* remove doc link ([#167](https://github.com/OKEAMAH/aave-v3-periphery/issues/167)) ([c9dc231](https://github.com/OKEAMAH/aave-v3-periphery/commit/c9dc2314c5aa5a5b5754a5675378a8844b62be05))
* removed duplicated import ([cb2eba8](https://github.com/OKEAMAH/aave-v3-periphery/commit/cb2eba824811322f6db12b09fd2cb149bd9d1b90))
* rename IncentivesControllerV2 to RewardsController ([2a7fcbf](https://github.com/OKEAMAH/aave-v3-periphery/commit/2a7fcbf1bb967fb9b815ddb84e14a13336089820))
* rename script release please origin ([a87dd68](https://github.com/OKEAMAH/aave-v3-periphery/commit/a87dd688a567540151fb0db8ec5f09399a523d5a))
* soften version requirements ([a8a378f](https://github.com/OKEAMAH/aave-v3-periphery/commit/a8a378fd7313fb8afeae3dc79029cdd5e90eeb45))
* support @aave/core-v3@1.10.0 ([5426eab](https://github.com/OKEAMAH/aave-v3-periphery/commit/5426eabd0300a0794f321e9817e6256f82939933))
* ui pool data provider with full information ([b7e9cef](https://github.com/OKEAMAH/aave-v3-periphery/commit/b7e9cefc49bf64206334be38f3a9da1923101287))
* Update WethGateway contracts ([74d27ee](https://github.com/OKEAMAH/aave-v3-periphery/commit/74d27ee7079c8e16dee52cd4cb59cae2bb5846e0))
* updated helper contracts to v3 and added decimals to incentives helper. Updated distribution manager decimals to be in uint8 ([b6d7892](https://github.com/OKEAMAH/aave-v3-periphery/commit/b6d7892b205a0e07ef081013f58ea798f46d3917))
* updated ui pool data provider with latest logic ([06fe324](https://github.com/OKEAMAH/aave-v3-periphery/commit/06fe3247c96392c955ddaa657e32f1c8ed0a6796))
* updated with maker case ([55a2be9](https://github.com/OKEAMAH/aave-v3-periphery/commit/55a2be961aca772a5762ad4e9b627271aae7de47))
* use github packages for aave-token and stake-v2 ([57d3a5d](https://github.com/OKEAMAH/aave-v3-periphery/commit/57d3a5d3542743df710be1e6194d648a671b280b))
* use GPv2SafeERC20 instead of SafeERC20. ([bbd6131](https://github.com/OKEAMAH/aave-v3-periphery/commit/bbd6131644465be00f209f43b0b9c2d11d2279eb))
* use latest aave@deploy-v3 and aave@core-v3 package, use the Test market at tests ([4b3a8f4](https://github.com/OKEAMAH/aave-v3-periphery/commit/4b3a8f488e3520d85093a908ea898e845e16cbc3))
* use max pattern to detect overflow intead of casting ([8dfa261](https://github.com/OKEAMAH/aave-v3-periphery/commit/8dfa261c2dc8069296daa8c9b652a856c7c7760b))
* use simple flash loan ([e715175](https://github.com/OKEAMAH/aave-v3-periphery/commit/e715175c899f95dcde98099965aad2fabdbdc1f2))
* use TransferStrategyStorage constructor at staked token strategy ([ac04c12](https://github.com/OKEAMAH/aave-v3-periphery/commit/ac04c12532f7741af16b24a8c11ce69d9b7ef262))
* use v3 deploy as source of deployment scripts. ([200d0a3](https://github.com/OKEAMAH/aave-v3-periphery/commit/200d0a34856c4a73e2fa11b170f99cfe27fa9bc2))


### Bug Fixes

* Add already accrued rewards ([4dcac4f](https://github.com/OKEAMAH/aave-v3-periphery/commit/4dcac4f418c515ec59d568f8c4e18644e80cc156))
* Add clean ups to UIIncentiveDataProvider and PoolDataProvider ([4d80e42](https://github.com/OKEAMAH/aave-v3-periphery/commit/4d80e425ab301d8e9573f8457a1cf534314ec957))
* Add missing docs to modifier ([ad663df](https://github.com/OKEAMAH/aave-v3-periphery/commit/ad663df941f8b675aea16658ca6f7ae8e0465c1b))
* add name to response ([78a976f](https://github.com/OKEAMAH/aave-v3-periphery/commit/78a976f519845e6dd5e1e52649df9f1659013206))
* add prepublish compilation to export artifacts ([ec15da8](https://github.com/OKEAMAH/aave-v3-periphery/commit/ec15da8ffb6271d1c64401e310ce954764ae7140))
* add registry url to actions/setup-node@v1 ([7695376](https://github.com/OKEAMAH/aave-v3-periphery/commit/769537678a2fb4eec02e55dd5cf75f88ef13455a))
* add test ([dc20993](https://github.com/OKEAMAH/aave-v3-periphery/commit/dc20993dc3a7e0155b594f57893cc8dced5733bb))
* add value to struct ([5ab18b5](https://github.com/OKEAMAH/aave-v3-periphery/commit/5ab18b5bca1d7247d63ac01c41a09d235a5e5067))
* added proper overflows check ([e4eb148](https://github.com/OKEAMAH/aave-v3-periphery/commit/e4eb14832160a90958f821e2afad1d50fe814425))
* added slopes ([b8f98a3](https://github.com/OKEAMAH/aave-v3-periphery/commit/b8f98a35b513113585daaffe0eb3e22ca3d46d32))
* Adjust treasury contracts to reflect mainnet deployment ([e0580a8](https://github.com/OKEAMAH/aave-v3-periphery/commit/e0580a81a83fa4e217b9f18a891e58c63deb1f3b))
* assign variable to stack to deep ([8f2b68b](https://github.com/OKEAMAH/aave-v3-periphery/commit/8f2b68b452a19197c0b6664598f1f7a940b958c7))
* Bump aave v3 dependencies ([#186](https://github.com/OKEAMAH/aave-v3-periphery/issues/186)) ([d9a89ef](https://github.com/OKEAMAH/aave-v3-periphery/commit/d9a89ef3db3a609ec81260bc31390bd1d2471174))
* Bump v3 core dependency ([#188](https://github.com/OKEAMAH/aave-v3-periphery/issues/188)) ([d332212](https://github.com/OKEAMAH/aave-v3-periphery/commit/d332212c10bf8a65d622e9bfbbb83f760cba171c))
* Cache rewardList length in claimAllRewards function ([be71bc8](https://github.com/OKEAMAH/aave-v3-periphery/commit/be71bc810ff9bb572c8d808cdb5745b5fc74087e))
* compiling ([1e2394b](https://github.com/OKEAMAH/aave-v3-periphery/commit/1e2394bef6999924ac8cd3d7e357bd3e5f985640))
* convert interface to address at event emit ([a3ddb57](https://github.com/OKEAMAH/aave-v3-periphery/commit/a3ddb5741305f6ec0603d02bfd0575b397fbb245))
* docs ([fe8e0e1](https://github.com/OKEAMAH/aave-v3-periphery/commit/fe8e0e1b8b4d2063efb2e62d8057d22b6db1e070))
* Fix docs ([7b0b0fd](https://github.com/OKEAMAH/aave-v3-periphery/commit/7b0b0fdffb5f6305be865576edf3e20c0d12d8c6))
* Fix docs ([70e1c0f](https://github.com/OKEAMAH/aave-v3-periphery/commit/70e1c0f3c5ec71dd7195f0a287e8b0cfc2327ae5))
* Fix docs ([3751fcf](https://github.com/OKEAMAH/aave-v3-periphery/commit/3751fcfbdc9bcf1e7e2de22e9614bc5faaefce27))
* Fix docstring and function param of setEmissionPerSecond ([080648c](https://github.com/OKEAMAH/aave-v3-periphery/commit/080648ca502150828424a59efda0c9222a603d1e))
* Fix docstrings in Rewards contracts ([3ee0184](https://github.com/OKEAMAH/aave-v3-periphery/commit/3ee01840b6f3bfb306850b9f7163369f487195b9))
* Fix EmissionManagerUpdated event docstring ([49fe12b](https://github.com/OKEAMAH/aave-v3-periphery/commit/49fe12b61b6633444d4522ad66c357f4d41fe5c9))
* Fix EmissionManagerUpdated event docstring ([6e0ae79](https://github.com/OKEAMAH/aave-v3-periphery/commit/6e0ae79ad5446fc1c21be703d6f68c50fad18e78))
* Fix error on hardhat config ([d77b1d2](https://github.com/OKEAMAH/aave-v3-periphery/commit/d77b1d20e8429368fa1c38c0b0acecd512cfe882))
* Fix error on verify task ([e09fba1](https://github.com/OKEAMAH/aave-v3-periphery/commit/e09fba189d5b1e262acd224c6aa14c6b8e56de96))
* Fix fetching of IR data from UiPoolDataProvider ([e3865c2](https://github.com/OKEAMAH/aave-v3-periphery/commit/e3865c2ac052fe204ca1435ba2f9c15d02aedad9))
* Fix function docs ([3883ae8](https://github.com/OKEAMAH/aave-v3-periphery/commit/3883ae8b655e09f1fde0033cf104b62ad44537ec))
* Fix function docstrings ([bb2a3af](https://github.com/OKEAMAH/aave-v3-periphery/commit/bb2a3afef5a790218171b17780ab7d917111d986))
* Fix getUserReward getter ([c8c2072](https://github.com/OKEAMAH/aave-v3-periphery/commit/c8c2072f1440384e8090f98a9109d522e6afc777))
* Fix logic of setEmissionsPerSecond function ([45f8030](https://github.com/OKEAMAH/aave-v3-periphery/commit/45f8030b1976b587c4fa3c0a7fd4fb1d2c80ed8e))
* fix order of fields ([9f73cd4](https://github.com/OKEAMAH/aave-v3-periphery/commit/9f73cd499118fb6273004b46c482efbcb3f23d54))
* Fix parameters of IRewardsController handleAction function ([8fa6e83](https://github.com/OKEAMAH/aave-v3-periphery/commit/8fa6e8374e4c4e2f22422b9f920a881b282c545f))
* Fix README docs ([abd7465](https://github.com/OKEAMAH/aave-v3-periphery/commit/abd7465a83cde8133083d10b0aa8f8f1a1445441))
* fix tests for executeOperation ([2f98828](https://github.com/OKEAMAH/aave-v3-periphery/commit/2f98828abb3832886ec14d7651a437137c93bbec))
* Fix the emission of old values in AssetConfigUpdate ([faf8cdc](https://github.com/OKEAMAH/aave-v3-periphery/commit/faf8cdc05438d41531833c184426679b037597a4))
* Fix typo in docstring ([a343d47](https://github.com/OKEAMAH/aave-v3-periphery/commit/a343d47fbb51be32358a6a243b3efa0e94df639b))
* Fix typos of WethGateway ([a28d163](https://github.com/OKEAMAH/aave-v3-periphery/commit/a28d1637bc8132493e8002c24231be363fea6d3e))
* Fix UiIncentiveProvider with 0 incentivesController ([5ddc801](https://github.com/OKEAMAH/aave-v3-periphery/commit/5ddc8015e226ae23b9d7f9c565c24474a7ac7c6b))
* Fix version of aave-deploy ([e946268](https://github.com/OKEAMAH/aave-v3-periphery/commit/e9462689046bee725c002d710565b0a999614137))
* fixed interface order ([58534d3](https://github.com/OKEAMAH/aave-v3-periphery/commit/58534d301897b08cc3f2b966450ba878d5ce0b6d))
* fixed revert messages ([57e6906](https://github.com/OKEAMAH/aave-v3-periphery/commit/57e690686208911b86fa911aa13b7ccb41543125))
* fixed syntax error coming from merge ([8c26b9d](https://github.com/OKEAMAH/aave-v3-periphery/commit/8c26b9d31063d46f3b5e49d25339e7414c39c68a))
* fixed wrong calculations in claimRewards ([5b81da2](https://github.com/OKEAMAH/aave-v3-periphery/commit/5b81da20c15380171a831a91313ceb7821195e7a))
* initialize return arrays at _claimAllRewards function. Add tests for IncentivesControllerV2. ([61e7456](https://github.com/OKEAMAH/aave-v3-periphery/commit/61e74564a2eaf2df9e4d6d02e120d9225677d27f))
* Make emission manager variables internal ([37966a1](https://github.com/OKEAMAH/aave-v3-periphery/commit/37966a15965941efe872d1ce2ab0555674214b2d))
* Make Rewards contract work with PoolAddressesProvider updateImpl ([#123](https://github.com/OKEAMAH/aave-v3-periphery/issues/123)) ([63e4000](https://github.com/OKEAMAH/aave-v3-periphery/commit/63e400008ee18c81cceb846db4f64f9907413b59))
* missing view function ([5ee0776](https://github.com/OKEAMAH/aave-v3-periphery/commit/5ee0776cc8387783a75fb6ab5fa3fc6d4d82cca4))
* Move ecosystem contracts to treasury folder ([e84c6a4](https://github.com/OKEAMAH/aave-v3-periphery/commit/e84c6a4bed4b69727f6f22611b6c2e6ffc907e44))
* move worflows inside .github directory ([8a2e35b](https://github.com/OKEAMAH/aave-v3-periphery/commit/8a2e35b8721310b87d9abe261c53f8dbc390abdf))
* not compiling ([a984d48](https://github.com/OKEAMAH/aave-v3-periphery/commit/a984d48f72f8472e0dcc878819069489a26670d8))
* npm test script ([496092b](https://github.com/OKEAMAH/aave-v3-periphery/commit/496092b09b3c7d507093f6df06cd2046eef96025))
* Optimize logic of setEmissionPerSecond ([9bd97e2](https://github.com/OKEAMAH/aave-v3-periphery/commit/9bd97e20f3422e6703d9392c18b9ec8d764cb18e))
* package-lock ([068ba75](https://github.com/OKEAMAH/aave-v3-periphery/commit/068ba754fb68df080d30dce25755b7c64d01fb04))
* package-lock ([0f1819a](https://github.com/OKEAMAH/aave-v3-periphery/commit/0f1819a9c68f54ac00f1a8c268337cda4b5026ab))
* publish all artifacts files, required by hardhat-deploy to store solidity input ([01814cb](https://github.com/OKEAMAH/aave-v3-periphery/commit/01814cb6a3a91a93dbfa39c1c01a925d3c71695a))
* publish npm at action ([992dda2](https://github.com/OKEAMAH/aave-v3-periphery/commit/992dda25a5df000b7efe218051d18a2ef157621b))
* Refactor indexUpdated flag in updateRewardData function ([d6584d7](https://github.com/OKEAMAH/aave-v3-periphery/commit/d6584d723186d46757fbd8e263d5607abbabc838))
* Refactor test setup ([585c74b](https://github.com/OKEAMAH/aave-v3-periphery/commit/585c74b5f152c8de4a79d774bd462bd6370259f2))
* Remove `buidler` references ([5bdd96e](https://github.com/OKEAMAH/aave-v3-periphery/commit/5bdd96eb04fb3edac26bd9e0e89cdab55768b44f))
* remove aaveoracle from constructor and move it at initialize ([6514ecb](https://github.com/OKEAMAH/aave-v3-periphery/commit/6514ecbbb3629959d895bfb1480bf7fe735f74ef))
* Remove constructor of RewardsController ([4210a75](https://github.com/OKEAMAH/aave-v3-periphery/commit/4210a75b7cc1cffdf0efb04ad2a0cebe8af641a8))
* remove deploy args of RewardsController at tests, add deploy beta package ([1c01600](https://github.com/OKEAMAH/aave-v3-periphery/commit/1c0160045b6edfddd36fb7fbba64a6e8f58e4a1d))
* remove experimental pragma ([eae70a3](https://github.com/OKEAMAH/aave-v3-periphery/commit/eae70a3f3eaeefbf1d5b2957f2cf04a683bc31b3))
* Remove lending word from contracts ([be9fa92](https://github.com/OKEAMAH/aave-v3-periphery/commit/be9fa92bbbc979cd63b9076f667e928434f51adc))
* Remove lending word from tests ([16de46a](https://github.com/OKEAMAH/aave-v3-periphery/commit/16de46a7be4da32049294264c229f5281917c0f6))
* Remove test case of ZERO new emissionManager ([837c949](https://github.com/OKEAMAH/aave-v3-periphery/commit/837c9494c947b7b3dbf80812c1f3dccacdc2a8f2))
* remove typo ([70dd011](https://github.com/OKEAMAH/aave-v3-periphery/commit/70dd011d5661c6f22dda968bca8b06587ddc82d2))
* Remove unnecessary import in IRewardsDistributor ([b7951bb](https://github.com/OKEAMAH/aave-v3-periphery/commit/b7951bb4de7f20116c3f823c34945774c3f8727f))
* Remove unneeded events in Rewards ([5634fb1](https://github.com/OKEAMAH/aave-v3-periphery/commit/5634fb151fa1a77017395ad5ff41068548ade490))
* Remove unused sol compiler from hh config ([5d7574e](https://github.com/OKEAMAH/aave-v3-periphery/commit/5d7574e2326c0151176c9ecfced6466ff24e9c8b))
* Rename _getUserBalances to _getUserAssetBalances ([bc5d1be](https://github.com/OKEAMAH/aave-v3-periphery/commit/bc5d1be2a7c36a249eed4277a008a562eae78345))
* Rename DataTypes lib to RewardsDataTypes to avoid name clashing ([85aee46](https://github.com/OKEAMAH/aave-v3-periphery/commit/85aee46132a8073527694d809af2c16018de0b15))
* Rename function getUserAssetData by getUserDataIndex ([353366f](https://github.com/OKEAMAH/aave-v3-periphery/commit/353366ffde5b306a81cd26f8e0f04af0697144c9))
* Rename getUserRewardsBalance function by getUserRewards ([66ed861](https://github.com/OKEAMAH/aave-v3-periphery/commit/66ed86194e1293a3468a04d78d5fd47dd6ab9eda))
* Rename getUserUnclaimedRewards fn by getUserAccruedRewards ([9332f3c](https://github.com/OKEAMAH/aave-v3-periphery/commit/9332f3c236c75d32ed8182625b59d49493020994))
* Rename lendingPool to pool in UiProvider contract ([2e50d3f](https://github.com/OKEAMAH/aave-v3-periphery/commit/2e50d3f57bd0ccc4d2649ec8c7b36770158829ee))
* Rename principalUserBalance variable to userBalance ([c4a77a9](https://github.com/OKEAMAH/aave-v3-periphery/commit/c4a77a9acef5a4ce652df60d7aabe765cc732b21))
* Rename UserAssetStatsInput struct to UserAssetBalance in Rewards ([3194c8a](https://github.com/OKEAMAH/aave-v3-periphery/commit/3194c8a076afa1b194b6740f1665ec9ebde78b74))
* replace Precision with Asset Decimals. Added test scenarios where underlying token has 2 decimals. ([a24240a](https://github.com/OKEAMAH/aave-v3-periphery/commit/a24240a3f668a5632c2c4094ecd4bef6c8e597da))
* reset IEACAggregatorProxy interface ([69ac51e](https://github.com/OKEAMAH/aave-v3-periphery/commit/69ac51ee67f04147a628c6654afed858812546e2))
* rollback to 1.9.1 ([1f256db](https://github.com/OKEAMAH/aave-v3-periphery/commit/1f256db71ef46a2aaca43a14e268deced07e3579))
* set REVISION of proxy implementations to 1 by default ([#143](https://github.com/OKEAMAH/aave-v3-periphery/issues/143)) ([1f6abcd](https://github.com/OKEAMAH/aave-v3-periphery/commit/1f6abcd7da3483bd3c54a78b9e4e28064e784307))
* solved conflicts ([96f5793](https://github.com/OKEAMAH/aave-v3-periphery/commit/96f5793d101362a2d55975570be0e6328353e9a0))
* test scripts and fix typescript integration with dependencies ([02ec4b9](https://github.com/OKEAMAH/aave-v3-periphery/commit/02ec4b9d8c73e9c80229baa13ac5321f0da9cdce))
* Update tests to check emission of old values in events ([07c1879](https://github.com/OKEAMAH/aave-v3-periphery/commit/07c1879ec93b1e59b0e8f61f7d14761edaa39b5f))
* Upload only artifacts from this project to the NPM package ([020e1a5](https://github.com/OKEAMAH/aave-v3-periphery/commit/020e1a5746e5597e578e813dd17e36c77d6c750c))
* use SafeERC20 safeApprove to work well with non standard ERC20 tokens ([#176](https://github.com/OKEAMAH/aave-v3-periphery/issues/176)) ([f5d0af9](https://github.com/OKEAMAH/aave-v3-periphery/commit/f5d0af92d5aadba7ec370d44d3c5312484d5b7a5))
* use scaled total supply ([e3a725b](https://github.com/OKEAMAH/aave-v3-periphery/commit/e3a725b5e8142f5476cc92dd2ebfcbe4dc611a7b))
* use simple receiver ([3aa2b26](https://github.com/OKEAMAH/aave-v3-periphery/commit/3aa2b266850c46f861b77dbbaffd1c67b422124a))


### Miscellaneous Chores

* release 1.10.0 ([6b27d2f](https://github.com/OKEAMAH/aave-v3-periphery/commit/6b27d2f5721db4d2a9caa6bda9e8ca5e3136c22f))
* release 1.11.0 ([a4dee72](https://github.com/OKEAMAH/aave-v3-periphery/commit/a4dee72c618c0512ed2bf2e6902c7b27e520f767))
* release 1.11.1 ([701fede](https://github.com/OKEAMAH/aave-v3-periphery/commit/701fedeb9430385f6e7e3d275eba221782361040))
* release 1.18.0 ([63c4695](https://github.com/OKEAMAH/aave-v3-periphery/commit/63c4695a2d4ce4a12c2aaf9b3fce4b998abf0203))
* release 1.19.2 ([007621c](https://github.com/OKEAMAH/aave-v3-periphery/commit/007621cced60cd9bb7062ab5dafee3c33959150b))
* release 1.20.2 ([28ec2ad](https://github.com/OKEAMAH/aave-v3-periphery/commit/28ec2adb46d0230265192b3dc86e64c62cea935f))
* release 1.21.0 ([522827e](https://github.com/OKEAMAH/aave-v3-periphery/commit/522827efc58a06819f8915863e9ee0749b305821))
* release 1.21.1 ([517bbdf](https://github.com/OKEAMAH/aave-v3-periphery/commit/517bbdf558e3ca5e30cd6d9cb74a504922e25a01))
* release 1.21.3 ([ced680b](https://github.com/OKEAMAH/aave-v3-periphery/commit/ced680b388f88b5faf8fff404107a78876ddc1bd))
* release 1.23.0 ([fd5b00e](https://github.com/OKEAMAH/aave-v3-periphery/commit/fd5b00ef87d336edda0001baead18a4461c28686))
* release 1.4.1 ([3868319](https://github.com/OKEAMAH/aave-v3-periphery/commit/3868319d3386fac718dd7c8bcd0c817e6b22966f))
* release 1.9.0 ([3856ca6](https://github.com/OKEAMAH/aave-v3-periphery/commit/3856ca69c84ddcf27e957ae1e5f0eb0e01047f4e))
* release 1.9.1 ([834f1c7](https://github.com/OKEAMAH/aave-v3-periphery/commit/834f1c7eb9a78e05a9117dc7bc94b8c8b413bff8))
* release 1.9.1 ([953827c](https://github.com/OKEAMAH/aave-v3-periphery/commit/953827c883f6113f8bc2aec55065147431e30623))
* release 2.0.0 ([23c9ef0](https://github.com/OKEAMAH/aave-v3-periphery/commit/23c9ef0d7b3efba776d15136f229a2732aadf807))
* release 3.0.1 ([ddf85ce](https://github.com/OKEAMAH/aave-v3-periphery/commit/ddf85ce0c01771406807b004aad5ee95054a3c76))

## [2.5.2](https://github.com/aave/aave-v3-periphery/compare/v2.5.1...v2.5.2) (2024-03-07)


### Bug Fixes

* Bump v3 core dependency ([#188](https://github.com/aave/aave-v3-periphery/issues/188)) ([d332212](https://github.com/aave/aave-v3-periphery/commit/d332212c10bf8a65d622e9bfbbb83f760cba171c))

## [2.5.1](https://github.com/aave/aave-v3-periphery/compare/v2.5.0...v2.5.1) (2024-03-07)


### Bug Fixes

* Bump aave v3 dependencies ([#186](https://github.com/aave/aave-v3-periphery/issues/186)) ([d9a89ef](https://github.com/aave/aave-v3-periphery/commit/d9a89ef3db3a609ec81260bc31390bd1d2471174))

## [2.5.0](https://github.com/aave/aave-v3-periphery/compare/v2.4.1...v2.5.0) (2023-08-22)


### Features

* Add withdraw and swap paraswap adapter ([#180](https://github.com/aave/aave-v3-periphery/issues/180)) ([b7ead26](https://github.com/aave/aave-v3-periphery/commit/b7ead26505ad699a5da31aa1abd20b47b5f27d6a))

## [2.4.1](https://github.com/aave/aave-v3-periphery/compare/v2.4.0...v2.4.1) (2023-07-06)


### Bug Fixes

* use SafeERC20 safeApprove to work well with non standard ERC20 tokens ([#176](https://github.com/aave/aave-v3-periphery/issues/176)) ([f5d0af9](https://github.com/aave/aave-v3-periphery/commit/f5d0af92d5aadba7ec370d44d3c5312484d5b7a5))

## [2.4.0](https://github.com/aave/aave-v3-periphery/compare/v2.3.0...v2.4.0) (2023-05-26)


### Features

* Add control to block mints in Faucet ([#172](https://github.com/aave/aave-v3-periphery/issues/172)) ([19ce4be](https://github.com/aave/aave-v3-periphery/commit/19ce4be7fc2d4364147be907a171afa0c75826e1))

## [2.3.0](https://github.com/aave/aave-v3-periphery/compare/v2.2.0...v2.3.0) (2023-04-20)


### Features

* deploy ([#169](https://github.com/aave/aave-v3-periphery/issues/169)) ([896e082](https://github.com/aave/aave-v3-periphery/commit/896e08237d64e8aceb68a3772ae531fbb7b96867))

## [2.2.0](https://github.com/aave/aave-v3-periphery/compare/v2.1.0...v2.2.0) (2023-04-20)


### Features

* remove doc link ([#167](https://github.com/aave/aave-v3-periphery/issues/167)) ([c9dc231](https://github.com/aave/aave-v3-periphery/commit/c9dc2314c5aa5a5b5754a5675378a8844b62be05))

## [2.1.0](https://github.com/aave/aave-v3-periphery/compare/v2.0.1...v2.1.0) (2023-04-19)


### Features

* Add a mint amount limit and ownership transfer function to Faucet  ([#162](https://github.com/aave/aave-v3-periphery/issues/162)) ([b52f6c4](https://github.com/aave/aave-v3-periphery/commit/b52f6c483373f1c9a1478af9e076a08fda6bf67c))

## [2.0.1](https://github.com/aave/aave-v3-periphery/compare/v2.0.0...v2.0.1) (2023-03-15)


### Bug Fixes

* publish all artifacts files, required by hardhat-deploy to store solidity input ([01814cb](https://github.com/aave/aave-v3-periphery/commit/01814cb6a3a91a93dbfa39c1c01a925d3c71695a))

## [2.0.0](https://github.com/aave/aave-v3-periphery/compare/v1.23.1...v2.0.0) (2023-01-12)


### Miscellaneous Chores

* release 2.0.0 ([23c9ef0](https://github.com/aave/aave-v3-periphery/commit/23c9ef0d7b3efba776d15136f229a2732aadf807))

## [1.23.1](https://github.com/aave/aave-v3-periphery/compare/v1.23.0...v1.23.1) (2022-12-30)


### Bug Fixes

* Fix fetching of IR data from UiPoolDataProvider ([e3865c2](https://github.com/aave/aave-v3-periphery/commit/e3865c2ac052fe204ca1435ba2f9c15d02aedad9))
* Fix UiIncentiveProvider with 0 incentivesController ([5ddc801](https://github.com/aave/aave-v3-periphery/commit/5ddc8015e226ae23b9d7f9c565c24474a7ac7c6b))

## [1.23.0](https://github.com/aave/aave-v3-periphery/compare/v1.22.0...v1.23.0) (2022-12-28)


### Miscellaneous Chores

* release 1.23.0 ([fd5b00e](https://github.com/aave/aave-v3-periphery/commit/fd5b00ef87d336edda0001baead18a4461c28686))

## [1.22.0](https://github.com/aave/aave-v3-periphery/compare/v1.21.5...v1.22.0) (2022-12-28)


### Features

* Add Faucet contracts to periphery ([#144](https://github.com/aave/aave-v3-periphery/issues/144)) ([ec151d9](https://github.com/aave/aave-v3-periphery/commit/ec151d969c2c91224fc5771d5a1783b238e683ef))


### Bug Fixes

* set REVISION of proxy implementations to 1 by default ([#143](https://github.com/aave/aave-v3-periphery/issues/143)) ([1f6abcd](https://github.com/aave/aave-v3-periphery/commit/1f6abcd7da3483bd3c54a78b9e4e28064e784307))

## [1.21.5](https://github.com/aave/aave-v3-periphery/compare/v1.21.4...v1.21.5) (2022-12-07)


### Bug Fixes

* add registry url to actions/setup-node@v1 ([7695376](https://github.com/aave/aave-v3-periphery/commit/769537678a2fb4eec02e55dd5cf75f88ef13455a))

## [1.21.4](https://github.com/aave/aave-v3-periphery/compare/v1.21.3...v1.21.4) (2022-12-07)


### Bug Fixes

* publish npm at action ([992dda2](https://github.com/aave/aave-v3-periphery/commit/992dda25a5df000b7efe218051d18a2ef157621b))

## [1.21.3](https://github.com/aave/aave-v3-periphery/compare/v1.21.2...v1.21.3) (2022-12-07)


### Miscellaneous Chores

* release 1.21.3 ([ced680b](https://github.com/aave/aave-v3-periphery/commit/ced680b388f88b5faf8fff404107a78876ddc1bd))

## [1.21.2](https://github.com/aave/aave-v3-periphery/compare/v1.21.1...v1.21.2) (2022-12-07)


### Bug Fixes

* Fix parameters of IRewardsController handleAction function ([8fa6e83](https://github.com/aave/aave-v3-periphery/commit/8fa6e8374e4c4e2f22422b9f920a881b282c545f))

## [1.21.1](https://github.com/aave/aave-v3-periphery/compare/v1.20.2...v1.21.1) (2022-11-28)


### Features

* readd getter for backwards compatibility ([#129](https://github.com/aave/aave-v3-periphery/issues/129)) ([0202aab](https://github.com/aave/aave-v3-periphery/commit/0202aab32bdc25864714b98d8347f9ef4978bfe8))


### Bug Fixes

* Fix function docs ([3883ae8](https://github.com/aave/aave-v3-periphery/commit/3883ae8b655e09f1fde0033cf104b62ad44537ec))
* Make Rewards contract work with PoolAddressesProvider updateImpl ([#123](https://github.com/aave/aave-v3-periphery/issues/123)) ([63e4000](https://github.com/aave/aave-v3-periphery/commit/63e400008ee18c81cceb846db4f64f9907413b59))
* Remove constructor of RewardsController ([4210a75](https://github.com/aave/aave-v3-periphery/commit/4210a75b7cc1cffdf0efb04ad2a0cebe8af641a8))
* remove deploy args of RewardsController at tests, add deploy beta package ([1c01600](https://github.com/aave/aave-v3-periphery/commit/1c0160045b6edfddd36fb7fbba64a6e8f58e4a1d))


### Miscellaneous Chores

* release 1.21.0 ([522827e](https://github.com/aave/aave-v3-periphery/commit/522827efc58a06819f8915863e9ee0749b305821))
* release 1.21.1 ([517bbdf](https://github.com/aave/aave-v3-periphery/commit/517bbdf558e3ca5e30cd6d9cb74a504922e25a01))
* release 3.0.1 ([ddf85ce](https://github.com/aave/aave-v3-periphery/commit/ddf85ce0c01771406807b004aad5ee95054a3c76))

## [1.21.0](https://github.com/aave/aave-v3-periphery/compare/v1.20.2...v1.21.0) (2022-11-28)


### Features

* readd getter for backwards compatibility ([#129](https://github.com/aave/aave-v3-periphery/issues/129)) ([0202aab](https://github.com/aave/aave-v3-periphery/commit/0202aab32bdc25864714b98d8347f9ef4978bfe8))


### Bug Fixes

* Fix function docs ([3883ae8](https://github.com/aave/aave-v3-periphery/commit/3883ae8b655e09f1fde0033cf104b62ad44537ec))
* Make Rewards contract work with PoolAddressesProvider updateImpl ([#123](https://github.com/aave/aave-v3-periphery/issues/123)) ([63e4000](https://github.com/aave/aave-v3-periphery/commit/63e400008ee18c81cceb846db4f64f9907413b59))
* Remove constructor of RewardsController ([4210a75](https://github.com/aave/aave-v3-periphery/commit/4210a75b7cc1cffdf0efb04ad2a0cebe8af641a8))
* remove deploy args of RewardsController at tests, add deploy beta package ([1c01600](https://github.com/aave/aave-v3-periphery/commit/1c0160045b6edfddd36fb7fbba64a6e8f58e4a1d))


### Miscellaneous Chores

* release 1.21.0 ([522827e](https://github.com/aave/aave-v3-periphery/commit/522827efc58a06819f8915863e9ee0749b305821))
* release 3.0.1 ([ddf85ce](https://github.com/aave/aave-v3-periphery/commit/ddf85ce0c01771406807b004aad5ee95054a3c76))

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
