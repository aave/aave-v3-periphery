const { expect } = require('chai');
const { ethers } = require('hardhat');
const { impersonateAccount, stopImpersonateAccount, resetChain } = require('../test-utils.js');
const { time, group } = require('console');

describe('RewardControllerV2', () => {
  let initBlock;
  let emissionManager;
  let rewardsController;

  let emissionManagerAddress = '0x69ea2c310a950E58984f4bEc4acCf2ECe391dafD';
  let rewardControllerProxyAddress = '0x60485C5E5E3D535B16CC1bd2C9243C7877374259';
  let addressProviderAddress = '0x5C57266688A4aD1d3aB61209ebcb967B84227642';
  let poolAddress = '0x4a4d9abD36F923cBA0Af62A39C01dEC2944fb638';
  let timelockAddress = '0x02135EA9bc6481f7296852c9C3c24e8f9Ef10bE7';
  let deployerAddress = '0xDf716940F602E2d7289d41402f52231d515B116f';
  let multisigAddress = '0xa0C9a9D6Bd0855b7F1a3eFC5daB4855250a85dB6';
  let whaleAddress = '0xa4ac340635caE0Cf52e4058BfFCCF6B7FC6Cf61F';

  let aWSEI = '0x809FF4801aA5bDb33045d1fEC810D082490D63a4';
  let aUSDT = '0x945C042a18A90Dd7adb88922387D12EfE32F4171';
  let aUSDC = '0xc1a6F27a4CcbABB1C2b1F8E98478e52d3D3cB935';
  let wsei = '0xE30feDd158A2e3b13e9badaeABaFc5516e95e8C7';
  let usdc = '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1';
  let usdt = '0xB75D0B03c06A926e488e2659DF1A861F860bD3d1';
  let wseiOracle = '0xa2aCDc40e5ebCE7f8554E66eCe6734937A48B3f3';

  // before all
  before(async () => {
    // get current block
    initBlock = await ethers.provider.getBlockNumber();
  });
  beforeEach(async () => {
    // reset chain
    await resetChain(initBlock.number);

    // set USDT emission to 0
    emissionManager = await ethers.getContractAt('EmissionManager', emissionManagerAddress);
    emission_per_second = '0';
    total_supply = '0';
    distr_end = '0';
    reward = wsei;
    transfer_strategy = '0x127201e84aD4EE06eC15104CF083696D6354f8Dd';
    reward_oracle = wseiOracle;
    aUSDTConfigureAssetParams = [
      emission_per_second,
      total_supply,
      distr_end,
      aUSDT,
      reward,
      transfer_strategy,
      reward_oracle,
    ];
    let multisigAccount = await impersonateAccount(multisigAddress);
    await emissionManager.connect(multisigAccount).configureAssets([aUSDTConfigureAssetParams]);

    // fund timelock account as if it's an EOA
    let whaleAccount = await impersonateAccount(whaleAddress);
    const sendAmount = ethers.utils.parseEther('1.0'); // 1 ETH
    await whaleAccount.sendTransaction({ to: timelockAddress, value: sendAmount });

    // deploy impl
    rewardControllerV2Factory = await ethers.getContractFactory('RewardsControllerV2');
    rewardControllerV2Impl = await rewardControllerV2Factory.deploy(emissionManagerAddress);

    // upgrade proxy's impl
    const incentivesControllerId =
      '0x703c2c8634bed68d98c029c18f310e7f7ec0e5d6342c590190b3cb8b3ba54532';
    const addressProviderAbi = require('../abis/address-provider.ts').default;
    const addressProvider = new ethers.Contract(
      addressProviderAddress,
      addressProviderAbi,
      ethers.provider
    );

    let timeLockAccount = await impersonateAccount(timelockAddress);
    await addressProvider
      .connect(timeLockAccount)
      .setAddressAsProxy(incentivesControllerId, rewardControllerV2Impl.address);
    const poolAbi = require('../abis/pool.ts').default;
    pool = new ethers.Contract(poolAddress, poolAbi, ethers.provider);

    rewardsController = await ethers.getContractAt(
      'RewardsControllerV2',
      rewardControllerProxyAddress
    );
    let deployerAccount = await impersonateAccount(deployerAddress);
    await rewardsController.connect(deployerAccount).setPool(poolAddress);
    await rewardsController.connect(deployerAccount).setAssetGroup([usdc, usdt, wsei], [1, 1, 2]);

    // set emission to 0
  });
  it('test owner access function', async () => {
    // expect no revert
    let deployerAccount = await impersonateAccount(deployerAddress);
    await rewardsController.connect(deployerAccount).setAssetGroup([usdc, usdt, wsei], [1, 1, 2]);
    // expect revert
    let whaleAccount = await impersonateAccount(whaleAddress);
    await expect(
      rewardsController.connect(whaleAccount).setAssetGroup([usdc, usdt, wsei], [1, 1, 2])
    ).to.be.revertedWith('OWNER_UNAUTHORIZED');

    // expect no revert
    await rewardsController.connect(deployerAccount).setPool(poolAddress);
    // expect revert
    await expect(rewardsController.connect(whaleAccount).setPool(poolAddress)).to.be.revertedWith(
      'OWNER_UNAUTHORIZED'
    );
  });
  it('test for USDC looping whale', async () => {
    let loopingWhale = '0x0723c74793e6a30ee70de84f2abfa53b954f3b20'; // deposit 558.4k borrow 480.11k usdc
    let loopingWhaleAccount = await impersonateAccount(loopingWhale);
    let wseiContract = await ethers.getContractAt('IERC20', wsei);
    // claim all rewards first to set personal pending rewards to 0
    let firstClaimTx = await rewardsController
      .connect(loopingWhaleAccount)
      .claimAllRewards([aUSDC, aUSDT, aWSEI], loopingWhale);
    let firstClaimReceipt = await firstClaimTx.wait();
    let firstClaimBlock = await ethers.provider.getBlock(firstClaimReceipt.blockNumber);

    beforeWseiBalance = await wseiContract.balanceOf(loopingWhale);
    // claim again in the next block
    let secondClaimTx = await rewardsController
      .connect(loopingWhaleAccount)
      .claimAllRewards([aUSDC, aUSDT, aWSEI], loopingWhale);
    let secondClaimReceipt = await secondClaimTx.wait();
    let secondClaimBlock = await ethers.provider.getBlock(secondClaimReceipt.blockNumber);
    let timeElapsed = secondClaimBlock.timestamp - firstClaimBlock.timestamp;
    // expect time elapsed >= 1
    expect(timeElapsed >= 1).to.be.true;

    afterWseiBalance = await wseiContract.balanceOf(loopingWhale);
    receivedWsei = afterWseiBalance.sub(beforeWseiBalance);
    // expect > 0
    expect(receivedWsei.gt(0)).to.be.true;
    console.log('receivedWsei', receivedWsei.toString());
    // current mainnet config emission rate for USDC is 0.47365 WSEI per sec
    let [userNetSupply, groupNetSupply] =
      await rewardsController._getGroupScaledUserBalanceAndSupply(aUSDC, loopingWhale);
    console.log('userNetSupply', userNetSupply.toString());
    console.log('groupNetSupply', groupNetSupply.toString());
    // user net supply as a percentage of group net supply
    let userNetSupplyShare = userNetSupply.mul(ethers.utils.parseEther('1')).div(groupNetSupply);
    console.log('userNetSupplyShare', userNetSupplyShare.toString());

    let currentEmissionPerSecond = ethers.utils.parseEther('0.47365');
    let receivedWseiPercentage = receivedWsei
      .mul(ethers.utils.parseEther('1'))
      .div(currentEmissionPerSecond.mul(timeElapsed));
    console.log('receivedWseiPercentage', receivedWseiPercentage.toString());
    // expect received wsei percentage to be less than 0.01% different due to rounding errors
    expect(
      receivedWseiPercentage.sub(userNetSupplyShare).abs().lt(ethers.utils.parseEther('0.0001'))
    ).to.be.true;
  });
  it('test for USDT looping whale', async () => {
    let loopingWhale = '0x132233eecf86f2e76b637a7bdc451dd0627a13e1'; // deposit 391k and borrow 368k
    let loopingWhaleAccount = await impersonateAccount(loopingWhale);
    let wseiContract = await ethers.getContractAt('IERC20', wsei);
    // claim all rewards first to set personal pending rewards to 0
    let firstClaimTx = await rewardsController
      .connect(loopingWhaleAccount)
      .claimAllRewards([aUSDC, aUSDT, aWSEI], loopingWhale);
    let firstClaimReceipt = await firstClaimTx.wait();
    let firstClaimBlock = await ethers.provider.getBlock(firstClaimReceipt.blockNumber);

    beforeWseiBalance = await wseiContract.balanceOf(loopingWhale);
    // claim again in the next block
    let secondClaimTx = await rewardsController
      .connect(loopingWhaleAccount)
      .claimAllRewards([aUSDC, aUSDT, aWSEI], loopingWhale);
    let secondClaimReceipt = await secondClaimTx.wait();
    let secondClaimBlock = await ethers.provider.getBlock(secondClaimReceipt.blockNumber);
    let timeElapsed = secondClaimBlock.timestamp - firstClaimBlock.timestamp;
    // expect time elapsed >= 1
    expect(timeElapsed >= 1).to.be.true;

    afterWseiBalance = await wseiContract.balanceOf(loopingWhale);
    receivedWsei = afterWseiBalance.sub(beforeWseiBalance);
    // expect > 0
    expect(receivedWsei.gt(0)).to.be.true;
    console.log('receivedWsei', receivedWsei.toString());
    // current mainnet config emission rate for USDC is 0.47365 WSEI per sec
    let [userNetSupply, groupNetSupply] =
      await rewardsController._getGroupScaledUserBalanceAndSupply(aUSDC, loopingWhale);
    console.log('userNetSupply', userNetSupply.toString());
    console.log('groupNetSupply', groupNetSupply.toString());
    // user net supply as a percentage of group net supply
    let userNetSupplyShare = userNetSupply.mul(ethers.utils.parseEther('1')).div(groupNetSupply);
    console.log('userNetSupplyShare', userNetSupplyShare.toString());

    let currentEmissionPerSecond = ethers.utils.parseEther('0.47365');
    let receivedWseiPercentage = receivedWsei
      .mul(ethers.utils.parseEther('1'))
      .div(currentEmissionPerSecond.mul(timeElapsed));
    console.log('receivedWseiPercentage', receivedWseiPercentage.toString());
    // expect received wsei percentage to be less than 0.01% different due to rounding errors
    expect(
      receivedWseiPercentage.sub(userNetSupplyShare).abs().lt(ethers.utils.parseEther('0.0001'))
    ).to.be.true;
  });
  it('test for USDT AND USDC looping whale', async () => {
    let loopingWhale = '0x11b80050d78c11e3bcdff27c680132dd5eb8813c'; // deposit 330k and borrow 311k
    let loopingWhaleAccount = await impersonateAccount(loopingWhale);
    let wseiContract = await ethers.getContractAt('IERC20', wsei);
    // claim all rewards first to set personal pending rewards to 0
    let firstClaimTx = await rewardsController
      .connect(loopingWhaleAccount)
      .claimAllRewards([aUSDC, aUSDT, aWSEI], loopingWhale);
    let firstClaimReceipt = await firstClaimTx.wait();
    let firstClaimBlock = await ethers.provider.getBlock(firstClaimReceipt.blockNumber);

    beforeWseiBalance = await wseiContract.balanceOf(loopingWhale);
    // claim again in the next block
    let secondClaimTx = await rewardsController
      .connect(loopingWhaleAccount)
      .claimAllRewards([aUSDC, aUSDT, aWSEI], loopingWhale);
    let secondClaimReceipt = await secondClaimTx.wait();
    let secondClaimBlock = await ethers.provider.getBlock(secondClaimReceipt.blockNumber);
    let timeElapsed = secondClaimBlock.timestamp - firstClaimBlock.timestamp;
    // expect time elapsed >= 1
    expect(timeElapsed >= 1).to.be.true;

    afterWseiBalance = await wseiContract.balanceOf(loopingWhale);
    receivedWsei = afterWseiBalance.sub(beforeWseiBalance);
    // expect > 0
    expect(receivedWsei.gt(0)).to.be.true;
    console.log('receivedWsei', receivedWsei.toString());
    // current mainnet config emission rate for USDC is 0.47365 WSEI per sec
    let [userNetSupply, groupNetSupply] =
      await rewardsController._getGroupScaledUserBalanceAndSupply(aUSDC, loopingWhale);
    console.log('userNetSupply', userNetSupply.toString());
    console.log('groupNetSupply', groupNetSupply.toString());
    // user net supply as a percentage of group net supply
    let userNetSupplyShare = userNetSupply.mul(ethers.utils.parseEther('1')).div(groupNetSupply);
    console.log('userNetSupplyShare', userNetSupplyShare.toString());

    let currentEmissionPerSecond = ethers.utils.parseEther('0.47365');
    let receivedWseiPercentage = receivedWsei
      .mul(ethers.utils.parseEther('1'))
      .div(currentEmissionPerSecond.mul(timeElapsed));
    console.log('receivedWseiPercentage', receivedWseiPercentage.toString());
    // expect received wsei percentage to be less than 0.01% different due to rounding errors
    expect(
      receivedWseiPercentage.sub(userNetSupplyShare).abs().lt(ethers.utils.parseEther('0.0001'))
    ).to.be.true;
  });
});
