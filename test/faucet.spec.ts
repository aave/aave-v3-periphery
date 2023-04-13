import { getFirstSigner, waitForTx } from '@aave/deploy-v3';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { makeSuite, TestEnv } from './helpers/make-suite';

declare let hre: HardhatRuntimeEnvironment;

makeSuite('Faucet', (testEnv: TestEnv) => {
  const mintAmount = parseEther('100');
  const maxMintAmount = parseEther('10000');

  let faucetOwnable;
  before(async () => {
    // Enforce permissioned mode as disabled for deterministic test suite

    const { deployer } = await hre.getNamedAccounts();
    const factory = await hre.ethers.getContractFactory('Faucet');

    faucetOwnable = await factory.deploy(deployer, false);

    await waitForTx(await faucetOwnable.setPermissioned(false));
  });
  describe('Permissioned mode: disabled', () => {
    before(async () => {
      // Enforce permissioned mode as disabled for deterministic test suite
      await waitForTx(await faucetOwnable.setPermissioned(false));
    });
    it('Mint can be called by anyone', async () => {
      const {
        users: [user],
        dai,
      } = testEnv;

      await waitForTx(
        await faucetOwnable.connect(user.signer).mint(dai.address, user.address, mintAmount)
      );

      await expect(await dai.balanceOf(user.address)).eq(mintAmount);
    });

    it('Getter isPermissioned should return false', async () => {
      await expect(await faucetOwnable.isPermissioned()).is.equal(false);
    });

    it('Mint function should mint tokens within limit', async () => {
      const withinLimitThreshold = parseEther('100');

      const {
        users: [, , , user],
        dai,
        deployer,
      } = testEnv;

      await faucetOwnable
        .connect(deployer.signer)
        .mint(dai.address, user.address, withinLimitThreshold);
      await expect(await dai.balanceOf(user.address)).eq(withinLimitThreshold);
    });

    it('Mint function should revert with values over 10,000', async () => {
      const maxCapacityThresholdMint = parseEther('10001');

      const {
        users: [, , , user],
        dai,
        deployer,
      } = testEnv;

      await expect(
        faucetOwnable
          .connect(deployer.signer)
          .mint(dai.address, user.address, maxCapacityThresholdMint)
      ).to.be.revertedWith('Error: Mint limit transaction exceeded');
    });
  });

  describe('Permissioned mode: enabled', () => {
    before(async () => {
      // Enforce permissioned mode as enabled for deterministic test suite
      await waitForTx(await faucetOwnable.setPermissioned(true));
    });
    it('Mint function should revert if caller not owner', async () => {
      const {
        users: [, , user],
        dai,
      } = testEnv;

      await expect(
        faucetOwnable.connect(user.signer).mint(dai.address, user.address, mintAmount)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Mint function can only be called by owner', async () => {
      const mintAmount = parseEther('100');
      const {
        users: [, , , user],
        dai,
        deployer,
      } = testEnv;

      const initialBalance = await dai.balanceOf(user.address);

      await waitForTx(
        await faucetOwnable.connect(deployer.signer).mint(dai.address, user.address, mintAmount)
      );

      await expect(await dai.balanceOf(user.address)).eq(initialBalance.add(mintAmount));
    });

    it('Getter isPermissioned should return true', async () => {
      await expect(await faucetOwnable.isPermissioned()).is.equal(true);
    });
  });

  it('Function setPermissioned should revert if caller not owner', async () => {
    const {
      users: [, , user],
    } = testEnv;

    await expect(faucetOwnable.connect(user.signer).setPermissioned(false)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });

  it('Function setPermissioned can only be called by owner: false input', async () => {
    const { deployer } = testEnv;

    await waitForTx(await faucetOwnable.connect(deployer.signer).setPermissioned(false));

    expect(await faucetOwnable.isPermissioned()).equal(false);
  });

  it('Function setPermissioned can only be called by owner: true input', async () => {
    const { deployer } = testEnv;

    await waitForTx(await faucetOwnable.connect(deployer.signer).setPermissioned(true));

    expect(await faucetOwnable.isPermissioned()).equal(true);
  });
});
