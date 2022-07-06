const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');

const AuthRouter = require('../auth/auth-router');
const UsersRouter = require('../users/users-router');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(bodyParser.json());

server.get('/', (req, res) => {
  res.send("Users API Endpoint");
});

server.use('/api/users', UsersRouter);
server.use('/api/auth', AuthRouter);

module.exports = server;
