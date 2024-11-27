export const authTypes = `#graphql
  type AuthResponse {
    user: User!
    token: String!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }
`