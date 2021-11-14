import { AuthenticationError } from 'apollo-server-express';
import { ETokenType, EUserRole, IContext } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default (
  fn: (parent: any, args: any, context: IContext) => any,
  requiredRights: EUserRole[],
) => async (parent: any, args: any, context: IContext) => {
  try {
    const token = context.req.headers.authorization || ''; // .split(' ')[1];
    if (!token) {
      throw new Error('⛔ Please authenticate first!');
    }
    const accessTokenDoc = await context.dataSources.tokens.verifyToken(token, ETokenType.ACCESS);
    if (!context.user) {
      context.user = await context.dataSources.users.getUser(accessTokenDoc.user.toString());
    }

    if (!requiredRights.includes(context.user.role)) {
      throw new Error('⛔ You don\'t have access to this ressource!');
    }

    return fn(parent, args, context);
  } catch (error) {
    throw new AuthenticationError(error.message);
  }
};