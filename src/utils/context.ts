import { Request, Response } from 'express';
import { IContext } from '../types';


export default async ({
  req,
  res,
}: {
    req: Request;
    res?: Response;
  }): Promise<IContext> => {
  return {
    req,
    res,
  };
};