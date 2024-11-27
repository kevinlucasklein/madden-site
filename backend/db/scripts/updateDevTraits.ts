import 'dotenv/config';
import DevelopmentTraitUpdater from './updateDevelopmentTraits';

async function main() {
  const updater = new DevelopmentTraitUpdater();
  try {
    await updater.run();
  } catch (error) {
    console.error('Error running development trait update:', error);
    process.exit(1);
  } finally {
    await updater.close();
  }
}

main().catch(console.error);