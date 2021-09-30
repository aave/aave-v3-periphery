import {
  tEthereumAddress,
  iMultiPoolsAssets,
  IMarketRates,
  iAssetAggregatorBase,
  iAssetBase,
} from './types';
import { deployMockAggregator } from './contracts-deployments';
import { chunk, waitForTx } from './misc-utils';
import { MockAggregator, PriceOracle } from '../types';

export const setInitialAssetPricesInOracle = async (
  prices: iAssetBase<tEthereumAddress>,
  assetsAddresses: iAssetBase<tEthereumAddress>,
  priceOracleInstance: PriceOracle
) => {
  for (const [assetSymbol, price] of Object.entries(prices) as [string, string][]) {
    const assetAddressIndex = Object.keys(assetsAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, assetAddress] = (Object.entries(assetsAddresses) as [string, string][])[
      assetAddressIndex
    ];
    await waitForTx(await priceOracleInstance.setAssetPrice(assetAddress, price));
  }
};

export const deployAllMockAggregators = async (
  initialPrices: iAssetAggregatorBase<string>,
  verify?: boolean
) => {
  const aggregators: { [tokenSymbol: string]: MockAggregator } = {};
  for (const tokenContractName of Object.keys(initialPrices)) {
    if (tokenContractName !== 'ETH') {
      const priceIndex = Object.keys(initialPrices).findIndex(
        (value) => value === tokenContractName
      );
      const [, price] = (Object.entries(initialPrices) as [string, string][])[priceIndex];
      aggregators[tokenContractName] = await deployMockAggregator(price, verify);
    }
  }
  return aggregators;
};
