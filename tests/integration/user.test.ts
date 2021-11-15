import faker from 'faker';
import moment from 'moment';
import bcrypt from 'bcryptjs';
import { EGender, EGraphQlErrorCode, ETokenType, EUserRole, IUser } from '../../src/types';
import { setupTestDB, setupTestServer, userUtil } from '../utils';
import server from '../../src/graphql';
import { gql } from 'apollo-server-express';
import { config } from '../../src/config';
import { authService, userService } from '../services';
import { Token, User } from '../../src/models';

setupTestDB();

describe('User management module', () => {
  const AExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = authService.generateToken(userUtil.userOne._id.toString(), AExpires, ETokenType.ACCESS);
  const authServer = setupTestServer(accessToken);

  const adminAccessToken = authService.generateToken(userUtil.admin._id.toString(), AExpires, ETokenType.ACCESS);
  const adminAuthServer = setupTestServer(adminAccessToken);

  describe('Mutation createUser', () => {
    const CREATE_USER = gql`
      mutation($firstname: String!, $lastname: String!, $email: String!, $gender: EGender, $role: EUserRole) {
        createUser(firstname: $firstname, lastname: $lastname, email: $email, gender: $gender, role: $role) {
          id
          firstname
          lastname
          role
          email
          gender
          isEmailVerified
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
        role: EUserRole.ADMIN,
      };
    });

    test('should successfully create new user if request data is ok', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      
      const res = await adminAuthServer.executeOperation({
        query: CREATE_USER,
        variables: { ...newUser }
      });

      expect(res.errors).toBeUndefined();

      expect(res.data?.createUser).toEqual({
        id: expect.anything(),
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: EUserRole.ADMIN,
        gender: newUser.gender,
        isEmailVerified: false
      });

      const dbUser = await userService.getUserById(res.data?.createUser.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password); // password must be encrypted
      expect(dbUser).toMatchObject({
        id: res.data?.createUser.id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: newUser.role,
        gender: newUser.gender,
        isEmailVerified: false,
        accountClosed: false
      });
    });

    test('should return FORBIDDEN error if logged in user is not admin', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      const res = await authServer.executeOperation({
        query: CREATE_USER,
        variables: { ...newUser }
      });

      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.FORBIDDEN);
    });

    test('should return UNAUTHENTICATED error if access token is missing', async () => {
      const res = await server.executeOperation({
        query: CREATE_USER,
        variables: { ...newUser }
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should return 400 error if email is invalid', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      newUser.email = 'invalidEmail';
      
      const res = await adminAuthServer.executeOperation({
        query: CREATE_USER,
        variables: { ...newUser }
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return PERSISTED_QUERY_NOT_SUPPORTED error code if email is already used', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      newUser.email = userUtil.admin.email;
      const res = await adminAuthServer.executeOperation({
        query: CREATE_USER,
        variables: { ...newUser }
      });

      expect(res.errors[0].message.includes('email')).toBe(true);
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.PERSISTED_QUERY_NOT_SUPPORTED);
    });
  });

  describe('Query users', () => {
    const GET_USERS = gql`
      query {
        users {
          limit
          page
          totalPages
          totalResults
          results {
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

    test('should return user list and apply the default query options', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await adminAuthServer.executeOperation({
        query: GET_USERS,
      });
      expect(res.errors).toBeUndefined();

      expect(res.data?.users).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.data?.users.results).toHaveLength(3);
      expect(res.data?.users.results[0]).toEqual({
        id: userUtil.userOne._id.toHexString(),
        firstname: userUtil.userOne.firstname,
        lastname: userUtil.userOne.lastname,
        email: userUtil.userOne.email,
        role: userUtil.userOne.role,
        gender: userUtil.userOne.gender,
        isEmailVerified: userUtil.userOne.isEmailVerified,
      });
    });

    test('should return FORBIDDEN if a non-admin is trying to access all users', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await authServer.executeOperation({
        query: GET_USERS,
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.FORBIDDEN);
    });

    test('should return UNAUTHENTICATED if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const res = await server.executeOperation({
        query: GET_USERS,
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should correctly apply filter on role field', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const GET_NORMAL_USERS = gql`
        query($role: EUserRole) {
          users(role: $role) {
            limit
            page
            totalPages
            totalResults
            results {
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

      const res = await adminAuthServer.executeOperation({
        query: GET_NORMAL_USERS,
        variables: { role: EUserRole.USER }
      });
      expect(res.errors).toBeUndefined();

      expect(res.data?.users).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.data?.users.results).toHaveLength(2);
      expect(res.data?.users.results[0].id).toBe(userUtil.userOne._id.toHexString());
      expect(res.data?.users.results[1].id).toBe(userUtil.userTwo._id.toHexString());
    });

    test('should limit returned array if limit param is specified', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const GET_LIMITED_USERS = gql`
      query($limit: Int) {
        users(limit: $limit) {
          limit
          page
          totalPages
          totalResults
          results {
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

      const res = await adminAuthServer.executeOperation({
        query: GET_LIMITED_USERS,
        variables: { limit: 1 }
      });

      expect(res.errors).toBeUndefined();
      expect(res.data?.users).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 1,
        totalPages: 3,
        totalResults: 3,
      });
      expect(res.data?.users.results).toHaveLength(1);
      expect(res.data?.users.results[0].id).toBe(userUtil.userOne._id.toHexString());
    });

    test('should return the correct page if page and limit params are specified', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo, userUtil.admin]);

      const GET_LIMITED_USERS = gql`
        query($limit: Int, $page: Int) {
          users(limit: $limit, page: $page) {
            limit
            page
            totalPages
            totalResults
            results {
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

      const res = await adminAuthServer.executeOperation({
        query: GET_LIMITED_USERS,
        variables: { page: 2, limit: 2 }
      });

      expect(res.errors).toBeUndefined();
      expect(res.data?.users).toEqual({
        results: expect.any(Array),
        page: 2,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.data?.users.results).toHaveLength(1);
      expect(res.data?.users.results[0].id).toBe(userUtil.admin._id.toHexString());
    });
  });

  describe('Query user', () => {
    const GET_USER = gql`
      query($userId: ID!) {
        user(userId: $userId) {
          id
          firstname
          lastname
          role
          email
          gender
          isEmailVerified
        }
      }
    `;
    test('should return the user if data is ok', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      const res = await authServer.executeOperation({
        query: GET_USER,
        variables: { userId: userUtil.userOne._id.toString()}
      });

      expect(res.data?.user).toEqual({
        id: userUtil.userOne._id.toHexString(),
        email: userUtil.userOne.email,
        firstname: userUtil.userOne.firstname,
        lastname: userUtil.userOne.lastname,
        role: userUtil.userOne.role,
        gender: userUtil.userOne.gender,
        isEmailVerified: userUtil.userOne.isEmailVerified
      });
    });

    test('should return UNAUTHENTICATED error if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      const res = await server.executeOperation({
        query: GET_USER,
        variables: { userId: userUtil.userOne._id.toString()}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should return FORBIDDEN error if user is trying to get another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo]);

      const res = await authServer.executeOperation({
        query: GET_USER,
        variables: { userId: userUtil.userTwo._id.toString()}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.FORBIDDEN);
    });

    test('should return  the user object if admin is trying to get another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.admin]);

      const res = await adminAuthServer.executeOperation({
        query: GET_USER,
        variables: { userId: userUtil.userOne._id.toString()}
      });
      expect(res.errors).toBeUndefined();
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      const res = await adminAuthServer.executeOperation({
        query: GET_USER,
        variables: { userId: 'invalidId'}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return PERSISTED_QUERY_NOT_FOUND error if user is not found', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      const res = await adminAuthServer.executeOperation({
        query: GET_USER,
        variables: { userId: userUtil.userOne._id.toString()}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
    });
  });

  describe('Mutation deleteUser', () => {
    const DELETE_USER = gql`
      mutation($userId: ID!) {
        deleteUser(userId: $userId)
      }
    `;

    test('should delete user if userId is ok', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.admin]);

      const res = await adminAuthServer.executeOperation({
        query: DELETE_USER,
        variables: { userId: userUtil.userOne._id.toString()}
      });
      expect(res.errors).toBeUndefined();

      const dbUser = await User.findById(userUtil.userOne._id);
      expect(dbUser).toBeNull();
    });

    test('should return FORBIDEN if non Admin user is trying to delete', async () => {
      await userUtil.insertUsers([userUtil.userOne]);

      const res = await authServer.executeOperation({
        query: DELETE_USER,
        variables: { userId: userUtil.userOne._id.toString()}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.FORBIDDEN);
    });

    test('should return BAD_USER_INPUT if userId is not valid', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.admin]);

      const res = await adminAuthServer.executeOperation({
        query: DELETE_USER,
        variables: { userId: 'invalidId'}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return PERSISTED_QUERY_NOT_FOUND if user already is not found', async () => {
      await userUtil.insertUsers([userUtil.admin]);

      const res = await adminAuthServer.executeOperation({
        query: DELETE_USER,
        variables: { userId: userUtil.userOne._id.toString()}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
    });
  });

  describe('Mutation deleteUser', () => {
    const UPDATE_USER = gql`
      mutation($userId: ID!, $data: IUpdateUser!) {
        updateUser(userId: $userId, data: $data) {
          id
          firstname
          lastname
          role
          email
          gender
          isEmailVerified
        }
      }
    `;

    test('should successfully update user if data is ok', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = {
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: 'newPassword1',
        gender: EGender.FEMALE
      };

      const res = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors).toBeUndefined();

      expect(res.data?.updateUser).toEqual({
        id: userUtil.userOne._id.toHexString(),
        firstname: updateBody.firstname,
        lastname: updateBody.lastname,
        email: updateBody.email,
        role: EUserRole.USER,
        gender: updateBody.gender,
        isEmailVerified: false,
      });

      const dbUser = await User.findById(userUtil.userOne._id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(updateBody.password);
      expect(dbUser).toMatchObject({ firstname: updateBody.firstname, lastname: updateBody.lastname, email: updateBody.email, role: EUserRole.USER });
    });

    test('should return UNAUTHENTICATED error if access token is missing', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { firstname: faker.name.firstName() };

      const res = await server.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.UNAUTHENTICATED);
    });

    test('should return FORBIDDEN if user is updating another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo]);
      const updateBody = { firstname: faker.name.firstName() };

      const res = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userTwo._id.toString(), data: updateBody}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.FORBIDDEN);
    });

    test('should successfully update user if admin is updating another user', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.admin]);
      const updateBody = { firstname: faker.name.firstName() };

      const res = await adminAuthServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors).toBeUndefined();
    });

    test('should return PERSISTED_QUERY_NOT_FOUND if admin is updating another user that is not found', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      const updateBody = { firstname: faker.name.firstName() };

      const res = await adminAuthServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.PERSISTED_QUERY_NOT_FOUND);
    });

    test('should return BAD_USER_INPUT error if userId is not a valid mongo id', async () => {
      await userUtil.insertUsers([userUtil.admin]);
      const updateBody = { firstname: faker.name.firstName() };

      const res = await adminAuthServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: 'invalidId', data: updateBody}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return BAD_USER_INPUT if email is invalid', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { email: 'invalidEmail' };

      const res = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return BAD_USER_INPUT if email is already taken', async () => {
      await userUtil.insertUsers([userUtil.userOne, userUtil.userTwo]);
      const updateBody = { email: userUtil.userTwo.email };

      const res = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should update if email is my email', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { email: userUtil.userOne.email };

      const res = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors).toBeUndefined();
    });

    test('should return BAD_USER_INPUT if password length is less than 8 characters', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { password: 'passwo1' };

      const res = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });

    test('should return BAD_USER_INPUT if password does not contain both letters and numbers', async () => {
      await userUtil.insertUsers([userUtil.userOne]);
      const updateBody = { password: 'password' };

      const res1 = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res1.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);

      updateBody.password = '11111111';

      const res2 = await authServer.executeOperation({
        query: UPDATE_USER,
        variables: { userId: userUtil.userOne._id.toString(), data: updateBody}
      });
      expect(res2.errors[0].extensions.code).toBe(EGraphQlErrorCode.BAD_USER_INPUT);
    });
  });
});