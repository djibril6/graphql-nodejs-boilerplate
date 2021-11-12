import { IContext } from '../types';

function register(data: {userId: string}, ctx: IContext) {
  return data;
}

function login(data: {userId: string}, ctx: IContext) {
  return data;
}

function logout(data: {userId: string}, ctx: IContext) {
  return data;
}

function refreshTokens(data: {userId: string}, ctx: IContext) {
  return data;
}

function forgotPassword(data: {userId: string}, ctx: IContext) {
  return data;
}

function resetPassword(data: {userId: string}, ctx: IContext) {
  return data;
}
function sendVerificationEmail(data: {userId: string}, ctx: IContext) {
  return data;
}
function verifyEmail(data: {userId: string}, ctx: IContext) {
  return data;
}

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
};