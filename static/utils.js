function getOriginalImagePath(pinId){
    if ( !pinId ){
        return "";
    }
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `originals/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return file;
}

function getThumbnailImagePath(pinId){
    if ( !pinId ){
        return "";
    }
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `thumbnails/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
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