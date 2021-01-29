let conf = require("./conf.js");

module.exports = (req, res, next) => {
    if ( req.method == "GET" && req.originalUrl.startsWith("/images/") ){

        let filepath = conf.getImagePath() + '/' + req.user.id + '/' + req.originalUrl;
        res.setHeader('Cache-control', `private, max-age=2592000000`); // 30 days
        res.sendFile(filepath); 
        return;

    } else if ( req.method == "GET" && req.originalUrl.startsWith("/dl/") ){
        
        let path = req.originalUrl.replace("/dl/", "/images/");

        let filepath = conf.getImagePath() + "/" + req.user.id + "/" + path;
        res.setHeader("Content-Disposition", 'attachment; filename="image.jpg');
        res.sendFile(filepath);
        return;

    } else {
        next();
    }
}