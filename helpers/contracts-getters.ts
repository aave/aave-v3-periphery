import { DRE, getDb, notFalsyOrZeroAddress } from './misc-utils';
import { eContractid, tEthereumAddress } from './types';
import { getFirstSigner } from '../helpers/wallet-helpers';
import {
  IERC20Detailed__factory,
  ReservesSetupHelper__factory,
  WETHGateway__factory,
  PoolConfigurator__factory,
  PoolAddressesProvider__factory,
  Pool__factory,
  PriceOracle__factory,
  AToken__factory,
  StableDebtToken__factory,
  VariableDebtToken__factory,
  MintableERC20__factory,
  WETH9Mocked__factory,
  PoolAddressesProviderRegistry__factory,
  AaveProtocolDataProvider__factory,
  ACLManager__factory,
} from '../types';

export const getPoolAddressesProvider = async (address?: tEthereumAddress) => {
  return await PoolAddressesProvider__factory.connect(
    address ||
      (await getDb().get(`${eContractid.PoolAddressesProvider}.${DRE.network.name}`).value())
        .address,
    await getFirstSigner()
  );
};

export const getPool = async (address?: tEthereumAddress) =>
  await Pool__factory.connect(
    address || (await getDb().get(`${eContractid.Pool}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getPriceOracle = async (address?: tEthereumAddress) =>
  await PriceOracle__factory.connect(
    address ||
      (await getDb().get(`${eContractid.PriceOracle}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getPoolConfiguratorProxy = async (address?: tEthereumAddress) => {
  return await PoolConfigurator__factory.connect(
    address ||
      (await getDb().get(`${eContractid.PoolConfigurator}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );
};

export const getIErc20Detailed = async (address: tEthereumAddress) =>
  await IERC20Detailed__factory.connect(address, await getFirstSigner());

export const getPoolAddressesProviderRegistry = async (address?: tEthereumAddress) =>
  await PoolAddressesProviderRegistry__factory.connect(
    notFalsyOrZeroAddress(address)
      ? address
      : (
          await getDb()
            .get(`${eContractid.PoolAddressesProviderRegistry}.${DRE.network.name}`)
            .value()
        ).address,
    await getFirstSigner()
  );

export const getPairsTokenAggregator = (
  allAssetsAddresses: {
    [tokenSymbol: string]: tEthereumAddress;
  },
  aggregatorsAddresses: { [tokenSymbol: string]: tEthereumAddress }
): [string[], string[]] => {
  const { ETH, WETH, ...assetsAddressesWithoutEth } = allAssetsAddresses;
  const pairs = Object.entries(assetsAddressesWithoutEth).map(([tokenSymbol, tokenAddress]) => {
    //if (true/*tokenSymbol !== 'WETH' && tokenSymbol !== 'ETH' && tokenSymbol !== 'LpWETH'*/) {
    const aggregatorAddressIndex = Object.keys(aggregatorsAddresses).findIndex(
      (value) => value === tokenSymbol
    );
    const [, aggregatorAddress] = (Object.entries(aggregatorsAddresses) as [
      string,
      tEthereumAddress
    ][])[aggregatorAddressIndex];
    return [tokenAddress, aggregatorAddress];
    //}
  }) as [string, string][];

  const mappedPairs = pairs.map(([asset]) => asset);
  const mappedAggregators = pairs.map(([, source]) => source);

  return [mappedPairs, mappedAggregators];
};

export const getWETHMocked = async (address?: tEthereumAddress) =>
  await WETH9Mocked__factory.connect(
    address || (await getDb().get(`${eContractid.WETHMocked}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getWETHGateway = async (address?: tEthereumAddress) =>
  await WETHGateway__factory.connect(
    address ||
      (await getDb().get(`${eContractid.WETHGateway}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getAToken = async (address?: tEthereumAddress) =>
  await AToken__factory.connect(
    address || (await getDb().get(`${eContractid.AToken}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getStableDebtToken = async (address?: tEthereumAddress) =>
  await StableDebtToken__factory.connect(
    address ||
      (await getDb().get(`${eContractid.StableDebtToken}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getVariableDebtToken = async (address?: tEthereumAddress) =>
  await VariableDebtToken__factory.connect(
    address ||
      (await getDb().get(`${eContractid.VariableDebtToken}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getMintableERC20 = async (address: tEthereumAddress) =>
  await MintableERC20__factory.connect(
    address ||
      (await getDb().get(`${eContractid.MintableERC20}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getAaveProtocolDataProvider = async (address?: tEthereumAddress) =>
  await AaveProtocolDataProvider__factory.connect(
    address ||
      (await getDb().get(`${eContractid.AaveProtocolDataProvider}.${DRE.network.name}`).value())
        .address,
    await getFirstSigner()
  );

export const getACLManager = async (address?: tEthereumAddress) => {
  return await ACLManager__factory.connect(
    address || (await getDb().get(`${eContractid.ACLManager}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );
};

export const getReservesSetupHelper = async (address?: tEthereumAddress) =>
  await ReservesSetupHelper__factory.connect(
    address ||
      (await getDb().get(`${eContractid.ReservesSetupHelper}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );
