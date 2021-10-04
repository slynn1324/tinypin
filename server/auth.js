const tokenUtils = require('./token-utils.js');
const imageUtils = require('./image-utils.js');
const path = require('path');
const dao = require('./dao.js');

// auth helper functions
function sendAuthCookie(res, c){
    res.cookie('s', tokenUtils.encrypt(c), {maxAge: 315569520000}); // 10 years
}

function maybeGetUser(req){

    if ( !req.cookies ){
        return null;
    }

    // if we made it this far, we're eady to check for the cookie
    let s = req.cookies.s;

    // TODO: should probably check if the user's access has been revoked,
    // but we currently don't allow deleting users anyway.  A key rotation would 
    // be the other solution, but that would log out all users and require new tokens
    // to be created.
    if ( s ){
        try {
            s = tokenUtils.decrypt(s);
            if ( s.i && s.u ){
                return {
                    id: s.i,
                    name: s.u
                }
            }
        } catch (err) {
            console.log(`error parsing cookie: `, err);
        }
    }

    return null;
}

module.exports = async (req, res, next) => {

    // we will also accept the auth token in the x-api-key header
    if ( req.headers["x-api-key"] ){
        let apiKey = req.headers['x-api-key'];
        try {
            u = tokenUtils.decrypt(decodeURIComponent(apiKey));
            req.user = {
                id: u.i,
                name: u.u
            };
            console.log("api key accepted for user " + req.user.name);
            next();
            return;
        } catch (e) {
            console.log("invalid api key");
            res.sendStatus(403);
            return;
        }
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
    if ( req.originalUrl == "/favicon.ico" ){
        res.sendFile(path.resolve("./client/pub/icons/favicon.ico"));
        return;
    }
    if ( req.originalUrl.startsWith("/pub/") ){
        next();
        return;
    } if ( req.method == "GET" && req.originalUrl == "/login" ){


        if ( maybeGetUser(req) ){
            res.redirect("./");
            return;
        }

        console.log("login");
        // res.type("html").sendFile(path.resolve('./templates/login.html'));
        res.render("login", { registerEnabled: dao.getProperty("registerEnabled"), csrfToken: req.csrfToken() });
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

        let registerEnabled = dao.getProperty("registerEnabled");
        if ( registerEnabled != 'y' ){
            res.sendStatus(403);
            return;
        }

        res.render("register", { csrfToken: req.csrfToken() });
        return;
    } else if ( req.method == "POST" && req.originalUrl == "/register" ){

        let registerEnabled = dao.getProperty("registerEnabled");
        if ( registerEnabled != 'y' ){
            res.sendStatus(403);
            return;
        }

        // if it's the first user, make them an admin - otherwise don't.
        let userCount = dao.getUserCount();
        let admin = userCount == 0 ? 1 : 0;
        
        let username = req.body.username;
        let salt = tokenUtils.createSalt();
        let key = await tokenUtils.deriveKey(salt, req.body.password);

        let result = dao.createUser(username, admin, key, salt);       

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

    // // if we made it this far, we're eady to check for the cookie
    // let s = req.cookies.s;

    // // TODO: should probably check if the user's access has been revoked,
    // // but we currently don't allow deleting users anyway.  A key rotation would 
    // // be the other solution, but that would log out all users and require new tokens
    // // to be created.
    // if ( s ){
    //     try {
    //         s = tokenUtils.decrypt(s);
    //         if ( s.i && s.u ){
    //             req.user = {
    //                 id: s.i,
    //                 name: s.u
    //             }
    //         }
    //     } catch (err) {
    //         console.error(`error parsing cookie: `, err);
    //     }
    // }
    req.user = maybeGetUser(req);

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