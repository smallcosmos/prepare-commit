const { spawn } = require('child_process');
const path = require('path');


spawn('node', [path.join(__dirname, './email.js')], {
    stdio: 'inherit'
});
process.exit(0);