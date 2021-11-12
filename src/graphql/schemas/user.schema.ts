import { gql } from 'apollo-server-express';

export default gql`

  type TUser {
    id: ID
    firstname: String
    lastname: String
    email: String
    gender: EGender
    role: UserRole
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
    role: String
  }

  input IGetUsers {
    role: EUserRole
    limit: Int
    page: Int
  }

   # Queries
   extend type Query {
    user(userId: ID!): TUser
    users(input: IGetUsers): [TUser]!
  }

  # Mutations
  extend type Mutation {
    createUser(input: INewUser!): TUser
    updateUser(input: IUpdateUser!): TUser
    deleteUser(userId: ID!): String!
  }
`;
