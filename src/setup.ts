import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';

import { config } from './config';
import { ENodeEnv } from './types';
import apolloServer from './graphql';

const setup  = async (): Promise<Express> => {

  await apolloServer.start();
  const app = express();

  // set security HTTP headers
  if (config.env === ENodeEnv.PROD) {
    app.use(helmet());
  }

  // parse json request body
  app.use(express.json());

  // parse urlencoded request body
  app.use(express.urlencoded({ extended: true }));

  // sanitize request data
  app.use(xss());
  app.use(mongoSanitize());

  // gzip compression
  app.use(compression());

  // enable cors
  app.use(cors());
  app.options('*', cors());

  // Apollo Graphql
  apolloServer.applyMiddleware({ app, path: '/v1/docs' });


  return app;

};

export default setup;
