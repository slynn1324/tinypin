const crypto = require('crypto');
const readline = require("readline");
const writable = require('stream').Writable;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

rl.stdoutMuted = true;
rl.query = "password: ";
rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if ( stringToWrite == rl.query ){
        rl.output.write(stringToWrite);
    }
    // if (rl.stdoutMuted)
    //     // rl.output.write("");
    // //   rl.output.write("\x1B[2K\x1B[200D"+rl.query+"["+((rl.line.length%2==1)?"=-":"-=")+"]");
    // else
    //   rl.output.write(stringToWrite);
};

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

// let username = req.body.username;
// let salt = createSalt();
// let key = await deriveKey(salt, req.body.password);


rl.question(rl.query, async (password) => {
    rl.close();
    console.log(password);
    let salt = createSalt();
    let key = await deriveKey(salt, password);
    console.log("salt: " + salt);
    console.log("key: " + key);
});
