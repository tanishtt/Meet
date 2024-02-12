const socket = io();

const iceServers={
    iceServers:[
        { urls: 'stun:stun1.l.google.com:19302'},
        { urls: 'stun:stun3.l.google.com:19302'},
        { urls: 'stun:stun4.l.google.com:19302'}
    ]
}

let creater=true;
let userStream='';
let rtcPeerConnection='';
let muteFlag=false;
let videoFlag=false;


//getUserMedia(constraints, successCallback, errorCallback)
navigator.getUserMedia= navigator.getUserMedia || navigator.mozGetUserMedia ||  navigator.webkitGetUserMedia;

function videStreamingOn(roomName, creater){
    navigator.getUserMedia(
        {
            audio:true,
            video:{width:600, height:400},
        },
        function(stream){
            userStream= stream;
            videoChatForm.style="display:none;";
            buttonGroup.style='display:flex;';
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

let roomName=roomBox.value;

const videoChatRooms= document.getElementById('video-chat-rooms');
const userVideo= document.getElementById('user-video');
const peerVideo= document.getElementById('peer-video');


const buttonGroup= document.getElementById('btn-grp');
const muteButton= document.getElementById('mute-btn');
const videoOnOffButton= document.getElementById('video-off-btn');
const leaveButton= document.getElementById('leave-btn');





joinButton.addEventListener('click',function(){
    if(roomBox.value== ''){
        alert('please enter room name.');
        return;
    }
    
    roomName= roomBox.value;
    socket.emit('user:join', roomName);

});



muteButton.addEventListener('click',function(){
  muteFlag=!muteFlag;
  if(muteFlag){
    muteButton.textContent='UnMute';
    userStream.getTracks()[0].enabled=false;
    console.log(userStream.getTracks())
  }else{
    muteButton.textContent='Mute';
    userStream.getTracks()[0].enabled=true;

  }
});


videoOnOffButton.addEventListener('click',function(){
  videoFlag=!videoFlag;
  if(videoFlag){
    videoOnOffButton.textContent='Camera On';
    userStream.getTracks()[1].enabled=false;
    console.log(userStream.getTracks())
  }else{
    videoOnOffButton.textContent='Hide Camera';
    userStream.getTracks()[1].enabled=true;

  }
});


leaveButton.addEventListener('click',function(){
    socket.emit('user:leave', roomName);

    videoChatForm.style="display:block;";
    buttonGroup.style='display:none;';

    //if user(me) leave.
    if(userVideo.srcObject)
    {
        userVideo.srcObject.getTracks()[0].stop();
        userVideo.srcObject.getTracks()[1].stop();
    }
    if(peerVideo.srcObject)
    {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
    }


    if(rtcPeerConnection){
        rtcPeerConnection.ontrack=null;
        rtcPeerConnection.onicecandidate=null;
        rtcPeerConnection.close();
    }
    

});





socket.on('room:created',()=>{
    //when room created by user1, turn on the camera and audio.
    creater=true;
    videStreamingOn(roomName, creater);
});

socket.on('room:joined',()=>{
    //when join the room , turn on the joined user(2) camera.
    creater= false;
    videStreamingOn(roomName, creater);
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
        console.log('track.');
        peerVideo.onloadedmetadata= function(e){
            peerVideo.play();
        }
}
socket.on('user:ready',()=>{
    if(creater){
        //user called.
        rtcPeerConnection =new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate= handleOnIceCandidate;
        rtcPeerConnection.ontrack= handleOnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);//[audio, video] //audio
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);//video
        console.log(rtcPeerConnection);

        rtcPeerConnection.createOffer(
            function(offer){
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit('user:offer',offer, roomName);
            },
            function(err){
                console.log(err);
            }
        );

    }
});



socket.on('candidate',(candidate)=>{
    const iceCandidate= new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
});



socket.on('user:offer',(offer)=>{
    //sdp offer will come here from user who had initiated the call.
    if(!creater){
        //user (who has not called)
        rtcPeerConnection =new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate= handleOnIceCandidate;
        rtcPeerConnection.ontrack= handleOnTrackFunction;
        console.log(rtcPeerConnection);
        console.log(userStream);
        console.log(userStream.getTracks());

        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);//[audio, video] //audio
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);//video

        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer(
            function(answer){
                rtcPeerConnection.setLocalDescription(answer);
                socket.emit('user:answer',answer, roomName);
            },
            function(err){
                console.log(err);
            }
        );

    }
});

socket.on('user:answer',(answer)=>{
    //user who has called.
    rtcPeerConnection.setRemoteDescription(answer);

});



socket.on('user:leave',()=>{

    //the one who left will be admin(creater)
    creater=true;
    //other user,peer
    if(peerVideo.srcObject)
        {
            peerVideo.srcObject.getTracks()[0].stop();
            peerVideo.srcObject.getTracks()[1].stop();
        }


        if(rtcPeerConnection){
            rtcPeerConnection.ontrack=null;
            rtcPeerConnection.onicecandidate=null;
            rtcPeerConnection.close();
        }
})