const cp = require('child_process');

module.exports = {
  configureYulOptimizer: true,
  skipFiles: [
    './mocks',
    './misc/UiIncentiveDataProvider.sol',
    './misc/UiPoolDataProvider.sol',
    './misc/WalletBalanceProvider.sol',
    './rewards/interfaces/',
    './misc/interfaces/',
  ],
  onCompileComplete: function () {
    console.log('onCompileComplete hook');
    cp.execSync('. ./setup-test-env.sh', { stdio: 'inherit' });
  },
};
