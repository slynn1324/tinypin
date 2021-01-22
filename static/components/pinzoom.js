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


app.addSetter('pinZoomModal.open', (data, el) => {
        
    let pinId = el.getAttribute("data-pinid");

    if( pinId ){
        data.pinZoomModal.pin = getPinById(pinId);
        data.pinZoomModal.active = true;
    }
    
});

app.addSetter('pinZoomModal.close', (data) => {
    data.pinZoomModal.active = false;
    data.pinZoomModal.pinId = null;
    data.pinZoomModal.fullDescriptionOpen = false;
});


app.addSetter('pinZoomModal.moveLeft', (data) => {

    let idx = getPinIndexById(data.pinZoomModal.pin.id);
    
    if ( idx > 0 ){
        data.pinZoomModal.pin = data.board.pins[idx-1];
    }

});

app.addSetter('pinZoomModal.moveRight', (data) => {

    let idx = getPinIndexById(data.pinZoomModal.pin.id);
    
    if ( idx >= 0 && (idx < data.board.pins.length-1) ){
        data.pinZoomModal.pin = data.board.pins[idx+1];
    }
});

app.addSetter('pinZoomModal.showFullDescription', (data) => {
    data.pinZoomModal.fullDescriptionOpen = true;
});

app.addSetter('pinZoomModal.hideFullDescription', (data) => {
    data.pinZoomModal.fullDescriptionOpen = false;
});

app.addSetter('pinZoomModal.deletePin', async (data) => {
    if ( !confirm("Are you sure you want to delete this pin?" ) ){
        return;
    }

    store.do('loader.show');

    let pinId = data.pinZoomModal.pin.id;

    let idx = getPinIndexById(pinId);
    if ( idx >= 0 ){
        data.board.pins.splice(idx,1);
    }

    store.do("pinZoomModal.close");

    let res = await fetch(`api/pins/${pinId}`, {
        method: 'DELETE'
    });

    if ( res.status == 200 ){
        console.log(`deleted pin#${pinId}`);
    } else {
        console.error(`error deleting pin#${pinId}`);
    }

    store.do('loader.hide');
});

app.addComponent('pinZoomModal', (store) => { return new Reef("#pinZoomModal", {
    store: store,
    template: (data) => {

        let siteLink = '';
        if ( data.pinZoomModal.pin && data.pinZoomModal.pin.siteUrl ){
            siteLink = `<a class="pinZoomModal-site-link" href="${data.pinZoomModal.pin.siteUrl}"></a>`;
        }

        return /*html*/`
            <div class="modal ${data.pinZoomModal.active ? 'is-active' : ''}">
                <div class="modal-background" data-onclick="pinZoomModal.close"></div>
                <div class="modal-content">
                    <p>
                        <img src="${data.pinZoomModal.active ? getOriginalImagePath(data.pinZoomModal.pin.id) : ''}" />
                    </p>                   
                </div>
                <button class="modal-close is-large" aria-label="close" data-onclick="pinZoomModal.close"></button>
                ${siteLink}
                <a class="pinZoomModal-edit" data-onclick="pinZoomModal.editPin"></a>
                <a class="pinZoomModal-delete" data-onclick="pinZoomModal.deletePin"></a>
                
                <div class="pinZoomModal-description" data-onclick="pinZoomModal.showFullDescription">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</div>
                
                <div class="pinZoomModal-full-description ${data.pinZoomModal.fullDescriptionOpen ? 'pinZoomModal-full-description-open' : ''}">
                    <div>
                        <a class="pinZoomModal-hide-full-description" data-onclick="pinZoomModal.hideFullDescription">&nbsp;</a>
                    </div>
                    <div class="content">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </div>
                </div>
                
            </div>
        `;
    }
    
}); });