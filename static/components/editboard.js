app.addSetter('editBoardModal.open', (data) => {
    data.editBoardModal.name = data.board.name;
    data.editBoardModal.hidden = data.board.hidden;
    data.editBoardModal.active = true;
});

app.addSetter('editBoardModal.close', (data) => {
    data.editBoardModal.name = "";
    data.editBoardModal.hidden = 0;
    data.editBoardModal.active = false;
});

app.addSetter('editBoardModal.save', async (data) => {

    store.do("loader.show");

    let boardId = data.board.id;
    let name = data.editBoardModal.name;
    let hidden = data.editBoardModal.hidden;

    let idx = getBoardIndexById(boardId);
    if ( idx >= 0 ){
        data.boards[idx].name = name;
        data.boards[idx].hidden = hidden;
        
    }
    if ( data.board ){
        data.board.name = name;
        data.board.hidden = hidden;
    }

    let res = await fetch(`/api/boards/${boardId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            hidden: hidden
        })
    });

    if ( res.status == 200 ){
        console.log(`updated board#${boardId}`);
        data.editBoardModal.active = false;
    } else {
        console.error(`error updating board#${boardId}`);
    }

    store.do("loader.hide");
});

app.addSetter('editBoardModal.delete', async (data) => {

    if ( !confirm("Are you sure you want to delete this board and all pins on it?") ){
        return;
    }

    store.do("loader.show");

    let boardId = data.board.id;


    let idx = getBoardIndexById(boardId);
    console.log(idx);
    if ( idx >= 0 ){
        data.boards.splice(idx, 1);
    }
    data.editBoardModal.active = false;
    window.location.hash = "";


    let res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE'
    });

    if ( res.status == 200 ){
        console.log(`deleted board#${boardId}`);                
    } else {
        console.log(`error deleting board#${boardId}`);
    }

    store.do("loader.hide");
});

app.addGetter('editBoardModal.isValid', (data) => {
    if (!data.editBoardModal.name){
        return false;
    }

    if ( data.editBoardModal.name.trim().length < 1 ){
        return false;
    }

    return true;
});

app.addComponent('editBoardModal', (store) => { return new Reef("#editBoardModal", {
    store: store,
    template: (data) => {
        return /*html*/`
        <div class="modal ${data.editBoardModal.active ? 'is-active' : ''}">
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">Edit Board</p>
                    <button class="delete" aria-label="close" data-onclick="editBoardModal.close"></button>
                </header>
                <section class="modal-card-body">

                    <div class="field">
                        <label class="label">Name</label>
                        <div class="control">
                            <input class="input" type="text" data-bind="editBoardModal.name" />
                        </div>
                    </div>

                    <label class="checkbox">
                        <input type="checkbox" data-bind="editBoardModal.hidden" value="1">
                        Hidden
                    </label>
                    
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success ${data.editBoardModal.saveInProgress ? 'is-loading' : '' }" ${!store.get('editBoardModal.isValid') || data.editBoardModal.saveInProgress ? 'disabled' : ''} data-onclick="editBoardModal.save">Save</button>
                    <button class="button is-danger" data-onclick="editBoardModal.delete">Delete</button>
                </footer>
            </div>
        </div>
        `;
    }
    
}); });