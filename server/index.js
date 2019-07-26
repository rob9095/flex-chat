require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./handlers/error');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const modelRoutes = require('./routes/models');
const chatRoutes = require('./routes/chat');
const db = require("./models");
const { loginRequired, ensureCorrectUser } = require('./middleware/auth');
const { validator } = require('./middleware/validator');
const PORT = 8080;

// require the socket.io module
const io = require("socket.io");


app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));

const server = app.listen(PORT, function(){
	console.log(`Server starting on port ${PORT}`)
});

//integrating socketio
const socket = io(server, {path: '/api/chat/listen'});

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

	socket.on("newMessage", async function ({ message, user }) {
		console.log({ message });
		//save to db
		let u = await db.User.findOne({ _id: user.id })
		let s = await db.Shift.findOne({ _id: '5d3a2a910f15f03ce18fb968' })
		if (!u || !s) {
			return
		}
		lastMessage = await db.ChatMessage.create({ message, user: u._id, shift: s._id })
		//send back to client
		socket.emit("messageSaved", { lastMessage });
		//broadcast message to everyone except yourself.
		socket.broadcast.emit("messageSaved", { lastMessage });
	});
});
// app.use(function (req, res, next) {
// 	req.socket = socket;
// 	next();
// });

// all routes here

// auth routes
app.use('/api/auth', validator, authRoutes);

// account routes
app.use('/api/account', validator, accountRoutes);

//generic model routes
app.use('/api/models', validator, modelRoutes);

//chat routes
app.use('/api/chat', chatRoutes);



app.use(errorHandler);


