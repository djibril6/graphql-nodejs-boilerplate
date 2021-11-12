import mongoose from 'mongoose';
import setup from './setup';
import { config, logger } from './config';


mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  setup().then(app => {
    app.listen(config.port, () => {
      logger.info(`🚀 Server listening to port ${config.port}`);
    });
  });
});
