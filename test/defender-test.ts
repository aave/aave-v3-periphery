import chai, { expect } from 'chai';
import hardhat from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Greeter__factory } from '../typechain';
import { makeSuite } from './helpers/make-suit';
import { getEthersSigners } from '../helpers/wallet-helpers';
import { getDefenderSigner } from '../helpers/wallet-helpers';
import { Signer, utils } from 'ethers';

chai.use(solidity);

makeSuite('Greeter Tests', async () => {
  let greeter;
  let deployer;
  let defender;

  before(async () => {
    await hardhat.run('set-DRE');
    deployer = (await getEthersSigners())[0] as Signer;
    defender = await getDefenderSigner();
    await deployer.sendTransaction({
      to: defender.address,
      value: utils.parseEther('2'),
    });
    const greeterFactory = new Greeter__factory(defender);
    greeter = await greeterFactory.deploy(
      'Hello, world!',
      50,
      '0x6F179165237bC5948b0b4C05b3A94e0eAc9919F9'
    );
    await greeter.deployed();
  });

  describe('Greeter with defender signer', async () => {
    it("Should return the new greeting once it's changed", async function () {
      const newGreeting = 'Hey defender!';
      const tx = await greeter.connect(defender).setGreeting(newGreeting);
      await tx.wait();
      expect(await greeter.connect(defender).greet()).to.equal(newGreeting);
    });
  });
});
