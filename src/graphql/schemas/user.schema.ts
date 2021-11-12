import { gql } from 'apollo-server-express';

export default gql`

  type TUser {
    id: ID
    firstname: String
    lastname: String
    email: String
    gender: EGender
    role: EUserRole
    isEmailVerified: String
    accountClosed: String
  }

  input INewUser {
    firstname: String!
    lastname: String!
    email: String!
    gender: EGender
    role: String
  }

  input IUpdateUser {
    firstname: String
    lastname: String
    email: String
    gender: EGender
    role: EUserRole
  }

  input IGetUsers {
    role: EUserRole
    limit: Int
    page: Int
  }

   # Queries
  type Query {
    user(userId: ID!): TUser
    users(input: IGetUsers): [TUser]!
  }

  # Mutations
  type Mutation {
    createUser(input: INewUser!): TUser
    updateUser(input: IUpdateUser!): TUser
    deleteUser(userId: ID!): String!
  }
`;
