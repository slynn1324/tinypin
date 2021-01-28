// decorate on web socket functions.  if web sockets fail to work, the app should keep working anyway.
// if you want to permanently disable websockets, just remove the src include 

window.socketConnected = false;
window.socket = null;

// keep-alive
setInterval(() => {
    if ( window.socket && window.socket.readyState != WebSocket.OPEN ){
        console.log("web socket reconnect");
        window.socket = socketConnect();
    } else {
        window.socket.send(".");
    }
}, 30000);

window.addEventListener("socket-connect", () => {
    socketConnect();
});

function socketConnect(){

    if ( !window.uid ){
        console.log("no user id, can't open a socket");
        return;
    }

    if ( window.socketConnected ){
        console.log("web socket already connected");
        return;
    }

    window.socketConnected = false;

    let s = new WebSocket(getSocketUrl());

    s.onopen = (e) => {
        console.log("web socket connected");

        // wait 10ms to see if the socket stays connected
        setTimeout( () => {
            if ( s.readyState == WebSocket.OPEN ){
                console.log("web socket appears operational");
                document.body.classList.add("socketConnected");
                window.socketConnected = true;
                window.socketConnectFailureCount = 0;

                store.do("load.boards");
                store.do("load.board");                
            } else {
                console.log("web socket connect failed");
            }
        }, 10);
    };
    
    s.onmessage = (e) => {
        console.log("web socket message: " + e.data);
        let msg = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent("broadcast", {detail: msg}));
    }
    
    s.onclose = (e) => {
        console.log("web socket closed");
        document.body.classList.remove("socketConnected");
        window.socketConnected = false;
    }
    
    s.onerror = (e) => {
        console.log("web socket error: " + e.message);
    }

    window.socket = s;
}


function getSocketUrl(){
    var loc = window.location, new_uri;
    if (loc.protocol === "https:") {
        new_uri = "wss:";
    } else {
        new_uri = "ws:";
    }
    new_uri += "//" + loc.host;
    new_uri += "/ws/" + window.uid;
    return new_uri;
}

