import hardhat from 'hardhat';

export async function makeSuite(name: string, tests: () => void): Promise<void> {
  before(async () => {
    await hardhat.run('set-DRE');
  });
  describe(name, async () => {
    tests();
  });
  afterEach(async () => {});
}
