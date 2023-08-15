import {
  MAX_UINT_AMOUNT,
  evmRevert,
  evmSnapshot,
  getFirstSigner,
  parseUnitsFromToken,
  tEthereumAddress,
} from '@aave/deploy-v3';
import {
  MockParaSwapAugustus__factory,
  MockParaSwapAugustusRegistry__factory,
  ParaSwapWithdrawSwapAdapter__factory,
} from '../../types';
import { MockParaSwapAugustus } from '../../types/MockParaSwapAugustus';
import { MockParaSwapAugustusRegistry } from '../../types/MockParaSwapAugustusRegistry';
import { ParaSwapWithdrawSwapAdapter } from '../../types/ParaSwapWithdrawSwapAdapter.d';
import { makeSuite, TestEnv } from '../helpers/make-suite';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import BigNumber from 'bignumber.js';
import hre from 'hardhat';
import { buildPermitParams, getSignatureFromTypedData } from './utils';
import { accounts } from '../../helpers/test-wallets';
import { PANIC_CODES } from '@nomicfoundation/hardhat-chai-matchers/panic';

makeSuite('ParaSwap adapters', (testEnv: TestEnv) => {
  let mockAugustus: MockParaSwapAugustus;
  let mockAugustusRegistry: MockParaSwapAugustusRegistry;
  let paraswapWithdrawSwapAdapter: ParaSwapWithdrawSwapAdapter;
  let evmSnapshotId: string;

  before(async () => {
    const { addressesProvider, deployer } = testEnv;

    mockAugustus = await new MockParaSwapAugustus__factory(await getFirstSigner()).deploy();
    mockAugustusRegistry = await new MockParaSwapAugustusRegistry__factory(
      await getFirstSigner()
    ).deploy(mockAugustus.address);
    paraswapWithdrawSwapAdapter = await deployParaSwapWithdrawSwapAdapter(
      addressesProvider.address,
      mockAugustusRegistry.address,
      deployer.address
    );
  });

  beforeEach(async () => {
    evmSnapshotId = await evmSnapshot();
  });

  afterEach(async () => {
    await evmRevert(evmSnapshotId);
  });

  describe('ParaSwapWithdrawSwapAdapter', () => {
    describe('constructor()', () => {
      it('should deploy with correct parameters', async () => {
        const { addressesProvider, deployer } = testEnv;
        await deployParaSwapWithdrawSwapAdapter(
          addressesProvider.address,
          mockAugustusRegistry.address,
          deployer.address
        );
      });

      it('should revert if not valid addresses provider', async () => {
        const { deployer } = testEnv;
        await expect(
          deployParaSwapWithdrawSwapAdapter(
            mockAugustus.address, // any invalid contract can be used here
            mockAugustusRegistry.address,
            deployer.address
          )
        ).to.be.reverted;
      });

      it('should revert if not valid augustus registry', async () => {
        const { addressesProvider, deployer } = testEnv;
        await expect(
          deployParaSwapWithdrawSwapAdapter(
            addressesProvider.address,
            mockAugustus.address, // any invalid contract can be used here
            deployer.address
          )
        ).to.be.reverted;
      });
    });

    describe('withdrawAndSwap', () => {
      beforeEach(async () => {
        const { users, weth, dai, pool, deployer } = testEnv;
        const userAddress = users[0].address;

        // Provide liquidity
        await dai['mint(uint256)'](parseEther('20000'));
        await dai.approve(pool.address, parseEther('20000'));
        await pool.deposit(dai.address, parseEther('20000'), deployer.address, 0);

        await weth['mint(uint256)'](parseEther('10000'));
        await weth.approve(pool.address, parseEther('10000'));
        await pool.deposit(weth.address, parseEther('10000'), deployer.address, 0);

        // Make a deposit for user
        await weth['mint(uint256)'](parseEther('100'));
        await weth.approve(pool.address, parseEther('100'));
        await pool.deposit(weth.address, parseEther('100'), userAddress, 0);
      });

      it('should correctly withdraw and swap', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);
        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        )
          .to.emit(paraswapWithdrawSwapAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, amountWETHtoSwap, expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapWithdrawSwapAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapWithdrawSwapAdapter.address);
        const userDaiBalance = await dai.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiBalance).to.be.eq(expectedDaiAmount);
        expect(userAEthBalance).to.be.eq(userAEthBalanceBefore.sub(amountWETHtoSwap));
      });

      it('should correctly withdraw and swap using permit', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        const chainId = hre.network.config.chainId;
        if (!chainId) throw 'missing chainid';
        const deadline = MAX_UINT_AMOUNT;
        const nonce = (await aWETH.nonces(userAddress)).toNumber();
        const msgParams = buildPermitParams(
          chainId,
          aWETH.address,
          '1',
          await aWETH.name(),
          userAddress,
          paraswapWithdrawSwapAdapter.address,
          nonce,
          deadline,
          amountWETHtoSwap.toString()
        );

        const ownerPrivateKey = accounts[3].secretKey;
        if (!ownerPrivateKey) {
          throw new Error('INVALID_OWNER_PK');
        }

        const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: amountWETHtoSwap,
                deadline,
                v,
                r,
                s,
              }
            )
        )
          .to.emit(paraswapWithdrawSwapAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, amountWETHtoSwap, expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapWithdrawSwapAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapWithdrawSwapAdapter.address);
        const userDaiBalance = await dai.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiBalance).to.be.eq(expectedDaiAmount);
        expect(userAEthBalance).to.be.eq(userAEthBalanceBefore.sub(amountWETHtoSwap));
      });

      it('should revert when trying to swap more than balance', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = (await parseUnitsFromToken(weth.address, '100')).add(1);

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWithPanic(PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW);
      });

      it('should revert when trying to swap more than allowance', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        await aWETH
          .connect(user)
          .approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap.sub(1));

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWithPanic(PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW);
      });

      it('should revert when min amount to receive exceeds the max slippage amount', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        const smallExpectedDaiAmount = expectedDaiAmount.div(2);

        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              smallExpectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWith('MIN_AMOUNT_EXCEEDS_MAX_SLIPPAGE');
      });

      it('should revert if wrong address used for Augustus', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter.connect(user).withdrawAndSwap(
            weth.address,
            dai.address,
            amountWETHtoSwap,
            expectedDaiAmount,
            0,
            mockAugustusCalldata,
            oracle.address, // using arbitrary contract instead of mock Augustus
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            }
          )
        ).to.be.revertedWith('INVALID_AUGUSTUS');
      });

      it('should bubble up errors from Augustus', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        // Add 1 to expected amount so it will fail
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount.add(1),
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWith('Received amount of tokens are less than expected');
      });

      it('should revert if Augustus swaps for less than minimum to receive', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );
        const actualDaiAmount = expectedDaiAmount.sub(1);

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          actualDaiAmount
        );

        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          actualDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWith('INSUFFICIENT_AMOUNT_RECEIVED');
      });

      it("should revert if Augustus doesn't swap correct amount", async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        const augustusSwapAmount = amountWETHtoSwap.sub(1);

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          augustusSwapAmount,
          augustusSwapAmount,
          expectedDaiAmount
        );

        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          augustusSwapAmount,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWith('WRONG_BALANCE_AFTER_SWAP');
      });

      it('should correctly swap all the balance when using a bigger amount', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        // Remove other balance
        await aWETH.connect(user).transfer(users[1].address, parseEther('90'));

        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);
        expect(userAEthBalanceBefore).to.be.eq(amountWETHtoSwap);

        const bigAmountToSwap = parseEther('11');
        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, bigAmountToSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          bigAmountToSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              bigAmountToSwap,
              expectedDaiAmount,
              4 + 2 * 32,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        )
          .to.emit(paraswapWithdrawSwapAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, amountWETHtoSwap, expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapWithdrawSwapAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapWithdrawSwapAdapter.address);
        const userDaiBalance = await dai.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiBalance).to.be.eq(expectedDaiAmount);
        expect(userAEthBalance).to.be.eq('0');
      });

      it('should correctly swap all the balance when using permit', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        // Remove other balance
        await aWETH.connect(user).transfer(users[1].address, parseEther('90'));

        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);
        expect(userAEthBalanceBefore).to.be.eq(amountWETHtoSwap);

        const bigAmountToSwap = parseEther('11');

        const chainId = hre.network.config.chainId;
        if (!chainId) throw 'missing chainid';

        const deadline = MAX_UINT_AMOUNT;
        const nonce = (await aWETH.nonces(userAddress)).toNumber();
        const msgParams = buildPermitParams(
          chainId,
          aWETH.address,
          '1',
          await aWETH.name(),
          userAddress,
          paraswapWithdrawSwapAdapter.address,
          nonce,
          deadline,
          bigAmountToSwap.toString()
        );

        const ownerPrivateKey = accounts[3].secretKey;
        if (!ownerPrivateKey) {
          throw new Error('INVALID_OWNER_PK');
        }

        const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          bigAmountToSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              bigAmountToSwap,
              expectedDaiAmount,
              4 + 2 * 32,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: bigAmountToSwap,
                deadline,
                v,
                r,
                s,
              }
            )
        )
          .to.emit(paraswapWithdrawSwapAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, amountWETHtoSwap, expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapWithdrawSwapAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapWithdrawSwapAdapter.address);
        const userDaiBalance = await dai.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiBalance).to.be.eq(expectedDaiAmount);
        expect(userAEthBalance).to.be.eq('0');
      });

      it('should revert trying to swap all the balance when using a smaller amount', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );

        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        // Remove other balance
        await aWETH.connect(user).transfer(users[1].address, parseEther('90'));

        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);
        expect(userAEthBalanceBefore).to.be.eq(amountWETHtoSwap);

        const smallAmountToSwap = parseEther('10').sub(1);
        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, smallAmountToSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          smallAmountToSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              smallAmountToSwap,
              expectedDaiAmount,
              4 + 2 * 32,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWith('INSUFFICIENT_AMOUNT_TO_SWAP');
      });

      it('should not touch any token balance already in the adapter', async () => {
        const { users, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        // Put token balances in the adapter
        const adapterWethBalanceBefore = parseEther('123');
        await weth['mint(uint256)'](adapterWethBalanceBefore);
        await weth.transfer(paraswapWithdrawSwapAdapter.address, adapterWethBalanceBefore);
        const adapterDaiBalanceBefore = parseEther('234');
        await dai['mint(uint256)'](adapterDaiBalanceBefore);
        await dai.transfer(paraswapWithdrawSwapAdapter.address, adapterDaiBalanceBefore);

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const ethPrice = await oracle.getAssetPrice(weth.address);
        const expectedDaiAmount = await parseUnitsFromToken(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString())
            .times(ethPrice.toString())
            .div(daiPrice.toString())
            .shiftedBy(-18)
            .toFixed(0)
        );
        await mockAugustus.expectSwap(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          amountWETHtoSwap,
          expectedDaiAmount
        );

        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);
        await aWETH.connect(user).approve(paraswapWithdrawSwapAdapter.address, amountWETHtoSwap);

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('swap', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        await expect(
          paraswapWithdrawSwapAdapter
            .connect(user)
            .withdrawAndSwap(
              weth.address,
              dai.address,
              amountWETHtoSwap,
              expectedDaiAmount,
              0,
              mockAugustusCalldata,
              mockAugustus.address,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        )
          .to.emit(paraswapWithdrawSwapAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, amountWETHtoSwap, expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapWithdrawSwapAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapWithdrawSwapAdapter.address);
        const userDaiBalance = await dai.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq(adapterWethBalanceBefore);
        expect(adapterDaiBalance).to.be.eq(adapterDaiBalanceBefore);
        expect(userDaiBalance).to.be.eq(expectedDaiAmount);
        expect(userAEthBalance).to.be.eq(userAEthBalanceBefore.sub(amountWETHtoSwap));
      });
    });
  });
});

async function deployParaSwapWithdrawSwapAdapter(
  poolAddressesProvider: tEthereumAddress,
  augustusRegistry: tEthereumAddress,
  owner: tEthereumAddress
) {
  return await new ParaSwapWithdrawSwapAdapter__factory(await getFirstSigner()).deploy(
    poolAddressesProvider,
    augustusRegistry,
    owner
  );
}
