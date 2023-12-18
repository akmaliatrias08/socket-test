import { Server } from "socket.io";
import express from "express"
import bodyParser from "body-parser";

const app = express()
const PORT = 5000
app.use(bodyParser.json())

const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
}


const io = new Server({
  cors: {
    origin: ['http://localhost:3000']
  }
})

let onlineUsers = [];

const addNewUser = (id, username, notifChannel, socketId) => {
  if (!onlineUsers.some(user => user.id === id)) {
    onlineUsers.push({ id, username, notifChannel, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) =>  user.socketId !== socketId);
};

const disconnetNotifChannel = (socketId) => {
  onlineUsers.filter((user) => user.socketId == socketId ? io.leave(user.notifChannel) : "")
}

const getUser = (id) => {
  return onlineUsers.find((user) => user.id === id);
};

const getNotifChannelUser = (notifChannel) => {
  return onlineUsers.find((user) => user.notifChannel === notifChannel);
};

io.on("connection", (socket) => {
  socket.on("newUser", ({id, username, notifChannel}) => {
    addNewUser(id, username, notifChannel, socket.id);
    console.log(onlineUsers)
    socket.join(notifChannel);
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    disconnetNotifChannel(socket.id)
  });
})

app.get("/", (req, res) => {
  res.json({message: 'hello world'})
});

app.post("/notif/send", (req, res) => {
  // Assuming you want to send a notification to a specific user with ID 'userId'
  const data = req?.body?.params;
  const receiver = getNotifChannelUser(data.channel);

  if (receiver?.notifChannel) {   
    io.to(receiver?.notifChannel).emit("getNotification", data?.data);

    res.json({ message: 'Notification sent successfully' });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`)
})

io.listen(3500);