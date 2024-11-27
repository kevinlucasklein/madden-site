import { userTypes } from './types/user'
import { authTypes } from './types/auth'

const typeDefs = `#graphql
  ${userTypes}
  ${authTypes}

  type Query {
    hello: String
  }

  type Mutation {
    register(input: RegisterInput!): AuthResponse!
  }
`

export default typeDefs