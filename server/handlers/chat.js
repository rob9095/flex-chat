const db = require('../models');

exports.chatListen = function(req, res, next) {
  try{
    console.log('chatListen hit')
    let { socket } = req
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

      socket.on("newMessage", async function ({message,user}) {
        console.log({message});
        //save to db
        let uid = await db.User.findOne({_id: user})
        let shift = await db.Shift.findOne({_id: '5d3a2a910f15f03ce18fb968'})
        if (!uid || !shift) {
          return next({
            status: 400,
            message: 'Cannot find shift or user, try again'
          })
        }
        message = await db.ChatMessage.create({message, user: uid, shift})
        //broadcast message to everyone in port:8080 except yourself.
        socket.broadcast.emit("received", { message });

        //save chat to the database
        // connect.then(db => {
        // 	console.log("connected correctly to the server");
        // 	 let chatMessage = new Chat({ message: msg, sender: "Anonymous" });

        // 	 chatMessage.save();
        // });
      });
    });
  } catch(err){
    return next(err)
  }
}