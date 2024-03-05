import {
  eContractid,
  evmRevert,
  evmSnapshot,
  getContract,
  getFirstSigner,
  MAX_UINT_AMOUNT,
  parseUnitsFromToken,
  StableDebtToken,
  tEthereumAddress,
} from '@aave/deploy-v3';
import {
  MockParaSwapAugustusRegistry__factory,
  MockParaSwapAugustus__factory,
  ParaSwapRepayAdapter,
  ParaSwapRepayAdapter__factory,
} from '../../types';
import { MockParaSwapAugustus } from '../../types/MockParaSwapAugustus';
import { MockParaSwapAugustusRegistry } from '../../types/MockParaSwapAugustusRegistry';
import { makeSuite, TestEnv } from '../helpers/make-suite';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import {
  buildParaswapBuyParams,
  buildParaSwapRepayParams,
  buildPermitParams,
  getSignatureFromTypedData,
} from './utils';
import hre from 'hardhat';
import BigNumber from 'bignumber.js';
import { accounts } from '../../helpers/test-wallets';

makeSuite('Paraswap adapters', (testEnv: TestEnv) => {
  let mockAugustus: MockParaSwapAugustus;
  let mockAugustusRegistry: MockParaSwapAugustusRegistry;
  let paraswapRepayAdapter: ParaSwapRepayAdapter;
  let evmSnapshotId: string;

  before(async () => {
    const { addressesProvider, deployer } = testEnv;

    mockAugustus = await new MockParaSwapAugustus__factory(await getFirstSigner()).deploy();
    mockAugustusRegistry = await new MockParaSwapAugustusRegistry__factory(
      await getFirstSigner()
    ).deploy(mockAugustus.address);
    paraswapRepayAdapter = await deployParaSwapRepayAdapter(
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

  describe('ParaswapRepayAdapter', () => {
    beforeEach(async () => {
      const { users, weth, dai, usdc, aave, pool, deployer } = testEnv;
      const userAddress = users[0].address;

      // Provide liquidity
      await dai['mint(uint256)'](parseEther('400000'));
      await dai.approve(pool.address, parseEther('400000'));
      await pool.deposit(dai.address, parseEther('400000'), deployer.address, 0);

      const usdcLiquidity = await parseUnitsFromToken(usdc.address, '5000000');
      await usdc['mint(uint256)'](usdcLiquidity);
      await usdc.approve(pool.address, usdcLiquidity);
      await pool.deposit(usdc.address, usdcLiquidity, deployer.address, 0);

      await weth['mint(uint256)'](parseEther('100'));
      await weth.approve(pool.address, parseEther('100'));
      await pool.deposit(weth.address, parseEther('100'), deployer.address, 0);

      await aave['mint(uint256)'](parseEther('1000000'));
      await aave.approve(pool.address, parseEther('1000000'));
      await pool.deposit(aave.address, parseEther('1000000'), deployer.address, 0);

      // Make a deposit for user
      await weth['mint(uint256)'](parseEther('1000'));
      await weth.approve(pool.address, parseEther('1000'));
      await pool.deposit(weth.address, parseEther('1000'), userAddress, 0);

      await aave['mint(uint256)'](parseEther('1000000'));
      await aave.approve(pool.address, parseEther('1000000'));
      await pool.deposit(aave.address, parseEther('1000000'), userAddress, 0);

      await usdc['mint(uint256)'](usdcLiquidity);
      await usdc.approve(pool.address, usdcLiquidity);
      await pool.deposit(usdc.address, usdcLiquidity, userAddress, 0);
    });

    describe('constructor', () => {
      it('should deploy with correct parameters', async () => {
        const { addressesProvider, deployer } = testEnv;
        await deployParaSwapRepayAdapter(
          addressesProvider.address,
          mockAugustusRegistry.address,
          deployer.address
        );
      });

      it('should revert if not valid addresses provider', async () => {
        const { deployer } = testEnv;
        await expect(
          deployParaSwapRepayAdapter(
            mockAugustus.address, // any invalid contract can be used here
            mockAugustusRegistry.address,
            deployer.address
          )
        ).to.be.reverted;
      });

      it('should revert if not valid augustus registry', async () => {
        const { addressesProvider, deployer } = testEnv;
        await expect(
          deployParaSwapRepayAdapter(
            addressesProvider.address,
            mockAugustus.address,
            deployer.address
          )
        ).to.be.reverted;
      });
    });

    describe('executeOperation', () => {
      it('should correctly swap tokens and repay debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, helpersContract } = testEnv;
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
        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        const flashloanPremium = amountWETHtoSwap.mul(9).div(10000);
        const flashloanTotal = amountWETHtoSwap.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        const params = buildParaSwapRepayParams(
          dai.address,
          expectedDaiAmount,
          0,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await expect(
          pool
            .connect(user)
            .flashLoanSimple(
              paraswapRepayAdapter.address,
              weth.address,
              amountWETHtoSwap.toString(),
              params,
              0
            )
        )
          .to.emit(paraswapRepayAdapter, 'Bought')
          .withArgs(weth.address, dai.address, amountWETHtoSwap, expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(flashloanTotal));
      });

      it('should correctly swap tokens and repay debt with permit', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        const flashloanPremium = amountWETHtoSwap.mul(9).div(10000);
        const flashloanTotal = amountWETHtoSwap.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);
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
          paraswapRepayAdapter.address,
          nonce,
          deadline,
          flashloanTotal.toString()
        );

        const ownerPrivateKey = accounts[3].secretKey;
        if (!ownerPrivateKey) {
          throw new Error('INVALID_OWNER_PK');
        }

        const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

        const params = buildParaSwapRepayParams(
          dai.address,
          expectedDaiAmount,
          0,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          flashloanTotal,
          deadline,
          v,
          r,
          s
        );

        await expect(
          pool
            .connect(user)
            .flashLoanSimple(
              paraswapRepayAdapter.address,
              weth.address,
              amountWETHtoSwap.toString(),
              params,
              0
            )
        )
          .to.emit(paraswapRepayAdapter, 'Bought')
          .withArgs(weth.address, dai.address, amountWETHtoSwap, expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(flashloanTotal));
      });

      it('should revert if caller not lending pool', async () => {
        const { users, pool, weth, aWETH, oracle, dai } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        const flashloanPremium = amountWETHtoSwap.mul(9).div(10000);
        const flashloanTotal = amountWETHtoSwap.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);

        const params = buildParaSwapRepayParams(
          dai.address,
          expectedDaiAmount,
          0,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await expect(
          paraswapRepayAdapter
            .connect(user)
            .executeOperation(weth.address, amountWETHtoSwap.toString(), 0, userAddress, params)
        ).to.be.revertedWith('CALLER_MUST_BE_POOL');
      });

      it('should revert if there is not debt to repay with the specified rate mode', async () => {
        const { users, pool, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        await weth.connect(user)['mint(uint256)'](amountWETHtoSwap);
        await weth.connect(user).transfer(paraswapRepayAdapter.address, amountWETHtoSwap);

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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 2, 0, userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        const flashloanPremium = amountWETHtoSwap.mul(9).div(10000);
        const flashloanTotal = amountWETHtoSwap.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);

        const params = buildParaSwapRepayParams(
          dai.address,
          expectedDaiAmount,
          0,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await expect(
          pool
            .connect(user)
            .flashLoanSimple(
              paraswapRepayAdapter.address,
              weth.address,
              amountWETHtoSwap.toString(),
              params,
              0
            )
        ).to.be.reverted;
      });

      it('should revert if there is not debt to repay', async () => {
        const { users, pool, weth, oracle, dai, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await parseUnitsFromToken(weth.address, '10');

        await weth.connect(user)['mint(uint256)'](amountWETHtoSwap);
        await weth.connect(user).transfer(paraswapRepayAdapter.address, amountWETHtoSwap);

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

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        const flashloanPremium = amountWETHtoSwap.mul(9).div(10000);
        const flashloanTotal = amountWETHtoSwap.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);

        const params = buildParaSwapRepayParams(
          dai.address,
          expectedDaiAmount,
          0,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await expect(
          pool
            .connect(user)
            .flashLoanSimple(
              paraswapRepayAdapter.address,
              weth.address,
              amountWETHtoSwap.toString(),
              params,
              0
            )
        ).to.be.reverted;
      });

      it('should revert when max amount allowed to swap is bigger than max slippage', async () => {
        const { users, pool, weth, oracle, dai, aWETH } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const bigMaxAmountToSwap = amountWETHtoSwap.mul(2);
        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          bigMaxAmountToSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          bigMaxAmountToSwap,
          expectedDaiAmount,
        ]);

        const flashloanPremium = bigMaxAmountToSwap.mul(9).div(10000);
        const flashloanTotal = bigMaxAmountToSwap.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);

        const params = buildParaSwapRepayParams(
          dai.address,
          bigMaxAmountToSwap,
          0,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await expect(
          pool
            .connect(user)
            .flashLoanSimple(
              paraswapRepayAdapter.address,
              weth.address,
              amountWETHtoSwap.toString(),
              params,
              0
            )
        ).to.be.revertedWith('maxAmountToSwap exceed max slippage');
      });

      it('should swap, repay debt and pull the needed ATokens leaving no leftovers', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          amountWETHtoSwap,
          expectedDaiAmount,
        ]);

        const flashloanPremium = amountWETHtoSwap.mul(9).div(10000);
        const flashloanTotal = amountWETHtoSwap.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        const params = buildParaSwapRepayParams(
          dai.address,
          expectedDaiAmount,
          0,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await expect(
          pool
            .connect(user)
            .flashLoanSimple(
              paraswapRepayAdapter.address,
              weth.address,
              amountWETHtoSwap.toString(),
              params,
              0
            )
        )
          .to.emit(paraswapRepayAdapter, 'Bought')
          .withArgs(weth.address, dai.address, amountWETHtoSwap.toString(), expectedDaiAmount);

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(flashloanTotal));
      });

      it('should correctly swap tokens and repay the whole stable debt', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const flashLoanAmount = await parseUnitsFromToken(weth.address, '11');
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);
        const liquidityToSwap = await parseUnitsFromToken(weth.address, '10.8');
        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          amountToRepay
        );

        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          flashLoanAmount,
          expectedDaiAmount,
        ]);

        const flashloanPremium = flashLoanAmount.mul(9).div(10000);
        const flashloanTotal = flashLoanAmount.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        // Add a % to repay on top of the debt

        const params = buildParaSwapRepayParams(
          dai.address,
          amountToRepay,
          4 + 3 * 32,
          1,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await pool
          .connect(user)
          .flashLoanSimple(
            paraswapRepayAdapter.address,
            weth.address,
            flashLoanAmount.toString(),
            params,
            0
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.eq('0');
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(flashloanTotal));
      });

      it('should correctly swap tokens and repay the whole variable debt', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 2, 0, userAddress);

        const daiStableVariableTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).variableDebtTokenAddress;

        const daiVariableDebtContract = await getContract<StableDebtToken>(
          eContractid.VariableDebtToken,
          daiStableVariableTokenAddress
        );

        const userDaiVariableDebtAmountBefore = await daiVariableDebtContract.balanceOf(
          userAddress
        );

        const flashLoanAmount = await parseUnitsFromToken(weth.address, '11');
        const liquidityToSwap = await parseUnitsFromToken(weth.address, '10.8');
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          amountToRepay
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          flashLoanAmount,
          expectedDaiAmount,
        ]);

        const flashloanPremium = flashLoanAmount.mul(9).div(10000);
        const flashloanTotal = flashLoanAmount.add(flashloanPremium);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, flashloanTotal);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        const params = buildParaSwapRepayParams(
          dai.address,
          amountToRepay,
          4 + 3 * 32,
          2,
          mockAugustusCalldata,
          mockAugustus.address,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        await pool
          .connect(user)
          .flashLoanSimple(
            paraswapRepayAdapter.address,
            weth.address,
            flashLoanAmount.toString(),
            params,
            0
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiVariableDebtAmount = await daiVariableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiVariableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiVariableDebtAmount).to.be.eq('0');
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(flashloanTotal));
      });
    });

    describe('swapAndRepay', () => {
      it('should correctly swap tokens and repay debt', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        await aWETH.connect(user).approve(paraswapRepayAdapter.address, liquidityToSwap);
        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
        await paraswapRepayAdapter
          .connect(user)
          .swapAndRepay(
            weth.address,
            dai.address,
            liquidityToSwap,
            expectedDaiAmount,
            1,
            0,
            params,
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            }
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly swap tokens and repay debt with permit', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);

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
          paraswapRepayAdapter.address,
          nonce,
          deadline,
          liquidityToSwap.toString()
        );

        const ownerPrivateKey = accounts[3].secretKey;
        if (!ownerPrivateKey) {
          throw new Error('INVALID_OWNER_PK');
        }

        const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

        await paraswapRepayAdapter
          .connect(user)
          .swapAndRepay(
            weth.address,
            dai.address,
            liquidityToSwap,
            expectedDaiAmount,
            1,
            0,
            params,
            {
              amount: liquidityToSwap,
              deadline,
              v,
              r,
              s,
            }
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should revert if there is not debt to repay', async () => {
        const { users, weth, aWETH, oracle, dai } = testEnv;
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

        const liquidityToSwap = amountWETHtoSwap;

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, liquidityToSwap);

        await expect(
          paraswapRepayAdapter
            .connect(user)
            .swapAndRepay(
              weth.address,
              dai.address,
              liquidityToSwap,
              expectedDaiAmount,
              1,
              0,
              params,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.reverted;
      });

      it('should revert when max amount allowed to swap is bigger than max slippage', async () => {
        const { users, pool, weth, aWETH, oracle, dai } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const bigMaxAmountToSwap = amountWETHtoSwap.mul(2);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, bigMaxAmountToSwap);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          bigMaxAmountToSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          bigMaxAmountToSwap,
          expectedDaiAmount,
        ]);

        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
        await expect(
          paraswapRepayAdapter
            .connect(user)
            .swapAndRepay(
              weth.address,
              dai.address,
              bigMaxAmountToSwap,
              expectedDaiAmount,
              1,
              0,
              params,
              {
                amount: 0,
                deadline: 0,
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000',
              }
            )
        ).to.be.revertedWith('maxAmountToSwap exceed max slippage');
      });

      it('should swap, repay debt and pull the needed ATokens leaving no leftovers', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, liquidityToSwap);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);
        const userWethBalanceBefore = await weth.balanceOf(userAddress);

        await paraswapRepayAdapter
          .connect(user)
          .swapAndRepay(
            weth.address,
            dai.address,
            liquidityToSwap,
            expectedDaiAmount,
            1,
            0,
            params,
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            }
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);
        const userWethBalance = await weth.balanceOf(userAddress);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.eq(userAEthBalanceBefore.sub(liquidityToSwap));
        expect(userWethBalance).to.be.eq(userWethBalanceBefore);
      });

      it('should swap (not whole amount), repay debt and pull the needed ATokens leaving no leftovers', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        const swappedAmount = await parseUnitsFromToken(weth.address, '9.9');

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          swappedAmount,
          expectedDaiAmount,
          expectedDaiAmount
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, liquidityToSwap);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);
        const userWethBalanceBefore = await weth.balanceOf(userAddress);

        await paraswapRepayAdapter
          .connect(user)
          .swapAndRepay(
            weth.address,
            dai.address,
            liquidityToSwap,
            expectedDaiAmount,
            1,
            0,
            params,
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            }
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);
        const userWethBalance = await weth.balanceOf(userAddress);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.eq(userAEthBalanceBefore.sub(swappedAmount));
        expect(userWethBalance).to.be.eq(userWethBalanceBefore);
      });

      it('should correctly swap tokens and repay the whole stable debt', async () => {
        const {
          users,
          pool,
          weth,
          aWETH,
          oracle,
          dai,

          helpersContract,
        } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const liquidityToSwap = new BigNumber(amountWETHtoSwap.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        // Add a % to repay on top of the debt
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          amountToRepay
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, liquidityToSwap);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        await paraswapRepayAdapter
          .connect(user)
          .swapAndRepay(
            weth.address,
            dai.address,
            liquidityToSwap,
            amountToRepay,
            1,
            4 + 3 * 32,
            params,
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            }
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.eq('0');
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly swap tokens and repay the whole variable debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, helpersContract } = testEnv;
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

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 2, 0, userAddress);

        const daiStableVariableTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).variableDebtTokenAddress;

        const daiVariableDebtContract = await getContract<StableDebtToken>(
          eContractid.VariableDebtToken,
          daiStableVariableTokenAddress
        );

        const userDaiVariableDebtAmountBefore = await daiVariableDebtContract.balanceOf(
          userAddress
        );

        // Add a % to repay on top of the debt
        const liquidityToSwap = new BigNumber(amountWETHtoSwap.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        // Add a % to repay on top of the debt
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          amountToRepay
        );
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
        await aWETH.connect(user).approve(paraswapRepayAdapter.address, liquidityToSwap);
        const userAEthBalanceBefore = await aWETH.balanceOf(userAddress);

        await paraswapRepayAdapter
          .connect(user)
          .swapAndRepay(
            weth.address,
            dai.address,
            liquidityToSwap,
            amountToRepay,
            2,
            4 + 3 * 32,
            params,
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            }
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiVariableDebtAmount = await daiVariableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiVariableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiVariableDebtAmount).to.be.eq('0');
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(userAEthBalanceBefore.sub(liquidityToSwap));
      });
    });
  });
});

async function deployParaSwapRepayAdapter(
  poolAddressesProvider: tEthereumAddress,
  augustusRegistry: tEthereumAddress,
  owner: tEthereumAddress
) {
  return await new ParaSwapRepayAdapter__factory(await getFirstSigner()).deploy(
    poolAddressesProvider,
    augustusRegistry,
    owner
  );
}
