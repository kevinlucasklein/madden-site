import express, { Request, Response } from 'express'
import { ApolloServer, GraphQLRequestContext } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import cors from 'cors'
import { json } from 'body-parser'
import rateLimit from 'express-rate-limit'
import typeDefs from '../schema/index'
import resolvers from '../schema/resolvers'

interface ContextType {
  req: Request
  res: Response
}

const app = express()

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

// Apply rate limiting
app.use(limiter)

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // restrict to your frontend domain
  credentials: true
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: 'bounded',
  plugins: [
    {
      async requestDidStart(requestContext: GraphQLRequestContext<any>) {
        if (
          process.env.NODE_ENV === 'production' &&
          requestContext.request.query?.includes('__schema')
        ) {
          throw new Error('Introspection is disabled in production')
        }
        return Promise.resolve() // Return a resolved promise
      }
    }
  ]
})

async function startServer() {
  await server.start()

  app.use(
    '/graphql',
    cors(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<ContextType> => {
        // Add security headers
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('X-Frame-Options', 'DENY')
        res.setHeader('X-XSS-Protection', '1; mode=block')
        
        return { req, res }
      },
    })
  )

  app.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000/graphql`)
  })
}

startServer().catch((err) => console.error('Error starting server:', err))