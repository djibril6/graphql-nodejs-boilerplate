import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import { userService } from './';
import { Token } from '../../src/models';
import { config } from '../../src/config';
import { EGraphQlErrorCode, ETokenType, ITokenPayload } from '../../src/types';
import { GraphQlApiError } from '../../src/utils';


function generateToken(userId: string, expires: Moment, type: ETokenType): string {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, config.jwt.secret);
}

function saveToDb(token: string, userId: string, expires: Moment, type: ETokenType) {
  return Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type
  });
}


async function verifyToken(token: string, type: ETokenType) {
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
    tokenDoc = await Token.findOne({ token, type, user: payload.sub});
  }
  if (!tokenDoc) {
    throw new GraphQlApiError('Token not found', EGraphQlErrorCode.UNAUTHENTICATED);
  }
  return tokenDoc;
}

function findOne(token: string, type: ETokenType, userId: string) {
  return Token.findOne({ token, type, user: userId});
}

async function remove(token: string, type: ETokenType, userId: string) {
  const tok = await findOne(token, type, userId);
  if (!tok) {
    throw new GraphQlApiError('User not found', EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
  }
  await tok.remove();
  return tok;
}

function deleteMany(userId: string, type: ETokenType) {
  return Token.deleteMany({ user: userId, type });
}

/**
 * Generate access and refresh tokens
 */
async function generateAuthTokens(userId: string) {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(userId, accessTokenExpires, ETokenType.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(userId, refreshTokenExpires, ETokenType.REFRESH);
  await saveToDb(refreshToken, userId, refreshTokenExpires, ETokenType.REFRESH);

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

async function generateResetPasswordToken(email: string) {
  const user = await userService.getUserByField({email});
  if (!user) {
    throw new GraphQlApiError('No users found with this email', EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, ETokenType.RESET_PASSWORD);
  await saveToDb(resetPasswordToken, user.id, expires, ETokenType.RESET_PASSWORD);
  return resetPasswordToken;
}

async function generateVerifyEmailToken(userId: string) {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(userId, expires, ETokenType.VERIFY_EMAIL);
  await saveToDb(verifyEmailToken, userId, expires, ETokenType.VERIFY_EMAIL);
  return verifyEmailToken;
}

export default {
  generateToken,
  saveToDb,
  verifyToken,
  findOne,
  remove,
  deleteMany,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken
};
