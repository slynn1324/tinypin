const crypto = require('crypto');
const conf = require('./conf.js');

const encrypt = (obj) => {
    let str = JSON.stringify(obj);
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes256', conf.getTokenKey(), iv);
    let ciphered = cipher.update(str, 'utf8', 'hex');
    ciphered += cipher.final('hex');
    return iv.toString('hex') + ':' + ciphered;
}

const decrypt = (ciphertext) => {
    let components = ciphertext.split(':');
    let iv_from_ciphertext = Buffer.from(components.shift(), 'hex');
    let decipher = crypto.createDecipheriv('aes256', conf.getTokenKey(), iv_from_ciphertext);
    let deciphered = decipher.update(components.join(':'), 'hex', 'utf8');
    deciphered += decipher.final('utf8');
    return JSON.parse(deciphered);
}

async function deriveKey(salt, pw){
    return new Promise( (resolve, reject) => {
        crypto.scrypt(pw, salt, 64, (err, key) => {
            resolve(key.toString('hex'));
        });
    }); 
}

function createSalt(){
    return crypto.randomBytes(16).toString('hex');
}

module.exports = { 
    encrypt: encrypt, 
    decrypt: decrypt, 
    deriveKey: deriveKey,
    createSalt: createSalt
}