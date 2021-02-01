const sharp = require("sharp");

async function run(){
let original = await sharp("/Users/slynn1324/Desktop/IMG_5166.HEIC");

console.log(await original.metadata());

let jpg = await original.toFormat("jpg").toBuffer();

jpg = await sharp(jpg);

console.log(await jpg.metadata() );

}

run();