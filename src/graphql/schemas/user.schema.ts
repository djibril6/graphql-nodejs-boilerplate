import { gql } from 'apollo-server-express';

export default gql`

  type TUser {
    id: ID
    firstname: String
    lastname: String
    email: String
    gender: EGender
    role: EUserRole
    isEmailVerified: Boolean
    accountClosed: Boolean
  }

  type TPaginatedUsers {
    results: [TUser]!
    page: Int!
    limit: Int!
    totalPages: Int!
    totalResults: Int!
  }

  input IUpdateUser {
    firstname: String
    lastname: String
    email: String
    gender: EGender
    role: EUserRole
    password: String
  }

   # Queries
  type Query {
    user(userId: ID!): TUser
    users(
      role: EUserRole,
      limit: Int,
      page: Int,
    ): TPaginatedUsers!
  }

  # Mutations
  type Mutation {
    createUser(
      firstname: String!,
      lastname: String!,
      email: String!,
      gender: EGender,
      role: EUserRole,
    ): TUser
    updateUser(userId: ID!, data: IUpdateUser!): TUser
    deleteUser(userId: ID!): String!
  }
`;
