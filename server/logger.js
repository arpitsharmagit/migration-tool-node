'use babel';
'use strict';

var winston = require('winston'),
	fs = require('fs'),
	logDir = "log";

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return month + "/" + day + "/" +year + " " + hour + ":" + min + ":" + sec;
}

if ( !fs.existsSync( logDir ) ) {
	// Create the directory if it does not exist
	fs.mkdirSync( logDir );
	//console.log("Log Directory Created:: "+logDir);
}
winston.emitErrs = false;
//console.log("Log directory:: "+logDir);
var logger = new (winston.Logger)({
    transports: [
			new (winston.transports.Console)({
            handleExceptions: true,
            json: false,
            colorize: true
	    }),
      new (winston.transports.File)({
				filename: logDir + '/logs.log',
				json: false,
				maxsize: 1024 * 1024 * 10,
				handleExceptions: true,
				colorize: false
		  //humanReadableUnhandledException: true
		})
	],
	exitOnError: false
  });


//logger.stream({ start: -1 }).on('log', function(log) {    console.log(log);  });
logger.on('logging', function (transport, level, msg, meta) {
    // [msg] and [meta] have now been logged at [level] to [transport]
		console.log("["+getDateTime()+"] ["+level+"] "+msg);
  });

module.exports = logger;
