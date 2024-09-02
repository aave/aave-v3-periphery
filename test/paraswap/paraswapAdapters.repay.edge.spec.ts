import {
  eContractid,
  evmRevert,
  evmSnapshot,
  getContract,
  getFirstSigner,
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
import { buildParaswapBuyParams, buildParaSwapRepayParams } from './utils';
import BigNumber from 'bignumber.js';

const EXCESS_FROM_AMOUNT = '11231';
const EXCESS_TO_AMOUNT = '11231';

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

  describe('ParaswapRepayAdapter Edge', () => {
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

      await weth['mint(address,uint256)'](deployer.address, parseEther('100'));
      await weth.approve(pool.address, parseEther('100'));
      await pool.deposit(weth.address, parseEther('100'), deployer.address, 0);

      await aave['mint(uint256)'](parseEther('1000000'));
      await aave.approve(pool.address, parseEther('1000000'));
      await pool.deposit(aave.address, parseEther('1000000'), deployer.address, 0);

      // Make a deposit for user
      await weth['mint(address,uint256)'](deployer.address, parseEther('1000'));
      await weth.approve(pool.address, parseEther('1000'));
      await pool.deposit(weth.address, parseEther('1000'), userAddress, 0);

      await aave['mint(uint256)'](parseEther('1000000'));
      await aave.approve(pool.address, parseEther('1000000'));
      await pool.deposit(aave.address, parseEther('1000000'), userAddress, 0);

      await usdc['mint(uint256)'](usdcLiquidity);
      await usdc.approve(pool.address, usdcLiquidity);
      await pool.deposit(usdc.address, usdcLiquidity, userAddress, 0);
    });

    describe('executeOperation', () => {
      it('should swap, repay debt and pull the needed ATokens leaving no leftovers', async () => {
        const { users, pool, weth, aWETH, oracle, dai, aDai, helpersContract } = testEnv;
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
        await mockAugustus.expectExcess(EXCESS_FROM_AMOUNT, EXCESS_TO_AMOUNT);
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
          .withArgs(
            weth.address,
            dai.address,
            amountWETHtoSwap.sub(EXCESS_FROM_AMOUNT).toString(),
            expectedDaiAmount.add(EXCESS_TO_AMOUNT)
          );

        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);
        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);
        const adapterADaiBalance = await aDai.balanceOf(paraswapRepayAdapter.address);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterADaiBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.lt(userAEthBalanceBefore);
        expect(userAEthBalance).to.be.gte(
          userAEthBalanceBefore.sub(flashloanTotal).add(EXCESS_FROM_AMOUNT)
        ); // gt because of interest
      });
    });

    describe('swapAndRepay', () => {
      it('should correctly swap tokens and repay debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, aDai, helpersContract } = testEnv;
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
        const userADaiBalanceBefore = await aDai.balanceOf(userAddress);
        const userDaiBalanceBefore = await dai.balanceOf(userAddress);

        await mockAugustus.expectBuy(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          expectedDaiAmount
        );
        await mockAugustus.expectExcess(EXCESS_FROM_AMOUNT, EXCESS_TO_AMOUNT);
        const mockAugustusCalldata = mockAugustus.interface.encodeFunctionData('buy', [
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
        ]);

        await aWETH.connect(user).approve(paraswapRepayAdapter.address, liquidityToSwap);
        const params = buildParaswapBuyParams(mockAugustusCalldata, mockAugustus.address);
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
        )
          .to.emit(paraswapRepayAdapter, 'Bought')
          .withArgs(
            weth.address,
            dai.address,
            liquidityToSwap.sub(EXCESS_FROM_AMOUNT).toString(),
            expectedDaiAmount.add(EXCESS_TO_AMOUNT)
          );

        const adapterAEthBalance = await aWETH.balanceOf(paraswapRepayAdapter.address);
        const adapterADaiBalance = await aDai.balanceOf(paraswapRepayAdapter.address);
        const adapterWethBalance = await weth.balanceOf(paraswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(paraswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userDaiBalance = await dai.balanceOf(userAddress);
        const userADaiBalance = await aDai.balanceOf(userAddress);
        const userAEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterAEthBalance).to.be.eq('0');
        expect(adapterADaiBalance).to.be.eq('0');
        expect(adapterWethBalance).to.be.eq('0');
        expect(adapterDaiBalance).to.be.eq('0');
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userAEthBalance).to.be.eq(
          userAEthBalanceBefore.sub(liquidityToSwap).add(EXCESS_FROM_AMOUNT)
        );
        expect(userADaiBalance).to.be.eq(userADaiBalanceBefore);
        expect(userDaiBalance).to.be.eq(userDaiBalanceBefore.add(EXCESS_TO_AMOUNT));
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
