import { gql } from 'apollo-server-express';

export default gql`
  enum EUserRole {
    admin
    user
  }

  enum EGender {
    female
    male
  }

  # Queries
  # type Query {}

  # Mutations
  # type Mutation {}
`;
