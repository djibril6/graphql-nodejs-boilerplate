import { FilterQuery } from 'mongoose';
import { User } from '../../src/models';
import { EGraphQlErrorCode, IPaginateOption, IUserDocument } from '../../src/types';
import { GraphQlApiError } from '../../src/utils';


const getUsers = async (filter: FilterQuery<IUserDocument>, options: IPaginateOption) => {
  const users = await User.paginate(filter, options);
  return users;
};

const getUserById = async (id: string) => {
  return await User.findById(id);
};

const getUserByField = async (filter: FilterQuery<IUserDocument>) => {
  return await User.findOne(filter);
};

const updateUserById = async (userId: string, updateBody: FilterQuery<IUserDocument>) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new GraphQlApiError('No users found', EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email.toString(), userId))) {
    throw new GraphQlApiError('Email already taken', EGraphQlErrorCode.PERSISTED_QUERY_NOT_SUPPORTED);
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUserById = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new GraphQlApiError('No users found', EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
  }
  await user.remove();
  return user;
};

export default {
  getUserById,
  updateUserById,
  deleteUserById,
  getUserByField,
  getUsers
};
