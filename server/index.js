'use 6to5';
'use babel';
'use strict';

    var express = require('express'),
    app = express(),
    router = express.Router(),
    bodyParser = require('body-parser'),
    logger = require('./logger'),
    sql = require('mssql'),
    path = require("path"),
    fs = require('fs'),
    JSFtp = require('jsftp'),
    moment = require('moment'),
    Q = require('q'),
    _ = require('lodash'),
    Rev = require('./Rev'),
    MaduroSLL = require('./MaduroSLL'),
    versionConfig=require('../package.json');

    var ftpLoggedIn=false,VemsLoggedIn=false,FileNameThumb='VEMS_THUMBNAIL',FileNameContent='VEMS_CONTENT_LINK';
    var FILEEXTENSIONS = ["PPT",  "PPTX", "DOC", "DOCX", "TXT", "PDF", "XLS", "XLSX", "CSV", "ZIP", "RAR", "7Z","JPG", "PNG", "GIF", "SVG"];
    var configPath=path.resolve('./config.json');
    var vemsSessionID = '';
    var outputDirectory = path.resolve("Contents");
    var TempDirectory=path.resolve("Temp");
    var api={},client,sll , verboseEnabled = true, revUrl, config;
    var appConfig= {
      "debugMode": false,
      "rev": {
        "url": "",
        "username": "",
        "password": ""
      },
      "vems" : {
        "url": "",
        "username": "",
        "password": "",
        "DBServer":"",
        "DBUsername":"",
        "DBPassword":"",
        "ClientIP" : "localhost"
      }
    }

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static(__dirname + '/client'));

    if ( !fs.existsSync( outputDirectory ) ) {
      fs.mkdirSync( outputDirectory );
    }
    if ( !fs.existsSync( TempDirectory ) ) {
      fs.mkdirSync( TempDirectory );
    }

    app.get('/api/config', function (req, res){
      fs.readFile(configPath, 'utf8', function(err, data ) {
        if (err) {
          logger.log('info', 'Error Reading Configuration file '+configPath+' JSON.'+err.message);
          appConfig= {
            "debugMode": false,
            "rev": {
              "url": "",
              "username": "",
              "password": ""
            },
            "vems" : {
              "url": "",
              "username": "",
              "password": "",
              "DBServer":"",
              "DBUsername":"",
              "DBPassword":"",
              "ClientIP" : "localhost"
            }
          }
          res.send(appConfig);
        }
        else {
          try {
            appConfig=JSON.parse(data);
            res.send(appConfig);
          }
          catch (ex) {
            logger.log('info', 'There has been an error parsing '+configPath+' JSON.'+ex);
            res.send("Error: "+err.message);
          }
        }
      });
    });
    app.get('/api/version', function (req, res){
      res.send(versionConfig.version);
    });
    app.post('/api/saveconfig', function (req, res){
      var newConfig = JSON.stringify(req.body);
     logger.log('info', "New Configurations:: "+newConfig);
      fs.writeFile(configPath, JSON.stringify(newConfig), function (err) {
        if (err) {
         logger.log('info', 'There has been an error saving your configuration data. '+err.message);
          res.send("Error: "+err.message);
        }
        else {
          res.send("Success");
        }
      });
    });

    function loadConfig(){
      var configPath=path.resolve('./config.json');
      logger.log('info', "Reading Configuration File from :: "+configPath);
      try {
        var data =fs.readFileSync(configPath);
        appConfig=JSON.parse(data);
          }
      catch (err) {
        logger.log('info', 'Error Reading Configuration file '+configPath+' JSON.'+err.message);
        appConfig=JSON.parse("{debugMode:false}");
      }
      finally{
        //console.log(appConfig);
        return appConfig;
      }
    }

    // create new instance of madurosll


    function saveContentLink (link) {
     logger.log('info', 'downloading file for content link ' +  link.FileName);
      var contentLinkDownloadPromise;
      contentLinkDownloadPromise = sll.downloadContentLink(link.GUID, link.savePath)
      .then(function () {
        logger.log('info', 'DONE: saved content link file for ' + link.FileName);
        return Promise.resolve();
      })
      .catch(function (err) {
        logger.log('info', 'FAIL: unable to download or save content link file for' + link.FileName);
        return Promise.reject(err);

      });
      return contentLinkDownloadPromise;
    }

    function saveContentThumbnail (contentID, savePath, token, videoID) {
      var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  token});

      var deferred = Q.defer();
      logger.log('info', 'getting content thumbnail for: ' + contentID);
      sll.getContentThumbnails(contentID, vemsSessionID)
      .then(function (thumbnail) {
        if(thumbnail){
       logger.log('info', 'Content Thumbnail found Guid is  ' + thumbnail.ResourceGUID);
        logger.log('info', 'downloading thumbnail file... ');
        sll.downloadThumbnail(thumbnail.ResourceGUID, savePath)
        .then(function(){
          logger.log('info', 'DONE: saved thumbnail file to ' + savePath);
          logger.log('info', 'Uploading thumbnail to Rev.....' );
          revManager.uploadThumbnail(videoID, savePath).
          then(function(result){
            if(result == 200){
           logger.log('info', 'DONE: uploaded thumbnail file to Rev.');
            deferred.resolve("Uploading Thumbnail Success.");
            }
            else
            {
              deferred.reject("some internal error occured while uploading thumbnail to Rev.");
            }
          },function(error){
            logger.log('info', 'FAIL: unable to upload  thumbnail file.' +  JSON.stringify(error));
            deferred.reject(JSON.stringify(error));
          })
        },function(error){
          logger.log('info', 'FAIL: unable to download or save thumbnail.' + error);
         deferred.reject(error);
        })
      } else {
         deferred.resolve("No Thumbnail found for the content.");
      }
      },function(error){
        logger.log('info', 'FAIL: error getting content details' + error);
        deferred.reject(error);
      })
      return deferred.promise;

    }

    app.post('/api/vemslogin', function (req, res){
      sll = new MaduroSLL({
      url: req.body.config.vems.url,
      debug: true
    });

    revUrl=req.body.config.rev.url;
    logger.log('info', 'logging into Vems..');
    if(!VemsLoggedIn){
    sll.login(req.body.config.vems.username, req.body.config.vems.password)
      .then(function (sessionID) {

        logger.log('info', "VEMS SESSION ID " + sessionID);
        vemsSessionID = sessionID;
        VemsLoggedIn=true;
        var statusMsg = "logged-in into vems with session ID -" + sessionID;
        return res.send(statusMsg);
      })
      .catch(function (error) {
        VemsLoggedIn=false;
        console.error(error);
        console.warn('FAIL', error.LocalizedMessage || error.message);
        var Msg = "Vems login failed with following error-" + error.message;
        res.send(Msg);
      });
    } else{
      res.send("Already logged-in into Vems.")
    }
    });

     app.post('/api/vemslogout', function (req, res){
    logger.log('info', "logging out from vems...");
    sll.logout()
      .then(function (data) {
        vemsSessionID = '';
        VemsLoggedIn=false;
        logger.log('info', 'logged out from vems');
        var statusMsg = "logged-out from vems";
        return res.send(statusMsg);
      })
      .catch(function (error) {
        console.error(error);
        logger.log('info', error.LocalizedMessage + error.message);
        var Msg = "Vems logout failed with following error-" + error.message;
        res.send(Msg);
      });

    });
    app.post('/api/contentThumbnail', function (req, res) {
     var  outputPath = path.join(outputDirectory, FileNameThumb + "_" + req.body.contentId + ".jpg");
     saveContentThumbnail(req.body.contentId, outputPath, req.body.revToken, req.body.videoID)
      .then(function(data){
        logger.log('info', "Success::"+data);
        res.send("Success::"+data);
      },function (error) {
        logger.log('info', error);
        res.send("Error::"+error);
      });
    });

    app.post('/api/contentLinks', function (req, res) {
      //Setting Express timeout
       res.connection.setTimeout(0);
        var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  req.body.revToken});
        logger.log('info', 'getting content Links for: ' + req.body.contentId);
        sll.getContentLinks(req.body.contentId, vemsSessionID)
         .then(function (data){
           if(data && data.length>0){
             logger.log('info', "got content lniks metadata from vems.Filtering files to remove invalid files for rev...");

             var contentMetaData = filterInvalidRevFiles(data);
             var filteredFiles = _.difference(data, contentMetaData);

             if(filteredFiles && filteredFiles.length > 0){
               logger.log('info', "following files are invalid for rev and won't be uploaded..");
               _.each(filteredFiles, function(file){
                logger.log('info', file.FileName);
               })
             }

             if(contentMetaData && contentMetaData.length > 0){
               ProcessContentLinks(req.body.contentId, contentMetaData).then(function(){
                logger.log('info', "Downloaded actual files for all content links..");
                 revManager.uploadContentLinkedDocs(req.body.videoID, contentMetaData)
                 .then(function(data){
                    if(data == 200){
                    logger.log('info', "uploaded content linked docs to Rev successfully.")
                     res.send("Success:: uploaded content linked docs to Rev successfully.");
                    }
                    else{
                       res.send("Error:: Content linked docs migration failed");
                    }
                 },function(error){
                  logger.log('info', "Content linked docs migration failed with following error" + error);
                   res.send("Error:: Content linked docs migration failed with following error"+ error);
                 });
               },function(error){
                 res.send("Error::"+error)
               })
             } else{
                res.send("Success:::: No valid content links.");
                logger.log('info', "Success:::: No valid content links.");
             }
           }
           else{
             res.send("Success:::: No content links.");
              logger.log('info', "Success:::: No content links.");
           }
         },function(error){
           res.send("Error:: error getting content link metadata.");
         });
    });

    function ProcessContentLinks(contentId, contentLinks){
      var queue = [];
      for (var i = 0; i < contentLinks.length; i++) {
       var arrFile =  contentLinks[i].FileName.split(".");
       var fileName = arrFile[0];
       var fileExtension = arrFile[1];
       contentLinks[i].savePath = path.join(outputDirectory, FileNameContent + "_" + contentId + "_" + fileName + "." + fileExtension);
       if(_.indexOf(FILEEXTENSIONS, fileExtension.toUpperCase()) >= 0){
          queue.push(saveContentLink(contentLinks[i]));
        }
        else{
         logger.log('info', "Linked Doc " +  arrFile + " not imported as it is not a supported format in Rev.")
        }
     }

     return Promise.all(queue);
    }

    app.post('/api/contentComments', function (req, res) {
  var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  req.body.revToken});

     logger.log('info', "Downloading Comments from Vems...");
      sll.getContentComments(req.body.contentId, vemsSessionID)
      .then(function(data){
        if(data.Entities && data.Entities.length>0){
         logger.log('info', "Uploading comments to Rev....");
          var comments=[];
          for(var i = 0; i < data.Entities.length; i++){
            var fullCommentText = "[" + moment(data.Entities[i].TimePosted).toISOString() + "] " + data.Entities[i].UserName + " - "  + data.Entities[i].CommentText;
            comments.push(revManager.uploadContentComment(req.body.videoID, fullCommentText));
          }
          Promise.all(comments).then(function(success){
             logger.log('info', "Content comments migrated successfully");
             res.send("Success::Content comments migrated successfully");
          },function(error){
           logger.log('info', "migration of comments failed with following error " + error);
            res.send("Error::migration of comments failed with following error" + error);
          })
        }
        else {
          res.send("Success:: No Comments for content from VEMS");
         logger.log('info', "Success:: No Comments for content from VEMS");
        }
      },function(error){
        res.send("Error:: Can't get comments from VEMS");
        logger.log('info', "Error:: Can't get comments from VEMS");
      });
});


 app.post('/api/vems-custom-fields', function (req, res) {
  var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  req.body.revToken});

   logger.log('info', "Getting custom fields from Vems...");
    sll.getCustomFields(vemsSessionID)
    .then(function(data){
       logger.log('info', "Vems custom fields fetched successfully.");
        res.send(data.Entities);
    },function(error){
      res.send("Error:: Custom fields get failed.");
      logger.log('info', "Error:: Custom fields get failed.");
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
      logger.log('info', err);
    })
    app.get('/api', function (req, res) {
           res.end(JSON.stringify("APIResponse"));
       });

    app.post('/api/contentUploadDateTime', function (req, res) {

     var revManager = new Rev({"url" : revUrl, "debug" : verboseEnabled, "token" :  req.body.revToken});
     logger.log('info', "Migrating content upload date time from vems to Rev");
     revManager.uploadContentDateTime(req.body.videoID, req.body.userName, req.body.whenUploaded)
     .then(function(result){
      if(result == 200){
        res.send("Success:: Upload date time migarted to rev successfully");
       logger.log('info', "Success:: Upload date time migarted to rev successfully");
      }
      else{
         res.send("Error:: Error occured while uploading content date time to rev.");
      }
     },function(error){
        res.send("Error:: Migration of upload date time failed with following error" + error);
       logger.log('info', "Error:: Migration of upload date time failed with following error" + error);
     });

    });
    app.post('/api/contents', function (req, res) {
        config = {
        user: req.body.config.vems.DBUsername,
        password: req.body.config.vems.DBPassword,
        server: req.body.config.vems.DBServer,
        database: 'maduro',
        options: {
            encrypt: false // Use this if you're on Windows Azure
         }
        };


    var connection = new sql.Connection(config, function(err) {
    logger.log('info', 'Fetching dme content details from Vems');
   logger.log('info', "DME Publishing point - " , req.body.publishingPoint);
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
        //config.server = '10.10.20.23';
        var connection = new sql.Connection(config, function(err) {
         logger.log('info', 'Updating custom fields for the content');
         logger.log('info', "ContentId - " + req.body.ContentID);
         logger.log('info', JSON.stringify(req.body.ContentStatus));
         var request = new sql.Request(connection);
         request.input('ContentId', sql.Int, req.body.ContentID);
         request.input('MigrationStatus', sql.VarChar(50), req.body.ContentStatus.MigrationStatus);
         request.input('RevLocation', sql.VarChar(1000), req.body.ContentStatus.RevContentLocation);
         request.input('VEMSLocation', sql.VarChar(1000), req.body.ContentStatus.VEMSContentPath);
         request.input('RevContentId', sql.VarChar(50), req.body.ContentStatus.RevContentID);
         request.execute('SetContentCustomFields', function(err, recordsets, returnValue){
           if(err == undefined){
            logger.log('info', "Result Value:: " + "Success");
            res.send("success");
            logger.log('info', "content field updated successfully.")
          }else{
           res.send("Error");
           logger.log('info', "error occured while updating content custom field" + err);
         }
        // ...
      });
       });

    connection.on('error', function(err) {
     logger.log('info', "Error Value:: " + err);
     res.send("Error:: error occured while updating content custom field");
    });

    });

    app.post('/api/download',function(req,res){
      if(ftpLoggedIn==true){
        var downloadPath= path.join(TempDirectory,path.basename(req.body.remotePath));
        client.get(req.body.remotePath,downloadPath,function(err){
          if (err){
            logger.log('info', err);
             res.send({Response:"Error", Message:err});
           }
           else {
             logger.log('info', 'File copied successfully!');
             res.send({Response:"Success", Message:'File copied successfully!'});
           }
         });
     }
     else {
       res.send({Response:"Error", Message:"Please login first before sending command."});
     }
    });
    app.post('/api/delete',function(req,res){
      if(ftpLoggedIn){
        var remotefile=req.body.remotePath;
        client.raw.dele(remotefile,function(err){
          if(err) {
              logger.log('info', err);
              res.send({Response:"Error", Message:"Error in deleting file from "+remotefile+" path."});
          }
          else {
           logger.log('info', 'File deleted successfully!');
            res.send({Response:"Success", Message:'File deleted successfully!'});
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
        var localPath= path.join(TempDirectory,path.basename(req.body.remotePath));
        logger.info(localPath);
        //fs.exists(TempDirectory, function (exists) {
          fs.writeFile(localPath, JSON.stringify(req.body.VideoMetaData), function(err) {
          if(err) {
              logger.log('info', err);
              res.send({Response:"Error", Message:"Error in saving file to "+TempDirectory+" folder."});
          }
          else {
            client.put(localPath,req.body.remotePath,function(err){
             if (err){
                logger.log('info', err);
                res.send({Response:"Error", Message:err});
              }
              else {
                logger.log('info', 'File uploaded successfully!');
                res.send({Response:"Success", Message:'File uploaded successfully!'});
              }
            });
          }
        });
      //});
     }
     else {
       res.send({Response:"Error", Message:"Please login first before sending command."});
     }
    });
    app.post('/api/mkdir',function (req, res) {
           if(ftpLoggedIn==true){
             client.raw.mkd(req.body.directory, function(err, data) {
                  if (err) return console.error(err);

                 logger.log('info', data.text); // Show the FTP response text to the user
                  logger.log('info', data.code); // Show the FTP response code to the user

                  res.send({Response:"Success", Message:data.text});
              });
           }
           else {
             res.send({Response:"Error", Message:"Please login first before sending command."});
           }
       });
    app.post('/api/copy', function (req, res) {
          if(ftpLoggedIn==true){
            var downloadPath= path.join(TempDirectory,path.basename(req.body.from));
            client.get(req.body.from,downloadPath,function(errget){
              if (errget){
                 logger.log('info', errget);
                 res.send({Response:"Error", Message:errget});
               }
               else {
                 client.put(downloadPath,req.body.to,function(errput){
                  if (errput){
                    logger.log('info', errput);
                     res.send({Response:"Error", Message:errput});
                   }
                   else {
                     logger.log('info', 'File copied successfully!');
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
             logger.log('info', err);
             res.send({Response:"Error", Message:err});
           }
           else {
             logger.log('info', data);
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
     logger.log('info', "Checking "+ftpConfig.host+" on port "+ftpConfig.port+" with "+ ftpConfig.user+" : "+ftpConfig.pass);

      //checking
      try{
        var client=new JSFtp(ftpConfig);
        client.keepAlive();
        client.on('error', function (err) {
          if(err.code=="ETIMEDOUT"){
             res.send({Response:"Error", Message:ftpConfig.host+" FTP Login Unsuccessful."});
          }
         logger.log('info', err.stack);
        });
        client.auth(ftpConfig.user,ftpConfig.pass,function(err, data) {
            if (err){
                logger.log('info', err);
                logger.log('info', "Checking "+ftpConfig.host+" success.");
               res.send({Response:"Error", Message:ftpConfig.host+" FTP Login Unsuccessful."});
             }
             else {
               client.raw.quit(function(err, data) {
                  if (err) {
                    console.error(err);
                    logger.log('info', "Checking "+ftpConfig.host+" success.");
                    res.send({Response:"Error", Message:ftpConfig.host+" FTP Login Unsuccessful."});
                  }
                  else {
                    logger.log('info', "Checking "+ftpConfig.host+" success.");
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
    app.post('/api/log',function(req, res) {
      var message=req.body.message;
       logger.log(message.type,message.data)
       res.send(message.type+" :: "+message.data);
    });
    app.post('/api/ftplogin', function (req, res) {
      client=undefined;
      var ftpConfig={
        host: req.body.host,
        port: req.body.port, // defaults to 21
        user: req.body.user, // defaults to "anonymous"
        pass: req.body.pass, // defaults to "@anonymous"
        debugMode: req.body.debugMode
      };
      logger.log('info', ftpConfig);
      try
      {
      client=new JSFtp(ftpConfig);
      client.on('error', function (er) {
       logger.log('info', er.stack);
        //res.send({Response:"Error", Message:"client Login Unsuccessful."});
      });
      client.on('jsftp_debug', function(eventType, data) {
        logger.log('info', 'DEBUG: ' + eventType);
       logger.log('info', JSON.stringify(data, null, 2));
      });
      //res.send(JSON.stringify(ftpConfig));
      client.auth(ftpConfig.user,ftpConfig.pass,function(err, data) {
          if (err){
            ftpLoggedIn=false;
             logger.log('info', err);
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
      logger.log('info', remotePath + " " + recursive);
      ls(remotePath, { recursive: recursive })
      .then((result) => {
        if (result.isError) {
            res.send({Response:"Error", Message:JSON.stringify(result)});
              logger.log('info',JSON.stringify(result));
          }else {
            res.send({Response:"Success", Message:result});
           //logger.log('info', result);
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
             logger.log('info', result);
             return Q.reject(result);
           }

           var promise = Q.all(_.map(result, item => {
             item.folder = folder;
             item.path = join(folder, item.name);
            logger.log('info', item.path);
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

    api.start=function(){
      try {
       logger.log('info', "Starting RestAPI Server");
        var port = process.env.PORT || 8000;
        var server = app.listen(port, function () {
          var host = server.address().address
          var port = server.address().port
          logger.log('info', "Rest API server listening at http" + host + port);
        })
      } catch (e) {
        logger.log('info', e);
      } finally {

      }
    }
    api.loadConfig=function(){
      return appConfig;
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
    loadConfig();

module.exports= api;

// if (!module.parent) {
//   api.start();
// }
