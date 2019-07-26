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


//require the http module
const http = require("http").Server(app);

// require the socket.io module
const io = require("socket.io");


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

//integrating socketio
socket = io(http);

//setup event listener
socket.on("connection", socket => {
	console.log("user connected");

	socket.on("disconnect", function () {
		console.log("user disconnected");
	});

	//Someone is typing
	socket.on("typing", data => {
		socket.broadcast.emit("notifyTyping", {
			user: data.user,
			message: data.message
		});
	});

	//when soemone stops typing
	socket.on("stopTyping", () => {
		socket.broadcast.emit("notifyStopTyping");
	});

	socket.on("chat message", function (msg) {
		console.log("message: " + msg);

		//broadcast message to everyone in port:8080 except yourself.
		socket.broadcast.emit("received", { message: msg });

		//save chat to the database
		// connect.then(db => {
		// 	console.log("connected correctly to the server");
		// 	 let chatMessage = new Chat({ message: msg, sender: "Anonymous" });

		// 	 chatMessage.save();
		// });
	});
});

const server = app.listen(PORT, function(){
	console.log(`Server starting on port ${PORT}`)
});

server.timeout = 720000;
