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
            pin: null
        },
        about: {
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
        },
        isEditBoardValid: (data) => {
            if (!data.editBoard.name){
                return false;
            }

            if ( data.editBoard.name.trim().length < 1 ){
                return false;
            }

            return true;
        }
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

const actions = {
    openAddPinModal: () => {
        
        if ( store.data.board ){
            store.data.addPin.boardId = store.data.board.id;
        } else if ( store.data.boards && store.data.boards.length > 0 ){
            store.data.addPin.boardId = store.data.boards[0].id;
        } else {
            store.data.addPin.boardId = "new";
        }

        store.data.addPin.active = true;
    },
    closeAddPinModal: () => {
        store.data.addPin.active = false;
        store.data.addPin.imageUrl = "";
        store.data.addPin.previewImageUrl = "";
        store.data.addPin.siteUrl = "";
        store.data.addPin.description = "";
        store.data.addPin.newBoardName = "";
        store.data.addPin.saveInProgress = false;
    },
    saveAddPin: async () => {

        store.data.addPin.saveInProgress = true;

        let boardId = store.data.addPin.boardId;

        let newBoard = null;

        if ( boardId == "new" ){
            let res = await fetch('api/boards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "name": store.data.addPin.newBoardName
                })
            });

            if ( res.status == 200 ){
                newBoard = await res.json();
                boardId = newBoard.id;
                store.data.boards.push(newBoard);
            }
        }

        let postData = {
            boardId: boardId,
            imageUrl: store.data.addPin.imageUrl,
            siteUrl: store.data.addPin.siteUrl,
            description: store.data.addPin.description
        };

        let res = await fetch('api/pins', {
            method: 'POST',
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(postData)
        });

        if ( res.status == 200 ){
            
            let body = await res.json();
            if ( store.data.board && store.data.board.id == boardId ){
                store.data.board.pins.push(body);
            }
            
            if ( newBoard ){
                newBoard.titlePinId = body.id;
            }

            actions.closeAddPinModal();
        } 

    },
    updateAddPinPreview: () => {
        if ( store.data.addPin.imageUrl.startsWith("http") ){
            ( async() => {
                let res = await fetch(store.data.addPin.imageUrl, {
                    mode: 'no-cors',
                    method: "HEAD"
                });
                if ( res.status = 200 ){
                    store.data.addPin.previewImageUrl = store.data.addPin.imageUrl;
                }
            })();
        } else {
            store.data.addPin.previewImageUrl = null;
        }
    },
    openPinZoomModal: (el) => {
        
        let pinId = el.getAttribute("data-pinid");

        if( pinId ){
            store.data.pinZoom.pin = getPinById(pinId);
            store.data.pinZoom.active = true;
        }
        
    },
    closePinZoomModal: () => {
        store.data.pinZoom.active = false;
        store.data.pinZoom.pinId = null;
    },
    movePinZoomModalLeft: () => {

        let idx = getPinIndexById(store.data.pinZoom.pin.id);
        
        if ( idx > 0 ){
            store.data.pinZoom.pin = store.data.board.pins[idx-1];
        }

    },
    movePinZoomModalRight: () => {

        let idx = getPinIndexById(store.data.pinZoom.pin.id);
        
        if ( idx >= 0 && (idx < store.data.board.pins.length-1) ){
            store.data.pinZoom.pin = store.data.board.pins[idx+1];
        }
    },
    deletePin: async () => {
        if ( confirm("Are you sure you want to delete this pin?") ){

            store.data.loading++;

            let pinId = store.data.pinZoom.pin.id;

            let idx = getPinIndexById(pin.id);
            if ( idx >= 0 ){
                store.data.board.pins.splice(idx,1);
            }

            actions.closePinZoomModal();

            let res = await fetch(`/api/pins/${pinId}`, {
                method: "DELETE"
            });

            if ( res.status == 200 ){
                console.log(`deleted pin#${pinId}`);
            } else {
                console.error(`error deleting pin#${pinId}`);
            }

            store.data.loading--;
                       
        }
    },
    showAboutModal: () => {
        store.data.about.active = true;
    },
    closeAboutModal: () => {
        store.data.about.active = false;
    },
    openEditBoardModal: () => {
        store.data.editBoard.name = store.data.board.name;
        store.data.editBoard.active = true;
    },
    closeEditBoardModal: () => {
        store.data.editBoard.name = "";
        store.data.editBoard.active = false;
    },
    saveEditBoard: async () => {

        store.data.loading++

        let boardId = store.data.board.id;
        let name = store.data.editBoard.name;

        let idx = getBoardIndexById(boardId);
        console.log("idx=" + idx);
        if ( idx >= 0 ){
            store.data.boards[idx].name = name;
            store.data.board.name = name;
        }

        let res = await fetch(`/api/boards/${boardId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name
            })
        });

        if ( res.status == 200 ){
            console.log(`updated board#${boardId}`);
            store.data.editBoard.active = false;
        } else {
            console.error(`error updating board#${boardId}`);
        }


        store.data.loading--;
    },
    editBoardDelete: async () => {

        if ( !confirm("Are you sure you want to delete this board and all pins on it?") ){
            return;
        }

        store.data.loading++;

        let boardId = store.data.board.id;


        let idx = getBoardIndexById(boardId);
        if ( idx >= 0 ){
            store.data.boards.splice(idx, 1);
        }
        store.data.editBoard.active = false;
        window.location.hash = "";


        let res = await fetch(`/api/boards/${boardId}`, {
            method: 'DELETE'
        });

        if ( res.status == 200 ){
            console.log(`deleted board#${boardId}`);                
        } else {
            console.log(`error deleting board#${boardId}`);
        }

        store.data.loading--;
    }
}

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
            <div class="content">
                <div class="level">
                    <div class="level-left">
                        
                    </div>
                    <div class="level-right">
                        <a data-onclick="showAboutModal">about tinypin</a>
                    </div>
                </div>
            </div>
        </footer>

        <div id="add-pin-modal"></div>
        <div id="pin-zoom-modal"></div>
        <div id="edit-board-modal"></div>
        <div id="about-modal"></div>
        `
    }
});

const navbar = new Reef("#navbar", {
    store: store,
    template: (data) => {

        let boardName = "";

        if ( data.board ){
            boardName = /*html*/`
            <span class="navbar-item">${data.board.name} &nbsp;
                <a data-onclick="openEditBoardModal" style="padding-top: 3px;"><img alt="edit" width="16" height="16" src="data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48dGl0bGU+NTE8L3RpdGxlPjxwYXRoIGQ9Ik04NC44NTAxMiw1MFY4MS43NDUxMkExMy4yNzAxMiwxMy4yNzAxMiwwLDAsMSw3MS41OTUyNCw5NUgxOC4yNTQ5MUExMy4yNzAxMiwxMy4yNzAxMiwwLDAsMSw1LDgxLjc0NTEyVjI4LjQwNTI4QTEzLjI3MDEyLDEzLjI3MDEyLDAsMCwxLDE4LjI1NDkxLDE1LjE1MDRINTBhMi41LDIuNSwwLDAsMSwwLDVIMTguMjU0OTFBOC4yNjQyMyw4LjI2NDIzLDAsMCwwLDEwLDI4LjQwNTI4VjgxLjc0NTEyQTguMjY0MjQsOC4yNjQyNCwwLDAsMCwxOC4yNTQ5MSw5MEg3MS41OTUyNGE4LjI2NDIzLDguMjY0MjMsMCwwLDAsOC4yNTQ4OC04LjI1NDg5VjUwYTIuNSwyLjUsMCwwLDEsNSwwWk04OS4xNDg0Niw2LjIzNzkyYTQuMjI2NjEsNC4yMjY2MSwwLDAsMC01Ljk3NzI5LDBsLTMzLjk2MjksMzMuOTYzTDU5Ljc5OTE2LDUwLjc5MTc2bDMzLjk2Mjg5LTMzLjk2M2E0LjIyNjUzLDQuMjI2NTMsMCwwLDAsMC01Ljk3NzIzWk00My42MjM4LDU4LjMxMjg3bDEzLjAwOTQtNC4zNTUxNkw0Ni4wNDIyNiw0My4zNjY4M2wtNC4zNTUxLDEzLjAwOTRBMS41MzAwNSwxLjUzMDA1LDAsMCwwLDQzLjYyMzgsNTguMzEyODdaIj48L3BhdGg+PC9zdmc+" /></a>
            </span>`;
        } else if ( !data.hash.board ) {
            boardName = /*html*/`<span class="navbar-item">Boards</span>`;
        }

        return /*html*/`
        <nav class="navbar is-light" role="navigation" aria-label="main navigation">
            <div class="navbar-brand">
                <a class="navbar-item" href="#">
                    <img alt="boards" width="32" height="32" src="data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2OCA0OCIgeD0iMHB4IiB5PSIwcHgiPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTcyLDgwNiBMMTA3LDgwNiBDMTA4LjEwNDU2OSw4MDYgMTA5LDgwNi44OTU0MzEgMTA5LDgwOCBMMTA5LDgzMiBDMTA5LDgzMy4xMDQ1NjkgMTA4LjEwNDU2OSw4MzQgMTA3LDgzNCBMNzIsODM0IEM3MC44OTU0MzA1LDgzNCA3MCw4MzMuMTA0NTY5IDcwLDgzMiBMNzAsODA4IEM3MCw4MDYuODk1NDMxIDcwLjg5NTQzMDUsODA2IDcyLDgwNiBaIE0xMTIsODIyIEwxMTIsODIyIEwxMTIsODA4IEMxMTIsODA1LjIzODU3NiAxMDkuNzYxNDI0LDgwMyAxMDcsODAzIEw5Niw4MDMgTDk2LDc4OCBDOTYsNzg2Ljg5NTQzMSA5Ni44OTU0MzA1LDc4NiA5OCw3ODYgTDEyMiw3ODYgQzEyMy4xMDQ1NjksNzg2IDEyNCw3ODYuODk1NDMxIDEyNCw3ODggTDEyNCw4MjAgQzEyNCw4MjEuMTA0NTY5IDEyMy4xMDQ1NjksODIyIDEyMiw4MjIgTDExMiw4MjIgWiBNODQsODAzIEw3Miw4MDMgQzY5LjIzODU3NjMsODAzIDY3LDgwNS4yMzg1NzYgNjcsODA4IEw2Nyw4MTcgTDU4LDgxNyBDNTYuODk1NDMwNSw4MTcgNTYsODE2LjEwNDU2OSA1Niw4MTUgTDU2LDc5MSBDNTYsNzg5Ljg5NTQzMSA1Ni44OTU0MzA1LDc4OSA1OCw3ODkgTDgyLDc4OSBDODMuMTA0NTY5NSw3ODkgODQsNzg5Ljg5NTQzMSA4NCw3OTEgTDg0LDgwMyBaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTYgLTc4NikiPjwvcGF0aD48L3N2Zz4=" />
                    
                </a>
           
                <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>

            </div>

            <div class="navbar-menu">
                <div class="navbar-start">
                    ${boardName}
                </div>
                <div class="navbar-end">
                    <span class="navbar-item">
                        <div id="loader" class="button is-text ${data.loading ? 'is-loading' : ''}"></div>
                    </span>
                    <a class="navbar-item" data-onclick="openAddPinModal">
                        <img alt="add pin" width="32" height="32" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' data-name='Layer 1' viewBox='0 0 100 125' x='0px' y='0px'%3E%3Ctitle%3EArtboard 164%3C/title%3E%3Cpath d='M56.77,3.11a4,4,0,1,0-5.66,5.66l5.17,5.17L37.23,33A23.32,23.32,0,0,0,9.42,36.8L7.11,39.11a4,4,0,0,0,0,5.66l21.3,21.29L3.23,91.23a4,4,0,0,0,5.66,5.66L34.06,71.72l21,21a4,4,0,0,0,5.66,0l2.31-2.31a23.34,23.34,0,0,0,3.81-27.82l19-19,5.17,5.18a4,4,0,0,0,5.66-5.66Zm1.16,81.16L15.61,42a15.37,15.37,0,0,1,21.19.51L57.42,63.08A15.39,15.39,0,0,1,57.93,84.27Zm4-28L43.59,37.94,61.94,19.59,80.28,37.94Z'/%3E%3C/svg%3E"/>
                    </a>
                </div>
            </div>
        </nav>
        `;

    },
    attachTo: app
});

const brickwall = new Reef('#brick-wall', {
    store: store,
    template: (data, el) => {

        // if the hash says we are supposed to be drawing a board, but it hasn't loaded yet... draw an empty div.
        if ( data.hash.board && !data.board ){
            return '<div></div>';
        }

        let numberOfColumns = 1;
        let width = el.offsetWidth;
        // matching bulma breakpoints - https://bulma.io/documentation/overview/responsiveness/
        if( width >= 1216 ){
            numberOfColumns = 5;
        } else if ( width >= 1024 ){
            numberOfColumns = 4;
        } else if ( width >= 769 ){
            numberOfColumns = 3;
        } else if ( width > 320 ){
            numberOfColumns = 2;
        }
        
        function createBrickForBoard(board){
            return /*html*/`
            <div class="brick board-brick">
                <a href="#board=${board.id}">
                    <img src="${board.titlePinId > 0 ? getThumbnailImagePath(board.titlePinId) : ''}" />
                    <div class="board-brick-name">${board.name}</div>
                </a>
            </div>
            `;
        }

        function createBrickForPin(board, pin){
            return /*html*/`
            <div class="brick" >
                <a data-pinid="${pin.id}" data-onclick="openPinZoomModal">
                    <img src="${getThumbnailImagePath(pin.id)}" width="${pin.thumbnailWidth}" height="${pin.thumbnailHeight}" />
                </a>
            </div>
            `;
        }

        // create the brick elements
        let bricks = [];

        if ( data.board ){
            for ( let i = 0; i < data.board.pins.length; ++i ){
                bricks.push(createBrickForPin(data.board, data.board.pins[i]));
            }
        } else {
            for ( let i = 0; i < data.boards.length; ++i ){           
                bricks.push(createBrickForBoard(data.boards[i]));
            }
        }
       
        // create column objects
        let columns = [];
        for ( let i = 0; i < numberOfColumns; ++i ){
            columns[i] = {
                height: 0,
                bricks: []
            }
        }

        // sort bricks into columns
        for ( let i = 0; i < bricks.length; ++i ){
            columns[i % columns.length].bricks.push(bricks[i]);
        }
    

        // write out the bricks
        let result = "";

        for ( let col = 0; col < columns.length; ++col ){
            result += '<div class="brick-wall-column">';

            for ( let i = 0; i < columns[col].bricks.length; ++i ){
                result += columns[col].bricks[i];
            }

            result += '</div>';
        }

        return result;
    },
    attachTo: app
});

const addPinModal = new Reef("#add-pin-modal", {
    store: store,
    template: (data) => {

        let imagePlaceholder = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22300%22%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%22300%22%20height%3D%22300%22%20style%3D%22fill%3A%23dedede%3B%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2218%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23555555%22%3Eimage%3C%2Ftext%3E%3C%2Fsvg%3E';

        let options = "";
        for ( let i = 0; i < data.boards.length; ++i ){
            options += `<option value="${data.boards[i].id}">${data.boards[i].name}</option>`;
        }

        let newBoardField = '';
        if ( data.addPin.boardId == "new" ){
            newBoardField = /*html*/`
            <div class="field">
                <label class="label">Board Name</label>
                <div class="control">
                    <input class="input" type="text" data-bind="addPin.newBoardName" />
                </div>
            </div>
            `;
        }

        return /*html*/`
        <div class="modal ${data.addPin.active ? 'is-active' : ''}">
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Add Pin</p>
                    <button class="delete" aria-label="close" data-onclick="closeAddPinModal"></button>
                </header>
                <section class="modal-card-body">
                    <div class="add-pin-flex">
                        <div class="add-pin-flex-left">
                            <img id="add-pin-modal-img" src="${data.addPin.previewImageUrl ? data.addPin.previewImageUrl : imagePlaceholder}" />
                        </div>
                        <div class="add-pin-flex-right">
                            <form>
                                
                                <div class="field">
                                    <label class="label">Board</label>
                                    <div class="select">
                                        <select data-bind="addPin.boardId">
                                            ${options}
                                            <option value="new">Create New Board</option>
                                        </select>
                                    </div>
                                </div>

                                ${newBoardField}

                                <div class="field">
                                    <label class="label">Image Url</label>
                                    <div class="control">
                                        <input class="input" type="text" data-bind="addPin.imageUrl" data-onblur="updateAddPinPreview"/>
                                    </div>
                                </div>

                                <div class="field">
                                    <label class="label">Website Url</label>
                                    <div class="control">
                                        <input class="input" type="text" data-bind="addPin.siteUrl" />
                                    </div>
                                </div>

                                <div class="field">
                                    <label class="label">Description</label>
                                    <div class="control">
                                        <textarea class="textarea" data-bind="addPin.description"></textarea>
                                    </div>
                                </div>

                            </form> 
                        </div>
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success ${data.addPin.saveInProgress ? 'is-loading' : ''}" ${!store.get('isAddPinValid') || data.addPin.saveInProgress  ? 'disabled' : ''} data-onclick="saveAddPin">Add Pin</button>
                </footer>
            </div>
        </div>
        `;
    },
    attachTo: app
});

const editBoardModal = new Reef("#edit-board-modal", {
    store: store,
    template: (data) => {
        return /*html*/`
        <div class="modal ${data.editBoard.active ? 'is-active' : ''}">
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Edit Board</p>
                    <button class="delete" aria-label="close" data-onclick="closeEditBoardModal"></button>
                </header>
                <section class="modal-card-body">

                    <div class="field">
                        <label class="label">Name</label>
                        <div class="control">
                            <input class="input" type="text" data-bind="editBoard.name" />
                        </div>
                    </div>
                    
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success ${data.editBoard.saveInProgress ? 'is-loading' : '' }" ${!store.get('isEditBoardValid') || data.editBoard.saveInProgress ? 'disabled' : ''} data-onclick="saveEditBoard">Save</button>
                    <button class="button is-danger" data-onclick="editBoardDelete">Delete</button>
                </footer>
            </div>
        </div>
        `;
    },
    attachTo: app
});

const pinZoomModal = new Reef("#pin-zoom-modal", {
    store: store,
    template: (data) => {

        let siteLink = '';
        if ( data.pinZoom.pin && data.pinZoom.pin.siteUrl ){
            siteLink = `<a class="pin-zoom-modal-site-link" href="${data.pinZoom.pin.siteUrl}"></a>`;
        }

        return /*html*/`
            <div class="modal ${data.pinZoom.active ? 'is-active' : ''}" id="pin-zoom-modal" >
                <div class="modal-background" data-onclick="closePinZoomModal"></div>
                <div class="modal-content">
                    <p>
                        <img src="${data.pinZoom.active ? getOriginalImagePath(data.pinZoom.pin.id) : ''}" />
                    </p>
                </div>
                <button class="modal-close is-large" aria-label="close" data-onclick="closePinZoomModal"></button>
                ${siteLink}
                <a class="pin-zoom-modal-edit" data-onclick="editPin"></a>
                <a class="pin-zoom-modal-delete" data-onclick="deletePin"></a>
            </div>
        `;
    },
    attachTo: app
});

const aboutModal = new Reef("#about-modal", {
    store: store,
    template: (data) => {
        return /*html*/`
        <div class="modal ${data.about.active ? 'is-active' : ''}">
            <div class="modal-background" data-onclick="closeAboutModal"></div>
            <div class="modal-content">
                <div class="box" style="font-family: monospace;">
                    <h1><strong>tinypin</strong></h1>
                    <div>
                        <a href="https://www.github.com">github.com/slynn1324/tinypin</a>
                        <br />
                        &nbsp;
                    </div>
                    <div>
                        <h2><strong>credits</strong></h2>
                        client
                        <br />
                        &nbsp;css framework &raquo; <a href="https://www.bulma.io">bulma.io</a>
                        <br />
                        &nbsp;ui framework &raquo; <a href="https://reefjs.com">reef</a>
                        <br />
                        &nbsp;boards icon &raquo; <a href="https://thenounproject.com/term/squares/1160031/">squares by Andrejs Kirma from the Noun Project</a>
                        <br />
                        &nbsp;pin icon &raquo; <a href="https://thenounproject.com/term/pinned/1560993/">pinned by Gregor Cresnar from the Noun Project</a>
                        <br />
                        &nbsp;trash icon &raquo; <a href="https://thenounproject.com/term/trash/2449397/">Trash by ICONZ from the Noun Project</a>
                        <br />
                        server
                        <br />
                        &nbsp;language &amp; runtime &raquo; <a href="https://nodejs.org/en/">node.js</a>
                        <br />
                        &nbsp;database &raquo; <a href="https://www.sqlite.org/index.html">sqlite</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/better-sqlite3">better-sqlite3</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/express">express</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/body-parser">body-parser</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/node-fetch">node-fetch</a>
                        <br />
                        &nbsp;library &raquo; <a href="https://www.npmjs.com/package/sharp">sharp</a>
                    </div>
                </div>
            </div>
            <button class="modal-close is-large" aria-label="close" data-onclick="closeAboutModal"></button>
        </div>
        `;
    },
    attachTo: app
});



document.addEventListener('click', (el) => {
    let target = el.target.closest('[data-onclick]');
    if (target) {
        let action = target.getAttribute('data-onclick');
        if (action) {
            if ( !actions[action] ){
                console.error(`No action named ${action}`);
            } else {
                actions[action](target);
            }
        }
    }
});

// focusout bubbles while 'blur' does not.  
document.addEventListener('focusout', (el) => {
    let target = el.target.closest('[data-onblur]');
    if ( target ){
        let method = target.getAttribute('data-onblur');
        if ( method && typeof(actions[method]) === 'function') {
            actions[method](target);
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

    if ( store.data.about.active ){
        if ( el.key == "Escape" ){
            actions.closeAboutModal();
        }
    }

});

window.addEventListener('hashchange', (evt) => {
    console.log("hash change");
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
        store.data.about.active = false;
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

// image urls
function padId(id){
    let result = id.toString();
    while ( result.length < 12 ) {
        result = '0' + result;
    }
    return result;
}

function getOriginalImagePath(pinId){
    let paddedId = padId(pinId);
    let dir = `originals/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return file;
}

function getThumbnailImagePath(pinId){
    let paddedId = padId(pinId);
    let dir = `thumbnails/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return file;
}