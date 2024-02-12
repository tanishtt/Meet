const socket = io();

const iceServers={
    iceServers:[
        { urls: 'stun:stun1.l.google.com:19302'},
        { urls: 'stun:stun3.l.google.com:19302'},
        { urls: 'stun:stun4.l.google.com:19302'}
    ]
}

let creater=true;
//getUserMedia(constraints, successCallback, errorCallback)
navigator.getUserMedia= navigator.getUserMedia || navigator.mozGetUserMedia ||  navigator.webkitGetUserMedia;

function videStreamingOn(roomName){
    navigator.getUserMedia(
        {
            audio:true,
            video:true,
        },
        function(stream){
            videoChatForm.style="display:none;"
            userVideo.srcObject= stream;
            console.log(stream);
            userVideo.onloadedmetadata= function(e){
                userVideo.play();
            }

            socket.emit('user:ready',roomName);
        },
        function(err){
            console.log(err);
            alert("media cannot be accessed...");
        }
    );
}



const videoChatForm= document.getElementById('video-chat-form');
const joinButton= document.getElementById('join');
const roomBox= document.getElementById('room-name');

const roomName=roomBox.value;

const videoChatRooms= document.getElementById('video-chat-rooms');
const userVideo= document.getElementById('user-video');
const peerVideo= document.getElementById('peer-video');


joinButton.addEventListener('click',function(){
    if(roomBox.value== ''){
        alert('please enter room name.');
        return;
    }
    
    
    socket.emit('user:join', roomName);

    

});


socket.on('room:created',()=>{
    //when room created by user1, turn on the camera and audio.
    creater=true;
    videStreamingOn(roomName);
});

socket.on('room:joined',()=>{
    //when join the room , turn on the joined user(2) camera.
    creater= false;
    videStreamingOn(roomName);
});

socket.on('room:full',()=>{
    alert('room is full!!!.');
});



function handleOnIceCandidate(event){
    if(event.candidate){
        socket.emit('candidate',event.candidate,roomName);
    }
}
function handleOnTrackFunction(event){
        peerVideo.srcObject= event.streams[0];
        console.log(stream);
        peerVideo.onloadedmetadata= function(e){
            peerVideo.play();
        }
}
socket.on('user:ready',()=>{
    if(creater){
        let rtcPeerConnection =new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate= handleOnIceCandidate;
        rtcPeerConnection.ontrack= handleOnTrackFunction;
    }
});


socket.on('candidate',()=>{});

socket.on('user:offer',()=>{});

socket.on('user:answer',()=>{});