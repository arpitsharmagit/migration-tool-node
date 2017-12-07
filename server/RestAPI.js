'use 6to5';
'use babel';
'use strict';

var RestAPI={};

var   express = require('express'),
bodyParser = require('body-parser'),
sql = require('mssql'),
path = require("path"),
fs = require('fs'),
JSFtp = require('jsftp'),
os = require('os'),
Q = require('q'),
_ = require('lodash');

//require rev class
var Rev = require('./Rev');
// require sll class
var MaduroSLL = require('./Maduro/MaduroSLL'),
// settings are saved in a separate JSON file
fixture = require('./config.json');
var app = express();
var ftpLoggedIn=false;
var FILEEXTENSIONS = ["PPT",  "PPTX", "DOC", "DOCX", "TXT", "PDF", "XLS", "XLSX", "CSV", "ZIP", "RAR", "7Z","JPG", "PNG", "GIF", "SVG"];

// Config
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/client'));

var client = undefined;

var outputDirectory = path.join(__dirname,"VemsDownload");


// create new instance of madurosll
var sll , verboseEnabled = true, revUrl, config;

function saveContentLink (link) {
  logger.info('downloading file for content link ' , link.FileName);
  var contentLinkDownloadPromise;
  contentLinkDownloadPromise = sll.downloadContentLink(link.GUID, link.savePath)
  .then(function () {
    logger.info('DONE: saved content link file for ' , link.FileName);
    return Promise.resolve();
  })
  .catch(function (err) {
    return Promise.reject(err);
    console.warn('FAIL: unable to download or save content link file for', link.FileName);
  });

  return contentLinkDownloadPromise;
}

function saveContentThumbnail (contentID, savePath, token, videoID) {
  var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  token});

  var deferred = Q.defer();
  logger.info('getting content thumbnail for: ' + contentID);
  sll.getContentDetails(contentID)
  .then(function (details) {
    logger.info('got details. Title is ' + details.title);
    logger.info('downloading thumbnail file' + details.thumbnailGUID);
    sll.downloadThumbnail(details.thumbnailGUID, savePath)
    .then(function(){
      logger.info('DONE: saved thumbnail file to ' + savePath);
      logger.info('Uploading thumbnail to Rev.....' );
      revManager.uploadThumbnail(videoID, savePath).
      then(function(result){
        if(result == 200){
        logger.info('DONE: uploaded thumbnail file to Rev.');
        deferred.resolve("Uploading Thumbnail Success.");
        }
        else
        {
          logger.info(JSON.stringify(result));
          deferred.reject("some internal error occured while uploading thumbnail to Rev.");
        }
      },function(error){
        console.warn('FAIL: unable to upload  thumbnail file.', JSON.stringify(error));
        deferred.reject(JSON.stringify(error));
      })
    },function(error){
      console.warn('FAIL: unable to download or save thumbnail.',error.LocalizedMessage);
     deferred.reject(error.LocalizedMessage);
    })
  },function(error){
    console.warn('FAIL: error getting content details',error.LocalizedMessage);
    deferred.reject(error.LocalizedMessage);
  })
  return deferred.promise;

}

app.post('/api/vemslogin', function (req, res){
  sll = new MaduroSLL({
  url: req.body.config.vems.url,
  debug: true
});
logger.info(JSON.stringify(req.body.config));
 revUrl=req.body.config.rev.url;
logger.info("RevURL"+revUrl);
logger.info('logging into Vems..');

sll.login(req.body.config.vems.username, req.body.config.vems.password)
  .then(function (sessionID) {
    logger.info('logged in with session ID', sessionID);
    var statusMsg = "logged-in into vems with session ID -" + sessionID;
    return res.send(statusMsg);
  })
  .catch(function (error) {
    console.error(error);
    console.warn('FAIL', error.LocalizedMessage || error.message);
    var Msg = "Vems login failed with following error-" + error.message;
    res.send(Msg);
  });

});
app.post('/api/contentThumbnail', function (req, res) {
 var  outputPath = path.join(outputDirectory, fixture.vems.filename + "_" + req.body.contentId + ".jpg");
 saveContentThumbnail(req.body.contentId, outputPath, req.body.revToken, req.body.videoID)
  .then(function(data){
    logger.info("Success::"+data);
    res.send("Success::"+data);
  },function (error) {
    logger.info(error);
    res.send("Error::"+error);
  });
});

