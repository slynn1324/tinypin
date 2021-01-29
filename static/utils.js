function getOriginalImagePath(pinId){
    if ( !pinId ){
        return "";
    }
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `images/o/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return file;
}

function getImagePath(pinId, size){
    if ( !pinId ){
        return "";
    }

    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `images/${size}/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return file;
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

async function sleep(ms){ return new Promise((resolve) => setTimeout(resolve, ms)); }

// async function runAfter(f, ms){
//     return new Promise( (resolve,reject) => {
//         setTimeout( () => {
//             try {
//                 await f();
//                 resolve();
//             } catch (e){
//                 reject(e);
//             }
//         }, ms);
//     });
// }

// feature detection
if ( 'ontouchstart' in window ){
    window.isTouch = true;
    document.body.classList.add("is-touch");
}

if ([
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document) ){


    window.iOS = true;
    document.body.classList.add("is-ios");
} else {
    window.iOS = false;
}