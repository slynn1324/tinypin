app.addSetter('brickwall.toggleHiddenBoards', (data) => {
    data.showHiddenBoards = !data.showHiddenBoards;
    window.localStorage.showHiddenBoards = data.showHiddenBoards;
});

app.addSetter("brickwall.editPin", (data) => {

    let index = getLightGalleryIndex();
    

    data.editPinModal.pin = store.data.board.pins[index];
    
    store.do('editPinModal.open');

    closeLightGallery();
});

app.addSetter("brickwall.deletePin", async (data) => {
    if ( !confirm("Are you sure you want to delete this pin?" ) ){
        return;
    }

    store.do('loader.show');

    let index = getLightGalleryIndex();

    let pinId = data.board.pins[index].id;

    data.board.pins.splice(index,1);

    // store.do("pinZoomModal.close");
    closeLightGallery();

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

function openOriginal(el){

    let data = store.data;
    let index = getLightGalleryIndex();
    let pin = data.board.pins[index];
    // alert(pin.id);

    let path = getImagePath(pin.id, 'o');
    // alert(path);
    window.location = "https://sktp.quikstorm.net/" + path;

}

let lightgalleryElement = document.getElementById("lightgallery");
let lightgalleryOpen = false;

function openLightGallery(pinId){

    let data = store.data;

    let elements = [];
    let index = 0;

    let maxWidth = window.innerWidth * window.devicePixelRatio;
    let maxHeight = window.innerHeight * window.devicePixelRatio;
    
    for ( let i = 0; i < data.board.pins.length; ++i ){

        let pin = data.board.pins[i];

        let item = {};
        item.subHtml = pin.description;
        item.siteUrl = pin.siteUrl;
        
        const THUMBNAIL_IMAGE_SIZE = 400;
        const IMAGE_SIZES = [400,800,1280,1920,2560];  //TODO: make this dynamic to share the server-side setting
        // couldn't get srcset and sizes to work right with a vertical bounding box, so we'll just push the right image for the screen size.  This won't refresh on resize until closing & re-opening the lightgallery.
        let maxSize = maxWidth;
        let isPortrait = "n";
        // portrait
        if ( pin.originalHeight > pin.originalWidth ){
            maxSize = maxHeight;
            isPortrait = "y";
        } 

        maxSize = maxSize * 0.74; // take an image 74% smaller than the physical pixel count, we have 10% borders + prefer the smaller size file if it will be enlarged < 10% by the browser (74% just bumps ipad pro portrait into the 2048 size)
                
        let bestSize = -1;
         
        for ( let s = 0; s < IMAGE_SIZES.length; ++s ){
            if ( maxSize <= IMAGE_SIZES[s] ){
                bestSize = IMAGE_SIZES[s];
                break;
            }
        }

        if ( bestSize < 0 ){
            bestSize = 'o';
        }

        item.src = getImagePath(pin.id, bestSize);
        item.originalUrl = getImagePath(pin.id, 'o');
        
        elements.push(item);

        if ( data.board.pins[i].id == pinId ){
            index = i;
        }
    }

    let options = {
        speed: 333,
        loop: false,
        hideControlOnEnd: true,
        preload: 3,
        slideEndAnimatoin: false,
        dynamic: true,
        dynamicEl: elements,
        index: index,
        download: false,
        startClass: '', // disable zoom
        backdropDuration: 0 // disable animate in
    };

    // disable automatically hiding controls on touch devices, they can tap to hide.
    if ( window.isTouch ){
        options.hideBarsDelay = 0;
    }

    lightGallery(lightgalleryElement, options );    
    lightgalleryOpen = true;
}

function closeLightGallery(){
    lightgalleryOpen = false;
    let uid = lightgalleryElement.getAttribute("lg-uid");
    window.lgData[uid].destroy();
}

function getLightGalleryIndex(){
    let uid = lightgalleryElement.getAttribute("lg-uid");
    return window.lgData[uid].index;
}

document.getElementById("lightgallery").addEventListener("onCloseAfter", () => {

    let uid = lightgalleryElement.getAttribute("lg-uid");
    if ( uid ){
        window.lgData[uid].destroy(true);
    }

});

document.getElementById("lightgallery").addEventListener("onSlideClick", () => {
    let lgOuter = document.querySelector(".lg-outer");
    if ( lgOuter.classList.contains("lg-touch-hide-items") ){
        lgOuter.classList.remove("lg-touch-hide-items");
    } else {
        lgOuter.classList.add("lg-touch-hide-items");
    }
});

app.addComponent('brickwall', (store) => { return new Reef('#brickwall', {

    store: store,
    template: (data, el) => {

        // if the hash says we are supposed to be drawing a board, but it hasn't loaded yet... draw an empty div.
        if ( !data.initialized || (data.hash.board && !data.board) ){
            return '<div></div>';
        } 

        if ( data.hash.board && data.board.pins.length == 0 ){
            return `<div class="has-text-centered is-flex-grow-1">
                <h1>This board has no pins :(</h1>
                <div class="mt-4">
                    <a data-onclick="addPinModal.open">Pin Something</a>
                </div>
            </div>`;
            
        } else if ( !data.hash.board && data.boards.length == 0 ){
            return `<div class="has-text-centered is-flex-grow-1">
                <h1>There are no boards :(</h1>
                <div class="mt-4">
                    <a data-onclick="addPinModal.open">Pin Something</a>
                </div>
            </div>`;
        }

        // TODO: check these breakpoints for iPhone
        let numberOfColumns = 1;
        
        let width = window.innerWidth; //el.offsetWidth;
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


        if ( !data.hash.board && width < 400 ){
            numberOfColumns = 1;
        }
        
        function createBrickForBoard(board){

            // https://materialdesignicons.com/icon/dots-square
            let missingThumbnailSrc = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cg transform='translate(40, 40) scale(5 5)'%3E%3Cpath fill='currentColor' d='M12 16C13.1 16 14 16.9 14 18S13.1 20 12 20 10 19.1 10 18 10.9 16 12 16M12 4C13.1 4 14 4.9 14 6S13.1 8 12 8 10 7.1 10 6 10.9 4 12 4M6 16C7.1 16 8 16.9 8 18S7.1 20 6 20 4 19.1 4 18 4.9 16 6 16M6 10C7.1 10 8 10.9 8 12S7.1 14 6 14 4 13.1 4 12 4.9 10 6 10M6 4C7.1 4 8 4.9 8 6S7.1 8 6 8 4 7.1 4 6 4.9 4 6 4M18 16C19.1 16 20 16.9 20 18S19.1 20 18 20 16 19.1 16 18 16.9 16 18 16M18 10C19.1 10 20 10.9 20 12S19.1 14 18 14 16 13.1 16 12 16.9 10 18 10M18 4C19.1 4 20 4.9 20 6S19.1 8 18 8 16 7.1 16 6 16.9 4 18 4Z' /%3E%3C/g%3E%3C/svg%3E";

            let boardImage = null;
            if ( board.titlePinId > 0 ){
                boardImage = `<img class="thumb" src="${getImagePath(board.titlePinId, 400)}" />`;
            } else {
                boardImage = `<div class="board-brick-missing-thumbnail"><img class="thumb" src="${missingThumbnailSrc}" /></div>`;
            }

            let hiddenBoardImage = '';
            if ( board.hidden ){
                hiddenBoardImage = '<img alt="(hidden)" style="width: 24px; height: 24px; vertical-align: middle;" src="data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDI0IDI0IiB4PSIwcHgiIHk9IjBweCI+PHRpdGxlPkFydGJvYXJkIDY8L3RpdGxlPjxwYXRoIGQ9Ik0xMiw2LjkyQTguNjUsOC42NSwwLDAsMSwxOS44NSwxMmE4LjYxLDguNjEsMCwwLDEtMTUuNywwQTguNjUsOC42NSwwLDAsMSwxMiw2LjkybTAtMkExMC42MiwxMC42MiwwLDAsMCwyLDEyYTEwLjYsMTAuNiwwLDAsMCwyMCwwQTEwLjYyLDEwLjYyLDAsMCwwLDEyLDQuOTJaIj48L3BhdGg+PHBhdGggZD0iTTE0LjIxLDExLjEyYTEuMzQsMS4zNCwwLDAsMS0xLjMzLTEuMzMsMS4zMSwxLjMxLDAsMCwxLC41Mi0xQTMuNDQsMy40NCwwLDAsMCwxMiw4LjQ2LDMuNTQsMy41NCwwLDEsMCwxNS41NCwxMmEzLjQ0LDMuNDQsMCwwLDAtLjI5LTEuNEExLjMxLDEuMzEsMCwwLDEsMTQuMjEsMTEuMTJaIj48L3BhdGg+PHBhdGggZD0iTTE5LDIwYTEsMSwwLDAsMS0uNzEtLjI5bC0xNC0xNEExLDEsMCwwLDEsNS43MSw0LjI5bDE0LDE0YTEsMSwwLDAsMSwwLDEuNDJBMSwxLDAsMCwxLDE5LDIwWiI+PC9wYXRoPjwvc3ZnPg==" />';
            }

            return { height: 1, template: /*html*/`
            <div class="brick board-brick">
                <a href="#board=${board.id}">
                    ${boardImage}
                    <div class="board-brick-name">${board.name}
                    ${hiddenBoardImage}
                    </div>
                </a>
            </div>
            `};
        }

        function createBrickForPin(board, pin){
            return  { height: pin.thumbnailHeight, template: /*html*/`
            <div class="brick" >
                <a data-pinid="${pin.id}" onclick="openLightGallery(${pin.id})" >
                    <img class="thumb" src="${getImagePath(pin.id, 400)}" width="${pin.thumbnailWidth}" height="${pin.thumbnailHeight}"/>
                </a>
            </div>
            `};
        }

        // create the brick elements
        let bricks = [];

        if ( data.board ){
            for ( let i = 0; i < data.board.pins.length; ++i ){
                bricks.push(createBrickForPin(data.board, data.board.pins[i]));
            }
        } else {
            for ( let i = 0; i < data.boards.length; ++i ){      
                if ( data.showHiddenBoards || !data.boards[i].hidden ) {    
                    bricks.push(createBrickForBoard(data.boards[i]));
                }
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

        // TODO: make this height aware
        // sort bricks into columns
        for ( let i = 0; i < bricks.length; ++i ){

            // find shortest column
            let shortestIndex = 0;
            let shortestHeight = columns[0].height;
            for ( let c = 1; c < columns.length; ++c ){
                if ( columns[c].height < shortestHeight ){
                    shortestIndex = c;
                    shortestHeight = columns[c].height;
                }
            }

            columns[shortestIndex].bricks.push(bricks[i]);
            columns[shortestIndex].height += bricks[i].height;
        }
    

        // write out the bricks
        let result = "";

        for ( let col = 0; col < columns.length; ++col ){
            result += '<div class="brickwall-column">';

            for ( let i = 0; i < columns[col].bricks.length; ++i ){
                result += columns[col].bricks[i].template;
            }

            result += '</div>';
        }

        return result;
    }

}); });

