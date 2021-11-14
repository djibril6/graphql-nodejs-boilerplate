import jwt from 'jsonwebtoken';
import { ETokenType, IUserDocument } from "..";
import { Request, Response } from "express"
import { TokenDataSource, UserDataSource } from '../../datasources';

export interface ITokenPayload extends jwt.JwtPayload {
  type?: ETokenType
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
