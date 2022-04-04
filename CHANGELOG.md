# Changelog

## [1.17.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.16.0...v1.17.0) (2022-04-04)


### Features

* Add owner constructor parameter to EmissionManager contract to support CREATE2 factory deployments ([a36fc32](https://www.github.com/aave/aave-v3-periphery/commit/a36fc32437eee04da125e5f467231eb99354923e))


### Bug Fixes

* Fix docs ([7b0b0fd](https://www.github.com/aave/aave-v3-periphery/commit/7b0b0fdffb5f6305be865576edf3e20c0d12d8c6))

## [1.16.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.15.0...v1.16.0) (2022-04-04)


### Features

* Add emission manager contract ([abcb674](https://www.github.com/aave/aave-v3-periphery/commit/abcb6746557efc214462b0c7bdbe0bacdf775eaf))


### Bug Fixes

* Add missing docs to modifier ([ad663df](https://www.github.com/aave/aave-v3-periphery/commit/ad663df941f8b675aea16658ca6f7ae8e0465c1b))
* Fix docs ([70e1c0f](https://www.github.com/aave/aave-v3-periphery/commit/70e1c0f3c5ec71dd7195f0a287e8b0cfc2327ae5))
* Make emission manager variables internal ([37966a1](https://www.github.com/aave/aave-v3-periphery/commit/37966a15965941efe872d1ce2ab0555674214b2d))

## [1.15.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.14.0...v1.15.0) (2022-03-15)


### Features

* Add previousEmissionManager event parameter and remove zero address check ([b0c18a2](https://www.github.com/aave/aave-v3-periphery/commit/b0c18a2d681b5384d790ad721566b112e67a10c9))
* Allow Emission Manager owner of RewardsController to be mutable by current admin ([902e524](https://www.github.com/aave/aave-v3-periphery/commit/902e524e2740199fa594885863d6a5a94c441272))


### Bug Fixes

* Fix docs ([3751fcf](https://www.github.com/aave/aave-v3-periphery/commit/3751fcfbdc9bcf1e7e2de22e9614bc5faaefce27))
* Fix EmissionManagerUpdated event docstring ([49fe12b](https://www.github.com/aave/aave-v3-periphery/commit/49fe12b61b6633444d4522ad66c357f4d41fe5c9))
* Fix EmissionManagerUpdated event docstring ([6e0ae79](https://www.github.com/aave/aave-v3-periphery/commit/6e0ae79ad5446fc1c21be703d6f68c50fad18e78))
* Remove test case of ZERO new emissionManager ([837c949](https://www.github.com/aave/aave-v3-periphery/commit/837c9494c947b7b3dbf80812c1f3dccacdc2a8f2))

## [1.14.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.13.0...v1.14.0) (2022-03-04)


### Features

* add owner constructor parameters to contracts that inherit Ownable. ([a3fcaff](https://www.github.com/aave/aave-v3-periphery/commit/a3fcaff5377c427f8ae0941fa77357aab9e95a5a))
* Added beta deploy package. Fix test that hangs due multiple deployments. ([444139a](https://www.github.com/aave/aave-v3-periphery/commit/444139af5f216d9946c90ac833be4839749e9bc6))

## [1.13.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.12.2...v1.13.0) (2022-03-02)


### Features

* use latest aave@deploy-v3 and aave@core-v3 package, use the Test market at tests ([4b3a8f4](https://www.github.com/aave/aave-v3-periphery/commit/4b3a8f488e3520d85093a908ea898e845e16cbc3))

### [1.12.2](https://www.github.com/aave/aave-v3-periphery/compare/v1.12.1...v1.12.2) (2022-02-28)


### Bug Fixes

* fixed revert messages ([57e6906](https://www.github.com/aave/aave-v3-periphery/commit/57e690686208911b86fa911aa13b7ccb41543125))

### [1.12.1](https://www.github.com/aave/aave-v3-periphery/compare/v1.12.0...v1.12.1) (2022-02-25)


### Bug Fixes

* Rename lendingPool to pool in UiProvider contract ([2e50d3f](https://www.github.com/aave/aave-v3-periphery/commit/2e50d3f57bd0ccc4d2649ec8c7b36770158829ee))

## [1.12.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.11.1...v1.12.0) (2022-02-24)


### Features

* add Collector implementation and controller ([56a39c2](https://www.github.com/aave/aave-v3-periphery/commit/56a39c2daf502ffe3da36072ffdfd8e73d8b47b9))

### [1.11.1](https://www.github.com/aave/aave-v3-periphery/compare/v1.11.0...v1.11.1) (2022-02-15)


### Miscellaneous Chores

* release 1.11.1 ([701fede](https://www.github.com/aave/aave-v3-periphery/commit/701fedeb9430385f6e7e3d275eba221782361040))

## [1.11.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.10.0...v1.11.0) (2022-02-15)


### Miscellaneous Chores

* release 1.11.0 ([a4dee72](https://www.github.com/aave/aave-v3-periphery/commit/a4dee72c618c0512ed2bf2e6902c7b27e520f767))

## [1.10.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.9.1...v1.10.0) (2022-01-12)


### Features

* support @aave/core-v3@1.10.0 ([5426eab](https://www.github.com/aave/aave-v3-periphery/commit/5426eabd0300a0794f321e9817e6256f82939933))

### [1.9.1](https://www.github.com/aave/aave-v3-periphery/compare/v1.9.0...v1.9.1) (2022-01-07)


### Miscellaneous Chores

* release 1.9.1 ([953827c](https://www.github.com/aave/aave-v3-periphery/commit/953827c883f6113f8bc2aec55065147431e30623))

## [1.9.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.8.0...v1.9.0) (2021-12-27)


### Features

* rename IncentivesControllerV2 to RewardsController ([2a7fcbf](https://www.github.com/aave/aave-v3-periphery/commit/2a7fcbf1bb967fb9b815ddb84e14a13336089820))
* use GPv2SafeERC20 instead of SafeERC20. ([bbd6131](https://www.github.com/aave/aave-v3-periphery/commit/bbd6131644465be00f209f43b0b9c2d11d2279eb))


### Bug Fixes

* package-lock ([0f1819a](https://www.github.com/aave/aave-v3-periphery/commit/0f1819a9c68f54ac00f1a8c268337cda4b5026ab))

## [1.8.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.7.0...v1.8.0) (2021-12-27)


### Features

* updated helper contracts to v3 and added decimals to incentives helper. Updated distribution manager decimals to be in uint8 ([b6d7892](https://www.github.com/aave/aave-v3-periphery/commit/b6d7892b205a0e07ef081013f58ea798f46d3917))


### Bug Fixes

* replace Precision with Asset Decimals. Added test scenarios where underlying token has 2 decimals. ([a24240a](https://www.github.com/aave/aave-v3-periphery/commit/a24240a3f668a5632c2c4094ecd4bef6c8e597da))

## [1.7.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.6.1...v1.7.0) (2021-12-21)


### Features

* add reward price oracle mechanism ([ab001e7](https://www.github.com/aave/aave-v3-periphery/commit/ab001e71e789e75326cbeb77c1d50de7deadbfdd))
* Added gas optimizations and replace SafeERC20 to SafeTransferLib ([2d13589](https://www.github.com/aave/aave-v3-periphery/commit/2d13589e0570f96b3cfbc4624001416f09acdcaf))
* Added getTransferStrategy getter to Incentives Controller V2 ([104cf60](https://www.github.com/aave/aave-v3-periphery/commit/104cf607f1db4dbb64c29ce204abd8d2926fc45f))
* added PRECISION getter to IAaveDistributionManagerV2 interface ([a2c3136](https://www.github.com/aave/aave-v3-periphery/commit/a2c3136713767e8d4276f14409856d5a52aedfef))
* added price oracle mapping for easier rewards integration ([3ee5bd2](https://www.github.com/aave/aave-v3-periphery/commit/3ee5bd27a6c4e7f2a4022cf462a8a96ab85ddad7))
* change storage size for reward data, claim rewards and reward oracle tests ([c8ca14c](https://www.github.com/aave/aave-v3-periphery/commit/c8ca14c874abf328a120ba77ec369abbdecb7237))
* enforce source of value when adding rewards at Incentives Controller V2 ([17a8195](https://www.github.com/aave/aave-v3-periphery/commit/17a8195ec56406d071925f761ef39c816aa4ea4f))
* fix new setup for transfer strategy ([5fa7ce2](https://www.github.com/aave/aave-v3-periphery/commit/5fa7ce2e533c03708def497fe5ed4a0d5ea23964))
* move isTransferStrategy constructor to TransferStrategyStorage ([6e1a42d](https://www.github.com/aave/aave-v3-periphery/commit/6e1a42d7c50377ab97b37588055502208c3eea68))
* Perform call to TransferStrategy instead of delegate calls. Added reward admin, emergency withdraw, and approval admin methods to TransferStrategyBase. ([5bf4977](https://www.github.com/aave/aave-v3-periphery/commit/5bf497760be8648d5ff3adfb234d9c56d9f95870))
* perform normal call ([90c9909](https://www.github.com/aave/aave-v3-periphery/commit/90c99093293f9722dc1b34572f1e8ceb8bf5b6b0))
* use github packages for aave-token and stake-v2 ([57d3a5d](https://www.github.com/aave/aave-v3-periphery/commit/57d3a5d3542743df710be1e6194d648a671b280b))
* use max pattern to detect overflow intead of casting ([8dfa261](https://www.github.com/aave/aave-v3-periphery/commit/8dfa261c2dc8069296daa8c9b652a856c7c7760b))
* use TransferStrategyStorage constructor at staked token strategy ([ac04c12](https://www.github.com/aave/aave-v3-periphery/commit/ac04c12532f7741af16b24a8c11ce69d9b7ef262))


### Bug Fixes

* convert interface to address at event emit ([a3ddb57](https://www.github.com/aave/aave-v3-periphery/commit/a3ddb5741305f6ec0603d02bfd0575b397fbb245))
* initialize return arrays at _claimAllRewards function. Add tests for IncentivesControllerV2. ([61e7456](https://www.github.com/aave/aave-v3-periphery/commit/61e74564a2eaf2df9e4d6d02e120d9225677d27f))
* missing view function ([5ee0776](https://www.github.com/aave/aave-v3-periphery/commit/5ee0776cc8387783a75fb6ab5fa3fc6d4d82cca4))
* remove aaveoracle from constructor and move it at initialize ([6514ecb](https://www.github.com/aave/aave-v3-periphery/commit/6514ecbbb3629959d895bfb1480bf7fe735f74ef))
* reset IEACAggregatorProxy interface ([69ac51e](https://www.github.com/aave/aave-v3-periphery/commit/69ac51ee67f04147a628c6654afed858812546e2))

### [1.6.1](https://www.github.com/aave/aave-v3-periphery/compare/v1.6.0...v1.6.1) (2021-11-22)


### Bug Fixes

* Upload only artifacts from this project to the NPM package ([020e1a5](https://www.github.com/aave/aave-v3-periphery/commit/020e1a5746e5597e578e813dd17e36c77d6c750c))

## [1.6.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.5.0...v1.6.0) (2021-11-17)


### Features

* added borrowableInIsolation field ([272cade](https://www.github.com/aave/aave-v3-periphery/commit/272cadec329489bbba6e3ffafa50017b8f840d1d))
* use v3 deploy as source of deployment scripts. ([200d0a3](https://www.github.com/aave/aave-v3-periphery/commit/200d0a34856c4a73e2fa11b170f99cfe27fa9bc2))

## [1.5.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.4.3...v1.5.0) (2021-11-15)


### Features

* bump solc to 0.8.10 as @aave/core-v3 ([30a818f](https://www.github.com/aave/aave-v3-periphery/commit/30a818f5ec574da83e174087a2c930fc4833b624))

### [1.4.3](https://www.github.com/aave/aave-v3-periphery/compare/v1.4.2...v1.4.3) (2021-11-12)


### Bug Fixes

* compiling ([1e2394b](https://www.github.com/aave/aave-v3-periphery/commit/1e2394bef6999924ac8cd3d7e357bd3e5f985640))
* fix order of fields ([9f73cd4](https://www.github.com/aave/aave-v3-periphery/commit/9f73cd499118fb6273004b46c482efbcb3f23d54))
* fixed interface order ([58534d3](https://www.github.com/aave/aave-v3-periphery/commit/58534d301897b08cc3f2b966450ba878d5ce0b6d))

### [1.4.2](https://www.github.com/aave/aave-v3-periphery/compare/v1.4.1...v1.4.2) (2021-11-10)


### Bug Fixes

* add prepublish compilation to export artifacts ([ec15da8](https://www.github.com/aave/aave-v3-periphery/commit/ec15da8ffb6271d1c64401e310ce954764ae7140))

### [1.4.1](https://www.github.com/aave/aave-v3-periphery/compare/v1.4.0...v1.4.1) (2021-11-10)


### Features

* added debt ceiling decimals ([005fec4](https://www.github.com/aave/aave-v3-periphery/commit/005fec439867746bfbdf0fdcd20f6b175ac45904))
* added extra fields ([fd56951](https://www.github.com/aave/aave-v3-periphery/commit/fd56951654976a37478e151d7e1b415f8cab2a7d))
* added missing fields in UiPoolDataProvider. Added UiIncentiveDataProvider helper ([ab7a460](https://www.github.com/aave/aave-v3-periphery/commit/ab7a460c9889b311dbb8eb29a11efd6c67ad9081))
* added UiIncentiveDataProvider helper ([774f1a9](https://www.github.com/aave/aave-v3-periphery/commit/774f1a9c653b5783e8a746583fa522df7cf49345))


### Bug Fixes

* solved conflicts ([96f5793](https://www.github.com/aave/aave-v3-periphery/commit/96f5793d101362a2d55975570be0e6328353e9a0))


### Miscellaneous Chores

* release 1.4.1 ([3868319](https://www.github.com/aave/aave-v3-periphery/commit/3868319d3386fac718dd7c8bcd0c817e6b22966f))

## [1.4.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.3.0...v1.4.0) (2021-11-05)


### Features

* updated with maker case ([55a2be9](https://www.github.com/aave/aave-v3-periphery/commit/55a2be961aca772a5762ad4e9b627271aae7de47))

## [1.3.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.2.0...v1.3.0) (2021-10-20)


### Features

* ui pool data provider with full information ([b7e9cef](https://www.github.com/aave/aave-v3-periphery/commit/b7e9cefc49bf64206334be38f3a9da1923101287))
* updated ui pool data provider with latest logic ([06fe324](https://www.github.com/aave/aave-v3-periphery/commit/06fe3247c96392c955ddaa657e32f1c8ed0a6796))


### Bug Fixes

* added slopes ([b8f98a3](https://www.github.com/aave/aave-v3-periphery/commit/b8f98a35b513113585daaffe0eb3e22ca3d46d32))

## [1.2.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.1.0...v1.2.0) (2021-10-01)


### Features

* Adapt codebase and test setup to @aave/core-v3@1.1.0 ([79c8468](https://www.github.com/aave/aave-v3-periphery/commit/79c8468eca13dfde6ee24b1c996e3602be5d4d95))

## [1.1.0](https://www.github.com/aave/aave-v3-periphery/compare/v1.0.0...v1.1.0) (2021-09-16)


### Features

* bump Solidity version to 0.8.7 ([a0a9758](https://www.github.com/aave/aave-v3-periphery/commit/a0a9758239383898e2b193e4cc465ee2b35ca37d))
* fix github packages installation in workflows. ([40727dc](https://www.github.com/aave/aave-v3-periphery/commit/40727dcfcc2941aae373dd076e4097ab0c205336))


### Bug Fixes

* test scripts and fix typescript integration with dependencies ([02ec4b9](https://www.github.com/aave/aave-v3-periphery/commit/02ec4b9d8c73e9c80229baa13ac5321f0da9cdce))

## 1.0.0 (2021-09-15)


### Features

* Add helpers for contracts deployments and accessors ([af5788f](https://www.github.com/aave/aave-v3-periphery/commit/af5788f878b6ab30c8398dffd71ec93ceff458e4))
* Add periphery contracts importing core dependencies ([eefed97](https://www.github.com/aave/aave-v3-periphery/commit/eefed972df7dc54b9940ff4cba85e52fe8d0fa45))
* Add primary Aave markets ([630fa4b](https://www.github.com/aave/aave-v3-periphery/commit/630fa4b2d743b0f14e759b08e351542bcb8bddf4))
* Add SelfdsetructTransfer contract ([e87d96e](https://www.github.com/aave/aave-v3-periphery/commit/e87d96e75fce326c20183501d8397b948afe107c))
* Add test files ([662f8d6](https://www.github.com/aave/aave-v3-periphery/commit/662f8d604ff0851c8a94e680f46569c0ff853f8f))
* Added workflow files for test during PRs and release-please integration ([80f723e](https://www.github.com/aave/aave-v3-periphery/commit/80f723e30ddf020e756b49bf4d610e9442f791ad))
* Fix contracts compiler warnings ([0453a47](https://www.github.com/aave/aave-v3-periphery/commit/0453a47d3cb56496f61dd830e36bad20a29d2c10))


### Bug Fixes

* Fix error on hardhat config ([d77b1d2](https://www.github.com/aave/aave-v3-periphery/commit/d77b1d20e8429368fa1c38c0b0acecd512cfe882))
* Fix error on verify task ([e09fba1](https://www.github.com/aave/aave-v3-periphery/commit/e09fba189d5b1e262acd224c6aa14c6b8e56de96))
* move worflows inside .github directory ([8a2e35b](https://www.github.com/aave/aave-v3-periphery/commit/8a2e35b8721310b87d9abe261c53f8dbc390abdf))
* Refactor test setup ([585c74b](https://www.github.com/aave/aave-v3-periphery/commit/585c74b5f152c8de4a79d774bd462bd6370259f2))
* Remove `buidler` references ([5bdd96e](https://www.github.com/aave/aave-v3-periphery/commit/5bdd96eb04fb3edac26bd9e0e89cdab55768b44f))
