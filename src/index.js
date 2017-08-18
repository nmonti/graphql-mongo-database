import 'babel-polyfill'

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';

const PORT = 3002;
const MONGO_URL = require('../config/mongoUri');

// const because a function would be hoisted, and the imports would happen after
const init = async () => {
  try {
    const db = await MongoClient.connect(MONGO_URL);

    //db.collection('articles').drop();
    const Articles = db.collection('articles');
    const Comments = db.collection('comments');

    const typeDefs = [`
      type Query {
        article(_id: ID): Article
        articles: [Article]
        comment(_id: ID): Comment
      }

      type Article {
        _id: ID!
        title: String!
        body: String!
        comments: [Comment]
      }

      type Comment {
        _id: ID!
        body: String
        articleId: ID!
        article: Article
      }

      type Mutation {
        postArticle(title: String!, body: String!): Article
        postComment(articleId: ID!, body: String!): Comment
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
        }
      },

      Article: {
        comments: async ({_id}) => {
          _id = _id.toString();
          return await Comments.find({articleId: _id}).toArray();
        }
      },

      Comment: {
        article: async ({articleId}) => {
          return await Articles.findOne(ObjectId(articleId));
        }
      },

      Mutation: {
        postArticle: async (root, args) => {
          const res = await Articles.insert(args);
          return await Articles.findOne({_id: res.insertedIds[0]});
        },
        postComment: async (root, args) => {
          const res = await Comments.insert(args);
          return await Comments.findOne({_id: res.insertedIds[0]});
        }
      },
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
