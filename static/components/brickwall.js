app.addComponent('brickwall', (store) => { return new Reef('#brickwall', {

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
                <a data-pinid="${pin.id}" data-onclick="pinZoomModal.open">
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
            result += '<div class="brickwall-column">';

            for ( let i = 0; i < columns[col].bricks.length; ++i ){
                result += columns[col].bricks[i];
            }

            result += '</div>';
        }

        return result;
    }

}); });

