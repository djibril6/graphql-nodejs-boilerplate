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
    createUser: auth(catchReq(userValidation.createUser, userController.createUser), [EUserRole.ADMIN]),
    updateUser: auth(catchReq(userValidation.updateUser, userController.updateUser), [EUserRole.ADMIN, EUserRole.USER]),
    deleteUser: auth(catchReq(userValidation.deleteUser, userController.deleteUser), [EUserRole.ADMIN]),
  },
};