app.post('/api/contentLinks', function (req, res) {
    var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  req.body.revToken});

    logger.info('getting content Links for: ' + req.body.contentId);
    sll.getContentLinks(req.body.contentId)
     .then(function (data){
       logger.info(data);
       if(data && data.length>0){
         logger.info("got content lniks metadata from vems.Filtering files to remove invalid files for rev...");

         var contentMetaData = filterInvalidRevFiles(data);
         var filteredFiles = _.difference(data, contentMetaData);
         if(filteredFiles){
           logger.info("following files are invalid for rev and won't be uploaded..", filteredFiles);
         }
         ProcessContentLinks(req.body.contentId, contentMetaData).then(function(){
           logger.info("Downloaded actual files for all content links..");
           revManager.uploadContentLinkedDocs(req.body.videoID, contentMetaData)
           .then(function(data){
              if(data == 200){
               logger.info("uploaded content linked docs to Rev successfully.")
               res.send("Success:: uploaded content linked docs to Rev successfully.");
              }
              else{
                 res.send("Error:: Content linked docs migration failed");
              }
           },function(error){
             logger.info("Content linked docs migration failed with following error", error);
             res.send("Error:: Content linked docs migration failed with following error"+ error);
           });
         },function(error){
           res.send("Error::"+error)
         })
       }
       else {
         res.send("Success:::: No content links.");
       }
     },function(error){
       res.send("error getting content link metadata.", error);
     });
});

function ProcessContentLinks(contentId, contentLinks){
  var queue = [];
  for (var i = 0; i < contentLinks.length; i++) {
   var arrFile =  contentLinks[i].FileName.split(".");
   var fileName = arrFile[0];
   var fileExtension = arrFile[1];
   contentLinks[i].savePath = path.join(outputDirectory, fixture.vems.linkFilename + "_" + contentId + "_" + fileName + "." + fileExtension);
   if(_.indexOf(FILEEXTENSIONS, fileExtension.toUpperCase()) >= 0){
    logger.info("this is a valid rev file", arrFile);
      queue.push(saveContentLink(contentLinks[i]));
    }
    else{
      logger.info("Linked Doc", arrFile, "Not imported as it is not a supported format in Rev.")
    }
 }

 return Promise.all(queue);
}

app.post('/api/contentComments', function (req, res) {
  var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  req.body.revToken});
  logger.info("Downloading Comments from Vems...");
  sll.getContentComments(req.body.contentId)
  .then(function(data){
    logger.info(data.Entities);
    if(data.Entities && data.Entities.length>0){
      logger.info("Uploading comments to Rev....");
      var comments=[];
      for(var i = 0; i < data.Entities.length; i++){
        comments.push(revManager.uploadContentComment(req.body.videoID, data.Entities[i].CommentText));
      }
      Promise.all(comments).then(function(success){
         logger.info("Content comments migrated successfully");
         res.send("Success::Content comments migrated successfully");
      },function(error){
        logger.info("migration of comments failed with following error", error);
        res.send("Error::migration of comments failed with following error", error);
      })
    }
    else {
      res.send("Success:: No Comments for content from VEMS");
      logger.info("Success:: No Comments for content from VEMS");
    }
  },function(error){
    res.send("Error:: Can't get comments from VEMS");
    logger.info("Error:: Can't get comments from VEMS");
  });
});

function filterInvalidRevFiles(data){
  return _.filter(data, function(file){
   var arrFile =  file.FileName.split(".");
   var fileExtension = arrFile[1];
   return _.contains(FILEEXTENSIONS,fileExtension.toUpperCase());
 });
}

