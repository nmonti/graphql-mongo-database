require('dotenv').config();

import 'babel-polyfill';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import path from 'path';
import r from 'rethinkdb';

const PORT = process.env.PORT || 3002;

// const because a function would be hoisted, and the imports would happen after
const init = async () => {
  try {
    const db = await MongoClient.connect(process.env.MONGO_HOST);
    const connection = await r.connect( {host: 'localhost', port: 28015});
    // db.collection('articles').drop();
    // db.collection('comments').drop();
    // db.collection('users').drop();
    // await r.tableCreate('articles').run(connection)
    // await r.tableCreate('users').run(connection)
    // await r.tableCreate('comments').run(connection)
    const Articles = r.table('articles');
    const Comments = r.table('comments');
    const Users = r.table('users');

    const typeDefs = [`
      type Query {
        article(id: ID): Article
        articles: [Article]
        comment(id: ID): Comment
        user(id: ID): User
        users: [User]
      }

      type Article {
        id: ID!
        title: String!
        body: String!
        comments: [Comment]
        author: User
        authorId: ID
        subheader: String
      }

      type Comment {
        id: ID!
        body: String!
        articleId: ID!
        article: Article
        commenter: User!
        likes: Int
      }

      type User {
        id: ID!
        username: String!
        password: String!
        articles: [Article]
        comments: [Comment]
      }

      type Mutation {
        createUser(username: String!, password: String!): User
        postArticle(authorId: ID, title: String!, body: String!, subheader: String): Article
        postComment(commenterId: ID!, articleId: ID!, body: String!): Comment
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        article: async (root, {id}) => {
          return await Articles.get(id).run(connection);
        },
        articles: async (root) => {
          const articles = await r.table('articles').run(connection);
          return await articles.toArray();
        },
        comment: async (root, {id}) => {
          return await Comments.get(id).run(connection);
        },
        user: async (root, {id}) => {
          return await Users.get(id).run(connection);
        },
        users: async (root, {id}) => {
          const users = await r.table('users').run(connection);
          return await users.toArray();
        }
      },

      Article: {
        comments: async ({id}) => {
          const comments = await Comments.filter(
                                        r.row("authorId")
                                         .eq(id))
                                         .run(connection);
          return await comments.toArray();
        },
        author: async ({authorId}) => {
          console.log(authorId)
          return await Users.filter(
                           r.row("id")
                            .eq(authorId))
                            .run(connection);
        }
      },

      Comment: {
        article: async ({articleId}) => {
          return await Articles.filter(
                              r.row("id")
                               .eq(articleId))
                               .run(connection);
        },
        commenter: async ({commenterId}) => {
          return await Users.filter(
                           r.row("id")
                            .eq(commenterId))
                            .run(connection);
        }
      },

      Mutation: {
        createUser: async (root, args) => {
          const res = await Users.insert(args, {returnChanges: true})
                                 .run(connection);
          return res.changes[0].new_val
        },
        postArticle: async (root, args) => {
          const res = await Articles.insert(args, {returnChanges: true})
                                    .run(connection);
          return res.changes[0].new_val
        },
        postComment: async (root, args) => {
          const res = await Comments.insert(args, {returnChanges: true})
                                   .run(connection);
          return res.changes[0].new_val;
        }
      }
    };

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    const app = express()
    const distPath = path.resolve(__dirname, '../dist');

    app.use(cors());
    app.use(express.static(distPath, {maxAge: 86400000}));
    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}));
    app.use('/graphiql', graphiqlExpress({
      endpointURL: '/graphql'
    }));

    app.listen(PORT, () => {
      console.log(`http:/localhost:${PORT}`)
    });

  } catch (e) {
    console.log(e)
  }
}

init();
