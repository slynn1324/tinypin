const tokenUtils = require('./token-utils.js');
const imageUtils = require('./image-utils.js');
const path = require('path');
const dao = require('./dao.js');

// auth helper functions
function sendAuthCookie(res, c){
    res.cookie('s', tokenUtils.encrypt(c), {maxAge: 315569520000}); // 10 years
}

module.exports = async (req, res, next) => {

    // we will also accept the auth token in the x-api-key header
    if ( req.headers["x-api-key"] ){
        // let apiKey = req.headers['x-api-key'];
        // try {
        //     u = tokenUtils.decrypt(decodeURIComponent(apiKey));
        //     req.user = {
        //         id: u.i,
        //         name: u.u
        //     };
        //     console.log("api key accepted for user " + req.user.name);
        // } catch (e) {
        //     console.log("invalid api key");
        //     res.sendStatus(403);
        //     return;
        // }

        req.user = {
            id: 1,
            name: 'a'
        }
        next();
        return;
    }


    // handle one-time-links for images
    if ( req.originalUrl.startsWith("/otl/" ) ){
        try{
            let token = tokenUtils.decrypt(req.originalUrl.substr(5));
            
            // expire tokens in 5 minutes
            if ( new Date().getTime() - token.t > 300000 ){ // 5 minutes
                res.status(404).send(NOT_FOUND);
                return;
            }

            let imagePath = imageUtils.getImagePath(token.u, token.p, 'o');
            res.sendFile(imagePath.file);
            return;
        } catch (e){
            res.status(404).send(NOT_FOUND);
            return;
        }
    }

    // skip auth for pub resources
    // handle login and register paths
    if ( req.originalUrl.startsWith("/pub/") ){
        next();
        return;
    } if ( req.method == "GET" && req.originalUrl == "/login" ){
        res.type("html").sendFile(path.resolve('./templates/login.html'));
        return;
    } else if ( req.method == "POST" && req.originalUrl == "/login" ){
        let username = req.body.username;
        let result = dao.getSaltForUser(username);
        
        if ( !result ){
            console.log(`login ${username} failed [unknown user]`);
            res.redirect("/login#nope");
            return;
        }

        let key = await tokenUtils.deriveKey(result.salt, req.body.password);
        result = dao.getUserByNameAndKey(username, key);

        if (!result){
            console.log(`login ${username} failed [bad password]`);
            res.redirect("/login#nope");
            return;
        }

        sendAuthCookie(res, {
            i: result.id,
            u: username
        });

        console.log(`login ${username} ok`);
        res.redirect("./");
        return;
    } else if ( req.method == "GET" && req.originalUrl == "/register" ){
        res.type("html").sendFile(path.resolve('./templates/register.html'));
        return;
    } else if ( req.method == "POST" && req.originalUrl == "/register" ){

        let username = req.body.username;
        let salt = tokenUtils.createSalt();
        let key = await tokenUtils.deriveKey(salt, req.body.password);

        let result = dao.createUser(username, key, salt);       

        if ( result && result.changes == 1 ){
            sendAuthCookie(res, {
                i: result.lastInsertRowid,
                u: username
            });

            console.log(`created user ${username}`);
            res.redirect("./");
        } else {
            console.log(`error creating account ${name}`);
            res.redirect("/register#nope");
        }

        return;
    } 

    // if we made it this far, we're eady to check for the cookie
    let s = req.cookies.s;

    if ( s ){
        try {
            s = tokenUtils.decrypt(s);
            if ( s.i && s.u ){
                req.user = {
                    id: s.i,
                    name: s.u
                }
            }
        } catch (err) {
            console.error(`error parsing cookie: `, err);
        }
    }

    if ( !req.user ){
        res.redirect("/login");
        return;
    }

    if ( req.method == "GET" && req.originalUrl == "/logout" ){
        console.log(`logout ${req.user.name}`);
        res.cookie('s', '', {maxAge:0});
        res.redirect("/login");
        return;
    }

    next();

}