import { FlashLoanLogic } from './../types/FlashLoanLogic.d';
import { DRE } from './misc-utils';
import { eContractid, tEthereumAddress, TokenContractId, tStringTokenSmallUnits } from './types';
import { getFirstSigner } from './wallet-helpers';
import {
  insertContractAddressInDb,
  linkBytecode,
  registerContractInJsonDb,
  withSave,
  withSaveAndVerify,
} from './contracts-helpers';
import {
  WalletBalanceProvider__factory,
  WETHGateway__factory,
  SelfdestructTransfer__factory,
  WETH9Mocked__factory,
  ACLManager__factory,
  ReservesSetupHelper__factory,
  MintableERC20,
  MintableERC20__factory,
  PoolAddressesProvider__factory,
  PoolAddressesProviderRegistry__factory,
  Pool__factory,
  ConfiguratorLogic__factory,
  PoolConfigurator__factory,
  PriceOracle__factory,
  MockAggregator__factory,
  AaveOracle__factory,
  MockFlashLoanReceiver__factory,
  AaveProtocolDataProvider__factory,
  DefaultReserveInterestRateStrategy__factory,
  DelegationAwareAToken__factory,
  StableDebtToken__factory,
  VariableDebtToken__factory,
  AToken__factory,
  WETH9Mocked,
  MockIncentivesController__factory,
} from '../types';
import { PoolLibraryAddresses } from '../types/factories/Pool__factory';
import { MockContract } from 'ethereum-waffle';
import AaveConfig from '../market-config';

const readArtifact = async (id: string) => {
  return DRE.artifacts.readArtifact(id);
};

export const deployWETHMocked = async () =>
  withSave(await new WETH9Mocked__factory(await getFirstSigner()).deploy(), eContractid.WETHMocked);

export const deployMintableERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC20> =>
  withSaveAndVerify(
    await new MintableERC20__factory(await getFirstSigner()).deploy(...args),
    eContractid.MintableERC20,
    args,
    verify
  );

export const deployGenericATokenImpl = async (pool: tEthereumAddress) =>
  withSave(await new AToken__factory(await getFirstSigner()).deploy(pool), eContractid.AToken);

export const deployPoolAddressesProvider = async (marketId: string, verify?: boolean) =>
  withSaveAndVerify(
    await new PoolAddressesProvider__factory(await getFirstSigner()).deploy(marketId),
    eContractid.PoolAddressesProvider,
    [marketId],
    verify
  );

export const deployPoolAddressesProviderRegistry = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PoolAddressesProviderRegistry__factory(await getFirstSigner()).deploy(),
    eContractid.PoolAddressesProviderRegistry,
    [],
    verify
  );

export const deployACLManager = async (provider: tEthereumAddress) =>
  withSave(
    await new ACLManager__factory(await getFirstSigner()).deploy(provider),
    eContractid.ACLManager
  );

