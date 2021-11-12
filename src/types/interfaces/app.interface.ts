import jwt from 'jsonwebtoken';
import { ETokenType, IUserDocument } from "..";
import { Request, Response } from "express"

export interface ITokenPayload extends jwt.JwtPayload {
  type?: ETokenType
}

export interface IContext {
  req: Request;
  res: Response;
  user?: IUserDocument;
}