app.on('uncaughtException', function (err) {
  logger.info(err);
})
app.get('/api', function (req, res) {
       res.end(JSON.stringify("APIResponse"));
   });

app.post('/api/contentUploadDateTime', function (req, res) {

 var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  req.body.revToken});
 logger.info("Migrating content upload date time from vems to Rev");
 logger.info(req.body.videoID, req.body.userName, req.body.whenUploaded);
 revManager.uploadContentDateTime(req.body.videoID, req.body.userName, req.body.whenUploaded)
 .then(function(result){
    res.send("Success:: Upload date time migarted to rev successfully");
    logger.info("Success:: Upload date time migarted to rev successfully");
 },function(error){
    res.send("Error:: Migration of upload date time failed with following error" + error);
    logger.info("Error:: Migration of upload date time failed with following error" + error);
 });

});
app.post('/api/contents', function (req, res) {
    config = {
    user: req.body.config.vems.DBUsername,
    password: req.body.config.vems.DBPassword,
    server: req.body.config.vems.DBServer, // You can use 'localhost\\instance' to connect to named instance
    database: 'maduro',
    options: {
        encrypt: false // Use this if you're on Windows Azure
     }
    };

    var connection = new sql.Connection(config, function(err) {
    logger.info('Fetching dme content details from Vems');
    logger.info("DME Publishing point - " , req.body.publishingPoint);
    var request = new sql.Request(connection);
    request.input('StoredServerPublishingPointId', sql.Int, req.body.publishingPoint);// or: var request = connection.request();
    request.execute('GetDMEContents', function(err, recordsets, returnValue){
    if(recordsets && recordsets.length > 0){
          res.end(JSON.stringify(recordsets[0]));
        }
      else{
        res.end("Error:: error occured in fetching dme contents from Vems")
      }
      // ...
    });
 });

 connection.on('error', function(err) {
   res.end("error occured");
 });
});

 app.post('/api/customfields', function (req, res) {

    var connection = new sql.Connection(config, function(err) {
    logger.info('Updating custom fields for the content');
    logger.info("ContentId - " , req.body.ContentID);
    logger.info(JSON.stringify(req.body.ContentStatus));
    var request = new sql.Request(connection);
    request.input('ContentId', sql.Int, req.body.ContentID);
    request.input('MigrationStatus', sql.VarChar(50), req.body.ContentStatus.MigrationStatus);
    request.input('RevLocation', sql.VarChar(1000), req.body.ContentStatus.RevContentLocation);
    request.input('VEMSLocation', sql.VarChar(1000), req.body.ContentStatus.VEMSContentPath);
    request.input('RevContentId', sql.VarChar(50), req.body.ContentStatus.RevContentID);
    request.execute('SetContentCustomFields', function(err, recordsets, returnValue){

    logger.info("Result Value:: ",JSON.stringify(recordsets[0]));
    res.end(JSON.stringify(recordsets[0]));
    logger.info("content field updated successfully.")
    // ...
    });
});

connection.on('error', function(err) {
  logger.info("Error Value:: ",JSON.stringify(err));
 res.end("error occured while updating content custom field");
});

});

