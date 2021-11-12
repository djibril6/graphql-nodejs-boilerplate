import { IContext } from '../types';

function createUser(data: {userId: string}, ctx: IContext) {
  return data;
}

function getUsers(data: {userId: string}, ctx: IContext) {
  return data;
}

function getUser(data: {userId: string}, ctx: IContext) {
  return data;
}

function updateUser(data: {userId: string}, ctx: IContext) {
  return data;
}

function deleteUser(data: {userId: string}, ctx: IContext) {
  return data;
}

export default {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser
};