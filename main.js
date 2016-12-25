// Module to control application life.
// var app = require('electron'); 

const electron = require('electron');
// Module to control application life.
const app = electron.app;


// Module to create native browser window.
// var BrowserWindow = require('browser-window');
const BrowserWindow = electron.BrowserWindow;
let mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1200, height: 800, title:'Dynamodb', icon: __dirname + '/icon.icns', 'node-integration': false});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the devtools.
  // mainWindow.openDevTools();
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {

    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

});