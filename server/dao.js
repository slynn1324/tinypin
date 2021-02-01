const betterSqlite3 = require('better-sqlite3');
const fs = require('fs').promises;
const crypto = require('crypto');
const conf = require('./conf.js');

let db = null;

function listBoards(userId){
    let boards = db.prepare("SELECT * FROM boards where userId = @userId").all({userId:userId});

    // get title pins
    for( let i = 0; i < boards.length; ++i ){
        let result = db.prepare("SELECT id FROM pins WHERE userId = @userId and boardId = @boardId order by createDate limit 1").get({userId:userId, boardId:boards[i].id});
        if ( result ) {
            boards[i].titlePinId = result.id;
        } else {
            boards[i].titlePinId = 0;
        }
    }

    return boards;
}

function countBoardsByUser(userId){
    return db.prepare("SELECT count(id) as count FROM boards WHERE userId = @userId").get({userId: userId});
}

function getBoard(userId, boardId){
    let board = db.prepare("SELECT * FROM boards WHERE userId = @userId and id = @boardId").get({userId:userId, boardId:boardId});

    if ( board ){
        board.pins = db.prepare("SELECT * FROM pins WHERE userId = @userId and boardId = @boardId").all({userId:userId, boardId:boardId});
    }

    return board;
}

function findBoardByUserAndName(userId, name){
    return db.prepare("SELECT id FROM boards WHERE name = @name and userId = @userId").get({name: name, userId: userId});
}

function createBoard(userId, name, hidden){
    let result = db.prepare("INSERT INTO boards (name, userId, hidden, createDate) VALUES (@name, @userId, @hidden, @createDate)").run({name: name, userId: userId, hidden: hidden, createDate: new Date().toISOString()});
    let id = result.lastInsertRowid;
    let board = db.prepare("SELECT * FROM boards WHERE userId = @userId and id = @boardId").get({userId: userId, boardId: id});
    board.titlePinId = 0;
    return board;
}

function updateBoard(boardId, userId, name, hidden){
    let result = db.prepare("UPDATE boards SET name = @name, hidden = @hidden WHERE userId = @userId and id = @boardId").run({name: name, hidden: hidden, userId: userId, boardId: boardId});
    return result.changes == 1;
}

function deleteBoard(userId, boardId){
    let result = db.prepare("DELETE FROM pins WHERE userId = @userId and boardId = @boardId").run({userId:userId, boardId:boardId});
    result = db.prepare("DELETE FROM boards WHERE userId = @userId and id = @boardId").run({userId: userId, boardId:boardId});
    return result.changes == 1;
}

function listPins(userId, boardId){
    return db.prepare("SELECT * FROM pins WHERE userId = @userId and boardId = @boardId").all({userId:userId, boardId:boardId});
}

function countPinsByUser(userId){
    return db.prepare("SELECT count(id) as count FROM pins WHERE userId = @userId").get({userId:userId});
}

function getPin(userId, pinId){
    return db.prepare('SELECT * FROM pins WHERE userId = @userId and id = @pinId').get({userId: userId, pinId:pinId});
}

function createPin(userId, boardId, imageUrl, siteUrl, description, sortOrder, originalHeight, originalWidth, thumbnailHeight, thumbnailWidth){
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
        boardId: boardId,
        imageUrl: imageUrl,
        siteUrl: siteUrl,
        description: description,
        sortOrder: sortOrder,
        originalHeight: originalHeight,
        originalWidth: originalWidth,
        thumbnailHeight: thumbnailHeight,
        thumbnailWidth: thumbnailWidth,
        userId: userId,
        createDate: new Date().toISOString()
    });
    
    return getPin(userId, result.lastInsertRowid);
}

function updatePin(userId, pinId, boardId, siteUrl, description, sortOrder){
    let result = db.prepare(`UPDATE pins SET
            boardId = @boardId,
            siteUrl = @siteUrl,
            description = @description,
            sortOrder = @sortOrder
            WHERE userId = @userId and id = @pinId
        `).run({
            userId: userId,
            pinId: pinId,
            boardId: boardId,
            siteUrl: siteUrl,
            description: description,
            sortOrder: sortOrder
        });

    return result.changes == 1;
}

function deletePin(userId, pinId){
    let result = db.prepare('DELETE FROM pins WHERE userId = @userId and id = @pinId').run({userId: userId, pinId:pinId});
    return result.changes == 1;
}

