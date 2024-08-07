const { ethers, waffle } = require('hardhat');

const toWei = ethers.utils.parseEther;

const impersonateAccount = async (address) => {
  const signer = await ethers.provider.getSigner(address);
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });
  return signer;
};

const stopImpersonateAccount = async (address) => {
  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [address],
  });
};

const resetChain = async (blockNumber) => {
  console.log(hre.network.forking);
  await hre.network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl:
            'https://radial-polished-field.sei-pacific.quiknode.pro/8400232cc3049cb86a624659dfa20cac418e6a9e/',
          blockNumber: blockNumber,
        },
      },
    ],
  });
};

module.exports = {
  impersonateAccount: impersonateAccount,
  stopImpersonateAccount: stopImpersonateAccount,
  resetChain: resetChain,
};
