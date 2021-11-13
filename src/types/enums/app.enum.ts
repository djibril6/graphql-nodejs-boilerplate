export enum ENodeEnv {
  DEV = "development",
  PROD = "production",
  TEST = "test"
}

export enum EModelNames {
  USER = 'User',
  TOKEN = 'Token'
}

export enum EUserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum EGender {
  MALE = 'male',
  FEMALE = 'female'
}

export enum ETokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'resetPassword',
  VERIFY_EMAIL = 'verifyEmail'
} 

export enum EGraphQlErrorCode {
  GRAPHQL_PARSE_FAILED = 'GRAPHQL_PARSE_FAILED',
  GRAPHQL_VALIDATION_FAILED = 'GRAPHQL_VALIDATION_FAILED',
  BAD_USER_INPUT = 'BAD_USER_INPUT',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  PERSISTED_QUERY_NOT_FOUND = 'PERSISTED_QUERY_NOT_FOUND',
  PERSISTED_QUERY_NOT_SUPPORTED = 'PERSISTED_QUERY_NOT_SUPPORTED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}