Reef.debug(true);

// force a re-render
app.addSetter("render", (data) => {
    appComponent.render();
});

app.addSetter("loader.show", (data) => {
    data.loading++;
});

app.addSetter("loader.hide", (data) => {
    data.loading--;
});

app.addSetter("load.boards", async (data) => {

    store.do("loader.show");

    let res = await fetch("/api/boards");
    data.boards = await res.json();

    data.initialized = true;
    
    store.do("loader.hide");
});

// handle update events 
window.addEventListener("broadcast", async (e) => {
    
    let data = store.data;

    if ( e.detail.updateBoard ){
        console.log("updating board");
        let boardId = e.detail.updateBoard;

        store.do("load.boards");   
        

        // if we are currently viewing this board, reload the pins
        if ( data.board && boardId && boardId == data.board.id ){
            store.do("load.board", true);
        }
    } else if ( e.detail.deleteBoard ) {
        console.log("deleting board");
        let boardId = e.detail.deleteBoard;

        // reload the boards
        store.do("load.boards");

        // we're currently looking at this board... alert and error
        if ( data.board && boardId == data.board.id ){
            window.alert("this board has been deleted on another device");
            window.location.hash = "#";
        }
    }

});

app.addSetter('load.board', async (data, force) => {
    store.do("loader.show");

    if ( data.hash.board ){
        if ( force || !data.board || data.board.id != data.hash.board ){
            let res = await fetch("/api/boards/" + data.hash.board);
            data.board = await res.json();
        } 
    }

    store.do("loader.hide");
});

app.addSetter('load.user', async (data) => {

    console.log("load.user");
    store.do("loader.show");

    let res = await fetch("/api/whoami");
    data.user = await res.json();

    window.uid = data.user.id;
    window.csrfToken = data.user.csrf;
    dispatchSocketConnect();

    store.do("loader.hide");
});

app.addSetter("hash.update", (data) => {
    data.hash = parseQueryString(window.location.hash.substr(1));
    
    if ( data.hash.board ){
        store.do('load.board');
    } else {
        data.board = null;

        data.pinZoomModal.active = false;
        data.addPinModal.active = false;
        data.aboutModal.active = false;
    }
});

app.addSetter("app.uploadDroppedFiles", async (data, evt) => {

    let boardId = store.data.board.id;

    const supportedTypes = ["image/jpeg","image/png","image/webp"];

    if ( boardId ){
        let hasFiles = event.dataTransfer.types.find(i => i == "Files") == "Files";
        if ( hasFiles ){
            
            if ( evt.dataTransfer.items ){

                let files = [];

                for ( let i = 0; i < evt.dataTransfer.items.length; ++i ){
                    if ( evt.dataTransfer.items[i].kind === "file" ){
                        let file = evt.dataTransfer.items[i].getAsFile();

                         if ( !supportedTypes.includes(file.type)){
        
                            window.alert("Unsupported file type. JPEG, PNG, and WebP images are supported.");
                            console.log("Unsupported file type: " + file.type);

                            return;
                        } 

                        // check size
                        if ( file.size >= 26214400 ){
                            window.alert("File size exceeds the 25MB limit.");
                            console.log("File size exceeds the 25MB limit. size=" + file.size);
                            document.getElementById("fileInput").value = "";        
                            return;
                        }

                        files.push(file);
                    
                    }
                }

                console.log("Number of files=" + files.length);

                for ( let i = 0; i < files.length; ++i ){

                    data.dropUploadMessage = `Uploading ${i+1} of ${files.length}`;

                    try {
                        let newPin = await multipartUpload(files[i], boardId);
                        if ( data.board && data.board.id == boardId ){
                            data.board.pins.push(newPin);
                        }
                    } catch (e){
                        window.alert("Error uploading images.");
                        break;
                    }
                }

                data.dropUploadMessage = null;

            }

        } 
    }

});

function PostException(statusCode, errorMessage){
    this.statusCode = statusCode;
    this.errorMessage = errorMessage;
}

async function multipartUpload(file, boardId, newBoardName, siteUrl, description){
    console.log("attempting multipart upload");
    let formData = new FormData();
    formData.append("file", file);
    formData.append("boardId", boardId);
    if ( newBoardName ){
        formData.append("newBoardName", newBoardName);
    }
    if ( siteUrl ){
        formData.append("siteUrl", siteUrl);   
    }
    if ( description ){
        formData.append("description", description);
    }

    let res = await fetch("./multiup", {
        method: "POST",
        body: formData,
        headers: {
            "x-csrf-token": window.csrfToken
        }
    });

    if ( res.status == 200 ){
        return res.json();
    } else {
        console.error("error uploading status=" + res.status + " body=" + await res.text());
        throw new PostException(res.status);
    }
}

function dispatchSocketConnect(){
    window.dispatchEvent(new CustomEvent("socket-connect"));
}

let store = new Reef.Store({
    data: {
        hash: {
            board: null
        },
        initialized: false,
        menuOpen: false,
        loading: 0,
        user: null,
        showHiddenBoards: window.localStorage.showHiddenBoards == "true" || false,
        boards: [],
        board: null,
        addPinModal: {
            pinId: null,
            active: false,
            boardId: "",
            newBoardName: null,
            imageUrl: "",
            previewImageUrl: null,
            siteUrl: "",
            description: "",
            saveInProgress: false,
            didYouKnowDragAndDropMessageDisabled: window.localStorage.addPinModal_didYouKnowDragAndDropMessageDisabled == "true" || false
        },
        pinZoomModal: {
            active: false,
            pin: null,
            fullDescriptionOpen: false
        },
        aboutModal: {
            active: false
        },
        editBoardModal: {
            active: false,
            name: "",
            hidden: 0
        },
        editPinModal: {
            active: false,
            pin: null,
            newBoardName: null,
            saveInProgress: false
        }
    },
    getters: app.getGetters(),
    setters: app.getSetters()
});


