import { catchReq } from '../../utils';
import { EUserRole } from '../../types';
import { userValidation } from '../../validations';
import { auth } from '../../middlewares';
import { userController } from '../../controllers';



export default {
  Query: {
    user: auth(catchReq(userValidation.getUser, userController.getUser), [EUserRole.USER, EUserRole.ADMIN]),
    users: auth(catchReq(userValidation.getUsers, userController.getUsers), [EUserRole.ADMIN]),
  },
  Mutation: {
    createUser: auth(catchReq(userValidation.getUsers, userController.createUser), [EUserRole.ADMIN]),
    updateUser: auth(catchReq(userValidation.getUsers, userController.updateUser), [EUserRole.ADMIN, EUserRole.USER]),
    deleteUser: auth(catchReq(userValidation.getUsers, userController.deleteUser), [EUserRole.ADMIN]),
  },
};
