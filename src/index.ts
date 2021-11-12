import app from './app';
import { config, logger } from './config';

app.listen(config.port, () => {
  logger.info(`🚀 Server listening to port ${config.port}`);
});
