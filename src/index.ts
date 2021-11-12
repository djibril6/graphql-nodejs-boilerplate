import express from 'express';
import { logger } from './config';

const app = express();
app.listen(4000, () => {
  logger.info('🚀 server listening on port 4000');
});
