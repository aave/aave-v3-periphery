const cp = require('child_process');

module.exports = {
  skipFiles: ['GreeterLibrary.sol'],
  onCompileComplete: function () {
    console.log('onCompileComplete hook');
    cp.execSync('. ./setup-test-env.sh', { stdio: 'inherit' });
  },
};
