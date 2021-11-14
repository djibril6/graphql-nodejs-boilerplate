import faker from 'faker';
import moment from 'moment';
import bcrypt from 'bcryptjs';
import { EGender, EGraphQlErrorCode, ETokenType, EUserRole, IUser } from '../../src/types';
import { setupTestDB, setupTestServer, userUtil } from '../utils';
import server from '../../src/graphql';
import { gql } from 'apollo-server-express';
import { config } from '../../src/config';
import { authService, userService } from '../services';
import { Token } from '../../src/models';
setupTestDB();

describe('Auth module', () => {
  const AExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = authService.generateToken(userUtil.userOne._id.toString(), AExpires, ETokenType.ACCESS);
  const authServer = setupTestServer(accessToken);
  describe('Mutation register', () => {
    const REGISTER = gql`
      mutation($firstname: String!, $lastname: String!, $email: String!, $gender: EGender, $password: String!) {
        register(firstname: $firstname, lastname: $lastname, email: $email, gender: $gender password: $password) {
              tokens {
                  access {
                      expires
                      token
                  }
                  refresh {
                      expires
                      token
                  }
              }
              user {
                  id
                  firstname
                  lastname
                  role
                  email
                  gender
                  isEmailVerified
              }
          }
      }
    `;
    let newUser: IUser;
    beforeEach(() => {
      newUser = {
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email().toLowerCase(),
        gender: EGender.MALE,
        password: 'password1',
      };
    });

    test('should successfully register user if request data is ok', async () => {
      
      const res = await server.executeOperation({
        query: REGISTER,
        variables: { ...newUser }
      });

      expect(res.errors).toBeUndefined();

      expect(res.data?.register.user).toEqual({
        id: expect.anything(),
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: EUserRole.USER,
        gender: newUser.gender,
        isEmailVerified: false
      });

      expect(res.data?.register.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbUser = await userService.getUserById(res.data?.register.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password); // password must be encrypted
      expect(dbUser).toMatchObject({ 
        firstname: newUser.firstname, 
        lastname: newUser.lastname, 
        email: newUser.email, 
        role: EUserRole.USER, 
        gender: newUser.gender, 
        isEmailVerified: false,
        accountClosed: false
      });
    });

    test('should return BAD_USER_INPUT error code if email is invalid', async () => {
      newUser.email = 'invalidEmail';
      const res = await server.executeOperation({
        query: REGISTER,
        variables: { ...newUser }
      });

      expect(res.errors).toBeDefined();
      expect(res.errors[0].extensions.details.toString().includes('email')).toBe(true);
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return PERSISTED_QUERY_NOT_SUPPORTED error code if email is already used', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      newUser.email = userUtil.userOne.email;
      const res = await server.executeOperation({
        query: REGISTER,
        variables: { ...newUser }
      });

      expect(res.errors).toBeDefined();
      expect(res.errors[0].message.includes('email')).toBe(true);
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.PERSISTED_QUERY_NOT_SUPPORTED);
    });

    test('should return BAD_USER_INPUT error code if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';
      const res = await server.executeOperation({
        query: REGISTER,
        variables: { ...newUser }
      });
      expect(res.errors).toBeDefined();
      expect(res.errors[0].extensions.details.toString().includes('password')).toBe(true);
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return BAD_USER_INPUT error code if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      const res = await server.executeOperation({
        query: REGISTER,
        variables: { ...newUser }
      });
      expect(res.errors).toBeDefined();
      expect(res.errors[0].extensions.details.toString().includes('password')).toBe(true);
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);

      newUser.password = '11111111';

      const res2 = await server.executeOperation({
        query: REGISTER,
        variables: { ...newUser }
      });
      expect(res2.errors).toBeDefined();
      expect(res2.errors[0].extensions.details.toString().includes('password')).toBe(true);
      expect(res2.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });
  });
  describe('Mutation login', () => {
    const LOGIN = gql`
      mutation($email: String!, $password: String!) {
        login(email: $email, password: $password) {
              tokens {
                  access {
                      expires
                      token
                  }
                  refresh {
                      expires
                      token
                  }
              }
              user {
                  id
                  firstname
                  lastname
                  role
                  email
                  gender
                  isEmailVerified
              }
          }
      }
    `;
    test('should return login user if email and password match', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const loginCredentials = {
        email: userUtil.userOne.email,
        password: userUtil.userOne.password,
      };

      const res = await server.executeOperation({
        query: LOGIN,
        variables: { ...loginCredentials }
      });
      expect(res.errors).toBeUndefined();
      expect(res.data?.login.user).toEqual({
        id: expect.anything(),
        firstname: userUtil.userOne.firstname,
        lastname: userUtil.userOne.lastname,
        email: userUtil.userOne.email,
        role: userUtil.userOne.role,
        gender: userUtil.userOne.gender,
        isEmailVerified: userUtil.userOne.isEmailVerified
      });

      expect(res.data?.login.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return UNAUTHENTICATED error code if there are no users with that email or password', async () => {
      const loginCredentials = {
        email: userUtil.userOne.email,
        password: userUtil.userOne.password,
      };

      const res = await server.executeOperation({
        query: LOGIN,
        variables: { ...loginCredentials }
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should return UNAUTHENTICATED error code if email is incorrect', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const loginCredentials = {
        email: 'wrongemail@mail.com',
        password: userUtil.userOne.password,
      };

      const res = await server.executeOperation({
        query: LOGIN,
        variables: { ...loginCredentials }
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should return UNAUTHENTICATED error code if password is wrong', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const loginCredentials = {
        email: userUtil.userOne.email,
        password: 'wrongPassword1',
      };

      const res = await server.executeOperation({
        query: LOGIN,
        variables: { ...loginCredentials }
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });
  });

  describe('Mutation logout', () => {
    const LOGOUT = gql`
      mutation($refreshToken: String!) {
        logout(refreshToken: $refreshToken)
      }
    `;

    test('should logout if refresh token is valid', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
      await authService.saveToDb(refreshToken, userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

      const res = await authServer.executeOperation({
        query: LOGOUT,
        variables: { refreshToken },
      });
      expect(res.errors).toBeUndefined();

      const dbRefreshTokenDoc = await authService.findOne(refreshToken, ETokenType.REFRESH, userUtil.userOne._id.toString());
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return UNAUTHENTICATED error code if access token is missing in the header', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
      await authService.saveToDb(refreshToken, userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

      const res = await server.executeOperation({
        query: LOGOUT,
        variables: { refreshToken },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should return BAD_USER_INPUT error code if refresh token is missing from request body', async () => {
      const res = await server.executeOperation({
        query: LOGOUT,
        variables: { },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return FORBIDDEN error if refresh token is not found in the database', async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

      const res = await authServer.executeOperation({
        query: LOGOUT,
        variables: { refreshToken },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.FORBIDDEN);
    });
  });

  describe('Mutation refreshTokens', () => {
    const REFRESH_TOKEN = gql`
      mutation($refreshToken: String!) {
        refreshTokens(refreshToken: $refreshToken) {
          access {
            token
            expires
          }
          refresh {
            token
            expires
          }
        }
      }
    `;
    test('should return new auth tokens if refresh token is valid', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
      await authService.saveToDb(refreshToken, userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { refreshToken },
      });

      expect(res.data?.refreshTokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbRefreshTokenDoc = await Token.findOne({ token: res.data?.refreshTokens.refresh.token });
      expect(dbRefreshTokenDoc).toMatchObject({ type: ETokenType.REFRESH, user: userUtil.userOne._id });

      const dbRefreshTokenCount = await Token.countDocuments();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test('should return BAD_USER_INPUT error code if refresh token is missing from request body', async () => {
      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return PERSISTED_QUERY_NOT_FOUND error code if refresh token is not found in the database', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { refreshToken },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
    });

    test('should return UNAUTHENTICATED error code if refresh token is expired', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);
      await authService.saveToDb(refreshToken, userUtil.userOne._id.toString(), expires, ETokenType.REFRESH);

      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { refreshToken },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });
  });

  describe('Mutation resetPassword', () => {
    const REFRESH_TOKEN = gql`
      mutation($token: String!, $password: String!) {
        resetPassword(token: $token, password: $password)
      }
    `;
    test('should reset the password', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
      await authService.saveToDb(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { token: resetPasswordToken, password: 'password2' },
      });
      expect(res.errors).toBeUndefined();

      const dbUser = await userService.getUserById(userUtil.userOne._id.toString());
      const isPasswordMatch = await bcrypt.compare('password2', dbUser.password);
      expect(isPasswordMatch).toBe(true);
    });

    test('should return BAD_USER_INPUT error code if reset password token is missing', async () => {
      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { password: 'password2' },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return UNAUTHENTICATED if reset password token is expired', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().subtract(1, 'minutes');
      const resetPasswordToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
      await authService.saveToDb(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { token: resetPasswordToken, password: 'password2' },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should return PERSISTED_QUERY_NOT_FOUND if user is not found', async () => {
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
      await authService.saveToDb(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { token: resetPasswordToken, password: 'password2' },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
    });

    test('should return 400 if password is missing or invalid', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = authService.generateToken(userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);
      await authService.saveToDb(resetPasswordToken, userUtil.userOne._id.toString(), expires, ETokenType.RESET_PASSWORD);

      const res1 = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { token: resetPasswordToken },
      });
      expect(res1.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);

      const res2 = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { token: resetPasswordToken, password: 'shor1' },
      });
      expect(res2.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);

      const res3 = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { token: resetPasswordToken, password: 'password' },
      });
      expect(res3.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);

      const res = await server.executeOperation({
        query: REFRESH_TOKEN,
        variables: { token: resetPasswordToken, password: '11111111' },
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });
  });

  describe('Mutation sendVerificationEmail', () => {
    const SEND_VERIF_EMAIL = gql`
      mutation {
        sendVerificationEmail
      }
    `;

    test('should return UNAUTHENTICATED error if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      const res = await server.executeOperation({
        query: SEND_VERIF_EMAIL
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });
  });
});