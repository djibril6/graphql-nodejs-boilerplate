# Node.js Rest API boilerplate
[![Coverage Status](https://coveralls.io/repos/github/djibril6/graphql-nodejs-boilerplate/badge.svg?branch=main)](https://coveralls.io/github/djibril6/graphql-nodejs-boilerplate?branch=main)
[![Build Status](https://app.travis-ci.com/djibril6/graphql-nodejs-boilerplate.svg?branch=main)](https://app.travis-ci.com/djibril6/graphql-nodejs-boilerplate)

Node js project boilerplate using GraphQL and typescript

## Installation with `create-nodejs-boilerplate`

```bash

npx create-nodejs-boilerplate <project-name> --template graphQL

```
## Manual installation

Clone the repository:
```bash

git clone https://github.com/djibril6/graphql-nodejs-boilerplate.git
# Then
npx rimraf ./.git

```

Then create a new `.env` file in the project root directory and copy the .env.exemple file content (this step not necessary in the project in installed with `create-node-js-boilerplate`).

Install the dependencies for the project:
```bash

npm install
#Or
yarn

```

### Environnement variables

Edit the `.env` file by adding the corrects value for each field. 

## Features used in this project

- **NoSQL database**: [MongoDB](https://www.mongodb.com) object data modeling using [Mongoose](https://mongoosejs.com)
- **Email service**: Email API service [Sendgrid](https://sendgrid.com)
- **Validation**: request data validation using [Joi](https://github.com/hapijs/joi)
- **Logging**: using [winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan)
- **Testing**: unit and integration tests using [Jest](https://jestjs.io)
- **Process management**: advanced production process management using [PM2](https://pm2.keymetrics.io)
- **Security**: set security HTTP headers using [helmet](https://helmetjs.github.io)
- **Santizing**: sanitize request data against xss and query injection
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)
- **Compression**: gzip compression with [compression](https://github.com/expressjs/compression)
- **CI**: continuous integration with [Travis CI](https://travis-ci.org)
- **Docker support**
- **Code coverage**: using [coveralls](https://coveralls.io)
- **Code quality**: with [Codacy](https://www.codacy.com)
- **Git hooks**: with [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged)
- **Linting**: with [ESLint](https://eslint.org) and [Prettier](https://prettier.io)
- **Editor config**: consistent editor configuration using [EditorConfig](https://editorconfig.org)

## Project Structure

```
src\
 |--config\         # Environment variables and global configurations 
 |--controllers\    # All Route controllers (and Business logic)
 |--datasources\    # Data source Classes for graqhql
 |--graphql\        # All GraphQl logics (schema, resolver, server config)
 |--middlewares\    # All Custom middlewares
 |--models\         # All Mongoose models
 |--types\          # All TypeScript shared interfaces and enums
 |--utils\          # Utility classes and functions
 |--validations\    # All data validation logics
 |--setup.ts        # Express app setup
 |--index.ts        # App entry point
test\
 |--integration\    # integration test files
 |--utils\          # utilty functions for test
 |--services\       # All usefull services for test
```
## API Documentation

The graphql documentation of the application is available on `http://localhost:{PORT}/v1/docs`.

## Authentication

We are using an access and refresh token system.

## Logging

Logging should be done with the logger module (`do not use console.log()`) located in `src/config/logger.js`, according to the following severity levels:

```javascript
import { config, logger } from '<path to src>/config';

logger.error('message'); // level 0
logger.warn('message'); // level 1
logger.info('message'); // level 2
logger.http('message'); // level 3
logger.verbose('message'); // level 4
logger.debug('message'); // level 5
```

## Licence

[MIT](https://github.com/djibril6/graphql-nodejs-boilerplate/blob/main/LICENSE)