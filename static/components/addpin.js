app.addSetter('addPinModal.open', (data) => {
        
    if ( data.board ){
        data.addPinModal.boardId = data.board.id;
    } else if ( window.localStorage.addPinLastBoardId ){
        data.addPinModal.boardId = window.localStorage.addPinLastBoardId;
    } else if ( data.boards && data.boards.length > 0 ){
        data.addPinModal.boardId = data.boards[0].id;
    } else {
        data.addPinModal.boardId = "new";
    }

    data.addPinModal.active = true;
});

app.addSetter('addPinModal.close', (data) => {
    data.addPinModal.active = false;
    data.addPinModal.imageUrl = "";
    data.addPinModal.previewImageUrl = "";
    data.addPinModal.siteUrl = "";
    data.addPinModal.description = "";
    data.addPinModal.newBoardName = "";
    data.addPinModal.saveInProgress = false;
});

app.addSetter('addPinModal.updatePreview', (data) => {
    if ( data.addPinModal.imageUrl.startsWith("http") ){
        ( async() => {
            let res = await fetch(data.addPinModal.imageUrl, {
                mode: 'no-cors',
                method: "HEAD"
            });
            if ( res.status = 200 ){
                data.addPinModal.previewImageUrl = data.addPinModal.imageUrl;
            }
            store.do("render");
        })();
    } else {
        data.addPinModal.previewImageUrl = null;
    }
});

app.addSetter('addPinModal.save', async (data) => {

    store.do("loader.show");

    data.addPinModal.saveInProgress = true;

    let boardId = data.addPinModal.boardId;

    let postData = {
        boardId: boardId,
        newBoardName: data.addPinModal.newBoardName,
        imageUrl: data.addPinModal.imageUrl,
        siteUrl: data.addPinModal.siteUrl,
        description: data.addPinModal.description
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
        if ( data.board && data.board.id == boardId ){
            data.board.pins.push(body);
        }

        window.localStorage.addPinLastBoardId = boardId;
        store.do("addPinModal.close");

        // if we don't have a listening socket, we need to trigger our own update
        if ( boardId == "new" && !window.socketConnected ){
            store.do("load.boards");
        } 
    } 

    store.do("loader.hide");

});

app.addGetter('addPinModal.isValid', (data) => {

    if ( data.addPinModal.boardId == "new"){
        if ( !data.addPinModal.newBoardName ){
            return false;
        } else if ( data.addPinModal.newBoardName.trim().length < 1 ){
            return false;
        }
    }

    if ( !data.addPinModal.previewImageUrl ){
        return false;
    }

    return true;
});

app.addComponent('addPinModal', (store) => { return new Reef("#addPinModal", {
    
    store: store,
    template: (data) => {

        let imagePlaceholder = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22300%22%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%22300%22%20height%3D%22300%22%20style%3D%22fill%3A%23dedede%3B%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2218%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23555555%22%3Eimage%3C%2Ftext%3E%3C%2Fsvg%3E';

        let options = "";
        for ( let i = 0; i < data.boards.length; ++i ){
            options += `<option value="${data.boards[i].id}">${data.boards[i].name}</option>`;
        }

        let newBoardField = '';
        if ( data.addPinModal.boardId == "new" ){
            newBoardField = /*html*/`
            <div class="field">
                <label class="label">Board Name</label>
                <div class="control">
                    <input class="input" type="text" data-bind="addPinModal.newBoardName" />
                </div>
            </div>
            `;
        }

        return /*html*/`
        <div class="modal ${data.addPinModal.active ? 'is-active' : ''}">
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Add Pin</p>
                    <button class="delete" aria-label="close" data-onclick="addPinModal.close"></button>
                </header>
                <section class="modal-card-body">
                    <div class="add-pin-flex">
                        <div class="add-pin-flex-left">
                            <img id="add-pin-modal-img" src="${data.addPinModal.previewImageUrl ? data.addPinModal.previewImageUrl : imagePlaceholder}" />
                        </div>
                        <div class="add-pin-flex-right">
                            <form>
                                
                                <div class="field">
                                    <label class="label">Board</label>
                                    <div class="select">
                                        <select data-bind="addPinModal.boardId">
                                            ${options}
                                            <option value="new">Create New Board</option>
                                        </select>
                                    </div>
                                </div>

                                ${newBoardField}

                                <div class="field">
                                    <label class="label">Image Url</label>
                                    <div class="control">
                                        <input class="input" type="text" data-bind="addPinModal.imageUrl" data-onblur="addPinModal.updatePreview"/>
                                    </div>
                                </div>

                                <div class="field">
                                    <label class="label">Website Url</label>
                                    <div class="control">
                                        <input class="input" type="text" data-bind="addPinModal.siteUrl" />
                                    </div>
                                </div>

                                <div class="field">
                                    <label class="label">Description</label>
                                    <div class="control">
                                        <textarea class="textarea" data-bind="addPinModal.description"></textarea>
                                    </div>
                                </div>

                            </form> 
                        </div>
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success ${data.addPinModal.saveInProgress ? 'is-loading' : ''}" ${!store.get('addPinModal.isValid') || data.addPinModal.saveInProgress  ? 'disabled' : ''} data-onclick="addPinModal.save">Add Pin</button>
                </footer>
            </div>
        </div>
        `;
    }

}); });