const sharp = require('sharp');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const conf = require("./conf.js");

const THUMBNAIL_IMAGE_SIZE = 400;
const ADDITIONAL_IMAGE_SIZES = [800,1280,1920,2560];

/**
 * Downloads the image, converts it to JPG, and creates the thumbnail size so that standard dimensions can be taken
 * @param {string} imageUrl 
 */
async function downloadImage(imageUrl){

    let res = await fetch(imageUrl);

    if ( res.status != 200 ){
        throw(new Error(`download error status=${res.status}`));
    }

    let buffer = await res.buffer();

    return await processImage(buffer);
}

async function processImage(buffer){
    let original = sharp(buffer);
    // add rotate to auto-rotate based on metadata, and withMetadata to preserve the original metadata
    let originalBuffer = await original.toFormat("jpg").rotate().withMetadata().toBuffer();  
    let originalMetadata = await original.metadata();

    let thumbnail = await original.resize({ width: THUMBNAIL_IMAGE_SIZE, height: THUMBNAIL_IMAGE_SIZE, fit: 'inside' });
    let thumbnailBuffer = await thumbnail.toBuffer();
    let thumbnailMetadata = await sharp(thumbnailBuffer).metadata();

    return {
        original: {
            buffer: originalBuffer,
            width: originalMetadata.width,
            height: originalMetadata.height
        },
        thumbnail: {
            buffer: thumbnailBuffer,
            width: thumbnailMetadata.width,
            height: thumbnailMetadata.height
        }
    }
}

// takes the response from downloadImage, creates ADDITIONAL_IMAGE_SIZE and writes all files to disk
async function saveImage(userId, pinId, image){
    let originalImagePath = getImagePath(userId, pinId, 'o');
    await fs.mkdir(originalImagePath.dir, {recursive: true});
    await fs.writeFile(originalImagePath.file, image.original.buffer);
    console.log(`saved original to: ${originalImagePath.file}`);

    let thumbnailImagePath = getImagePath(userId, pinId, '400');
    await fs.mkdir(thumbnailImagePath.dir, {recursive: true});
    await fs.writeFile(thumbnailImagePath.file, image.thumbnail.buffer);
    console.log(`saved thumbnail to: ${thumbnailImagePath.file}`);

    // this will enlarge images if necessary, as the lanczos3 resize algorithm will create better looking enlargements than the browser will
    for ( let i = 0; i < ADDITIONAL_IMAGE_SIZES.length; ++i ){
        let size = ADDITIONAL_IMAGE_SIZES[i];
        
        let img = await sharp(image.original.buffer);
        let resizedImg = await img.resize({width: size, height: size, fit: 'inside'})
        let buf = await resizedImg.toBuffer();

        let imgPath = getImagePath(userId, pinId, size);
        await fs.mkdir(imgPath.dir, {recursive:true});
        await fs.writeFile(imgPath.file, buf);
        console.log(`saved additional size ${size} to: ${imgPath.file}`);
    }
}

async function deleteImagesForPin(userId, pinId){
    console.log("deleting images for userId=" + userId + " pinId=" + pinId);
    
    try {
        await fs.unlink(getImagePath(userId, pinId, 'o').file);
    } catch (err){
        console.log("error deleting original: ", err);
    }

    try {
    await fs.unlink(getImagePath(userId, pinId, THUMBNAIL_IMAGE_SIZE).file);
    } catch (err){
        console.log("error deleting thumbnail: " + err);
    }

    for ( let s = 0; s < ADDITIONAL_IMAGE_SIZES.length; ++s ){
        try{
        await fs.unlink(getImagePath(userId, pinId, ADDITIONAL_IMAGE_SIZES[s]).file);
        } catch (err){
            console.log("error deleting additional size " + ADDITIONAL_IMAGE_SIZES[s] + ": ", err);
        }
    }
}

function getImagePath(userId, pinId, size){
    let paddedId = pinId.toString().padStart(12, '0');
    let dir =  `${conf.getImagePath()}/${userId}/images/${size}/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return { dir: dir, file: file};
}

module.exports = {
    processImage: processImage,
    saveImage: saveImage,
    getImagePath: getImagePath,
    downloadImage: downloadImage,
    deleteImagesForPin: deleteImagesForPin
}