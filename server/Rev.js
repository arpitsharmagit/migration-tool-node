var request = require('request'),
	formData = require('form-data'),
    fs = require('fs');

function Rev(options){

	this.token = options.token;
	this.baseURL = options.url;
  this.config = {
    userAgent: options.userAgent || 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)'
  };

  // set to true to show all HTTP requests
  this._debug = (options.debug !== undefined) ? options.debug : false;
};

Rev.prototype.invoke = function (methodName, inputData) {

  var dataToPost = {
    // this is important to JSON.stringify the content here otherwise formData would through error - source.on is no a function
    "SupplementalFiles" : JSON.stringify(inputData.SupplementalFiles)
  };

  dataToPost.Files = [];

  for (var i = 0; i < inputData.Files.length ; i++) {
    dataToPost.Files.push(fs.createReadStream(inputData.Files[i]));
  }
 var self = this,
 requestOptions = {
    uri: self.baseURL + methodName,
    formData : dataToPost,
    json : true,
        // emulating IE 10 (VEMS has content rules according to what the browser is)
    headers: { 'User-Agent': this.config.userAgent, 'Authorization' : 'Vbrick ' + self.token}
  };

  return new Promise(function (fulfill, reject) {
    // use request library to make a POST request with provided arguments
    request.post(requestOptions, function (error, request, body) {
      // detect error on HTTP request
      if (error) {
        self._debug  && console.error("REV ERROR RESPONSE: ", error);
        // optionally provide better messages here?
        return reject(error);
      }

      self._debug  && console.log("REV RESPONSE:" ,request.statusCode,request.statusMessage, methodName, inputData);

      // return json response
      return fulfill(request.statusCode);
    });
  });
};

Rev.prototype.uploadThumbnail = function (videoId, filepath) {
	var method = '/api/uploads/images/' + videoId;
	var self = this;

	var formData = {};

  formData.Files = [];
  formData.Files.push(filepath);
  formData.SupplementalFiles = {};
  return this.invoke(method, formData)
  .then(function (response) {
    return response;
  })
	.catch(function (err) {
      // pass on, or manipulate further here
      self._debug && console.error('Error in uploading Thumbnail file', err);
      return Promise.reject(err);
  });
};

Rev.prototype.uploadContentLinkedDocs = function (videoId, fileDetails) {
  var method = '/api/uploads/supplemental-files/' + videoId;
  var self = this;
  var formData = {};
  formData.SupplementalFiles = {};
  formData.SupplementalFiles.files = [];
  formData.Files = [];

  for (var i = 0; i < fileDetails.length ; i++) {
     formData.SupplementalFiles.files.push({"FileName": fileDetails[i].FileTitle})
     formData.Files.push(fileDetails[i].savePath);
  }


  return this.invoke(method, formData);
  // .then(function (response) {
  //   return Promise.resolve(response);
  // })
  // .catch(function (err) {
  //     // pass on, or manipulate further here
  //     self._debug && console.error('Error in uploading content linked files', err);
  //     return Promise.reject(err);
  // });
};

Rev.prototype.uploadContentComment = function (videoId, comment) {
 var method ='/api/v1/videos/' + videoId + '/comment';
 var self = this;
 requestOptions = {
  uri: self.baseURL + method,
  formData : {"Comment" : comment},
  json : true,
        // emulating IE 10 (VEMS has content rules according to what the browser is)
        headers: { 'User-Agent': this.config.userAgent, 'Authorization' : 'Vbrick ' + self.token}
      };
      return new Promise(function (fulfill, reject) {
        request.put(requestOptions, function(error, response, body){
          // detect error on HTTP request
 if (error) {
  self._debug && console.error("REVC COMMENT ERROR RESPONSE: ", error);
        // optionally provide better messages here?
        return reject(error);
      }

       self._debug  && console.log("REV COMMENT RESPONSE:" , response.statusCode);

      // return json response
      return fulfill(response.statusCode);

    });
      });
    };

Rev.prototype.uploadContentDateTime = function (videoId, userName, whenUploaded) {
 var method ='/api/v1/videos/' + videoId + '/migration';
 var self = this;
 requestOptions = {
  uri: self.baseURL + method,
  formData : {"UserName" : userName, "whenUploaded" : whenUploaded},
  json : true,
        // emulating IE 10 (VEMS has content rules according to what the browser is)
        headers: { 'User-Agent': this.config.userAgent, 'Authorization' : 'Vbrick ' + self.token}
      };
      return new Promise(function (fulfill, reject) {
        request.put(requestOptions, function(error, response, body){
          // detect error on HTTP request
 if (error) {
  self._debug && console.error("REV DATE ERROR RESPONSE: ", error);
        // optionally provide better messages here?
        return reject(error);
      }

      self._debug  && console.log("REV DATE RESPONSE:" , response.statusCode, response.statusMessage);

      // return json response
      return fulfill(response.statusCode);

    });
      });
    };
module.exports = Rev;