export const deployDepositLogic = async (verify?: boolean) => {
  const depositLogicArtifact = await readArtifact(eContractid.DepositLogic);
  const linkedDepositLogicByteCode = linkBytecode(depositLogicArtifact, {});
  const depositLogic__factory = await DRE.ethers.getContractFactory(
    depositLogicArtifact.abi,
    linkedDepositLogicByteCode
  );
  const depositLogic = await (
    await depositLogic__factory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(depositLogic, eContractid.DepositLogic, [], verify);
};

export const deployBorrowLogic = async (verify?: boolean) => {
  const borrowLogicArtifact = await readArtifact(eContractid.BorrowLogic);

  const borrowLogic__factory = await DRE.ethers.getContractFactory(
    borrowLogicArtifact.abi,
    borrowLogicArtifact.bytecode
  );
  const borrowLogic = await (
    await borrowLogic__factory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(borrowLogic, eContractid.BorrowLogic, [], verify);
};

export const deployLiquidationLogic = async (verify?: boolean) => {
  const liquidationLogicArtifact = await readArtifact(eContractid.LiquidationLogic);

  const borrowLogic__factory = await DRE.ethers.getContractFactory(
    liquidationLogicArtifact.abi,
    liquidationLogicArtifact.bytecode
  );
  const liquidationLogic = await (
    await borrowLogic__factory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(liquidationLogic, eContractid.LiquidationLogic, [], verify);
};

export const deploySupplyLogic = async () => {
  const supplyLogicArtifact = await readArtifact(eContractid.SupplyLogic);

  const linkedSupplyLogicByteCode = linkBytecode(supplyLogicArtifact, {});
  const supplyLogicFactory = await DRE.ethers.getContractFactory(
    supplyLogicArtifact.abi,
    linkedSupplyLogicByteCode
  );
  const supplyLogic = await (
    await supplyLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSave(supplyLogic, eContractid.SupplyLogic);
};

export const deployBridgeLogic = async () => {
  const bridgeLogicArtifact = await readArtifact(eContractid.BridgeLogic);
  const bridgeLogicFactory = await DRE.ethers.getContractFactory(
    bridgeLogicArtifact.abi,
    bridgeLogicArtifact.bytecode
  );
  const bridgeLogic = await (
    await bridgeLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSave(bridgeLogic, eContractid.BridgeLogic);
};

export const deployEModeLogic = async () => {
  const eModeLogicArtifact = await readArtifact(eContractid.EModeLogic);

  const eModeLogicFactory = await DRE.ethers.getContractFactory(
    eModeLogicArtifact.abi,
    eModeLogicArtifact.bytecode
  );
  const eModeLogic = await (
    await eModeLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSave(eModeLogic, eContractid.EModeLogic);
};

export const deployFlashLoanLogic = async (borrowLogicAddress: tEthereumAddress) => {
  const flashLoanLogicArtifact = await readArtifact(eContractid.FlashLoanLogic);

  const linkedFlashLoanLogicByteCode = linkBytecode(flashLoanLogicArtifact, {
    [eContractid.BorrowLogic]: borrowLogicAddress,
  });

  const flashLoanLogicFactory = await DRE.ethers.getContractFactory(
    flashLoanLogicArtifact.abi,
    linkedFlashLoanLogicByteCode
  );

  const flashLoanLogic = await (
    await flashLoanLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSave(flashLoanLogic, eContractid.FlashLoanLogic);
};

export const deployAaveLibraries = async (): Promise<PoolLibraryAddresses> => {
  const supplyLogic = await deploySupplyLogic();
  const borrowLogic = await deployBorrowLogic();
  const liquidationLogic = await deployLiquidationLogic();
  const bridgeLogic = await deployBridgeLogic();
  const eModeLogic = await deployEModeLogic();
  const flashLoanLogic = await deployFlashLoanLogic(borrowLogic.address);
  // Hardcoded solidity placeholders, if any library changes path this will fail.
  // The '__$PLACEHOLDER$__ can be calculated via solidity keccak, but the PoolLibraryAddresses Type seems to
  // require a hardcoded string.
  //
  //  how-to:
  //  1. PLACEHOLDER = solidityKeccak256(['string'], `${libPath}:${libName}`).slice(2, 36)
  //  2. LIB_PLACEHOLDER = `__$${PLACEHOLDER}$__`
  // or grab placeholders from PoolLibraryAddresses at Typechain generation.
  //
  // libPath example: contracts/libraries/logic/GenericLogic.sol
  // libName example: GenericLogic
  return {
    ['contracts/protocol/libraries/logic/LiquidationLogic.sol:LiquidationLogic']:
      liquidationLogic.address,
    ['contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic']: supplyLogic.address,
    ['contracts/protocol/libraries/logic/EModeLogic.sol:EModeLogic']: eModeLogic.address,
    ['contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic']: borrowLogic.address,
    ['contracts/protocol/libraries/logic/BridgeLogic.sol:BridgeLogic']: bridgeLogic.address,
    ['contracts/protocol/libraries/logic/FlashLoanLogic.sol:FlashLoanLogic']:
      flashLoanLogic.address,
  };
};

export const deployPool = async (verify?: boolean) => {
  const libraries = await deployAaveLibraries();
  const poolImpl = await new Pool__factory(libraries, await getFirstSigner()).deploy();
  await insertContractAddressInDb(eContractid.PoolImpl, poolImpl.address);
  return withSaveAndVerify(poolImpl, eContractid.Pool, [], verify);
};

export const deployConfiguratorLogicLibrary = async (verify?: boolean) =>
  withSaveAndVerify(
    await new ConfiguratorLogic__factory(await getFirstSigner()).deploy(),
    eContractid.ConfiguratorLogic,
    [],
    verify
  );

export const deployPoolConfigurator = async (verify?: boolean) => {
  const configuratorLogic = await deployConfiguratorLogicLibrary(verify);
  const poolConfiguratorImpl = await new PoolConfigurator__factory(
    {
      ['contracts/protocol/libraries/logic/ConfiguratorLogic.sol:ConfiguratorLogic']:
        configuratorLogic.address,
    },
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(eContractid.PoolConfiguratorImpl, poolConfiguratorImpl.address);
  return withSaveAndVerify(poolConfiguratorImpl, eContractid.PoolConfigurator, [], verify);
};

export const deployWETHGateway = async (args: [tEthereumAddress], verify?: boolean) =>
  withSaveAndVerify(
    await new WETHGateway__factory(await getFirstSigner()).deploy(...args),
    eContractid.WETHGateway,
    args,
    verify
  );

export const deployPriceOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PriceOracle__factory(await getFirstSigner()).deploy(),
    eContractid.PriceOracle,
    [],
    verify
  );

export const deployMockAggregator = async (price: tStringTokenSmallUnits, verify?: boolean) =>
  withSaveAndVerify(
    await new MockAggregator__factory(await getFirstSigner()).deploy(price),
    eContractid.MockAggregator,
    [price],
    verify
  );

export const deployAaveOracle = async (
  args: [
    tEthereumAddress,
    tEthereumAddress[],
    tEthereumAddress[],
    tEthereumAddress,
    tEthereumAddress,
    string
  ],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new AaveOracle__factory(await getFirstSigner()).deploy(...args),
    eContractid.AaveOracle,
    args,
    verify
  );

export const deployAaveProtocolDataProvider = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new AaveProtocolDataProvider__factory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.AaveProtocolDataProvider,
    [addressesProvider],
    verify
  );

export const deployMockFlashLoanReceiver = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockFlashLoanReceiver__factory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.MockFlashLoanReceiver,
    [addressesProvider],
    verify
  );

export const deploySelfdestructTransferMock = async (verify?: boolean) =>
  withSaveAndVerify(
    await new SelfdestructTransfer__factory(await getFirstSigner()).deploy(),
    eContractid.SelfdestructTransferMock,
    [],
    verify
  );

export const deployWalletBalancerProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WalletBalanceProvider__factory(await getFirstSigner()).deploy(),
    eContractid.WalletBalanceProvider,
    [],
    verify
  );

export const deployDefaultReserveInterestRateStrategy = async (
  args: [tEthereumAddress, string, string, string, string, string, string, string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new DefaultReserveInterestRateStrategy__factory(await getFirstSigner()).deploy(...args),
    eContractid.DefaultReserveInterestRateStrategy,
    args,
    verify
  );

export const deployReservesSetupHelper = async () =>
  withSave(
    await new ReservesSetupHelper__factory(await getFirstSigner()).deploy(),
    eContractid.ReservesSetupHelper
  );

export const deployDelegationAwareATokenImpl = async (pool: tEthereumAddress, verify?: boolean) =>
  withSaveAndVerify(
    await new DelegationAwareAToken__factory(await getFirstSigner()).deploy(pool),
    eContractid.DelegationAwareAToken,
    [pool],
    verify
  );

export const deployGenericStableDebtToken = async (pool: tEthereumAddress, verify?: boolean) =>
  withSaveAndVerify(
    await new StableDebtToken__factory(await getFirstSigner()).deploy(pool),
    eContractid.StableDebtToken,
    [pool],
    verify
  );

export const deployGenericVariableDebtToken = async (pool: tEthereumAddress, verify?: boolean) =>
  withSaveAndVerify(
    await new VariableDebtToken__factory(await getFirstSigner()).deploy(pool),
    eContractid.VariableDebtToken,
    [pool],
    verify
  );

export const deployAllMockTokens = async () => {
  const tokens: { [symbol: string]: MockContract | MintableERC20 | WETH9Mocked } = {};

  const protoConfigData = AaveConfig.ReservesConfig;

  for (const tokenSymbol of Object.keys(TokenContractId)) {
    if (tokenSymbol === 'WETH') {
      tokens[tokenSymbol] = await deployWETHMocked();
      await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
      continue;
    }
    let decimals = 18;

    let configData = (<any>protoConfigData)[tokenSymbol];

    if (!configData) {
      decimals = 18;
    }

    tokens[tokenSymbol] = await deployMintableERC20([
      tokenSymbol,
      tokenSymbol,
      configData ? configData.reserveDecimals : 18,
    ]);
    await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
  }

  return tokens;
};

export const deployMockIncentivesController = async () =>
  withSave(
    await new MockIncentivesController__factory(await getFirstSigner()).deploy(),
    eContractid.MockIncentivesController
  );
