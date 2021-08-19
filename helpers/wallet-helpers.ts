import { Wallet, Signer, utils } from 'ethers';
import { DefenderRelaySigner, DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import { DRE, getImpersonatedSigner } from './misc-utils';
import { usingTenderly } from './tenderly-utils';
import { tEthereumAddress } from './types';

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export const getPrivateKeySigner = (): Signer => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
  try {
    return new Wallet(PRIVATE_KEY, DRE.ethers.provider);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

export const getMnemonicSigner = (): Signer => {
  const MNEMONIC = process.env.MNEMONIC || '';
  const WALLET_INDEX = process.env.WALLET_INDEX || '0';
  try {
    const parentHdNode = utils.HDNode.fromMnemonic(MNEMONIC);
    const childHdNode = parentHdNode.derivePath(`m/44'/60'/0'/0/${WALLET_INDEX}`);
    return new Wallet(childHdNode.privateKey, DRE.ethers.provider);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

export const usingDefender = (): boolean => process.env.DEFENDER === 'true';

export const getDefenderSigner = async (): Promise<Signer> => {
  let defenderSigner: Signer;
  const { DEFENDER_API_KEY, DEFENDER_SECRET_KEY } = process.env;
  if (!DEFENDER_API_KEY || !DEFENDER_SECRET_KEY) {
    throw new Error('Defender secrets required');
  }

  const credentials = { apiKey: DEFENDER_API_KEY, apiSecret: DEFENDER_SECRET_KEY };
  defenderSigner = new DefenderRelaySigner(credentials, new DefenderRelayProvider(credentials), {
    speed: 'fast',
  });

  // Replace signer if FORK=main is active
  const defenderAddress = await defenderSigner.getAddress();
  if (process.env.FORK === 'main') {
    defenderSigner = await getImpersonatedSigner(defenderAddress);
  }
  // Replace signer if Tenderly network is active
  if (usingTenderly()) {
    defenderSigner = await DRE.ethers.getSigner(defenderAddress);
  }
  return defenderSigner;
};

export const getDefaultSigner = async (signerName: string): Promise<Signer> => {
  const signerNameLowerCase = signerName.toLowerCase();
  if (
    signerNameLowerCase === 'privatekey' ||
    signerNameLowerCase === 'private key' ||
    signerNameLowerCase === 'pk'
  ) {
    return getPrivateKeySigner();
  }
  if (signerNameLowerCase.toLowerCase() === 'mnemonic' || signerNameLowerCase === 'mn') {
    return getMnemonicSigner();
  }
  if (signerNameLowerCase.toLowerCase() === 'defender' || signerNameLowerCase === 'ozd') {
    return await getDefenderSigner();
  }
  throw new Error('Unrecognized Signer Type Selected');
};

export const getEthersSigners = async (): Promise<Signer[]> => {
  return await Promise.all(await DRE.ethers.getSigners());
};

export const getFirstSigner = async (): Promise<Signer> => {
  return (await getEthersSigners())[0];
};

export const getEthersSignersAddresses = async (): Promise<tEthereumAddress[]> =>
  await Promise.all((await getEthersSigners()).map((signer) => signer.getAddress()));
