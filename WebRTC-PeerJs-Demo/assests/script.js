var room_id;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var local_stream;
var screenStream;
var peer = null;
var currentPeer = null
var screenSharing = false

function createRoom() {
    console.log("Creating Room")
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = room;
    peer = new Peer(room_id)
    peer.on('open', (id) => {// Initialize variables
let room_id;
let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let local_stream;
let screenStream;
let peer = null;
let currentPeer = null;
let screenSharing = false;
let onlineUsers = []; // Initialize array to store online users

// Function to create a room
function createRoom() {
    let room = document.getElementById("room-input").value.trim();
    if (room === "") {
        alert("Please enter a room number.");
        return;
    }
    room_id = room;
    
    // Initialize Peer with room ID
    peer = new Peer(room_id);
    
    // Event handler when Peer connection is established
    peer.on('open', (id) => {
        console.log("Peer Room ID: ", id);
        
        // Get user media (video and audio)
        getUserMedia({ video: true, audio: true }, (stream) => {
            console.log(stream);
            local_stream = stream;
            setLocalStream(local_stream);
        }, (err) => {
            console.log(err);
        });
        
        // Notify user
        notify("Waiting for peer to join.");
    });
    
    // Event handler when receiving a call
    peer.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            console.log("Received call");
            console.log(stream);
            setRemoteStream(stream);
        });
        currentPeer = call;
    });
}

// Function to set local stream
function setLocalStream(stream) {
    document.getElementById("local-vid-container").hidden = false;
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

// Function to set remote stream
function setRemoteStream(stream) {
    document.getElementById("remote-vid-container").hidden = false;
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

// Function to notify user
function notify(msg) {
    let notification = document.getElementById("notification");
    notification.innerHTML = msg;
    notification.hidden = false;
    setTimeout(() => {
        notification.hidden = true;
    }, 3000);
}

// Function to join a room
function joinRoom() {
    let room = document.getElementById("room-input").value.trim();
    if (room === "") {
        alert("Please enter a room number.");
        return;
    }
    room_id = room;
    let username = prompt("Enter your name:");
    if (!username) {
        alert("Please enter your name.");
        return;
    }
    peer = new Peer();
    peer.on('open', (id) => {
        console.log("Connected room with Id: " + id);
        let user = { id: id, name: username };
        handleUserJoin(user);
        getUserMedia({ video: true, audio: false }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream);
            notify("Joining peer");
            let call = peer.call(room_id, { name: username, stream: stream }); // Pass user name along with the call
            call.on('stream', (stream) => {
                setRemoteStream(stream);
            });
            currentPeer = call;
        }, (err) => {
            console.log(err);
        });
    });
}

// Function to join a room and directly share screen
function joinRoomWithoutCamShareScreen() {
    let room = document.getElementById("room-input").value.trim();
    if (room === "") {
        alert("Please enter a room number.");
        return;
    }
    room_id = room;
    let username = prompt("Enter your name:");
    if (!username) {
        alert("Please enter your name.");
        return;
    }
    peer = new Peer();
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id);
        let user = { id: id, name: username };
        handleUserJoin(user);
        // Create a fake media stream for screen sharing
        const createMediaStreamFake = () => {
            return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width: 640, height: 480 })]);
        }

        notify("Joining peer");
        let call = peer.call(room_id, { name: username, stream: createMediaStreamFake() }); // Pass user name along with the call
        call.on('stream', (stream) => {
            setRemoteStream(stream);
        });
        currentPeer = call;
        startScreenShare();
    });
}

// Function to create an empty audio track
function createEmptyAudioTrack() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    const track = dst.stream.getAudioTracks()[0];
    return Object.assign(track, { enabled: false });
}

// Function to create an empty video track
function createEmptyVideoTrack({ width, height }) {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, width, height);

    const stream = canvas.captureStream();
    const track = stream.getVideoTracks()[0];

    return Object.assign(track, { enabled: false });
}

// Function to start screen sharing
function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing();
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        setScreenSharingStream(stream);
        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing();
        }
        if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            });
            sender.replaceTrack(videoTrack);
            screenSharing = true;
        }
        console.log(screenStream);
    });
}

