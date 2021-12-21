const cp = require('child_process');

module.exports = {
  skipFiles: [
    './mocks',
    './misc/UiIncentiveDataProvider.sol',
    './misc/UiPoolDataProvider.sol',
    './misc/WalletBalanceProvider.sol',
    './incentives-v2/interfaces/',
    './misc/interfaces/',
  ],
  onCompileComplete: function () {
    console.log('onCompileComplete hook');
    cp.execSync('. ./setup-test-env.sh', { stdio: 'inherit' });
  },
};
