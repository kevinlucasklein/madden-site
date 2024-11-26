import 'dotenv/config';
import MaddenRatingsUpdater from './maddenRatingsUpdater';

async function main() {
  const updater = new MaddenRatingsUpdater();
  try {
    await updater.run();
  } catch (error) {
    console.error('Error running ratings update:', error);
    process.exit(1);
  } finally {
    await updater.close();
  }
}

main().catch(console.error);