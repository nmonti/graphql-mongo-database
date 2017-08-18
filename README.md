## Requirements

* Mongodb. Once installed run `mongod --dbpath ./data/db` to set the database to this folder. Change if desired.
* babel-cli. `npm install -g babel-cli` (this is useful regardless, but I'm probably gonna switch to webpack soon)

## Running

* `npm i`
* Start your mongo client, `mongod --dbpath <your/database>`
* `npm start`
* Navigate to http://localhost:PORT/graphiql for a graphql interface that lets you play around. Or POST to http://localhost:PORT/graphql?query=QUERY

## Sample  queries

### Post article

```
mutation {
  postArticle(title: "Title", body: "Body") {
    _id
    title
    body
  }
}
```
**returns:**
```
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

```
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
```
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

```
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
```
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
