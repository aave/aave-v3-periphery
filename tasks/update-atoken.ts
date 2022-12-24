import {ethers} from 'hardhat';
import {PoolConfigurator} from '../types';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address is ${deployer.address}`);

  const poolc = await ethers.getContractAt(
    'PoolConfigurator',
    '0xf3b459a9578fd76d5d935a9420eed18ebfbaf8d1'
  );

  // struct UpdateATokenInput {
  //   address asset, address treasury, address incentivesController, string name, string symbol, address implementation, bytes params
  // }

  const asset = '0x8cc0f052fff7ead7f2edcccac895502e884a8a71';
  const treasury = '0x6357EDbfE5aDA570005ceB8FAd3139eF5A8863CC';
  const incentivesController = '0x7DEb36c5D3f2B4894a0a21De8D13D5d3a0981fE2';
  const name = 'MahaLend ARTH';
  const symbol = 'mARTH';
  const implementation = '0x39F07A833F4Ba8d570fEEfE42b7CD342e7Ec7329';
  const params = '0x10';

  const tuple = {asset, treasury, incentivesController, name, symbol, implementation, params};

  console.log(JSON.stringify(tuple));

  try {
    // console.log(await poolc.callStatic.admin());
    await poolc.updateAToken(tuple);
  } catch (error) {
    console.log(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