function getProperty(key){
    // this will throw if the property does not exist
    let result = db.prepare("SELECT value FROM properties WHERE key = ?").get(key);
    if ( result ){
        return result.value;
    }
    return null;
}

function setProperty(key, value){
    let result = db.prepare("UPDATE properties SET value = @value WHERE key = @key").run({key: key, value: value});
    return result.changes == 1;
}

function getUser(userId){
    return db.prepare("SELECT id, username, admin, createDate FROM users where id = ?").get(userId);
}

function listUsers(){
    return db.prepare("SELECT id, username, admin, createDate FROM users").all();
}

function getSaltForUser(username){
    return db.prepare("SELECT salt FROM users WHERE username = ?").get(username);
}

function getUserByNameAndKey(username, key){
    return db.prepare("SELECT id, username, admin, createDate FROM users WHERE username = @username AND key = @key").get({username: username, key: key});
}

function createUser(username, admin, key, salt){
    return db.prepare("INSERT INTO users (username, admin, key, salt, createDate) VALUES (@username, @admin, @key, @salt, @createDate)").run({username: username, admin: admin, key: key, salt: salt, createDate: new Date().toISOString()});
}

function getUserCount(){
    return db.prepare("SELECT count(id) as count FROM users").get().count;
}

function setUserAdmin(userId, admin){
    let result = db.prepare("UPDATE users SET admin = @admin WHERE id = @userId").run({userId:userId, admin:admin});
    return result.changes == 1;
}