app.post('/api/download',function(req,res){
  if(ftpLoggedIn==true){
    var downloadPath= path.join(__dirname,"Temp",path.basename(req.body.remotePath));
    logger.info(downloadPath);
    client.get(req.body.remotePath,downloadPath,function(err){
      if (err){
         logger.info(err);
         res.send({Response:"Error", Message:err});
       }
       else {
         logger.info('File copied successfully!');
         res.send({Response:"Success", Message:'File copied successfully!'});
       }
     });
 }
 else {
   res.send({Response:"Error", Message:"Please login first before sending command."});
 }
});
app.post('/api/upload',function(req,res){
  if(ftpLoggedIn==true){
    //Writefile to disk before upload
    var localPath= path.join(__dirname,"Temp",path.basename(req.body.remotePath));
    fs.exists('/Temp', function (exists) {
      fs.writeFile(localPath, JSON.stringify(req.body.VideoMetaData), function(err) {
      if(err) {
          logger.info(err);
          res.send({Response:"Error", Message:"Error in saving file to temp folder."});
      }
      else {
        client.put(localPath,req.body.remotePath,function(err){
         if (err){
            logger.info(err);
            res.send({Response:"Error", Message:err});
          }
          else {
            logger.info('File uploaded successfully!');
            res.send({Response:"Success", Message:'File uploaded successfully!'});
          }
        });
      }
    });
  });
 }
 else {
   res.send({Response:"Error", Message:"Please login first before sending command."});
 }
});
app.post('/api/mkdir',function (req, res) {
       if(ftpLoggedIn==true){
         client.raw.mkd(req.body.directory, function(err, data) {
              if (err) return console.error(err);

              logger.info(data.text); // Show the FTP response text to the user
              logger.info(data.code); // Show the FTP response code to the user

              res.send({Response:"Success", Message:data.text});
          });
       }
       else {
         res.send({Response:"Error", Message:"Please login first before sending command."});
       }
   });
app.post('/api/copy', function (req, res) {
      if(ftpLoggedIn==true){
        var downloadPath= path.join(__dirname,"Temp",path.basename(req.body.from));
        client.get(req.body.from,downloadPath,function(errget){
          if (errget){
             logger.info(errget);
             res.send({Response:"Error", Message:errget});
           }
           else {
             client.put(downloadPath,req.body.to,function(errput){
              if (errput){
                 logger.info(errput);
                 res.send({Response:"Error", Message:errput});
               }
               else {
                 logger.info('File copied successfully!');
                 res.send({Response:"Success", Message:'File copied successfully!'});
               }
             });
           }
         });
     }
     else {
       res.send({Response:"Error", Message:"Please login first before sending command."});
     }
   });
app.post('/api/move', function (req, res) {
  if(ftpLoggedIn==true){
    client.rename(req.body.from,req.body.to,function(err,data){
      if (err){
         logger.info(err);
         res.send({Response:"Error", Message:err});
       }
       else {
         logger.info(data);
         res.send({Response:"Success", Message:data.text});
       }
     });
  }
  else {
    res.send({Response:"Error", Message:"Please login first before sending command."});
  }
});
app.post('/api/checklogin',function(req,res){
  var ftpConfig={
    host: req.body.host,
    port: req.body.port, // defaults to 21
    user: req.body.user, // defaults to "anonymous"
    pass: req.body.pass, // defaults to "@anonymous"
    debugMode: req.body.debugMode
  };
  logger.info("Checking "+ftpConfig.host+" on port "+ftpConfig.port+" with "+ ftpConfig.user+" : "+ftpConfig.pass);

  //checking
  try{
    var client=new JSFtp(ftpConfig);
    client.on('error', function (er) {
      console.error(er.stack);
    });
    client.auth(ftpConfig.user,ftpConfig.pass,function(err, data) {
        if (err){
            console.error(err);
            logger.info("Checking "+ftpConfig.host+" success.");
           res.send({Response:"Error", Message:ftpConfig.host+" FTP Login Unsuccessful."});
         }
         else {
           client.raw.quit(function(err, data) {
              if (err) {
                console.error(err);
                logger.info("Checking "+ftpConfig.host+" success.");
                res.send({Response:"Error", Message:ftpConfig.host+" FTP Login Unsuccessful."});
              }
              else {
                logger.info("Checking "+ftpConfig.host+" success.");
                res.send({Response:"Success", Message:ftpConfig.host+"FTP Login success."});
              }
            });
         }
     });
  }
  catch(err)  {
    res.send({Response:"Error", Message:"Error in checklogin function:: "+ JSON.stringify(err.Message)});
  }
});
app.post('/api/login', function (req, res) {
  client=undefined;
  var ftpConfig={
    host: req.body.host,
    port: req.body.port, // defaults to 21
    user: req.body.user, // defaults to "anonymous"
    pass: req.body.pass, // defaults to "@anonymous"
    debugMode: req.body.debugMode
  };
  logger.info(ftpConfig);
  try
  {
  client=new JSFtp(ftpConfig);
  client.on('error', function (er) {
    console.error(er.stack);
    //res.send({Response:"Error", Message:"client Login Unsuccessful."});
  });
  client.on('jsftp_debug', function(eventType, data) {
    logger.info('DEBUG: ', eventType);
    logger.info(JSON.stringify(data, null, 2));
  });
  //res.send(JSON.stringify(ftpConfig));
  client.auth(ftpConfig.user,ftpConfig.pass,function(err, data) {
      if (err){
        ftpLoggedIn=false;
         logger.info(err);
         res.send({Response:"Error", Message:"FTP Login Unsuccessful."});
         return;
       }
       else {
         ftpLoggedIn=true;
         res.send({Response:"Success", Message:"FTP Login success."});
       }
   });
   }
   catch(err)
   {
     res.send({Response:"Error", Message:err.Message});
   }
});

