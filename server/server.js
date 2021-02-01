const yargs = require('yargs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const tokenUtil = require('./token-utils.js');
const dao = require("./dao.js");
const conf = require("./conf.js");
const imageUtils = require('./image-utils.js');
var eta = require("eta");
const tokenUtils = require('./token-utils.js');

module.exports = async () => {

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

    const VERSION = process.env['TINYPIN_VERSION'] ? process.env['TINYPIN_VERSION'].trim() : "none";

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
    conf.setImagePath(path.resolve(argv['image-path']));
    const PORT = argv.port;


    console.log('tinypin starting...');
    console.log('');
    console.log(`version: ${VERSION}`);
    console.log('');
    console.log('configuration:');
    console.log(`  port: ${PORT}`);
    console.log(`  database path: ${DB_PATH}`);
    console.log(`  image path: ${conf.getImagePath()}`)

    const SLOW = argv.slow || parseInt(process.env.TINYPIN_SLOW);
    if ( SLOW ){
        console.log(`  slow mode delay: ${SLOW}`);
    }
    console.log('');

    await dao.init(DB_PATH);
    conf.setTokenKey(Buffer.from(dao.getProperty("cookieKey"), 'hex'));

    // express config
    const app = express();
    app.engine("eta", eta.renderFile);
    app.set("view engine", "eta");
    app.set("views", "./templates")
    const expressWs = require('express-ws')(app);

    app.use(bodyParser.raw({type: 'image/jpeg', limit: '25mb'})); // accept image/jpeg files only
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json());
    app.set('json spaces', 2);
    app.use(cookieParser());



    // accept websocket connections.  currently are parsing the userid from the path to 
    // map the connections to only notify on changes from the same user.
    // this simple mapping of holding all connections in memory here won't really scale beyond 
    // one server instance - but that's not really the use case for tinypin.
    app.ws('/ws/:uid', (ws, req) => {
        ws.on("message", (msg) => {
            //console.log("received messsage: " + msg);
        });
        ws.on("close", () => {
            console.log("socket closed for user " + req.params.uid);
        });
        console.log("socket opened for user " + req.params.uid);
    });

    function broadcast(uid, msg){
        for ( let socket of expressWs.getWss('/ws/' + uid).clients ){
            socket.send(JSON.stringify(msg));
        }
    }

    // handle auth
    app.use ( require('./auth.js') );

    // handle image serving, injecting the user id in the path to segregate users and control cross-user resource access
    app.use( require('./image-server.js') );

    app.use( express.static('client') );

    // emulate slow down
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

    app.get("/api/whoami", (req, res) => {
        let user = dao.getUser(req.user.id);
        if ( !user ){
            res.sendStatus(403);
            return;
        }
        res.send({name: user.username, id: user.id, admin: user.admin, version: VERSION});
    });

    // list boards
    app.get("/api/boards", async (req, res) => {
        try{
            let boards = dao.listBoards(req.user.id);
            res.send(boards);
        } catch (err) {
            console.log("Error listing boards: ",err);
            res.status(500).send(SERVER_ERROR);
        }
    });

    // get board
    app.get("/api/boards/:boardId", async (req, res) => {
        try{
            let board = dao.getBoard(req.user.id, req.params.boardId);

            if ( board ){
                res.send(board);
            } else {
                res.status(404).send(NOT_FOUND);
            }
        } catch (err) {
            console.log('Error getting board#${req.params.boardId}:', err);
            res.status(500).send(SERVER_ERROR);
        }
    });

    // create board
    app.post('/api/boards', (req, res) => {
        try{
            let board = dao.createBoard(req.user.id, req.body.name, req.body.hidden);
            res.send(board);
            console.log(`Created board#${id} ${req.body.name}`);

            broadcast(req.user.id, {updateBoard:id});
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
            let result = dao.updateBoard(req.params.boardId, req.user.id, req.body.name, req.body.hidden);
            if ( result ){
                broadcast(req.user.id, {updateBoard:req.params.boardId});
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

            let pins = dao.listPins(req.user.id, req.params.boardId);
            for ( let i = 0; i < pins.length; ++i ){
                await imageUtils.deleteImagesForPin(req.user.id, pins[i].id);
            }

            let result = dao.deleteBoard(req.user.id, req.params.boardId);

            if ( result ){
                res.send(OK);
                broadcast(req.user.id, {deleteBoard: req.params.boardId});
            } else {
                res.status(404).send(NOT_FOUND);
            }
        } catch (err) {
            console.log(`Error deleting board#${req.params.boardId}:`, err);
            res.status(500).send(SERVER_ERROR);
        }
    });

    // get pin
    app.get("/api/pins/:pinId", (req, res) => {
        try {
            let pin = dao.getPin(userId, pinId);
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

            let boardId = req.body.boardId;

            if ( boardId == "new" ){
                try {
                    let board = dao.createBoard(req.user.id, req.body.newBoardName, 0);
                    boardId = board.id;
                } catch (e){
                    console.log("error creating new board: ", err);
                    res.status(500).send(SERVER_ERROR);
                }
            }

            // download the image first to make sure we can get it
            let image = await imageUtils.downloadImage(req.body.imageUrl);

            let pin = dao.createPin(req.user.id, boardId, req.body.imageUrl, req.body.siteUrl, req.body.description, req.body.sortOrder, image.original.height, image.original.width, image.thumbnail.height, image.thumbnail.width);
            
            await imageUtils.saveImage(req.user.id, pin.id, image);

            // return the newly created row
            res.send(pin);

            broadcast(req.user.id, {updateBoard:boardId});

        } catch (err) {
            console.log(`Error creating pin: ${err.message}`, err);
            res.status(500).send(SERVER_ERROR);
        }
    });

    // update pin
    app.post("/api/pins/:pinId", (req,res) => {

        try {
            let result = dao.updatePin(req.user.id, req.params.pinId, req.body.boardId, req.body.siteUrl, req.body.description, req.body.sortOrder);
            
            if ( result ){
                console.log(`updated pin#${req.params.pinId}`)
                res.send(OK);
                broadcast(req.user.id, {updateBoard:req.body.boardId});
            } else {
                res.status(404).send(NOT_FOUND);
            }
        } catch (err) {
            console.log(`Error updating pin#${req.params.pinId}`, err);
            res.status(500).send(SERVER_ERROR);
        }
    
    });

    // delete pin
    app.delete("/api/pins/:pinId", async (req, res) => {
        try {

            let pin = dao.getPin(req.user.id, req.params.pinId);

            if ( !pin ){
                res.status(404).send(NOT_FOUND);
            }

            imageUtils.deleteImagesForPin(req.user.id, req.params.pinId);

            let result = dao.deletePin(req.user.id, req.params.pinId);

            if ( result ){
                console.log(`deleted pin#${req.params.pinId}`);
                res.send(OK);

                broadcast(req.user.id, {updateBoard:pin.boardId});
            } else {
                throw("deleted 0 rows");
            }

        } catch (err){
            console.log(`Error deleting pin#${req.params.pinId}`, err);
            res.status(500).send(SERVER_ERROR);
        }
    });

    // get a one-time-link for an image
    app.post("/api/pins/:pinId/otl", (req,res) => {

        let data = {
            u: req.user.id,
            p: req.params.pinId,
            t: new Date().getTime()
        };

        let token = tokenUtil.encrypt(data);

        res.status(200).send({t: token});
    });

    app.post("/up", async (req, res) => {

        try {

            require("fs").writeFileSync("up.jpg", req.body);

            // try to parse the image first... if this blows up we'll stop early
            let image = await imageUtils.processImage(req.body);

            let boardName = req.headers['board-name'].trim();

            // get the board
            let board = dao.findBoardByUserAndName(req.user.id, boardName);

            if ( !board ){
                board = dao.createBoard(req.user.id, boardName, 0);
            }
            
            let pin = dao.createPin(req.user.id, board.id, null, null, null, null, image.original.height, image.original.width, image.thumbnail.height, image.thumbnailWidth);

            await imageUtils.saveImage(req.user.id, pin.id, image);

            broadcast(req.user.id, {updateBoard:board.id});
            res.status(200).send(pin);

        } catch (err){
            console.log(`Error uploading pin`, err);
            res.status(500).send(SERVER_ERROR);
        }
    });

    app.get("/api/apikey", (req,res) => {
        let s = req.cookies['s'];
        console.log("s=" + s);
        res.send({apiKey: s});
    });

    app.get("/settings", (req, res) => {

        let user = dao.getUser(req.user.id);
        if ( user.admin != 1 ){
            res.sendStatus(403);
            return;
        }

        let registerEnabled = dao.getProperty("registerEnabled");

        let users = dao.listUsers();
        for ( let i = 0; i < users.length; ++i ){
            users[i].boardCount = dao.countBoardsByUser(users[i].id).count;
            users[i].pinCount = dao.countPinsByUser(users[i].id).count;
        }

        res.render("settings", {
            registerEnabled: registerEnabled,
            users: users,
            userId: req.user.id
        });
    });

    app.post("/settings", async (req, res) => {

        let user = dao.getUser(req.user.id);
        if ( user.admin != 1 ){
            res.sendStatus(403);
            return;
        }

        if ( req.body.action == "updateUsers" ){

            let users = dao.listUsers();

            for ( let i = 0; i < users.length; ++i ){
                if ( users[i].id != req.user.id ){   // can't update yourself            
                    let adminSetting = req.body['admin-' + users[i].id];

                    if ( adminSetting != users[i].admin ){
                        dao.setUserAdmin(users[i].id, adminSetting);
                    }
                }
            }

            res.redirect("./settings#users-updated");
            return;
        
        } else if ( req.body.action == "updateSettings" ){
            let registerEnabled = "y";
            if ( req.body.registerEnabled == "n" ){
                registerEnabled = "n";
            }
            console.log("set register enabled=" + registerEnabled);
            dao.setProperty('registerEnabled', registerEnabled);

            res.redirect("./settings#settings-updated");
            return;
        } else if ( req.body.action == "createUser" ){

            let username = req.body.username;
            let password = req.body.password;
            let repeatPassword = req.body.repeatPassword;

            console.log(`username: ${username} password: ${password} rp: ${repeatPassword}`);

            if ( password != repeatPassword ){
                res.redirect("./settings#password-match")
                return;
            }

            let salt = tokenUtils.createSalt();
            let key = await tokenUtils.deriveKey(salt, password);

            try{
                dao.createUser(username, 0, key, salt);
            } catch (err){
                console.log("error creating user " + username, err);
                res.redirect("./settings#create-user-error");
                return;
            }

            res.redirect("./settings#created-user");
            return;

        } else if ( req.body.action == "deleteUser" ){

            let uid = req.body.uid;

            try {
                dao.deleteUser(uid);
                require("fs").rmdirSync(conf.getImagePath() + "/" + uid , { recursive: true });
            } catch (err){
                console.log("error deleting user " + uid, err);
                res.redirect("./settings#delete-user-error");
                return;
            }

            res.redirect("./settings#deleted-user");
            return;

        }

        res.redirect("./settings");

    });


    // start listening
    app.listen(PORT, () => {
        console.log(`tinypin is running at http://localhost:${PORT}`);
        console.log('');
    });


};