// Function to stop screen sharing
function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        });
        sender.replaceTrack(videoTrack);
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false;
}

// Function to update the list of online users
function updateOnlineUsers(users) {
    let userList = document.getElementById("user-list");
    userList.innerHTML = "";
    users.forEach(user => {
        let listItem = document.createElement("li");
        listItem.textContent = user.name;
        userList.appendChild(listItem);
    });
}

// Function to handle when a new user joins the room
function handleUserJoin(user) {
    onlineUsers.push(user); // Add the user to the list of online users
    updateOnlineUsers(onlineUsers); // Update the list of online users in the UI
    broadcastUsername(user); // Broadcast the user name to other peers
}

// Function to broadcast user name to other peers
function broadcastUsername(user) {
    for (let peerId in peer.connections) {
        peer.connections[peerId].forEach(connection => {
            connection.send({ type: 'username', username: user.name });
        });
    }
}

// Function to handle incoming messages
peer.on('connection', (connection) => {
    connection.on('data', (data) => {
        if (data.type === 'username') {
            let newUser = { id: connection.peer, name: data.username };
            handleUserJoin(newUser);
        }
    });
});

        console.log("Peer Room ID: ", id)
        getUserMedia({ video: true, audio: true }, (stream) => {
            console.log(stream);
            local_stream = stream;
            setLocalStream(local_stream)
        }, (err) => {
            console.log(err)
        })
        notify("Waiting for peer to join.")
    })
    peer.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            console.log("got call");
            console.log(stream);
            setRemoteStream(stream)
        })
        currentPeer = call;
    })
}

function setLocalStream(stream) {
    document.getElementById("local-vid-container").hidden = false;
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setScreenSharingStream(stream) {
    document.getElementById("screenshare-container").hidden = false;
    let video = document.getElementById("screenshared-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setRemoteStream(stream) {
    document.getElementById("remote-vid-container").hidden = false;
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}


function notify(msg) {
    let notification = document.getElementById("notification")
    notification.innerHTML = msg
    notification.hidden = false
    setTimeout(() => {
        notification.hidden = true;
    }, 3000)
}

function joinRoom() {
    console.log("Joining Room")
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = room;
    peer = new Peer()
    peer.on('open', (id) => {
        console.log("Connected room with Id: " + id)

        getUserMedia({ video: true, audio: false }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
            notify("Joining peer")
            let call = peer.call(room_id, stream)
            call.on('stream', (stream) => {
                setRemoteStream(stream);

            })
            currentPeer = call;
        }, (err) => {
            console.log(err)
        })

    })
}
function joinRoomWithoutCamShareScreen() {
    // join a call and drirectly share screen, without accesing camera
    console.log("Joining Room")
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = room;
    peer = new Peer()
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id)

        const createMediaStreamFake = () => {
            return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width: 640, height: 480 })]);
        }

        const createEmptyAudioTrack = () => {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            const track = dst.stream.getAudioTracks()[0];
            return Object.assign(track, { enabled: false });
        }

        const createEmptyVideoTrack = ({ width, height }) => {
            const canvas = Object.assign(document.createElement('canvas'), { width, height });
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "green";
            ctx.fillRect(0, 0, width, height);

            const stream = canvas.captureStream();
            const track = stream.getVideoTracks()[0];

            return Object.assign(track, { enabled: false });
        };

        notify("Joining peer")
        let call = peer.call(room_id, createMediaStreamFake())
        call.on('stream', (stream) => {
            setRemoteStream(stream);

        })

        currentPeer = call;
        startScreenShare();

    })
}

function joinRoomShareVideoAsStream() {
    // Play video from local media
    console.log("Joining Room")
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }

    room_id = room;
    peer = new Peer()
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id)

        document.getElementById("local-mdeia-container").hidden = false;
        
        const video = document.getElementById('local-media');
        video.onplay = function () {
            const stream = video.captureStream();
            notify("Joining peer")
            let call = peer.call(room_id, stream)

            // Show remote stream on my side
            call.on('stream', (stream) => {
                setRemoteStream(stream);

            })
        };
        video.play();
    })
}

function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        setScreenSharingStream(stream);

        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing()
        }
        if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
            screenSharing = true
        }
        console.log(screenStream)
    })
}

function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false
}
