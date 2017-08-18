## Requirements

* mongodb. Once installed run `mongod --dbpath ./data/db` to set the database to this folder. Change if desired. Be sure to change npm script if you do change the location.
* Create a top level `.env` file to store usernames/passwords. Example:
  ```bash
  MONGO_HOST=mongodb://mlab.com:51153/blog
  LOCAL_MONGO_HOST=mongodb://localhost:27017/blog
  MONGO_USER=user
  MONGO_PASS=password
 ```

## Running

* `npm i`
* Start your mongo client, `npm run mongo`
* `npm start`
* Navigate to http://localhost:PORT/graphiql for a graphql interface that lets you play around. Or GET http://localhost:PORT/graphql?query=QUERY

## Sample  queries

### Post article

```graphql
mutation {
  postArticle(title: "Title", body: "Body") {
    _id
    title
    body
  }
}
```
**returns:**
```json
{
  "data": {
    "postArticle": {
      "_id": "599657fd64612714daafdbc0",
      "title": "Title",
      "body": "Body"
    }
  }
}
```

### Get articles

```graphql
{
  articles {
    _id
    title
    body
    comments {
      body
    }
  }
}
```
**returns:**
```json
{
  "data": {
    "articles": [
      {
        "_id": "599657fd64612714daafdbc0",
        "title": "Title"
        "body": "Body",
        "comments": []
      }
    ]
  }
}
```

### Post comment

```graphql
mutation {
  postComment(articleId: "599657fd64612714daafdbc0", body: "Loser!") {
    _id
    body
    article {
      title
      comments {
        _id
        body
      }
    }
  }
}
```
**returns:**
```json
{
  "data": {
    "postComment": {
      "_id": "59965a4d64612714daafdbc2",
      "body": "Loser!"
      # Here I added article to show the comment was posted to it
      "article": {
        "title": "Title",
        "comments": [
          {
            "_id": "59965a4d64612714daafdbc2",
            "body": "Loser!"
          }
        ]
      }

    }
  }
}
```
