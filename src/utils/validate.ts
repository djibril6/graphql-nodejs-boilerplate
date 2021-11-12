import { UserInputError } from 'apollo-server-express';
import Joi from 'joi';

export default function<T> (schema: Joi.ObjectSchema<T>, data: T) {
  const { value, error } = schema.prefs({ errors: { label: 'key' } }).validate(data);
  if (error) {
    throw new UserInputError('Argument validation error', {
      details: error.message
    });
  }

  return value;
}