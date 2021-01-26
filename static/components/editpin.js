app.addSetter('editPinModal.open', (data) => {
    let pinId = photoSwipeGallery.currItem.pinId;
    closePhotoSwipe();
    data.editPinModal.pin = getPinById(pinId);
    data.editPinModal.active = true;
});

app.addSetter('editPinModal.close', (data) => {
    data.editPinModal.active = false;

    let pinId = data.editPinModal.pin.id;

    data.editPinModal.pin = null;
    data.editPinModal.newBoardName = null;
    data.editPinModal.saveInProgress = false;

    openPhotoSwipe(pinId);
});

app.addGetter('editPinModal.isValid', (data) => {

    if ( !data.editPinModal.pin ){
        return false;
    }

    if ( data.editPinModal.boardId == "new"){
        if ( !data.editPinModal.newBoardName ){
            return false;
        } else if ( data.editPinModal.newBoardName.trim().length < 1 ){
            return false;
        }
    }
    
    let pin = getPinById(data.editPinModal.pin.id);

    if ( pin.siteUrl == data.editPinModal.pin.siteUrl &&
         pin.description == data.editPinModal.pin.description &&
         pin.boardId == data.editPinModal.pin.boardId ){
        return false;
    }

    return true;
});

app.addSetter("editPinModal.save", async (data) => {

    store.do("loader.show");   

    data.editPinModal.saveInProgress = true;

    let pin = data.editPinModal.pin;

    let boardId = data.editPinModal.pin.boardId;

    let newBoard = null;

    if ( boardId == "new" ){

        // TODO: make a helper method
        let res = await fetch("/api/boards", {
            method: 'POST',
            headers: {'Content-Type': 'application/json' },
            body: JSON.stringify({
                "name": data.editPinModal.newBoardName
            })
        });

        if ( res.status == 200 ){
            newBoard = await res.json();
            boardId = newBoard.id;
            data.boards.push(newBoard);
        }

    }  

    let postData = {
        boardId: boardId,
        siteUrl: pin.siteUrl,
        description: pin.description
    };

    let res = await fetch('api/pins/' + pin.id, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    });

    if ( res.status == 200 ){
        console.log(`updated pin#${pin.id}`);

         // update the local copy of the pin
        let idx = getPinIndexById(pin.id);
        data.board.pins[idx].boardId = boardId;
        data.board.pins[idx].siteUrl = pin.siteUrl;
        data.board.pins[idx].description = pin.description;
        
        console.log(data.board.pins[idx]);

        store.do("editPinModal.close");
    } else {
        console.log(`error updating pin#${pin.id}`);
    }

    store.do("loader.hide");

});


app.addComponent('editPinModal', (store) => { return new Reef("#editPinModal", {

    store: store,
    template: (data) => {

        let options = "";
        for ( let i = 0; i < data.boards.length; ++i ){
            options += `<option value="${data.boards[i].id}">${data.boards[i].name}</option>`;
        }

        let newBoardField = '';
        if ( data.editPinModal.pin && data.editPinModal.pin.boardId == "new" ){
        // if ( true ) {
            console.log("is new");
            newBoardField = /*html*/`
            <div class="field">
                <label class="label">Board Name</label>
                <div class="control">
                    <input class="input" type="text" data-bind="editPinModal.newBoardName" />
                </div>
            </div>
            `;
        }

        if ( data.editPinModal.pin ){
        console.log(getThumbnailImagePath(data.editPinModal.pin.id));
        }

        

        return /*html*/`
        <div class="modal ${data.editPinModal.active ? 'is-active' : ''}">
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Edit Pin</p>
                    <button class="delete" aria-label="close" data-onclick="editPinModal.close"></button>
                </header>
                <section class="modal-card-body">
                    <div class="add-pin-flex">

                        <div class="add-pin-flex-left">
                            <img src="${data.editPinModal.pin ? getThumbnailImagePath(data.editPinModal.pin.id) : ''}" />
                        </div>

                        <div class="add-pin-flex-right">

                            <form>

                                <div class="field">
                                    <label class="label">Board</label>
                                    <div class="select">
                                        <select data-bind="editPinModal.pin.boardId">
                                            ${options}
                                            <option value="new">Create New Board</option>
                                        </select>
                                    </div>
                                </div>

                                ${newBoardField}

                                <div class="field">
                                    <label class="label">Image Url (read-only)</label>
                                    <div class="control">
                                        <input class="input" type="text" data-bind="editPinModal.pin.imageUrl" readonly />
                                    </div>
                                </div>

                                <div class="field">
                                    <label class="label">Website Url</label>
                                    <div class="control">
                                        <input class="input" type="text" data-bind="editPinModal.pin.siteUrl" />
                                    </div>
                                </div>

                                <div class="field">
                                    <label class="label">Description</label>
                                    <div class="control">
                                        <textarea class="textarea" data-bind="editPinModal.pin.description"></textarea>
                                    </div>
                                </div>

                            </form>                   
                        </div>        
                    </div>
                </section>

                <footer class="modal-card-foot">
                    <button class="button is-success ${data.editPinModal.saveInProgress ? 'is-loading' : ''}" ${!store.get('editPinModal.isValid') || data.editPinModal.saveInProgress  ? 'disabled' : ''} data-onclick="editPinModal.save">Save Pin</button>
                </footer>
            </div>
        </div>
        `;

    }

}); });