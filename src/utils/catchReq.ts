/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from 'joi';
import { validate } from '.';
import { IContext } from '../types';

export default function catchReq(schema: Joi.ObjectSchema<any>, fn: (data: any, ctx: IContext) => any) { 
  return (
    parent: any,
    args: any,
    ctx: IContext,
  ) => {
    const data = validate(schema, args);
    return fn(data, ctx);
  };
}