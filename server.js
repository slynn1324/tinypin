const yargs = require('yargs');
const express = require('express');
const bodyParser = require('body-parser');
const betterSqlite3 = require('better-sqlite3');
// const db = require('better-sqlite3') //, {verbose:console.log});
const http = require('http');
const https = require('https');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const { send } = require('process');

process.on('SIGINT', () => {
    console.info('ctrl+c detected, exiting tinypin');
    console.info('goodbye.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.info('sigterm detected, exiting tinypin');
    console.info('goodbye.');
    process.exit(0);
});

const argv = yargs
    .option('slow', {
        alias: 's',
        description: 'delay each request this many milliseconds for testing',
        type: 'number'
    })
    .option('image-path', {
        alias: 'i',
        description: 'base path to store images',
        type: 'string',
        default: './images'
    })
    .option('db-path', {
        alias: 'd',
        description: 'path to sqlite database file',
        type: 'string',
        default: 'tinypin.db'
    })
    .option('port', {
        alias: 'p',
        description: 'http server port',
        type: 'number',
        default: 3000
    })
    .help().alias('help', 'h')
    .argv;


const DB_PATH = path.resolve(argv['db-path']);
const IMAGE_PATH = path.resolve(argv['image-path']);
const PORT = argv.port;

console.log('tinypin starting...');
console.log('');
console.log('configuration:');
console.log(`  port: ${PORT}`);
console.log(`  database path: ${DB_PATH}`);
console.log(`  image path: ${IMAGE_PATH}`)

const SLOW = argv.slow || parseInt(process.env.TINYPIN_SLOW);
if ( SLOW ){
    console.log(`  slow mode delay: ${SLOW}`);
}
console.log('');


const db = betterSqlite3(DB_PATH);
// express config
const app = express();
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.set('json spaces', 2);
app.use(cookieParser());


app.post("/login", (req, res) => {

    let username = req.body.username;
    let passhash = hashPassword(req.body.password);
    
    let result = db.prepare("SELECT * FROM users WHERE username = @username AND passhash = @passhash").get({username: username, passhash: passhash});

    if ( result ){
        console.log(`login ${username} ok`);

        sendAuthCookie(res,{
            i: result.id,
            u: req.body.username,
            d: new Date().toISOString()
        });   
        
        res.redirect("./");

    } else {
        console.log(`login ${username} failed`);
        res.redirect("/login.html#nope");
    }

});

// auth -- if the cookie is set exctract the user info, otherwise redirect to /login.html
app.use( (req, res, next) => {

    // todo - allow basic auth for apis?
    let s = req.cookies.s;

    if ( s ){
        try {
            s = JSON.parse(s);

            if ( s.i && s.u ){
                req.user = {
                    id: s.i,
                    name: s.u
                }

                next();
            } else {
                console.log(s);
                console.error(`invalid cookie`);
                failAuth(req,res);
            }
        } catch (err){
            console.error(`error parsing cookie: `, err);
            failAuth(req,res);
        }
    
    } else {
        // if it's an api or image request, just 401 -- otherwise redirect the browser
        failAuth(req,res);
    }

});

function failAuth(req,res){
    if ( req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/thumbnails") || req.originalUrl.startsWith("/originals") ){
        res.status(401).send();
    } else {
        res.redirect("/login.html"); // this means we have issues with a context path, but is needed for image redirects to work
    }
}


app.use(express.static('static'));
app.use(express.static(IMAGE_PATH));

//emulate slow down
if ( SLOW ){
    app.use( (req,res,next) => {
        console.log("slow...");
        setTimeout(() => {
            next();
        }, SLOW);
    });
}

const OK = {status: "ok"};
const NOT_FOUND = {status: "error", error: "not found"};
const ALREADY_EXISTS = {status: "error", error: "already exists"};
const SERVER_ERROR = {status: "error", error: "server error"};

initDb();
const passwordSalt = getPasswordSalt();

// list boards
app.get("/api/boards", async (req, res) => {
    try{
        let boards = db.prepare("SELECT * FROM boards").all();

        for( let i = 0; i < boards.length; ++i ){
            let result = db.prepare("SELECT id FROM pins WHERE userId = @userId and boardId = @boardId order by createDate limit 1").get({userId:req.user.id, boardId:boards[i].id});
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

        let board = db.prepare("SELECT * FROM boards WHERE userId = @userId and id = @boardId").get({userId:req.user.id, boardId:req.params.boardId});
        if ( board ){

            board.pins = db.prepare("SELECT * FROM pins WHERE userId = @userId and boardId = @boardId").all({userId:req.user.id, boardId:req.params.boardId});

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
        let result = db.prepare("INSERT INTO boards (name, userId, createDate) VALUES (@name, @userId, @createDate)").run({name: req.body.name, userId: req.user.id, createDate: new Date().toISOString()});
        let id = result.lastInsertRowid;
        let board = db.prepare("SELECT * FROM boards WHERE userId = @userId and id = @boardId").get({userId: req.user.id, boardId: id});
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
        let result = db.prepare("UPDATE boards SET name = @name WHERE userId = @userId and id = @boardId").run({name: req.body.name, userId: req.user.id, boardId: req.params.boardId});
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

        let pins = db.prepare("SELECT id FROM pins WHERE userId = @userId and boardId = @boardId").all({userId:req.user.id, boardId:req.params.boardId});
        for ( let i = 0; i < pins.length; ++i ){
            await fs.unlink(getThumbnailImagePath(pins[i].id).file);
            await fs.unlink(getOriginalImagePath(pins[i].id).file);
        }

        let result = db.prepare("DELETE FROM pins WHERE userId = @userId and boardId = @boardId").run({userId:req.user.id, boardId:req.params.boardId});
        result = db.prepare("DELETE FROM boards WHERE userId = @userId and id = @boardId").run({userId: req.user.id, boardId:req.params.boardId});

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
        let pin = db.prepare('SELECT * FROM pins WHERE userId = @userId and id = @pinId').get({userId: req.user.id, pinId:req.params.pinId});
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

        let image = await downloadImage(req.body.imageUrl);
        
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
            userId,
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
            @userId,
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
            userId: req.user.id,
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
        let pin = db.prepare("SELECT * FROM pins WHERE userId = @userId and id = @pinId").get({userId: req.user.id, pinId: id});
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
            WHERE userId = @userId and id = @pinId
        `).run({
            userId: req.user.id,
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

        let result = db.prepare('DELETE FROM pins WHERE userId = @userId and id = @pinId').run({userId: req.user.id, pinId:req.params.pinId});

        if ( result.changes == 1 ){
            await fs.unlink(getThumbnailImagePath(req.params.pinId).file);
            await fs.unlink(getOriginalImagePath(req.params.pinId).file);

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



app.post("/create-account", (req, res) => {
    
    console.log(`creating user '${req.body.username}'`);

    let passhash = hashPassword(req.body.password);
    
    let result = db.prepare('INSERT INTO users (username, passhash) VALUES (@username, @passhash)').run({username: req.body.username, passhash: passhash});

    console.log(`  user pk = ${result.lastInsertRowid}`);

    sendAuthCookie(res, {
        i: result.lastInsertRowid,
        u: req.body.username,
        d: new Date().toISOString()
    });

    res.redirect("create-account.html");
});

app.get("/logout", (req, res) => {
    console.log(`logout user ${req.user.name}`);
    res.cookie('s', '', {maxAge:0});
    res.redirect("/login.html");
});

app.get("/whoami", (req, res) => {
    res.send(req.user);
});

function sendAuthCookie(res, c){
    res.cookie('s', JSON.stringify(c), {maxAge: 315569520000}); // 10 years
}

function hashPassword(pw){
    return crypto.createHash('sha256', passwordSalt).update(pw).digest('hex');
}


// start listening
app.listen(PORT, () => {
    console.log(`tinypin is running at http://localhost:${PORT}`);
    console.log('');
});

function initDb(){   

    console.log("initializing database...");

    db.prepare(`
    CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        createDate TEXT
    )
    `).run();

    let schemaVersion = db.prepare('select max(id) as id from migrations').get().id;

    if ( !schemaVersion || schemaVersion < 1 ){

        console.log("  running migration v1");

        db.prepare(`
            CREATE TABLE users (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                passhash TEXT NOT NULL,
                createDate TEXT
            )
        `).run();

        db.prepare(`
            CREATE TABLE properties (
                key TEXT NOT NULL PRIMARY KEY,
                value TEXT NOT NULL
            )
        `).run();

        db.prepare(`
        CREATE TABLE boards (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL UNIQUE, 
            userId INTEGER NOT NULL,
            createDate TEXT,
            
            FOREIGN KEY (userId) REFERENCES users(id)
            )
        `).run();

        db.prepare(`
        CREATE TABLE pins (
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
            userId INTEGER NOT NULL,
            createDate TEXT,

            FOREIGN KEY (boardId) REFERENCES boards(id),
            FOREIGN KEY (userId) REFERENCES users(id)
        )
        `).run();

        db.prepare("INSERT INTO properties (key, value) VALUES (@key, @value)").run({key: 'pwsalt', value: crypto.randomBytes(32).toString('hex')});
        db.prepare("INSERT INTO migrations (id, createDate) VALUES ( @id, @createDate )").run({id:1, createDate: new Date().toISOString()});

        schemaVersion = 1;
    }

    console.log(`database ready - schema version v${schemaVersion}`);
    console.log('');
}

function getPasswordSalt(){
    return db.prepare('SELECT value FROM properties WHERE key = ?').get('pwsalt').value;
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
