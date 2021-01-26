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

    // if( pinId ){
    //     let idx = getPinIndexById(pinId);

    //     data.pinZoomModal.pin = data.board.pins[idx];
    //     data.pinZoomModal.active = true;
    // }


    let pswpElement = document.getElementById("pswp");

    var items = [];
    for ( let i = 0; i < data.board.pins.length; ++i ){
        items.push({
            src: getThumbnailImagePath(data.board.pins[i].id),
            w: data.board.pins[i].originalWidth,
            h: data.board.pins[i].originalHeight
        });
    }

    let options = {
        index: getPinIndexById(pinId),
        loop: false,
        bgOpacity: 0.85,
        getThumbBoundsFn: function(index) {
            // See Options->getThumbBoundsFn section of docs for more info
            var thumbnail = el,
                pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                rect = thumbnail.getBoundingClientRect(); 

            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
        },
    };

    let gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

    // var realViewportWidth,
    //     useLargeImages = false,
    //     firstResize = true,
    //     imageSrcWillChange;

    // gallery.listen('beforeResize', function() {

    //     var dpiRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
    //     dpiRatio = Math.min(dpiRatio, 2.5);
    //     realViewportWidth = gallery.viewportSize.x * dpiRatio;


    //     if(realViewportWidth >= 1200 || (!gallery.likelyTouchDevice && realViewportWidth > 800) || screen.width > 1200 ) {
    //         if(!useLargeImages) {
    //             useLargeImages = true;
    //             imageSrcWillChange = true;
    //         }
            
    //     } else {
    //         if(useLargeImages) {
    //             useLargeImages = false;
    //             imageSrcWillChange = true;
    //         }
    //     }

    //     if(imageSrcWillChange && !firstResize) {
    //         gallery.invalidateCurrItems();
    //     }

    //     if(firstResize) {
    //         firstResize = false;
    //     }

    //     imageSrcWillChange = false;

    // });

    // gallery.listen('gettingData', function(index, item) {
    //     // if( useLargeImages ) {
    //     //     item.src = item.o.src;
    //     //     item.w = item.o.w;
    //     //     item.h = item.o.h;
    //     // } else {
    //     //     item.src = item.m.src;
    //     //     item.w = item.m.w;
    //     //     item.h = item.m.h;
    //     // }
    // });

    
    gallery.init();

    
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

app.addSetter('pinZoomModal.editPin', (data) => {

    // intentially read from store so we get an immutable copy
    data.editPinModal.pin = store.data.pinZoomModal.pin;
    
    console.log(data.editPinModal.pin);
    store.do('editPinModal.open');

});

app.addComponent('pinZoomModal', (store) => { return new Reef("#pinZoomModal", {
    store: store,
    template: (data) => {

        let siteLink = '';
        if ( data.pinZoomModal.pin && data.pinZoomModal.pin.siteUrl ){
            siteLink = `<a class="pinZoomModal-site-link" href="${data.pinZoomModal.pin.siteUrl}"></a>`;
        }

        let pinZoomDescription = '';
        if ( data.pinZoomModal.pin && data.pinZoomModal.pin.description && data.pinZoomModal.pin.description.length > 0 ){
            pinZoomDescription = `
            <div class="pinZoomModal-description" data-onclick="pinZoomModal.showFullDescription">${data.pinZoomModal.pin.description}</div>
                
            <div class="pinZoomModal-full-description ${data.pinZoomModal.fullDescriptionOpen ? 'pinZoomModal-full-description-open' : ''}">
                <div>
                    <a class="pinZoomModal-hide-full-description" data-onclick="pinZoomModal.hideFullDescription">&nbsp;</a>
                </div>
                <div class="content">
                    ${data.pinZoomModal.pin.description}
                </div>
            </div>
            `;
        }

        let isFirst = true;
        let isLast = true;

        if ( data.pinZoomModal.pin ){
            let idx = getPinIndexById(data.pinZoomModal.pin.id);
            isFirst = idx == 0;
            isLast = idx == (data.board.pins.length - 1);
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
                
                ${pinZoomDescription}
                
                <div data-onclick="pinZoomModal.moveLeft" id="pinZoomModal-moveLeft" style="${isFirst ? 'display: none;' : '' }">
                    <div style=""></div>
                </div>
                <div data-onclick="pinZoomModal.moveRight" id="pinZoomModal-moveRight" style="${isLast ? 'display: none;' : '' }">
                    <div style=""></div>
                </div>
            </div>
        `;
    }
    
}); });