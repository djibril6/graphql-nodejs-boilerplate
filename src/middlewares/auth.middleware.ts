import { AuthenticationError } from 'apollo-server-express';
import { tokenService, userService } from '../services';
import { ETokenType, EUserRole, IContext } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const auth = (
  next: any,
  requiredRights: EUserRole[],
) => async (root: any, args: any, context: IContext, info: any) => {
  try {
    const token = context.req.headers.authorization || ''; // .split(' ')[1];
    if (!token) {
      throw new Error('⛔ Please authenticate first!');
    }
    const accessTokenDoc = await tokenService.verifyToken(token, ETokenType.ACCESS);
    if (!context.user) {
      context.user = await userService.getUserById(accessTokenDoc.user.toString());
    }

    if (!requiredRights.includes(context.user.role)) {
      throw new Error('⛔ You don\'t have access to this ressource!');
    }

    return next(root, args, context, info);
  } catch (error) {
    throw new AuthenticationError(error);
  }
};