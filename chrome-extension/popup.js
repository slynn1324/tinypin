let hash = window.location.hash;

if ( hash.length > 0 && hash.indexOf(0) == "#" ){
    hash = hash.substr(1);
}

let q = parseQueryString(window.location.hash.substr(1));

document.getElementById("imageSrc").innerText = q.i || "";
document.getElementById("siteUrl").innerText = q.s || "";

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