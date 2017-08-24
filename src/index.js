require('dotenv').config();

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';

const PORT = 3002;

// const because a function would be hoisted, and the imports would happen after
const init = async () => {
  try {
    const db = await MongoClient.connect(process.env.LOCAL_MONGO_HOST);

    // db.collection('articles').drop();
    // db.collection('comments').drop();
    // db.collection('users').drop();
    const Articles = db.collection('articles');
    const Comments = db.collection('comments');
    const Users = db.collection('users')

    const typeDefs = [`
      type Query {
        article(_id: ID): Article
        articles: [Article]
        comment(_id: ID): Comment
        user(_id: ID): User
        users: [User]
      }

      type Article {
        _id: ID!
        title: String!
        body: String!
        comments: [Comment]
        author: User!
        authorId: ID!
        subheader: String
      }

      type Comment {
        _id: ID!
        body: String!
        articleId: ID!
        article: Article
        commenter: User!
        likes: Int
      }

      type User {
        _id: ID!
        username: String!
        password: String!
        articles: [Article]
        comments: [Comment]
      }

      type Mutation {
        createUser(username: String!, password: String!): User
        postArticle(authorId: ID!, title: String!, body: String!, subheader: String): Article
        postComment(commenterId: ID!, articleId: ID!, body: String!): Comment
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        article: async (root, {_id}) => {
          return await Articles.findOne(ObjectId(_id));
        },
        articles: async () => {
          return await Articles.find({}).toArray();
        },
        comment: async (root, {_id}) => {
          return await Comments.findOne(ObjectId(_id));
        },
        user: async (root, {_id}) => {
          return await Users.findOne(ObjectId(_id));
        },
        users: async (root, {_id}) => {
          return await Users.find({}).toArray();
        }
      },

      Article: {
        comments: async ({_id}) => {
          _id = _id.toString();
          return await Comments.find({articleId: _id}).toArray();
        },
        author: async ({authorId}) => {
          return await Users.findOne(ObjectId(authorId))
        }
      },

      Comment: {
        article: async ({articleId}) => {
          return await Articles.findOne(ObjectId(articleId));
        },
        commenter: async ({commenterId}) => {
          return await Users.findOne(ObjectId(commenterId));
        }
      },

      Mutation: {
        createUser: async (root, args) => {
          const res = await Users.insert(args);
          return await Users.findOne({_id: res.insertedIds[0]});
        },
        postArticle: async (root, args) => {
          const res = await Articles.insert(args);
          return await Articles.findOne({_id: res.insertedIds[0]});
        },
        postComment: async (root, args) => {
          const res = await Comments.insert(args);
          return await Comments.findOne({_id: res.insertedIds[0]});
        }
      }
    };

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    const app = express()

    app.use(cors());
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
