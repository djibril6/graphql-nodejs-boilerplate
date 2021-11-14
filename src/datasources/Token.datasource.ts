import { MongoDataSource } from 'apollo-datasource-mongodb';
import { ITokenDocument, IContext, EGraphQlErrorCode } from '../types';
import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import { config } from '../config';
import { GraphQlApiError } from '../utils';
import { ETokenType, ITokenPayload } from '../types';

export default class extends MongoDataSource<ITokenDocument, IContext> {
  generateToken(userId: string, expires: Moment, type: ETokenType): string {
    const payload = {
      sub: userId,
      iat: moment().unix(),
      exp: expires.unix(),
      type,
    };
    return jwt.sign(payload, config.jwt.secret);
  }

  saveToDb(token: string, userId: string, expires: Moment, type: ETokenType) {
    return this.model.create({
      token,
      user: userId,
      expires: expires.toDate(),
      type
    });
  }
  
  
  async verifyToken(token: string, type: ETokenType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tokenDoc: any = {};
    let payload: string | ITokenPayload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new GraphQlApiError('Incorrect token sended!', EGraphQlErrorCode.UNAUTHENTICATED);
    }
    if (typeof(payload) !== 'string' && payload.type !== type) {
      throw new GraphQlApiError('Wrong token sended!', EGraphQlErrorCode.FORBIDDEN);
    }
    if (type === ETokenType.ACCESS) {
      Object.assign(tokenDoc, {
        user: payload.sub,
        token: token,
        type : type,
      });
    } else {
      tokenDoc = await this.model.findOne({ token, type, user: payload.sub});
    }
    if (!tokenDoc) {
      if (type !== ETokenType.ACCESS) {
        throw new GraphQlApiError('Token not found', EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
      }
      throw new GraphQlApiError('Token not found', EGraphQlErrorCode.UNAUTHENTICATED);
    }
    return tokenDoc;
  }

  findOne(token: string, type: ETokenType) {
    return this.model.findOne({ token, type, user: this.context.user.id});
  }

  async delete(token: string, type: ETokenType) {
    const tok = await this.findOne(token, type);
    if (!tok) {
      throw new GraphQlApiError('User not found', EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
    }
    await tok.remove();
    return tok;
  }

  deleteMany(userId: string, type: ETokenType) {
    return this.model.deleteMany({ user: userId, type });
  }
  
  /**
   * Generate access and refresh tokens
   */
  async generateAuthTokens(userId: string) {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = this.generateToken(userId, accessTokenExpires, ETokenType.ACCESS);
  
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = this.generateToken(userId, refreshTokenExpires, ETokenType.REFRESH);
    await this.saveToDb(refreshToken, userId, refreshTokenExpires, ETokenType.REFRESH);
  
    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate(),
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate(),
      },
    };
  }
  
  async generateResetPasswordToken(email: string) {
    const user = await this.context.dataSources.users.getUserByField({email});
    if (!user) {
      throw new GraphQlApiError('No users found with this email', EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
    }
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = this.generateToken(user.id, expires, ETokenType.RESET_PASSWORD);
    await this.saveToDb(resetPasswordToken, user.id, expires, ETokenType.RESET_PASSWORD);
    return resetPasswordToken;
  }
  
  async generateVerifyEmailToken(userId: string) {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = this.generateToken(userId, expires, ETokenType.VERIFY_EMAIL);
    await this.saveToDb(verifyEmailToken, userId, expires, ETokenType.VERIFY_EMAIL);
    return verifyEmailToken;
  }
}