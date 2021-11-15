import Joi from 'joi';
import { EGender, EUserRole } from '../types';
import validation from './validation';

const createUser = Joi.object().keys({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  email: Joi.string().required().email(),
  role: Joi.string().valid(EUserRole.ADMIN, EUserRole.USER).default(EUserRole.USER),
  gender: Joi.string().valid(EGender.FEMALE, EGender.MALE),
});

const getUsers = Joi.object().keys({
  role: Joi.string().valid(EUserRole.ADMIN, EUserRole.USER),
  sortBy: Joi.string(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

const getUser = Joi.object().keys({
  userId: Joi.string().required().custom(validation.objectId),
});

const updateUser = Joi.object().keys({
  userId: Joi.required().custom(validation.objectId),
  data: Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().custom(validation.password),
    firstname: Joi.string(),
    lastname: Joi.string(),
    gender: Joi.string().valid(EGender.FEMALE, EGender.MALE),
    role: Joi.forbidden(),
  }).min(1)
});

const deleteUser = Joi.object().keys({
  userId: Joi.string().custom(validation.objectId),
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};
