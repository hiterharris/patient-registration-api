const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

const client = new AWS.DynamoDB.DocumentClient();
const tableName = 'users';

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(bodyParser.json());

server.get('/', (req, res) => {
  res.send("Users API Endpoint");
});

server.get("/users/all", (req, res) => {
    var params = {
        TableName: tableName
    };

    client.scan(params, (err, data) => {
        if (err) {
            console.log("Error returning users: ", err);
        } else {
            var items = [];
            for (var i in data.Items)
                items.push(data.Items[i]);
            res.contentType = "application/json";
            res.send(items);
            console.log("GET - users", res.statusCode, res.statusMessage);
        }
    });
});

server.post("/users/add", async (req, res) => {
    var body = req.body;
    var params = {
        TableName: tableName,
        Item: {
            "userId": uuidv4(),
            "name": body["name"],
            "dateOfBirth": body["dateOfBirth"],
            "phone": body["phone"],
            "email": body["email"],
            "address": body["address"],
            "photoId": body["photoId"],
            "registrationTime": body[Date.now()],
        }
    };

    client.put(params, (err) => {
        if (err) {
            console.error("Unable to add user.");
            console.error("Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.contentType = "application/json";
            res.send(req.body);
            console.log("POST - user: ", res.statusCode, res.statusMessage);
        }
    });
});

server.delete('/users/remove/:id', (req, res) => {
    const { id } = req.params;
    var params = {
        TableName: tableName,
        Key: {
            userId: id
        }
    };
    client.delete(params, (error) => {
        if (error) {
            console.log("Error deleting user: ", error);
        } else {
            res.send(id);
            console.log("DEL - user: ", res.statusCode, res.statusMessage);
        }
    });
  });

module.exports = server;
