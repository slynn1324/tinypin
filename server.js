const express = require('express');
const bodyParser = require('body-parser');
const db = require('better-sqlite3')('data.db') //, {verbose:console.log});
const http = require('http');
const https = require('https');
const sharp = require('sharp');
const fs = require('fs').promises;
const fetch = require('node-fetch');

const IMAGE_PATH = "./images";


// express config
const app = express();
const port = 3000;
app.use(express.static('static'));
app.use(express.static('images'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.set('json spaces', 2);

// emulate slow down
// app.use( (req,res,next) => {
//     console.log("slow...");
//     setTimeout(() => {
//         next();
//     }, 2000);
// });

const OK = {status: "ok"};
const NOT_FOUND = {status: "error", error: "not found"};
const ALREADY_EXISTS = {status: "error", error: "already exists"};
const SERVER_ERROR = {status: "error", error: "server error"};

initDb();

// list boards
app.get("/api/boards", async (req, res) => {
    try{
        let boards = db.prepare("SELECT * FROM boards").all();

        for( let i = 0; i < boards.length; ++i ){
            let result = db.prepare("SELECT id FROM pins WHERE boardId = ? order by createDate limit 1").get(boards[i].id);
            if ( result ) {
                boards[i].titlePinId = result.id;
            } else {
                boards[i].titlePinId = 0;
            }
        }

        res.send(boards);
    } catch (err) {
        console.log(`Error listing boards: ${err.message}`);
        res.status(500).send(SERVER_ERROR);
    }
});

// get board
app.get("/api/boards/:boardId", async (req, res) => {
    try{


        let board = db.prepare("SELECT * FROM boards WHERE id = ?").get(req.params.boardId);
        if ( board ){

            board.pins = db.prepare("SELECT * FROM pins WHERE boardId = ?").all(req.params.boardId);

            res.send(board);
        } else {
            res.status(404).send(NOT_FOUND);
        }
    } catch (err) {
        console.log(`Error getting board#${req.params.boardId}: ${err.message}`);
        res.status(500).send(SERVER_ERROR);
    }
});

// create board
app.post('/api/boards', (req, res) => {
    try{
        let result = db.prepare("INSERT INTO boards (name, createDate) VALUES (@name, @createDate)").run({name: req.body.name, createDate: new Date().toISOString()});
        let id = result.lastInsertRowid;
        let board = db.prepare("SELECT * FROM boards WHERE id = ?").get(id);
        board.titlePinId = 0;
        res.send(board);
        console.log(`Created board#${id} ${req.body.name}`);
        
    } catch (err){
        console.log("Error creating board: " + err.message);
        if ( err.message.includes('UNIQUE constraint failed:') ){
            res.status(409).send(ALREADY_EXISTS);
        } else {
            res.status(500).send(SERVER_ERROR);
        }
    }
});

// update board
app.post("/api/boards/:boardId", (req, res) =>{
    try{
        let result = db.prepare("UPDATE boards SET name = @name WHERE id = @boardId").run({name: req.body.name, boardId: req.params.boardId});
        if ( result.changes == 1 ){
            res.send(OK);
        } else {
            res.status(404).send(NOT_FOUND);
        }
    } catch (err){
        console.log(`Error updating board#${req.params.boardId}: ${err.message}`);
        res.status(500).send(SERVER_ERROR);
    }
});

// delete board
app.delete("/api/boards/:boardId", async (req, res) => {
    try{     

        let pins = db.prepare("SELECT id FROM pins WHERE boardId = ?").all(req.params.boardId);
        for ( let i = 0; i < pins.length; ++i ){
            await fs.unlink(getThumbnailImagePath(pins[i].id).file);
            await fs.unlink(getOriginalImagePath(pins[i].id).file);
        }

        let result = db.prepare("DELETE FROM pins WHERE boardId = ?").run(req.params.boardId);
        result = db.prepare("DELETE FROM boards WHERE id = ?").run(req.params.boardId);

        if ( result.changes == 1 ){
            res.send(OK);
        } else {
            res.status(404).send(NOT_FOUND);
        }
    } catch (err) {
        console.log(`Error deleting board#${req.params.boardId}: ${err.message}`);
        res.status(500).send(SERVER_ERROR);
    }
});

// get pin
app.get("/api/pins/:pinId", (req, res) => {
    try {
        let pin = db.prepare('SELECT * FROM pins WHERE id = ?').get(req.params.pinId);
        if ( pin ){
            res.send(pin);
        } else {
            res.status(404).send(NOT_FOUND);
        }
    } catch (err){
        console.error(`Error getting pin#${req.params.pinId}: ${err.message}`, err);
        res.status(500).send(SERVER_ERROR);
    }
});

// create pin
app.post("/api/pins", async (req, res) => {
    try {

        console.log(req.body);

        let image = await downloadImage(req.body.imageUrl);
        console.log(image);
        
        let result = db.prepare(`INSERT INTO PINS (
            boardId, 
            imageUrl, 
            siteUrl, 
            description, 
            sortOrder, 
            originalHeight, 
            originalWidth, 
            thumbnailHeight, 
            thumbnailWidth, 
            createDate
        ) VALUES (
            @boardId, 
            @imageUrl, 
            @siteUrl, 
            @description, 
            @sortOrder, 
            @originalHeight, 
            @originalWidth, 
            @thumbnailHeight, 
            @thumbnailWidth, 
            @createDate)
        `).run({
            boardId: req.body.boardId,
            imageUrl: req.body.imageUrl,
            siteUrl: req.body.siteUrl,
            description: req.body.description,
            sortOrder: req.body.sortOrder,
            originalHeight: image.original.height,
            originalWidth: image.original.width,
            thumbnailHeight: image.thumbnail.height,
            thumbnailWidth: image.thumbnail.width,
            createDate: new Date().toISOString()
        });
        
        let id = result.lastInsertRowid;

        // write the images to disk
        let originalImagePath = getOriginalImagePath(id);
        let thumbnailImagePath = getThumbnailImagePath(id);
        await fs.mkdir(originalImagePath.dir, {recursive: true});
        await fs.mkdir(thumbnailImagePath.dir, {recursive: true});
        await fs.writeFile(originalImagePath.file, image.original.buffer);
        console.log(`Saved original to: ${originalImagePath.file}`);
        await fs.writeFile(thumbnailImagePath.file, image.thumbnail.buffer);
        console.log(`Saved thumbnail to: ${thumbnailImagePath.file}`);

        // return the newly created row
        let pin = db.prepare("SELECT * FROM pins WHERE id = ?").get(id);
        res.send(pin);

    } catch (err) {
        console.log(`Error creating pin: ${err.message}`, err);
        res.status(500).send(SERVER_ERROR);
    }
});

app.post("/api/pins/:pinId", (req,res) => {

    try {
        let result = db.prepare(`UPDATE pins SET
            boardId = @boardId,
            siteUrl = @siteUrl,
            description = @description,
            sortOrder = @sortOrder
            WHERE id = @pinId
        `).run({
            pinId: req.params.pinId,
            boardId: req.body.boardId,
            siteUrl: req.body.siteUrl,
            description: req.body.description,
            sortOrder: req.body.sortOrder
        });

        if ( result.changes == 1 ){
            console.log(`updated pin#${req.params.pinId}`)
            res.send(OK);
        } else {
            res.status(404).send(NOT_FOUND);
        }
    } catch (err) {
        console.log(`Error updating pin#${req.params.pinId}`, err);
        res.status(500).send(SERVER_ERROR);
    }

});

app.delete("/api/pins/:pinId", async (req, res) => {
    try {

        await fs.unlink(getThumbnailImagePath(req.params.pinId).file);
        await fs.unlink(getOriginalImagePath(req.params.pinId).file);

        let result = db.prepare('DELETE FROM pins WHERE id = ?').run(req.params.pinId);

        if ( result.changes == 1 ){
            console.log(`deleted pin#${req.params.pinId}`);
            res.send(OK);
        } else {
            res.status(404).send(NOT_FOUND);
        }
    } catch (err){
        console.log(`Error deleting pin#${req.params.pinId}`, err);
        res.status(500).send(SERVER_ERROR);
    }
});


// start listening
app.listen(port, () => {
    console.log(`tinypin is running at http://localhost:${port}`)
});

function initDb(){   

    db.prepare(`
    CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        createDate TEXT
    )
    `).run();

    let schemaVersion = db.prepare('select max(id) as id from migrations').get().id;

    if ( !schemaVersion || schemaVersion < 1 ){

        console.log("Running migration to version 1");

        db.prepare(`
        CREATE TABLE IF NOT EXISTS boards (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL UNIQUE, 
            createDate TEXT)
        `).run();

        db.prepare(`
        CREATE TABLE IF NOT EXISTS pins (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            boardId INTEGER NOT NULL,
            imageUrl TEXT,
            siteUrl TEXT,
            description TEXT,
            sortOrder INTEGER,
            originalHeight INTEGER,
            originalWidth INTEGER,
            thumbnailHeight INTEGER,
            thumbnailWidth INTEGER,
            createDate TEXT,

            FOREIGN KEY (boardId) REFERENCES boards(id)
        )
        `).run();

        db.prepare(`
            INSERT INTO boards (id, name, createDate) VALUES (0, 'Default Board', ?)
        `).run(new Date().toISOString());

        db.prepare("INSERT INTO migrations (id, createDate) VALUES ( @id, @createDate )").run({id:1, createDate: new Date().toISOString()});

    } else {
        console.log("Database schema v" + schemaVersion + " is up to date.");
    }

}

async function downloadImage(imageUrl){

    let res = await fetch(imageUrl);

    if ( res.status != 200 ){
        throw(new Error(`download error status=${res.status}`));
    }

    let buffer = await res.buffer();

    let original = sharp(buffer);
    let originalMetadata = await original.metadata();
    let originalBuffer = await original.toFormat("jpg").toBuffer();

    let thumbnail = await original.resize({ width: 400, height: 400, fit: 'inside' });
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



function getOriginalImagePath(pinId){
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `${IMAGE_PATH}/originals/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return {dir: dir, file: file};
}

function getThumbnailImagePath(pinId){
    let paddedId = pinId.toString().padStart(12, '0');
    let dir = `${IMAGE_PATH}/thumbnails/${paddedId[11]}/${paddedId[10]}/${paddedId[9]}/${paddedId[8]}`;
    let file = `${dir}/${paddedId}.jpg`;
    return {dir: dir, file: file};
}