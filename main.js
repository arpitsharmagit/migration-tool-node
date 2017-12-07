'use strict';

var fs = require('fs'),
    path = require('path'),
    app = require('app'),
    BrowserWindow = require('browser-window'),
    server = require('./server'),
    _ = require('lodash'),
    localConfigJSON = {};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

server.start();
var appConfig=server.loadConfig();
if(typeof appConfig !== 'object'){
    appConfig=JSON.parse(appConfig);
}
console.log("Debug Mode:: "+appConfig.debugMode);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', function () {
    var mainWindow, io;

    try {
        var packageJSON = require('./package.json');
        console.log('\n\n');
        console.log('==============================');
        console.log('==== Migration Tool ====');
        console.log('==== Version ' + packageJSON.version + '====');
        console.log('==============================\n\n');
    }
    catch (err) {
      console.warn('Unable to load local package file', err);
    }

    mainWindow = new BrowserWindow({ width: 1600, height: 950,"node-integration": false });
    mainWindow.loadUrl(path.join('file://', __dirname, '/client/index.html'));

    //UNCOMMENT THESE LINES TO OPEN DEVTOOLS ON LOAD
    if(appConfig.debugMode){
      mainWindow.webContents.on('did-finish-load', function () {
        mainWindow.openDevTools();
      });
    }

    mainWindow.on('closed', function () {
          mainWindow = null;
          app.quit();
      });
    mainWindow.on('close', function(e){
      // var dialog = remote.require('dialog');
      // var choice = dialog.showMessageBox(
      //     mainWindow,
      //     {
      //       type: 'question',
      //       buttons: ['Yes', 'No'],
      //       title: 'Confirm',
      //       message: 'Are you sure you want to quit?'
      //     }
      // );
      // if(choice === 0){
      //   console.log("Choice 0");
      //   e.preventDefault();
      // }
      // else{
      //   console.log("Choice 1");
      //   e.preventDefault();
      // }
    });
});

var killedSockets = false;
app.on('uncaughtException', function (err) {
  console.log(err);
})
app.on('before-quit', function(event){
    if(!killedSockets)
        event.preventDefault();

    // CLEAR open IPC sockets to geth
    _.each(global.sockets, function(socket){
        if(socket) {
            console.log('Closing Socket ', socket.id);
            socket.destroy();
        }
    });

    // delay quit, so the sockets can close
    setTimeout(function(){
        killedSockets = true;
        app.quit();
    }, 500);
});
