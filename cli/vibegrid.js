#!/usr/bin/env node
/**
 * VibeGrid CLI
 *
 *   vibegrid                Launch the desktop app (downloads + installs on first run)
 *   vibegrid install        Download & install the latest release for this OS/arch
 *   vibegrid open           Launch the desktop app
 *   vibegrid --mcp          Print MCP connection info for pointing an AI agent at VibeGrid
 *   vibegrid --mcp-serve    Run the MCP stdio server (bridges to a running VibeGrid)
 *   vibegrid --version      Print the CLI version
 *   vibegrid help           Show this help
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, platform, arch } from 'node:os';
import { join } from 'node:path';

const REPO = 'abuzarkhan1/VibeGrid';
const VERSION = '0.1.0';
// Default port the desktop app's HTTP API binds to. Keep in sync with
// src-tauri/src/http_server.rs (http_port()). Overridable via VIBEGRID_HTTP_PORT.
const MCP_PORT = 8792;

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function die(msg) {
  process.stderr.write(`vibegrid: ${msg}\n`);
  process.exit(1);
}

/** Map Node platform/arch to the GitHub release asset names VibeGrid ships. */
function releaseAsset() {
  const p = platform();
  const a = arch();
  if (p === 'darwin') {
    if (a === 'arm64') return `VibeGrid_${VERSION}_aarch64.dmg`;
    if (a === 'x64') return `VibeGrid_${VERSION}_x64.dmg`;
    die(`Unsupported macOS architecture: ${a}`);
  }
  if (p === 'win32') {
    if (a === 'x64') return `VibeGrid_${VERSION}_x64-setup.exe`;
    if (a === 'arm64') return `VibeGrid_${VERSION}_arm64-setup.exe`;
    die(`Unsupported Windows architecture: ${a}`);
  }
  die(`VibeGrid does not yet ship a binary for ${p}/${a}. Use the Desktop app installers from the website instead.`);
}

function installDir() {
  return process.env.VIBEGRID_HOME || join(homedir(), '.vibegrid');
}

/** Candidate install locations for the Windows app executable. */
function winAppPaths() {
  const candidates = [
    join(installDir(), 'VibeGrid.exe'), // dev / manual copy into ~/.vibegrid
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'VibeGrid', 'VibeGrid.exe') : '', // NSIS default
    process.env.PROGRAMFILES ? join(process.env.PROGRAMFILES, 'VibeGrid', 'VibeGrid.exe') : '',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) || null;
}

/** Path to the installed desktop app's executable (if present). */
function appBinaryPath() {
  const p = platform();
  if (p === 'darwin') {
    const apps = [
      join(homedir(), 'Applications', 'VibeGrid.app', 'Contents', 'MacOS', 'VibeGrid'),
      join('/', 'Applications', 'VibeGrid.app', 'Contents', 'MacOS', 'VibeGrid'),
    ];
    return apps.find((a) => existsSync(a)) || null;
  }
  if (p === 'win32') {
    return winAppPaths();
  }
  return null;
}

/**
 * Install a downloaded .dmg on macOS: mount it, copy VibeGrid.app into
 * ~/Applications, then unmount. Keeps code-signing intact via `ditto`.
 */
function installDmgOnMac(dmgPath) {
  log('Mounting disk image…');
  let mountPoint = null;
  try {
    let attachOut;
    try {
      attachOut = execFileSync(
        'hdiutil',
        ['attach', '-nobrowse', '-noverify', dmgPath],
        { encoding: 'utf8' }
      );
    } catch (err) {
      die(`Could not mount ${dmgPath}: ${err.message}`);
    }
    const match = attachOut.match(/\/Volumes\/[^\t\n]+/);
    mountPoint = match ? match[0].trim() : null;
    if (!mountPoint) {
      die(`Could not locate the mounted volume from: ${attachOut.trim()}`);
    }

    const srcApp = join(mountPoint, 'VibeGrid.app');
    if (!existsSync(srcApp)) {
      die(`VibeGrid.app not found inside the disk image (looked in ${mountPoint}).`);
    }

    const appsDir = join(homedir(), 'Applications');
    mkdirSync(appsDir, { recursive: true });
    const destApp = join(appsDir, 'VibeGrid.app');
    if (existsSync(destApp)) {
      rmSync(destApp, { recursive: true, force: true });
    }
    try {
      execFileSync('ditto', [srcApp, destApp], { stdio: 'ignore' });
    } catch (err) {
      die(`Could not copy VibeGrid.app into ${appsDir}: ${err.message}`);
    }
    log(`Installed VibeGrid.app → ${destApp}`);
  } finally {
    if (mountPoint) {
      try {
        execFileSync('hdiutil', ['detach', mountPoint, '-quiet'], { stdio: 'ignore' });
      } catch {
        /* best-effort unmount */
      }
    }
  }
}

