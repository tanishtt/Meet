const express=require('express');
const  app=express();
const port= 3000;
const path=require('path');
const http=require('http');
const {Server}= require('socket.io');
const server = http.createServer(app);
const io= new Server(server);


app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(express.static('public'));

app.set('view engine','ejs');
app.set('views',path.resolve('./views'));


server.listen(port,()=>{
    console.log(`Server started on port : ${port}`);
});


const userRoute= require('./routes/userRoute');
const { off } = require('process');


app.use('/',userRoute);


io.on('connection',(socket)=>{
    console.log('user connected: ',socket.id);
    socket.on('user:join',(roomName)=>{
        console.log(roomName);

        let allRooms= io.sockets.adapter.rooms;
        console.log(allRooms);

        const room =allRooms.get(roomName);

        if(!room){
            socket.join(roomName);
            //creates room by me, and joined.
            console.log("Room created(1st user joined) ",roomName);
            socket.emit('room:created');
        }
        else if(room.size==1){
            socket.join(roomName);
            //other user joined.
            console.log("second user joined.");
            socket.emit('room:joined');
        }
        else{
            console.log("Room full");
            socket.emit('room:full');
        }

        allRooms= io.sockets.adapter.rooms
        console.log(allRooms);

    });


    socket.on('user:ready', (roomName)=>{
        //ready event//after joining event, ready event
        console.log("user ready, video audio is now on");
        socket.broadcast.to(roomName).emit('user:ready');
    });

    socket.on('candidate',(candidate, roomName)=>{
        console.log('ICE: candidate');
        socket.broadcast.to(roomName).emit('candidate',candidate);
    })


    socket.on('user:offer',(offer, roomName)=>{
        console.log('offer created by user.');
        socket.broadcast.to(roomName).emit('user:offer', offer);

    });

    socket.on('user:answer',(answer, roomName)=>{
        console.log('answer send by user for the offer');
        socket.broadcast.to(roomName).emit('user:answer',answer); 
    })

    socket.on('disconnect',()=>{
        console.log('user disconnect');
    })
})
