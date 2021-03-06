const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

AWS.config.update({region:'us-east-1'});
const client = new AWS.DynamoDB.DocumentClient();
const tableName = 'users';

router.get('/', (req, res) => {
  res.send("users-router");
});

router.get("/all", (req, res) => {
    const params = {
        TableName: tableName
    };

    client.scan(params, (err, data) => {
        if (err) {
            console.log("Error returning users: ", err);
        } else {
            const items = [];
            for (const i in data.Items)
                items.push(data.Items[i]);
            res.contentType = "application/json";
            res.send(items);
            console.log("GET - users", res.statusCode, res.statusMessage);
        }
    });
});

router.post("/add", async (req, res) => {
    const registrationTime = new Date(Date.now());
    const body = req.body;
    const params = {
        TableName: tableName,
        Item: {
            "userId": uuidv4(),
            "registrationTime": registrationTime.toString(),
            "name": body["name"],
            "dateOfBirth": body["dateOfBirth"],
            "phone": body["phone"],
            "email": body["email"],
            "addressLine1": body["addressLine1"],
            "addressLine2": body["addressLine2"],
            "city": body["city"],
            "state": body["state"],
            "zip": body["zip"],
            "photoId": body["photoId"],
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

router.delete('/remove/:id', (req, res) => {
    const { id } = req.params;
    const params = {
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

module.exports = router;
