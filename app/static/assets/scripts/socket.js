console.log("Sanity check from socket.js.");

const roomName = JSON.parse(document.getElementById('roomName').textContent);
username = (username == "") ? "Guest" : username;
let socket;
let webSocket = null;

let chatLog = document.querySelector("#chatLog");
let chatMessageInput = document.querySelector("#chatMessageInput");
let chatMessageSend = document.querySelector("#chatMessageSend");
let onlineUsersSelector = document.querySelector("#onlineUsersSelector");

// adds a new option to 'onlineUsersSelector'
function onlineUsersSelectorAdd(value) {
    if (document.querySelector("option[value='" + value + "']")) return;
    let newOption = document.createElement("option");
    newOption.value = value;
    newOption.innerHTML = value;
    onlineUsersSelector.appendChild(newOption);
}

// removes an option from 'onlineUsersSelector'
function onlineUsersSelectorRemove(value) {
    let oldOption = document.querySelector("option[value='" + value + "']");
    if (oldOption !== null) oldOption.remove();
}

// submit if the user presses the enter key
chatMessageInput.onkeyup = function(e) {
    if (e.keyCode === 13) {  // enter key
        chatMessageSend.click();
    }
};

// clear the 'chatMessageInput' and forward the message
chatMessageSend.onclick = function() {
    if (chatMessageInput.value.length === 0) return;
    webSocket.send(JSON.stringify({
        type: "chat_message",
        message: chatMessageInput.value,
    }));
    chatMessageInput.value = "";
};


// Determine and trigger audio event
function decodeAudioMessage(message) {
    // Don't read until user closes overlay
    if (!$(overlay).hasClass("overlay-hidden")) {
        return;
    }
    if (message == "PIPE") {
        uiTrack.sound("pipe");
    }
    switch (message["track"]) {
        case "master":
            if (message["user"] != username) {
                $(masterSliders.item(parseInt(message["trackID"]))).trigger("input");
                masterSliders.item(parseInt(message["trackID"])).value = message["target"];
            }
            break;
        case "ambience":
            switch (message["type"]) {
                case "preset":
                    setPreset(ambience_presets[parseInt(message["preset"])]);
                    ambienceTrack.stop();
                    ambienceTrack.play();
                    break;
                case "toggle":
                    if (message["enabled"]) {
                        channelOn(parseInt(message["id"]));
                    } else {
                        channelOff(parseInt(message["id"]));
                    }
                    triggerAmbience();
                    break;
                case "slider":
                    if (message["user"] != username) {
                        $(sliders.item(parseInt(message["slider"]))).trigger("input");
                        sliders.item(parseInt(message["slider"])).value = parseInt(message["target"]);
                        slider_labels.item(parseInt(message["slider"])).innerHTML = message["target"];
                    }
                    break;
            }
            break;
        case "sequencer":
            switch (message["type"]) {
                case "beat":
                    playSequencerBeat(message["beat"]);
                    break;
                case "state":
                    if (message["user"] != username) {
                        setSequencerState(JSON.parse(message["state"]));
                    }
                    break;
                case "request":
                    socket.sendSequencerState();
                    break;
            }
            break;
        case "instrument":
            switch (message["type"]) {
                case "slider":
                    if (message["user"] != username) {
                        $(instrument_control_sliders[parseInt(message["slider"])]).find("input").val(message["target"]);
                    }
                    break;
                case "instrument":
                    let notes;
                    switch (message["instrument"]) {
                        case "guitar":
                            nextGuitarSample(message["variation"]);
                            break;
                        case "pad":
                            soundPad(message["note"]);
                            break;
                        case "flute":
                            notes = message["notes"];
                            soundFlute(message["notes"]);
                            break;
                        case "marimba":
                            notes = message["notes"];
                            soundMarimbaBeat(notes);
                            break;
                        case "synth":
                            notes = message["notes"];
                            soundSynthBeat(message["notes"]);
                            break;
                        case "piano":
                            notes = message["notes"];
                            soundPianoBeat([notes.slice(0, 8), notes.slice(9, 17)]);
                            break;
                    }
                    break;
            }
            break;
    }
}



// Socket
class Socket {

    connect() {
        webSocket = new WebSocket("wss://" + window.location.host + "/ws/app/" + roomName + "/");
    
        webSocket.onopen = function(e) {
            console.info("Successfully connected to the WebSocket.");
        }
    
        webSocket.onclose = function(e) {
            console.info("WebSocket connection closed unexpectedly. Trying to reconnect in 2s...");
            setTimeout(function() {
                console.info("Reconnecting...");
                socket.connect();
            }, 2000);
        };
    
        webSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            // console.debug(data);
        
            switch (data.type) {
                case "chat_message":
                    chatLog.value += data.user + ": " + data.message + "\n";
                    break;
                case "user_list":
                    for (let i = 0; i < data.users.length; i++) {
                        onlineUsersSelectorAdd(data.users[i]);
                    }
                    break;
                case "user_join":
                    chatLog.value += data.user + " joined the room.\n";
                    onlineUsersSelectorAdd(data.user);
                    break;
                case "user_leave":
                    chatLog.value += data.user + " left the room.\n";
                    onlineUsersSelectorRemove(data.user);
                    break;
                case "audio_message":
                    decodeAudioMessage(data.message);
                    break;
                default:
                    console.error("Unknown message type!");
                    break;
            }
        
            // scroll 'chatLog' to the bottom
            chatLog.scrollTop = chatLog.scrollHeight;
        };
    
        webSocket.onerror = function(err) {
            console.info("WebSocket encountered an error: " + err.message);
            console.info("Closing the socket.");
            webSocket.close();
        }
    }

    pipe() {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: "PIPE"
        }));
    }

    sendMaster(trackID, target) {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: {
                user: username,
                track: "master",
                trackID: trackID,
                target: target
            }
        }));
    }

    sendSequencerState() {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: {
                user: username,
                track: "sequencer",
                type: "state",
                state: JSON.stringify(getSequencerState())
            }
        }));
    }
    // Might make a requestState function which requests the entire system state instead
    requestSequencerState() {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: {
                user: username,
                track: "sequencer",
                type: "request"
            }
        }));
    }

    sendAmbiencePreset(preset) {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: {
                user: username,
                track: "ambience",
                type: "preset",
                preset: preset
            }
        }));
    }

    sendAmbienceToggle(id, enabled) {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: {
                user: username,
                track: "ambience",
                type: "toggle",
                id: id,
                enabled: enabled
            }
        }));
    }

    sendAmbienceSlider(slider, target) {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: {
                user: username,
                track: "ambience",
                type: "slider",
                slider: slider,
                target: target
            }
        }));
    }

    sendInstrumentSlider(slider, target) {
        webSocket.send(JSON.stringify({
            type: "audio_message",
            message: {
                user: username,
                track: "instrument",
                type: "slider",
                slider: slider,
                target: target
            }
        }));
    }

}


// Initialise socket
socket = new Socket();
socket.connect();