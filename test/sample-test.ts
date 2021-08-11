import chai, { expect } from 'chai';
import hardhat from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Greeter__factory } from '../typechain';
import { DRE, getImpersonatedSigner } from '../helpers/misc-utils';
import { makeSuite } from './helpers/make-suit';
import { getEthersSigners, getFirstSigner } from '../helpers/wallet-helpers';

chai.use(solidity);

makeSuite('Greeter Tests', async () => {
  let greeter;
  let deployer;
  let users;

  before(async () => {
    await hardhat.run('set-DRE');
    [deployer, ...users] = await getEthersSigners();
    const whaleSigner = await getImpersonatedSigner('0x26a78d5b6d7a7aceedd1e6ee3229b372a624d8b7');
    const greeterFactory = new Greeter__factory(whaleSigner);
    greeter = await greeterFactory.deploy(
      'Hello, world!',
      50,
      '0x6F179165237bC5948b0b4C05b3A94e0eAc9919F9'
    );
    await greeter.deployed();
  });
  describe('Greeter', async () => {
    it("Should return the new greeting once it's changed", async function () {
      expect(await greeter.connect(deployer).greet()).to.equal('Hello, world!');
      await greeter.connect(users[0]).setGreeting('Hola, mundo!');
      expect(await greeter.connect(users[1]).greet()).to.equal('Hola, mundo!');
    });
    it('Check the test number', async function () {
      expect(await greeter.connect(await getFirstSigner()).getTestNumber()).to.equal(50);
    });
    it('Check the test address', async function () {
      expect(await greeter.getAddress()).to.be.properAddress;
    });
  });
});
