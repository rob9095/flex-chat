require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./handlers/error');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const modelRoutes = require('./routes/models');
const db = require("./models");
const { loginRequired, ensureCorrectUser } = require('./middleware/auth');
const { validator } = require('./middleware/validator');
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));

// all routes here

// auth routes
app.use('/api/auth', validator, authRoutes);

// account routes
app.use('/api/account', validator, accountRoutes);

//generic model routes
app.use('/api/models', validator, modelRoutes);



app.use(errorHandler);

const server = app.listen(PORT, function(){
	console.log(`Server starting on port ${PORT}`)
});

server.timeout = 720000;
