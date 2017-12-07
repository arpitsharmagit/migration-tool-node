
var request = require('request'),
    fs = require('fs'),
    _ = require('lodash');

// constant, always this value
var VEMS_APPLICATIONID = '0ffb13f8-11ce-46b5-aa41-5b2703013086';

function MaduroSLL (options) {

  // if options is string just treat as the URL
    if (options.toString() === options) {
      options = {
        url: options,
        debug: false
      };
  }
  this.baseURL = options.url + '/madurosll/madurosll.svc/json/';
  this.config = {
    userAgent: options.userAgent || 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)'
  };
  this.sessionID = null;
  this.userID = null;

  // set to true to show all HTTP requests
  this._debug = (options.debug !== undefined) ? options.debug : false;
};

MaduroSLL.prototype.invoke = function (methodName, postData) {
  var self = this,
      requestOptions = {
        uri: this.baseURL + methodName,
        body: postData || {},
        json: true,
        // emulating IE 10 (VEMS has content rules according to what the browser is)
        headers: { 'User-Agent': this.config.userAgent }
      };

  return new Promise(function (fulfill, reject) {
    // use request library to make a POST request with provided arguments
    request.post(requestOptions, function (error, request, body) {

      // detect error on HTTP request
      if (error) {
        self._debug && console.error("VEMS ERROR RESPONSE: ", error);
        // optionally provide better messages here?
        return reject(error);
      }

      if (!body || !body.d) {
        self._debug && console.error("VEMS ERROR RESPONSE: " + request.statusCode + " " + request.statusMessage);
        return reject(request.statusCode + " " + request.statusMessage);
      }

      self._debug && console.log("VEMS RESPONSE: ", body.d);

      // detect VEMS-level error
      if (body.d.Exception) {
        return reject(body.d.Exception);
      }

      // return json response
      return fulfill(body.d);

    });
  });
};

MaduroSLL.prototype.login = function (username, password) {
  var self = this,
      methodName = 'UserLogin',
      postData = {
        'userName': username,
        'password': password,
        'applicationID': VEMS_APPLICATIONID, // always this value
        'clientIP': null,
        'userLanguage': null
      };
  return this.invoke(methodName, postData)
    .then(function (response) {
      // store sessionID for later
      self.sessionID = response.SessionID;
      self.userID = response.UserID;
      self.clientIP = response.ClientIP;

      return self.sessionID;
    })
    .catch(function (err) {
      // pass on, or manipulate further here
      self._debug && console.error('Error in login', err);
      return Promise.reject(err);
    });
};

MaduroSLL.prototype.logout = function () {
  var self = this,
      methodName = 'UserLogout',
      postBody = {
        sessionID: this.sessionID
      };

  return this.invoke(methodName, postBody)
    .then(function (response) {
      self.sessionID = null;
      self.userID = null;
      self.clientIP = null;
    })
    .catch(function (err) {
      self._debug && console.error('Error in logout', err);
      return Promise.reject(err);
    });
};

MaduroSLL.prototype.getContentThumbnails = function (contentID, vemsID, allowUnfiltered) {
  var self = this,
  defaultAllow = true,
  methodName = 'ContentThumbnailGetAllByContent',
  postBody = {
    contentID: contentID,
    sessionID: vemsID
  };

  return this.invoke(methodName, postBody)
  .then(function (response) {
    var activeThumbnail =  _.filter(response.Entities, function(thumb){
     return thumb.IsActive;
   });

    if(activeThumbnail && activeThumbnail.length > 0)
    {
      return _.first(activeThumbnail);
    } else {
      return null;
    }
  })
  .catch(function (err) {
    self._debug && console.error('Error retrieving content Thumbnails', err);
    return Promise.reject(err);
  });
};

MaduroSLL.prototype.getContentLinks = function (contentID, vemsID) {
  var self = this,
  defaultAllow = true,
  methodName = 'ContentLinksGet',
  postBody = {
    contentID: contentID,
    sessionID: vemsID
  };

  return this.invoke(methodName, postBody)
  .then(function (response) {
    return _.map(response.Entities, function(link){
     return  {"ContentID" : link.ContentID, "FileTitle" : link.FriendlyFileName, "FileName" : link.RealFileName, "GUID" : link.VBRowVersion};
   });
  })
  .catch(function (err) {
    self._debug && console.error('Error retrieving content Links', err);
    return Promise.reject(err);
  });
};



MaduroSLL.prototype.getActiveTheme = function () {
  var methodName = 'ThemeGetActive',
      postBody = { applicationID: VEMS_APPLICATIONID };

  return this.invoke(methodName, postBody)
    .then(function (response) {
      return response.ThemeID;
    });
};

MaduroSLL.prototype.getDefaultThumbnailGUID = function (themeID) {
  var methodName = 'ThemeGetDefaultThumbnailGUIDByID',
      postBody = {
        themeID: themeID,
        sessionID: this.sessionID
      };

  return this.invoke(methodName, postBody)
    .then(function (response) {
      return response.ReturnValue;
    });
};

// NOTE: raw command - returns a raw request object
// this allows you to pipe to file system or to an upload HTTP stream
MaduroSLL.prototype.openThumbnailStream = function (thumbnailGUID) {
  var requestOptions = {
    uri: this.baseURL + 'GetThumbnailResourceObject',
    qs: {
      fileUID: thumbnailGUID
    },
    headers: { 'User-Agent': this.config.userAgent }
  };

  return request.get(requestOptions);
};

MaduroSLL.prototype.downloadThumbnail = function (thumbnailGUID, outputPath) {
  var self = this;

  return new Promise(function (fulfill, reject) {
    var req = self.openThumbnailStream.call(self, thumbnailGUID),
        pipe = req.pipe(fs.createWriteStream(outputPath));

    pipe
      .on('finish', fulfill)
      .on('error', reject);

  });
};

MaduroSLL.prototype.openContentLinkStream = function (contentLinkGUID) {
  var requestOptions = {
    uri: this.baseURL + 'GetResourceObject',
    qs: {
      fileUID: contentLinkGUID
    },
    headers: { 'User-Agent': this.config.userAgent }
  };

  return request.get(requestOptions);
};

MaduroSLL.prototype.downloadContentLink = function (contentLinkGUID, outputPath) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var req = self.openContentLinkStream.call(self, contentLinkGUID),
        pipe = req.pipe(fs.createWriteStream(outputPath));
    pipe
      .on('finish', fulfill)
      .on('error', reject);

  });
};

MaduroSLL.prototype.getContentComments = function (contentID, vemsID) {
  var self = this,
  defaultAllow = true,
  methodName = 'ContentCommentsGet',
  postBody = {"contentID":contentID
  ,"commentPage":1
  ,"commentCount":32000
  ,"sessionID":vemsID
  };

  return this.invoke(methodName, postBody);
  };

  MaduroSLL.prototype.getCustomFields = function (vemsID) {
  var self = this,
  defaultAllow = true,
  methodName = 'CustomFieldsGet',
  postBody = {
  "sessionID":vemsID
  };

  return this.invoke(methodName, postBody);
  };

module.exports = MaduroSLL;
