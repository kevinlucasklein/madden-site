export interface RegisterInput {
    username: string
    email: string
    password: string
  }
  
  export interface RegisterResponse {
    user: {
      id: string
      username: string
      email: string
    }
    token: string
  }
  
  // You can add more auth-related types here later, such as:
  export interface LoginInput {
    email: string
    password: string
  }
  
  export interface User {
    id: string
    username: string
    email: string
  }