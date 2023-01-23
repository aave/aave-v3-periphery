import { HardhatUserConfig } from 'hardhat/types';
import { accounts } from './helpers/test-wallets';
import { NETWORKS_RPC_URL } from './helper-hardhat-config';

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomicfoundation/hardhat-chai-matchers';
import '@typechain/hardhat';
import '@tenderly/hardhat-tenderly';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-dependency-compiler';
import 'hardhat-deploy';

import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_BLOCK_GAS_LIMIT = 12450000;
const MAINNET_FORK = process.env.MAINNET_FORK === 'true';
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || '';
const TENDERLY_USERNAME = process.env.TENDERLY_USERNAME || '';
const TENDERLY_FORK_NETWORK_ID = process.env.TENDERLY_FORK_NETWORK_ID || '1';
const REPORT_GAS = process.env.REPORT_GAS === 'true';

const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || '';
// const POLYGONSCAN_KEY = process.env.POLYGONSCAN_KEY || '';

const mainnetFork = MAINNET_FORK
  ? {
      blockNumber: 12012081,
      url: NETWORKS_RPC_URL['main'],
    }
  : undefined;

// export hardhat config
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.10',
        settings: {
          optimizer: { enabled: true, runs: 25000 },
          evmVersion: 'london',
        },
      },
    ],
  },
  tenderly: {
    project: TENDERLY_PROJECT,
    username: TENDERLY_USERNAME,
    forkNetwork: TENDERLY_FORK_NETWORK_ID,
  },
  typechain: {
    outDir: 'types',
    externalArtifacts: [
      'node_modules/@mahalend/deploy/artifacts/contracts/**/*[!dbg].json',
      'node_modules/@mahalend/deploy/artifacts/contracts/**/**/*[!dbg].json',
      'node_modules/@mahalend/deploy/artifacts/contracts/**/**/**/*[!dbg].json',
      'node_modules/@mahalend/deploy/artifacts/contracts/mocks/tokens/WETH9Mocked.sol/WETH9Mocked.json',
    ],
  },
  gasReporter: {
    enabled: REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API,
  },
  networks: {
    hardhat: {
      hardfork: 'berlin',
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: 8000000000,
      chainId: 31337,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => ({
        privateKey: secretKey,
        balance,
      })),
      forking: mainnetFork,
      allowUnlimitedContractSize: true,
    },
    main: {
      url: 'https://cloudflare-eth.com',
      accounts: {
        mnemonic: process.env.MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    ganache: {
      url: 'http://ganache:8545',
      accounts: {
        mnemonic: 'fox sight canyon orphan hotel grow hedgehog build bless august weather swarm',
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  },
  mocha: {
    timeout: 80000,
    bail: true,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    aclAdmin: {
      default: 0,
    },
    emergencyAdmin: {
      default: 0,
    },
    poolAdmin: {
      default: 0,
    },
    addressesProviderRegistryOwner: {
      default: 0,
    },
    treasuryProxyAdmin: {
      default: 1,
    },
    incentivesProxyAdmin: {
      default: 1,
    },
    incentivesEmissionManager: {
      default: 0,
    },
    incentivesRewardsVault: {
      default: 2,
    },
  },
  // Need to compile aave-v3 contracts due no way to import external artifacts for hre.ethers
  dependencyCompiler: {
    paths: [
      '@mahalend/core/contracts/protocol/configuration/PoolAddressesProviderRegistry.sol',
      '@mahalend/core/contracts/protocol/configuration/PoolAddressesProvider.sol',
      '@mahalend/core/contracts/misc/AaveOracle.sol',
      '@mahalend/core/contracts/protocol/tokenization/AToken.sol',
      '@mahalend/core/contracts/protocol/tokenization/DelegationAwareAToken.sol',
      '@mahalend/core/contracts/protocol/tokenization/StableDebtToken.sol',
      '@mahalend/core/contracts/protocol/tokenization/VariableDebtToken.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/GenericLogic.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/ValidationLogic.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/ReserveLogic.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/SupplyLogic.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/EModeLogic.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/BorrowLogic.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/BridgeLogic.sol',
      '@mahalend/core/contracts/protocol/libraries/logic/FlashLoanLogic.sol',
      '@mahalend/core/contracts/protocol/pool/Pool.sol',
      '@mahalend/core/contracts/protocol/pool/PoolConfigurator.sol',
      '@mahalend/core/contracts/protocol/pool/DefaultReserveInterestRateStrategy.sol',
      '@mahalend/core/contracts/dependencies/openzeppelin/upgradeability/InitializableAdminUpgradeabilityProxy.sol',
      '@mahalend/core/contracts/protocol/libraries/aave-upgradeability/InitializableImmutableAdminUpgradeabilityProxy.sol',
      '@mahalend/core/contracts/deployments/ReservesSetupHelper.sol',
      '@mahalend/core/contracts/misc/AaveProtocolDataProvider.sol',
      '@mahalend/core/contracts/protocol/configuration/ACLManager.sol',
      '@mahalend/core/contracts/dependencies/weth/WETH9.sol',
      '@mahalend/core/contracts/mocks/helpers/MockIncentivesController.sol',
      '@mahalend/core/contracts/mocks/helpers/MockReserveConfiguration.sol',
      '@mahalend/core/contracts/mocks/oracle/CLAggregators/MockAggregator.sol',
      '@mahalend/core/contracts/mocks/tokens/MintableERC20.sol',
      '@mahalend/core/contracts/mocks/flashloan/MockFlashLoanReceiver.sol',
      '@mahalend/core/contracts/mocks/tokens/WETH9Mocked.sol',
      '@mahalend/core/contracts/mocks/upgradeability/MockVariableDebtToken.sol',
      '@mahalend/core/contracts/mocks/upgradeability/MockAToken.sol',
      '@mahalend/core/contracts/mocks/upgradeability/MockStableDebtToken.sol',
      '@mahalend/core/contracts/mocks/upgradeability/MockInitializableImplementation.sol',
      '@mahalend/core/contracts/mocks/helpers/MockPool.sol',
      '@mahalend/core/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol',
      '@mahalend/core/contracts/mocks/oracle/PriceOracle.sol',
      '@mahalend/core/contracts/mocks/tokens/MintableDelegationERC20.sol',
    ],
  },
  etherscan: {
    customChains: [],
    apiKey: ETHERSCAN_KEY,
  },
  external: {
    contracts: [
      {
        artifacts: './temp-artifacts',
        deploy: 'node_modules/@mahalend/deploy/dist/deploy',
      },
    ],
  },
};

export default config;