function launch() {
  const p = platform();
  if (p === 'darwin') {
    const apps = [
      join(homedir(), 'Applications', 'VibeGrid.app'),
      '/Applications/VibeGrid.app',
    ];
    const app = apps.find((a) => existsSync(a));
    if (!app) {
      die('VibeGrid.app not found. Run `vibegrid install` first, or download from https://vibegrid.vercel.app/');
    }
    spawn('open', [app], { stdio: 'ignore', detached: true }).unref();
    log(`Launching ${app}`);
  } else if (p === 'win32') {
    const exe = winAppPaths();
    if (!exe) {
      die('VibeGrid.exe not found. Run `vibegrid install` first, or download from https://vibegrid.vercel.app/');
    }
    spawn(exe, [], { stdio: 'ignore', detached: true }).unref();
    log(`Launching ${exe}`);
  } else {
    die('VibeGrid does not yet ship a binary for this platform.');
  }
}

async function install() {
  const asset = releaseAsset();
  const url = `https://github.com/${REPO}/releases/download/v${VERSION}/${asset}`;
  const dest = join(installDir(), asset);
  mkdirSync(installDir(), { recursive: true });

  if (existsSync(dest)) {
    log(`Already downloaded: ${dest}`);
  } else {
    log(`Downloading ${url} …`);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      die(`Download failed (HTTP ${res.status}). Is ${VERSION} published? Check https://github.com/${REPO}/releases`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    log(`Saved to ${dest}`);
  }

  if (platform() === 'darwin') {
    installDmgOnMac(dest);
    log('Done. Launch with:  vibegrid open');
  } else if (platform() === 'win32') {
    log(`Next: run ${dest} to install.`);
    spawn(dest, [], { stdio: 'ignore', detached: true }).unref();
    log('Or run `vibegrid open` once installed.');
  }
}

/** Print accurate MCP connection info (kept in sync with src-tauri). */
function mcpInfo() {
  const port = process.env.VIBEGRID_HTTP_PORT || String(MCP_PORT);
  log('VibeGrid MCP');
  log('────────────');
  log('VibeGrid exposes terminal state over the Model Context Protocol so your');
  log('AI agent can read what is running in every pane. Two ways to connect:');
  log('');
  log(`  1. HTTP API (running app)   http://127.0.0.1:${port}/panes`);
  log('     Start VibeGrid first (`vibegrid open`). If port 8792 is busy the');
  log('     app falls back to the next free port and prints it on launch.');
  log('');
  log('  2. MCP stdio server         vibegrid --mcp-serve');
  log('     Streams JSON-RPC over stdin/stdout for MCP-compatible agents.');
  log('     Config: command `vibegrid`, args `--mcp-serve`. The desktop app');
  log('     must be running (it is the data source).');
  log('');
  log(`Tool exposed: vibegrid_get_panes — returns the current output of all`);
  log('active terminal panes. Port override via VIBEGRID_HTTP_PORT.');
}

/** Run the desktop app binary in MCP stdio mode, bridging to the running app. */
function mcpServe() {
  const bin = appBinaryPath();
  if (!bin) {
    die('VibeGrid is not installed. Run `vibegrid install` first, or download from https://vibegrid.vercel.app/');
  }
  // NOTE: keep this on stderr — stdout is the JSON-RPC stream an MCP client
  // (command: vibegrid, args: --mcp-serve) reads as its transport.
  process.stderr.write(`vibegrid: starting MCP server (${bin})…\n`);
  const child = spawn(bin, ['--mcp'], { stdio: 'inherit' });
  child.on('error', (err) => die(`Failed to start MCP server: ${err.message}`));
  child.on('exit', (code) => process.exit(code ?? 0));
}

const args = process.argv.slice(2);
const first = args[0];

if (first === '--version' || first === '-v') {
  log(VERSION);
} else if (first === 'help' || first === '--help' || first === '-h') {
  log(`VibeGrid CLI v${VERSION}`);
  log('');
  log('Usage:');
  log('  vibegrid                  Launch the desktop app (installs on first run)');
  log('  vibegrid install          Download & install the latest release');
  log('  vibegrid open             Launch the desktop app');
  log('  vibegrid --mcp            Print MCP connection info for AI agents');
  log('  vibegrid --mcp-serve      Run the MCP stdio server (needs app running)');
  log('  vibegrid --version        Print the CLI version');
  log('  vibegrid help             Show this help');
} else if (first === 'install') {
  await install();
} else if (first === 'open') {
  launch();
} else if (first === '--mcp') {
  mcpInfo();
} else if (first === '--mcp-serve') {
  mcpServe();
} else if (args.length === 0) {
  // No args → default to launching (matches `vibegrid` on its own).
  launch();
} else {
  die(`Unknown command "${first}". Run \`vibegrid help\` for usage.`);
}