app.post('/api/listAll', function (req, res) {
  var remotePath =req.body.remotePath|| '.';
  var recursive =req.body.recursive|| false;
  logger.info(remotePath," ", recursive);
  ls(remotePath, { recursive: recursive })
  .then((result) => {
    if (result.isError) {
        res.send({Response:"Error", Message:JSON.stringify(result)});
          logger.info({Response:"Error", Message:JSON.stringify(result)});
      }else {
        res.send({Response:"Success", Message:result});
        logger.info({Response:"Success", Message:result});
      }
  })
});

function ls (remotePath , options) {
  var recursive = _.get(options, 'recursive', true),
         isGlob = /\*/.test(remotePath),
         isSingleFile = path.extname(remotePath),
         folder = isGlob || isSingleFile ? path.dirname(remotePath) : remotePath,
         d = Q.defer();

     client.ls(remotePath, d.makeNodeResolver());

     return d.promise.then((result) => {
       if (result.isError) {
         logger.info(result);
         return Q.reject(result);
       }

       var promise = Q.all(_.map(result, item => {
         item.folder = folder;
         item.path = join(folder, item.name);
         logger.info(item.path);
         item.isDirectory = (item.type === 1);
         // if directory return array of item and all sub-entries
         if (recursive && item.isDirectory && item.userPermissions.read) {
           // TODO: what happens with permissions issues? should we swallow errors?
           let listChild = ls(item.path, recursive);
           return listChild.then(list => [item].concat(list));
         }
         return item;
       })).then(items => _.flatten(items) );

       return promise;
     });
   }

RestAPI.startServer=function(){
  try {
    logger.info("Starting RestAPI Server")
    var port = process.env.PORT || 8000;
    var server = app.listen(port, function () {
      var host = server.address().address
      var port = server.address().port
      logger.info("Rest API server listening at http://%s:%s", host, port)
    })
  } catch (e) {
    logger.info(e);
  } finally {

  }
}

function join(/* path segments */) {
  // Split the inputs into a list of path commands.
  var parts = [];
  for (var i = 0, l = arguments.length; i < l; i++) {
    parts = parts.concat(arguments[i].split("/"));
  }
  // Interpret the path commands to get the new resolved path.
  var newParts = [];
  for (i = 0, l = parts.length; i < l; i++) {
    var part = parts[i];
    // Remove leading and trailing slashes
    // Also remove "." segments
    if (!part) continue;
    //Also removes extra / from last
    if (part==="/" && l==i-1) continue;
    // Interpret ".." to pop the last segment
    if (part === "..") newParts.pop();
    // Push new path segments.
    else newParts.push(part);
  }
  // Preserve the initial slash if there was one.
  if (parts[0] === "") newParts.unshift("");
  // Turn back into a single string path.
  return newParts.join("/") || (newParts.length ? "/" : ".");
}

// A simple function to get the dirname of a path
// Trailing slashes are ignored. Leading slash is preserved.
function dirname(path) {
  return join(path, "..");
}

module.exports = RestAPI;
