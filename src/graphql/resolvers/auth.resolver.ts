import { catchReq } from '../../utils';
import { authValidation } from '../../validations';
import { auth } from '../../middlewares';
import { authController } from '../../controllers';



export default {
  Query: {},
  Mutation: {
    register: catchReq(authValidation.register, authController.register),
    login: catchReq(authValidation.login, authController.login),
    logout: auth(catchReq(authValidation.logout, authController.logout)),
    refreshTokens: catchReq(authValidation.refreshTokens, authController.refreshTokens),
    forgotPassword: catchReq(authValidation.forgotPassword, authController.forgotPassword),
    resetPassword: catchReq(authValidation.resetPassword, authController.resetPassword),
    sendVerificationEmail: auth(catchReq(authValidation.sendVerificationEmail, authController.sendVerificationEmail), []),
  },
};