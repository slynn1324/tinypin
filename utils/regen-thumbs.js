const fs = require("fs").promises;
const sharp = require("sharp");
const betterSqlite3 = require('better-sqlite3');


const DB_PATH = "tinypin.db";
const IMAGE_PATH = "images";

const db = betterSqlite3(DB_PATH);

( async () => {


let pins = db.prepare("select * from pins").all();

for ( let i = 0; i < pins.length; ++i ){

    let pin = pins[i];

    let originalPath = getImagePath(pin.userId, pin.id, 'o');

    let img = await sharp(originalPath.file);

    let resizedImg = await img.resize({width: 400, height: 400, fit: 'inside'})
    let buf = await resizedImg.toBuffer();

    let thumbPath = getImagePath(pin.userId, pin.id, 't');
    await fs.mkdir(thumbPath.dir, {recursive: true});
    await fs.writeFile(thumbPath.file, buf);
}




function getImagePath(userId, pinId, size){
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `${IMAGE_PATH}/${userId}/images/${size}/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return { dir: dir, file: file};
}
    
})();
