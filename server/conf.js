let imagePath = "images";
let tokenKey = null;

module.exports = {
    getImagePath: () => { return imagePath; },
    setImagePath: (path) => { imagePath = path; },

    getTokenKey: () => { 
        if ( !tokenKey ){ 
            throw 'tokenKey has not been set'; 
        } else { 
            return tokenKey; 
        } 
    },
    setTokenKey: (key) => { tokenKey = key }

}