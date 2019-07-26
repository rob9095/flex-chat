const mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.Promise = Promise;

mongoose.connect('mongodb://localhost/flex-chat', {
	keepAlive: true,
});

module.exports.User = require('./user');
module.exports.Shift = require('./shift');
module.exports.ChatMessage = require('./chatMessage');
module.exports.UserToken = require('./userToken');