app.freeze();

// init the app component
const appComponent = new Reef("#app", {
    store: store,
    template: (data) => {
        return /*html*/`
        <div id="navbar"></div>
        <section class="section">
            <div class="container" id="brickwall-container">
                <div id="brickwall" class="brickwall"></div>
            </div>
        </section>
        
        <div id="addPinModal"></div>
        <div id="pinZoomModal"></div>
        <div id="editBoardModal"></div>
        <div id="aboutModal"></div>
        <div id="editPinModal"></div>
        <div id="dragAndDropModal" class="modal">
            <div class="modal-background"></div>
            <div class="modal-content">
                <div class="box">
                    <div class="m-6">drop to add pins</div>
                </div>
            </div>
        </div>
        <div class="modal ${data.dropUploadMessage ? 'is-active' : ''}">
            <div class="modal-background"></div>
            <div class="modal-content has-text-centered">
                <div class="box">
                    <div class="button is-text is-large is-loading"></div>  
                    <div>${data.dropUploadMessage}</div>         
                </div>
            </div>
        </div>
        `
        //<div id="loader" class="button is-text ${data.loading ? 'is-loading' : ''}"></div>
    }
});

// attach all the child components
for (const [name, f] of Object.entries(app.getComponents())) {
    let c = f(store);
    if ( !c ){
        throw(new Error(`component ${name} did not return a Reef component`));
    } else {
        appComponent.attach(c);
    }
}


document.addEventListener('click', (el) => {

    // we always want to close the menu on click.  if we clicked an item,
    // that will still trigger below
    let burger = el.target.closest('.navbar-burger');
    if ( !burger && store.data.menuOpen ){
        store.do('navbar.closeMenu');
    }
    
    let target = el.target.closest('[data-onclick]');
    if (target) {
        let action = target.getAttribute('data-onclick');
        if (action) {
            try{
                store.do(action, target);
            } catch (err){
                console.error(`Error invoking ${action}:`, err);
            }
        } 
    } else {
        let targetx = el.target.closest('[data-onclick-x]'); // onclick-x attempts to invoke a function on window instead of a setter.  this is useful to bypass re-rendering
        if ( targetx ){
            let actionx = targetx.getAttribute('data-onclick-x');
            if ( actionx ){
                window[actionx](targetx);
            }
        }
    }
    
});

// focusout bubbles while 'blur' does not.  
document.addEventListener('focusout', (el) => {
    let target = el.target.closest('[data-onblur]');
    if ( target ){
        let method = target.getAttribute('data-onblur');
        if ( method ) {
            store.do(method, target);
        }
    }
});

document.addEventListener('keyup', (el) => {   
    
    if ( store.data.pinZoomModal.active ){
        if ( el.key == "Escape" ){
            store.do('pinZoomModal.close');
            
        } else if ( el.key == "ArrowLeft" ){
            store.do('pinZoomModal.moveLeft');
        } else if ( el.key == "ArrowRight" ){
            store.do('pinZoomModal.moveRight');
        }
    }

    if ( store.data.addPinModal.active ){
        if ( el.key == "Escape" ){
            store.do('addPinModal.close');
        }
    }

    if ( store.data.aboutModal.active ){
        if ( el.key == "Escape" ){
            store.do('aboutModal.close');
        }
    }

});

window.addEventListener("hashchange", () => {
    store.do("hash.update");
});

window.addEventListener('resize', (evt) => {
    store.do("render");
});

Reef.databind(appComponent);

store.do('load.user');
store.do('load.boards');
store.do('hash.update');

appComponent.render();


// refresh on load.  
window.lastVisibilityChange = new Date().getTime();
document.addEventListener("visibilitychange", async () => {
    
    let now = new Date().getTime();

    // only run if we haven't run in the last second.. prevent double updates
    if ( document.visibilityState === 'visible' && (now - window.lastVisibilityChange) > 1000) {
        window.lastVisibilityChange = now;

        let connected = false;
        if ( dispatchSocketConnect ){ // maybe we stripped out web sockets
            connected = await dispatchSocketConnect();
        }

        if ( !connected ){
            store.do("load.boards");
            store.do("load.board");
        }
    }

});

window.dragInProgress = false;

window.ondragover = (evt) => {
    
    let data = store.data;

    if ( !data.board || data.addPinModal.active || data.editPinModal.active || data.aboutModal.active || data.pinZoomModal.active ){
        return;
    }

    evt.preventDefault();

    let hasFiles = event.dataTransfer.types.find(i => i == "Files") == "Files";
    if ( hasFiles ){
        window.dragInProgress = true;
        document.getElementById("dragAndDropModal").classList.add("is-active");
    }    
};

window.ondragleave = (evt) => {
    if ( evt.x == 0 && evt.y == 0 ){
        document.getElementById("dragAndDropModal").classList.remove("is-active");
        window.dragInProgress = false;
    }
}

window.ondrop = async (evt) => {

    if ( window.dragInProgress ){
        evt.preventDefault();

        document.getElementById("dragAndDropModal").classList.remove("is-active");

        let hasFiles = event.dataTransfer.types.find(i => i == "Files") == "Files";
        if ( hasFiles ){
            store.do("app.uploadDroppedFiles", evt);
        }
    }

};

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}




