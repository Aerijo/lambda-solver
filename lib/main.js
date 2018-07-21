process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

const { app, BrowserWindow } = require('electron');
let window;

function createWindow () {
  window = new BrowserWindow();
  window.loadFile("./index.html");
}

app.on('ready', createWindow);
