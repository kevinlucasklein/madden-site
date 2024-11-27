import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../../src/config'

const pool = new Pool(config.database)

interface RegisterInput {
  username: string
  email: string
  password: string
}

const resolvers = {
  Mutation: {
    register: async (_: any, { input }: { input: RegisterInput }) => {
      const { username, email, password } = input

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email]
      )

      if (existingUser.rows.length > 0) {
        throw new Error('Username or email already exists')
      }

      // Single strong hash on server
      const passwordHash = await bcrypt.hash(password, 12)  // Increased work factor to 12

      // Store the hashed password
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username, email, created_at',
        [username, email, passwordHash]
      )

      const user = result.rows[0]

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.user_id,
          version: 1  // Add a version for token management
        },
        config.jwt.secret,
        { 
          expiresIn: config.jwt.expiresIn,
          algorithm: 'HS256'
        }
      )

      return {
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at
        },
        token
      }
    }
  }
}

export default resolvers