Reef.debug(true);

const store = new Reef.Store({
    data: {
        hash: {
            board: null
        },
        loading: false,
        boards: [],
        board: null,
        addPin: {
            active: false,
            boardId: "",
            newBoardName: null,
            imageUrl: "",
            previewReady: false,
            previewImageUrl: null,
            siteUrl: "",
            description: "",
            saveInProgress: false
        },
        pinZoom: {
            active: false,
            pin: null,
            fullDescriptionOpen: false
        },
        aboutModal: {
            active: false
        },
        editBoard: {
            active: false,
            name: ""
        }
    },
    getters: {
        isAddPinValid: (data) => {

            if ( data.addPin.boardId == "new"){
                if ( !data.addPin.newBoardName ){
                    return false;
                } else if ( data.addPin.newBoardName.trim().length < 1 ){
                    return false;
                }
            }

            if ( !data.addPin.previewImageUrl ){
                return false;
            }

            return true;
        }
    }
});

// since we can't dynamically set setters/getters in Reef, 
// we'll create our own outside 'store'
const actions = new Proxy(new function(){

    const _actions = {};

    this.add = (actionName, f) => {
        if ( _actions[actionName] ){
            console.error(`action ${actionName} is already defined.`);
        } else {
            console.log(`Added action ${actionName}`);
            _actions[actionName] = f;
        }
    };

    this.do = (actionName, target) => {
        console.log(_actions);
        if (!_actions[actionName]){
            console.error(`action ${actionName} is not defined.`);
        } else {
            console.log(`running action ${actionName}`);
            _actions[actionName](store.data, target);
        }
    }

    set = () => {
        console.error("Use actions.do(name, function).");
    }

}, {
    get(target, name, receiver){
        console.log("target");
        console.log(target);
        console.log("name");
        console.log(name);
        console.log("receiver");
        console.log(receiver);
        return Reflect.get(target, name, receiver);
    },
    set(target, name, receiver){
        console.error("Direct modification of actions is not allowed. Use actions.do(name, function) instead.");
    }
});

function getBoardIndexById(id){
    let idx = -1;
    for ( let i = 0; i < store.data.boards.length; ++i ){
        if ( store.data.boards[i].id == id ){
            idx = i;
        }
    }
    return idx;
}

function getBoardById(id){
    return store.data.boards[getBoardIndexById(id)];
}

function getPinIndexById(id){
    let idx = -1;
    for ( let i = 0; i < store.data.board.pins.length; ++i ){
        if ( store.data.board.pins[i].id == id ){
            idx = i;
        }
    }
    return idx;
}

function getPinById(id){
    return store.data.board.pins[getPinIndexById(id)];
}

// const actions = {   
   
//     deletePin: async () => {
//         if ( confirm("Are you sure you want to delete this pin?") ){

//             store.data.loading++;

//             let pinId = store.data.pinZoom.pin.id;

//             let idx = getPinIndexById(pin.id);
//             if ( idx >= 0 ){
//                 store.data.board.pins.splice(idx,1);
//             }

//             actions.closePinZoomModal();

//             let res = await fetch(`/api/pins/${pinId}`, {
//                 method: "DELETE"
//             });

//             if ( res.status == 200 ){
//                 console.log(`deleted pin#${pinId}`);
//             } else {
//                 console.error(`error deleting pin#${pinId}`);
//             }

//             store.data.loading--;
                       
//         }
//     },
    

// }

const app = new Reef("#app", {
    store: store,
    template: (data) => {
        return /*html*/`
        <div id="navbar"></div>
        <section class="section">
            <div class="container" id="brick-wall-container">
                <div id="brick-wall" class="brick-wall"></div>
            </div>
        </section>
        <footer class="footer" id="footer">
            <div class="content has-text-right">
                <a data-onclick="aboutModal.open">about tinypin</a>
            </div>
        </footer>

        

        <div id="add-pin-modal"></div>
        <div id="pin-zoom-modal"></div>
        <div id="edit-board-modal"></div>
        <div id="aboutModal"></div>
        `
        //<div id="loader" class="button is-text ${data.loading ? 'is-loading' : ''}"></div>
    }
});

document.addEventListener('click', (el) => {
    let target = el.target.closest('[data-onclick]');
    if (target) {
        let action = target.getAttribute('data-onclick');
        if (action) {
            actions.do(action, target);
        }
    }
});

// focusout bubbles while 'blur' does not.  
document.addEventListener('focusout', (el) => {
    let target = el.target.closest('[data-onblur]');
    if ( target ){
        let method = target.getAttribute('data-onblur');
        if ( method ) {
            actions.do(method, target);
        }
    }
});

document.addEventListener('keyup', (el) => {
    
    if ( store.data.pinZoom.active ){
        if ( el.key == "Escape" ){
            actions.closePinZoomModal();
        } else if ( el.key == "ArrowLeft" ){
            actions.movePinZoomModalLeft();
        } else if ( el.key == "ArrowRight" ){
            actions.movePinZoomModalRight();
        }
    }

    if ( store.data.addPin.active ){
        if ( el.key == "Escape" ){
            actions.closeAddPinModal();
        }
    }

    if ( store.data.aboutModal.active ){
        if ( el.key == "Escape" ){
            actions.closeAboutModal();
        }
    }

});

window.addEventListener('hashchange', (evt) => {
    handleHash();
});

window.addEventListener('resize', (evt) => {
    app.render();
});

Reef.databind(app);
app.render();

handleHash();
loadBoards();


function handleHash(){
    
    let hash = parseQueryString(window.location.hash.substr(1));
    store.data.hash = hash;

    if ( hash.board ){
        if ( !store.board || store.board.id != hash.board ){
            loadBoard(hash.board);
        }
    } else {
        store.data.board = null;

        store.data.pinZoom.active = false;
        store.data.addPin.active = false;
        store.data.aboutModal.active = false;
    }

}

async function loadBoard(id){
    store.data.loading++
    let res = await fetch("/api/boards/" + id);
    store.data.board = await res.json();
    store.data.loading--;
}

async function loadBoards(){
    store.data.loading++;
    let res = await fetch("/api/boards");
    store.data.boards = await res.json();
    store.data.loading--;
}


function parseQueryString(qs){
    let obj = {};
    let parts = qs.split("&");
    for ( let i = 0; i < parts.length; ++i ){
        let kv = parts[i].split("=");
        if ( kv.length == 2 ){
            let key = decodeURIComponent(kv[0]);
            let value = decodeURIComponent(kv[1]);
            obj[key] = value;
        }
    }
    return obj;
}

