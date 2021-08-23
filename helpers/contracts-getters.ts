import { DRE, getDb, notFalsyOrZeroAddress } from './misc-utils';
import { eContractid, tEthereumAddress } from './types';
import { IERC20Detailed__factory, WETHGateway__factory } from '../types';
import { getFirstSigner } from '../helpers/wallet-helpers';
import {
  PoolConfiguratorFactory,
  PoolAddressesProviderFactory,
  PoolFactory,
  PriceOracleFactory,
  StableAndVariableTokensHelperFactory,
  ATokensAndRatesHelperFactory,
  ATokenFactory,
  StableDebtTokenFactory,
  VariableDebtTokenFactory,
  MintableERC20Factory,
  WETH9MockedFactory,
  PoolAddressesProviderRegistryFactory,
  AaveProtocolDataProviderFactory,
} from '../../aave-v3-core/types';

export const getPoolAddressesProvider = async (address?: tEthereumAddress) => {
  return await PoolAddressesProviderFactory.connect(
    address ||
      (await getDb().get(`${eContractid.PoolAddressesProvider}.${DRE.network.name}`).value())
        .address,
    await getFirstSigner()
  );
};

export const getPool = async (address?: tEthereumAddress) =>
  await PoolFactory.connect(
    address || (await getDb().get(`${eContractid.Pool}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getPriceOracle = async (address?: tEthereumAddress) =>
  await PriceOracleFactory.connect(
    address ||
      (await getDb().get(`${eContractid.PriceOracle}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getPoolConfiguratorProxy = async (address?: tEthereumAddress) => {
  return await PoolConfiguratorFactory.connect(
    address ||
      (await getDb().get(`${eContractid.PoolConfigurator}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );
};

export const getIErc20Detailed = async (address: tEthereumAddress) =>
  await IERC20Detailed__factory.connect(address, await getFirstSigner());

export const getPoolAddressesProviderRegistry = async (address?: tEthereumAddress) =>
  await PoolAddressesProviderRegistryFactory.connect(
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

export const getStableAndVariableTokensHelper = async (address?: tEthereumAddress) =>
  await StableAndVariableTokensHelperFactory.connect(
    address ||
      (
        await getDb()
          .get(`${eContractid.StableAndVariableTokensHelper}.${DRE.network.name}`)
          .value()
      ).address,
    await getFirstSigner()
  );

export const getATokensAndRatesHelper = async (address?: tEthereumAddress) =>
  await ATokensAndRatesHelperFactory.connect(
    address ||
      (await getDb().get(`${eContractid.ATokensAndRatesHelper}.${DRE.network.name}`).value())
        .address,
    await getFirstSigner()
  );

export const getWETHMocked = async (address?: tEthereumAddress) =>
  await WETH9MockedFactory.connect(
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
  await ATokenFactory.connect(
    address || (await getDb().get(`${eContractid.AToken}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getStableDebtToken = async (address?: tEthereumAddress) =>
  await StableDebtTokenFactory.connect(
    address ||
      (await getDb().get(`${eContractid.StableDebtToken}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getVariableDebtToken = async (address?: tEthereumAddress) =>
  await VariableDebtTokenFactory.connect(
    address ||
      (await getDb().get(`${eContractid.VariableDebtToken}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getMintableERC20 = async (address: tEthereumAddress) =>
  await MintableERC20Factory.connect(
    address ||
      (await getDb().get(`${eContractid.MintableERC20}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getAaveProtocolDataProvider = async (address?: tEthereumAddress) =>
  await AaveProtocolDataProviderFactory.connect(
    address ||
      (await getDb().get(`${eContractid.AaveProtocolDataProvider}.${DRE.network.name}`).value())
        .address,
    await getFirstSigner()
  );
