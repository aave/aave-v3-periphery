import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { ONE_ADDRESS, waitForTx } from '@aave/deploy-v3';
import { makeSuite, TestEnv } from './helpers/make-suite';
import { Faucet, TestnetERC20, TestnetERC20__factory } from '../types';

declare let hre: HardhatRuntimeEnvironment;

makeSuite('Faucet', (testEnv: TestEnv) => {
  const mintAmount = parseEther('100');

  let faucetOwnable: Faucet;
  let tokenMintable: TestnetERC20;

  before(async () => {
    // Enforce permissioned mode as disabled for deterministic test suite

    const { deployer } = await hre.getNamedAccounts();
    const factory = await hre.ethers.getContractFactory('Faucet');

    faucetOwnable = (await factory.deploy(deployer, false, 10000)) as Faucet; // 10k whole tokens

    const mintableFactory = await hre.ethers.getContractFactory('TestnetERC20');
    tokenMintable = (await mintableFactory.deploy(
      'MintableToken',
      'TOK',
      18,
      faucetOwnable.address
    )) as TestnetERC20;

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
      } = testEnv;

      await waitForTx(
        await faucetOwnable
          .connect(user.signer)
          .mint(tokenMintable.address, user.address, mintAmount)
      );

      await expect(await tokenMintable.balanceOf(user.address)).eq(mintAmount);
    });

    it('Getter isPermissioned should return false', async () => {
      await expect(await faucetOwnable.isPermissioned()).is.equal(false);
    });

    it('Mint function should mint tokens within limit', async () => {
      const {
        users: [, , , user],
        deployer,
      } = testEnv;

      const threshold = await faucetOwnable.connect(deployer.signer).getMaximumMintAmount();
      const thresholdValue = threshold.toNumber();
      const withinLimitThreshold = parseEther(thresholdValue.toString());

      const balanceBefore = await tokenMintable.balanceOf(user.address);

      await faucetOwnable
        .connect(deployer.signer)
        .mint(tokenMintable.address, user.address, withinLimitThreshold);

      const balanceAfter = await tokenMintable.balanceOf(user.address);
      await expect(balanceAfter.sub(balanceBefore)).eq(withinLimitThreshold);
    });

    it('Mint function should revert with values over the limit', async () => {
      const {
        users: [, , , user],
        deployer,
      } = testEnv;

      const threshold = await faucetOwnable.connect(deployer.signer).getMaximumMintAmount();
      const thresholdValue = threshold.toNumber();
      const maxLimitThreshold = parseEther((thresholdValue + 1).toString());

      await expect(
        faucetOwnable
          .connect(deployer.signer)
          .mint(tokenMintable.address, user.address, maxLimitThreshold)
      ).to.be.revertedWith('Error: Mint limit transaction exceeded');
    });

    it('setMaximumMintAmount updates maximum mint amount', async () => {
      const {
        users: [, , user],
      } = testEnv;

      const oldLimit = await faucetOwnable.getMaximumMintAmount();

      const newLimit: number = 100;
      await expect(await faucetOwnable.setMaximumMintAmount(newLimit));
      await expect(await faucetOwnable.getMaximumMintAmount()).eq(newLimit);
      await expect(
        faucetOwnable.mint(
          tokenMintable.address,
          user.address,
          parseEther((newLimit + 1).toString())
        )
      ).to.be.revertedWith('Error: Mint limit transaction exceeded');

      await expect(await faucetOwnable.setMaximumMintAmount(oldLimit));
      await expect(await faucetOwnable.getMaximumMintAmount()).eq(oldLimit);
    });

    it('Non-owner tries to deactivate minting (revert expected)', async () => {
      const {
        users: [, , user],
      } = testEnv;

      await expect(
        faucetOwnable.connect(user.signer).setMintable(tokenMintable.address, false)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Owner deactivates mint', async () => {
      const {
        deployer,
        users: [user],
      } = testEnv;

      expect(await faucetOwnable.isMintable(tokenMintable.address)).to.be.true;
      await waitForTx(
        await faucetOwnable.connect(deployer.signer).setMintable(tokenMintable.address, false)
      );
      expect(await faucetOwnable.isMintable(tokenMintable.address)).to.be.false;

      await expect(
        faucetOwnable.connect(user.signer).mint(tokenMintable.address, user.address, 1)
      ).to.be.revertedWith('Error: not mintable');

      expect(await faucetOwnable.isMintable(tokenMintable.address)).to.be.false;
      await waitForTx(
        await faucetOwnable.connect(deployer.signer).setMintable(tokenMintable.address, true)
      );
      expect(await faucetOwnable.isMintable(tokenMintable.address)).to.be.true;

      const balanceBefore = await tokenMintable.balanceOf(user.address);
      expect(await faucetOwnable.connect(user.signer).mint(tokenMintable.address, user.address, 1));
      expect(await tokenMintable.balanceOf(user.address)).eq(balanceBefore.add(1));
    });

    it('Getter isPermissioned should return false', async () => {
      await expect(await faucetOwnable.isPermissioned()).is.equal(false);
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
      } = testEnv;

      await expect(
        faucetOwnable.connect(user.signer).mint(tokenMintable.address, user.address, mintAmount)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Mint function can only be called by owner', async () => {
      const mintAmount = parseEther('100');
      const {
        users: [, , , user],
        deployer,
      } = testEnv;

      const initialBalance = await tokenMintable.balanceOf(user.address);

      await waitForTx(
        await faucetOwnable
          .connect(deployer.signer)
          .mint(tokenMintable.address, user.address, mintAmount)
      );

      await expect(await tokenMintable.balanceOf(user.address)).eq(initialBalance.add(mintAmount));
    });

    it('Getter isPermissioned should return true', async () => {
      await expect(await faucetOwnable.isPermissioned()).is.equal(true);
    });
  });

  it('Function setMaximumMintAmount should revert if caller not owner', async () => {
    const {
      users: [, , user],
    } = testEnv;

    await expect(faucetOwnable.connect(user.signer).setMaximumMintAmount(123)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
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

  it('Transfer ownership should revert if not owner', async () => {
    const {
      deployer,
      users: [user1],
    } = testEnv;

    const childContract = await new TestnetERC20__factory(deployer.signer).deploy(
      'CHILD',
      'CHILD',
      18,
      faucetOwnable.address
    );
    expect(await childContract.owner()).to.be.eq(faucetOwnable.address);
    await expect(
      faucetOwnable
        .connect(user1.signer)
        .transferOwnershipOfChild([childContract.address], ONE_ADDRESS)
    ).to.be.revertedWith('Ownable: caller is not the owner');
    expect(await childContract.owner()).to.be.eq(faucetOwnable.address);
  });

  it('Transfer ownership of child to another address', async () => {
    const { deployer } = testEnv;

    const childContract = await new TestnetERC20__factory(deployer.signer).deploy(
      'CHILD',
      'CHILD',
      18,
      faucetOwnable.address
    );
    expect(await childContract.owner()).to.be.eq(faucetOwnable.address);
    await faucetOwnable
      .connect(deployer.signer)
      .transferOwnershipOfChild([childContract.address], ONE_ADDRESS);
    expect(await childContract.owner()).to.be.eq(ONE_ADDRESS);
  });

  it('Direct mint should revert if protected and caller not owner', async () => {
    const {
      users: [, , user],
    } = testEnv;

    expect(await tokenMintable.isProtected()).to.be.true;
    await expect(
      tokenMintable.connect(user.signer)['mint(address,uint256)'](user.address, 1)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Direct mint if not protected', async () => {
    const {
      users: [, , user, user2],
    } = testEnv;

    expect(await tokenMintable.isProtected()).to.be.true;
    await expect(tokenMintable.connect(user.signer).setProtected(false)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
    expect(await faucetOwnable.setProtectedOfChild([tokenMintable.address], false));
    expect(await tokenMintable.isProtected()).to.be.false;

    // mintable by anyone
    expect(await tokenMintable.connect(user2.signer)['mint(uint256)'](1000));
    await expect(await tokenMintable.balanceOf(user2.address)).eq(1000);
  });
});
