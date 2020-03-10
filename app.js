const express = require("express");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();
const events = [],
  users = [];
const mongoURL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-bp7af.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
//const mongoURL = `mongodb+srv://gql:I8hnGrLFosntjK43@cluster0-bp7af.mongodb.net/GQL?retryWrites=true&w=majority`;

app.use(bodyParser.json());

app.use(
  "/graphql",
  graphqlHttp({
    schema: buildSchema(`
    type Event {
        _id : ID!
        title:String!
        description:String!
        price: Float!
        date:String!
      },
      input EventInput{
        title: String!
        description:String!
        price:Float!
        date:String! 
      },
      
      type User {
        _id : ID!
        title:String!
        email:String!
        password: String
      },
      input UserInput{
        email: String!
        password:String!
      },
      
      type RootQuery{
        events:[Event!]!
      },
      type RootMutation {
        createEvent(eventInput: EventInput): Event  
        createUser(userInput: UserInput): User  
      },
      schema{
        query: RootQuery
        mutation: RootMutation
      }
    `),
    rootValue: {
      events: () => {
        return Event.find()
          .then(events => {
            return events.map(event => {
              return {
                ...event._doc,
                _id: event._doc._id.toString()
              };
            });
          })
          .catch(err => {
            throw err;
          });
      },
      createEvent: args => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date)
        });

        return event
          .save()
          .then(resp => {
            return { ...resp._doc };
          })
          .catch(err => {
            throw err;
          });
      },
      createUser: args => {
        return bcrypt
          .hash(args.userInput.password, 12)
          .then(hashpwd => {
            const user = new User({
              email: args.userInput.email,
              password: hashpwd
            });
            return user.save();
          })
          .then(result => {
            return { ...result._doc, _id: result.id };
          })
          .catch(err => {
            throw err;
          });
      }
    },
    graphiql: true
  })
);

app.get("/", (req, res, next) => {
  res.send("server is running on port 3000");
});

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("server running", process.env.MONGO_DB);
    app.listen(5000);
  })
  .catch(err => {
    console.log(err);
  });
