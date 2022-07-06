const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const crypto = require('crypto');

AWS.config.update({region:"us-east-1"});
const client = new AWS.DynamoDB.DocumentClient();

key = "";

router.get("/admins", (req, res) => {
    const params = {
        TableName: "patient-registration-api-authentication-session-keys"
    };

    client.scan(params, (err, data) => {
        if (err) {
            console.log("Error returning admins: ", err);
        } else {
            res.contentType = "application/json";
            res.send(data.Items);
            console.log("GET - admins", res.statusCode, res.statusMessage);
        }
    });
});

// Registration
router.post('/register', (req, res, next) => {
    const params = {
        TableName: "patient-registration-api-authentication",
        Key: {
            "userName": req.body.userName,
        }
    };

    client.get(params, (error, data) => {
        if (error) {
            console.log("Error registering user: ", error);
        } else {
            response = "GetItem succeeded: " + JSON.stringify(data, null, 2);
            if (response === "GetItem succeeded: {}"){
                addUser();
            } else {
                res.json({"Warning": { "Response": "Unable to add user, because the username, and or, email address is already associated with an existing account. Recover your account with Password Recovery, and have the password sent to your e-mail" }});
            };
        }
    });

    const addUser = () => {
        const hash = crypto.createHmac('sha512', key);
        hash.update(req.body.password);
        const hashed_pass = hash.digest('hex');

        const paramsWrite = {
            TableName: "patient-registration-api-authentication",
            Item:{
                "password": hashed_pass,
                "email": req.body.email,
                "userName": req.body.userName,
                "dateCreated": Date().toString(),
                "userEnabled": 1
            }
        };

        client.put(paramsWrite, (error) => {
            if (error) {
                res.json({"Error": { "Critical": "Unable to add item. Error JSON: " + error}});
            } else {
                res.json({"OK": { "Response": "Thanks for signing up!" }});
            }
        });
    };
});

// Login
router.post('/login', (req, res, next) => {
    const hash = crypto.createHmac('sha512', key);
    hash.update(req.body.password);
    const hashed_pass = hash.digest('hex');
    const SearchHashedPass = hashed_pass;
  
    const params = {
        TableName: "patient-registration-api-authentication",
        Key: {
            "userName": req.body.userName
        }
    };

    const SessionID_Generator = () => {
        const s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    const writeSessiontoDB = (sessionId) => {
        const writeSessionId = {
            TableName:"patient-registration-api-authentication-session-keys",
            Item:{
                "userName": req.body.userName,
                "sessionId": sessionId,
                "createDate": Date().toString()
            }
        };
        client.put(writeSessionId, (error) => {
            if (error) {
                console.log("Unable to add item. Error JSON: ", error, 2);
            }
        });
    };
  
    client.get(params, (error, data) => {
        if (error) {
            res.json({"Error": { "Critical":"Unable to read item" + error }});
        } else {
            if (SearchHashedPass === data.Item.password){
                const sessionId = SessionID_Generator();
                writeSessiontoDB(sessionId);
                res.send({"OK": { "userName": req.body.userName, "sessionId": sessionId }});
            } else {
                const sessionId = {};
                writeSessiontoDB(sessionId);
                res.send({"OK": { "userName": req.body.userName, "sessionId": sessionId }});
            }
        };
    });
});

// Logout
router.post('/logout', (req, res, next) => {
    const params = {
        TableName: "patient-registration-api-authentication",
        Key: {
            "userName": req.body.userName
        }
    };

    const writeSessiontoDB = (sessionId) => {
        const writeSessionId = {
            TableName:"patient-registration-api-authentication-session-keys",
            Item:{
                "sessionId": sessionId,
            }
        };
        client.put(writeSessionId, (error) => {
            if (error) {
                console.log("Unable to add item. Error JSON: ", error, 2);
            }
        });
    };
  
    client.get(params, (error, data) => {
        if (error) {
            res.json({"Error": { "Critical":"Unable to read item" + error }});
        } else {

                writeSessiontoDB({});
                res.send({"OK": { "sessionId": {} }});   
        };
    });
});

module.exports = router;
