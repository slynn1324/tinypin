const crypto = require('crypto');

console.log("cookieKey: " + crypto.randomBytes(32).toString('hex'));