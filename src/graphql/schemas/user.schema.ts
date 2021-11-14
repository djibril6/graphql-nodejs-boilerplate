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

  input IUpdateUser {
    firstname: String
    lastname: String
    email: String
    gender: EGender
    role: EUserRole
  }

   # Queries
  type Query {
    user(userId: ID!): TUser
    users(
      role: EUserRole,
      limit: Int,
      page: Int,
    ): [TUser]!
  }

  # Mutations
  type Mutation {
    createUser(
      firstname: String!,
      lastname: String!,
      email: String!,
      gender: EGender,
      role: String,
    ): TUser
    updateUser(userId: ID!, data: IUpdateUser!): TUser
    deleteUser(userId: ID!): String!
  }
`;
