require('dotenv').config();

import 'babel-polyfill';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import path from 'path';

const PORT = process.env.PORT || 3002;

// const because a function would be hoisted, and the imports would happen after
export const init = async () => {
  try {
    const db = await MongoClient.connect(process.env.MONGO_HOST);

    // db.collection('blogs').drop();
    // db.collection('comments').drop();
    // db.collection('users').drop();
    const Blogs = db.collection('blogs');
    const Comments = db.collection('comments');
    const Users = db.collection('users')

    const typeDefs = [`
      type Query {
        blog(_id: ID): Blog
        blogs: [Blog]
        comment(_id: ID): Comment
        user(_id: ID): User
        users: [User]
      }

      type Blog {
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
        blogId: ID!
        blog: Blog
        commenter: User!
        likes: Int
      }

      type User {
        _id: ID!
        username: String!
        password: String!
        blogs: [Blog]
        comments: [Comment]
      }

      type Mutation {
        createUser(username: String!, password: String!): User
        postBlog(authorId: ID!, title: String!, body: String!, subheader: String): Blog
        postComment(commenterId: ID!, blogId: ID!, body: String!): Comment
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        blog: async (root, {_id}) => {
          return await Blogs.findOne(ObjectId(_id));
        },
        blogs: async () => {
          return await Blogs.find({}).toArray();
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

      Blog: {
        comments: async ({_id}) => {
          _id = _id.toString();
          return await Comments.find({blogId: _id}).toArray();
        },
        author: async ({authorId}) => {
          return await Users.findOne(ObjectId(authorId))
        }
      },

      Comment: {
        blog: async ({blogId}) => {
          return await Blogs.findOne(ObjectId(blogId));
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
        postBlog: async (root, args) => {
          const res = await Blogs.insert(args);
          return await Blogs.findOne({_id: res.insertedIds[0]});
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

    const app = express();
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
