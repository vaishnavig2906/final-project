const webSocket = new WebSocket("ws://192.168.0.108:3000") //write your server IP address as "ws://SERVER IP ADDRESS:3000"

//whenever there is message from server to websocket
webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate) //add candidate to peerConn
    }
}

let username
let button2
let button1

function generate_(){
    button1=document.querySelector(".butt1")
    button1.disabled=false //Create room button is enabled
}

function myFunction() {
    var copyText = document.getElementById("username-input");
    copyText.select();
    copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
}

//function gets executed when send button is cilcked in sender.html
function sendUsername() {
    button2=document.querySelector(".butt2")
    button2.disabled=false //startcall button is enabled
    
    username = document.getElementById("username-input").value //gets username from text box with id username-input from sender.html
    sendData({
        type: "store_user" 
    })
}

//sends data to socket server
function sendData(data) {
    data.username = username //attach username to data
    webSocket.send(JSON.stringify(data)) //send data to the server
}

let localStream
let peerConn //short for peer connection

//function gets executed when start call button is cilcked in sender.html
function startCall() {
    document.getElementById("video-call-div")
    .style.display = "inline" //video-call-div is enabled

    //get your own video
    navigator.getUserMedia({
        video: {
            frameRate: 24,
            width: {
                min: 480, ideal: 720, max: 1280
            },
            aspectRatio: 1.33333
        },
        audio: true
    }, (stream) => {
        localStream = stream
        document.getElementById("local-video").srcObject = localStream //show video stream in the video element wiht local-video id in sender.html


        //list of stun servers
        let configuration = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302", 
                    "stun:stun1.l.google.com:19302", 
                    "stun:stun2.l.google.com:19302"]
                }
            ]
        }

        peerConn = new RTCPeerConnection(configuration)

        //attach our stream to peerConn
        peerConn.addStream(localStream) 
        peerConn.onaddstream = (e) => {
            document.getElementById("remote-video")
            .srcObject = e.stream
        }

        //send ice canditates to the server
        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null)
                return
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })

        createAndSendOffer()
    }, (error) => {
        console.log(error) //log out the error
    })
}

//function to send offer when someone is trying to connect with us
function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error) //log out the error
    })
}

//function to mute audio
let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}


//function to mute video
let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}