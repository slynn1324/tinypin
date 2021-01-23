const yargs = require('yargs');

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
    .option('port', {
        alias: 'p',
        description: 'http server port',
        type: 'number',
        default: 3000
    })
    .help().alias('help', 'h')
    .argv;



console.log(argv);