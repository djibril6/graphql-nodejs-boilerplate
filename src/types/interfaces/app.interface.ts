import jwt from 'jsonwebtoken';
import { ETokenType, IUserDocument } from "..";
import { Request, Response } from "express"
import { TokenDataSource, UserDataSource } from '../../datasources';

export interface ITokenPayload extends jwt.JwtPayload {
  type?: ETokenType
}

interface IUserController {
  getUser: Function;
  getUsers: Function;
  createUser: Function;
  updateUser: Function;
  deleteUser: Function;
}
interface IAuthController {
  register: Function;
  login: Function;
  logout: Function;
  refreshTokens: Function;
  forgotPassword: Function;
  resetPassword: Function;
  sendVerificationEmail: Function;
  verifyEmail: Function;
}
interface IModel {
  User: IUserController;
  Auth: IAuthController;
}

export interface IContext {
  req: Request;
  res: Response;
  user?: IUserDocument;
  dataSources?: {
    users: UserDataSource;
    tokens: TokenDataSource;
  };
}
