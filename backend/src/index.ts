import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { json } from 'body-parser';

const app = express();

const server = new ApolloServer({
  typeDefs: `
    type Query {
      hello: String
    }
  `,
  resolvers: {
    Query: {
      hello: () => 'Hello World!'
    }
  },
});

async function startServer() {
  await server.start();

  app.use(cors());
  app.use(json());
  app.use('/graphql', expressMiddleware(server));

  app.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
  });
}

startServer().catch((err) => console.error('Error starting server:', err));
