const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
  // shift: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Shift',
  //   required: true,
  // },
  warehouse: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,    
  },
  message: {
    type: String,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
},
  {
    timestamps: true
  });

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
module.exports = ChatMessage;