function deleteUser(userId){
    db.prepare("DELETE FROM pins WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM boards WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
}

async function init(path){
    DB_PATH = path
    db = betterSqlite3(path);

    console.log("initializing database...");

    db.prepare(`
    CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        createDate TEXT
    )
    `).run();

    let schemaVersion = db.prepare('select max(id) as id from migrations').get().id;
    let isNewDb = false;
    let createdBackup = false;

    if ( !schemaVersion || schemaVersion < 1 ){

        console.log("  running migration v1");
        isNewDb = true;

        db.transaction( () => {

            db.prepare(`
                CREATE TABLE users (
                    id INTEGER NOT NULL PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    key TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    createDate TEXT
                )
            `).run();

            db.prepare(`
                    CREATE TABLE properties (
                        key TEXT NOT NULL UNIQUE PRIMARY KEY,
                        value TEXT NOT NULL
                    )
            `).run();

            db.prepare(`
            CREATE TABLE boards (
                id INTEGER NOT NULL PRIMARY KEY, 
                name TEXT NOT NULL UNIQUE, 
                userId INTEGER NOT NULL,
                createDate TEXT,
                
                FOREIGN KEY (userId) REFERENCES users(id)
                )
            `).run();

            // autoincrement on pins so that pin ids are stable and are not reused.
            // this allows for better caching of images
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

            db.prepare("INSERT INTO properties (key, value) VALUES (@key, @value)").run({key: "cookieKey", value: crypto.randomBytes(32).toString('hex')});
            db.prepare("INSERT INTO migrations (id, createDate) VALUES ( @id, @createDate )").run({id:1, createDate: new Date().toISOString()});

            schemaVersion = 1;

        })();
    }

    if ( schemaVersion < 2 ){
        console.log("  running migration v2");

        if ( !isNewDb ){
            let backupPath = DB_PATH + ".backup-" + new Date().toISOString();
            console.log("    backing up to: " + backupPath);
            db.prepare(`
            VACUUM INTO ?
            `).run(backupPath);
            createdBackup = true;
        }

        db.transaction( () => {

            db.prepare(`
            ALTER TABLE boards ADD COLUMN hidden INTEGER
            `).run();

            db.prepare(`
            UPDATE boards SET hidden = 0
            `).run();

            db.prepare(`
            INSERT INTO migrations (id, createDate) VALUES ( @id, @createDate )
            `).run({id:2, createDate: new Date().toISOString()});

            schemaVersion = 2;
        })();
    }

    if ( schemaVersion < 3 ){
        // image file re-organization, additional sizes
        console.log("  running migration v3");

        let pins = db.prepare(`SELECT * FROM pins`).all();

        if ( require("fs").existsSync(conf.getImagePath()) ){
            let userdirs = await fs.readdir(conf.getImagePath());
            console.log("  migrating images");
            for ( let i = 0; i < userdirs.length; ++i ){       
                if ( require("fs").existsSync(`${conf.getImagePath()}/${userdirs[i]}/images/originals`) ){
                    await fs.rename(`${conf.getImagePath()}/${userdirs[i]}/images/originals`, `${conf.getImagePath()}/${userdirs[i]}/images/o`);
                }
                if ( require("fs").existsSync(`${conf.getImagePath()}/${userdirs[i]}/images/thumbnails`) ){
                    await fs.rename(`${conf.getImagePath()}/${userdirs[i]}/images/thumbnails`, `${conf.getImagePath()}/${userdirs[i]}/images/400`);
                }
            }
        }
        
        if ( pins.length > 0 ){
            console.log("  generating additional image sizes...");
        } 

        for ( let i = 0; i < pins.length; ++i ){
            let pin = pins[i];
            let originalImagePath = getImagePath(pin.userId, pin.id, 'o');
            
            for ( let i = 0; i < ADDITIONAL_IMAGE_SIZES.length; ++i ){
                let size = ADDITIONAL_IMAGE_SIZES[i];
            
                let img = await sharp(originalImagePath.file);
                let resizedImg = await img.resize({width: size, height: size, fit: 'inside'})
                let buf = await resizedImg.toBuffer();
        
                let imgPath = getImagePath(pin.userId, pin.id, size);
                await fs.mkdir(imgPath.dir, {recursive:true});
                await fs.writeFile(imgPath.file, buf);
                console.log(`   saved additional size ${size} for pin#${pin.id} to: ${imgPath.file}`);
            }

        }

        if ( pins.length > 0 ){
            console.log("  finished generating addditional image sizes");
        }

        db.prepare(`
        INSERT INTO migrations (id, createDate) VALUES ( @id, @createDate )
        `).run({id:3, createDate: new Date().toISOString()});

        schemaVersion = 3;
    }

    if ( schemaVersion < 4 ){

        console.log("  running migration v4");

        if ( !isNewDb && !createdBackup ){
            let backupPath = DB_PATH + ".backup-" + new Date().toISOString();
            console.log("    backing up to: " + backupPath);
            db.prepare(`
            VACUUM INTO ?
            `).run(backupPath);
            createdBackup = true;
        }

        db.transaction( () => {

            db.prepare('ALTER TABLE users ADD COLUMN admin').run();
            db.prepare('ALTER TABLE users ADD COLUMN uuid').run(); // need a uuid column to track real uniqueness, because we didn't use AUTOINCREMENT.
            
            db.prepare("UPDATE users SET admin = 1").run();

            let users = db.prepare("SELECT id FROM users").all();

            for ( let i = 0; i < users.length; ++i ){
                let uuid = crypto.randomBytes(16).toString("hex"); // not a real uuid, but serves the same purpose
                db.prepare("UPDATE users SET uuid = @uuid WHERE id = @id").run({id: users[i].id, uuid: uuid});
            }
            
            db.prepare(`
            INSERT INTO properties (key,value) VALUES (@key, @value)
            `).run({key: 'registerEnabled', value: "y"});

            db.prepare(`
            INSERT INTO migrations (id, createDate) VALUES ( @id, @createDate )
            `).run({id:4, createDate: new Date().toISOString()});

            schemaVersion = 4;

        })();

    }

    console.log(`database ready - schema version v${schemaVersion}`);
    console.log('');
}


module.exports = {
    init: init,
    listBoards: listBoards,
    countBoardsByUser, countBoardsByUser,
    getBoard: getBoard,
    findBoardByUserAndName: findBoardByUserAndName,
    createBoard: createBoard,
    updateBoard: updateBoard,
    deleteBoard: deleteBoard,
    listPins: listPins,
    countPinsByUser: countPinsByUser,
    getPin: getPin,
    createPin: createPin,
    updatePin: updatePin,
    deletePin: deletePin,
    getProperty: getProperty,
    setProperty: setProperty,
    getUser: getUser,
    listUsers: listUsers,
    getSaltForUser: getSaltForUser,
    getUserCount: getUserCount,
    getUserByNameAndKey: getUserByNameAndKey,
    createUser: createUser,
    deleteUser: deleteUser,
    setUserAdmin: setUserAdmin
};