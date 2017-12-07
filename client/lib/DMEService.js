'use strict';
angular.module('migrateApp')
.factory('DMEService',  ['$http','$q',function($http,$q){
 var BaseAddress='http://localhost:8000';
return {
  CheckLogin:function(ftpConfig){
    var deferred=$q.defer();
    $http.post(BaseAddress+ '/api/checklogin', ftpConfig).then(function(response){
      if(response.data.Response=="Success"){
        deferred.resolve(response.data);
      }else {
        deferred.reject(response.data);
      }
    }, function(response){
      deferred.reject(response);
    });
    return deferred.promise;
  },
    Login:function(ftpConfig){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/ftplogin', ftpConfig).then(function(response){
        if(response.data.Response=="Success"){
          deferred.resolve(response.data);
        }else {
          deferred.reject(response.data);
        }
      }, function(response){
        deferred.reject(response);
      });
      return deferred.promise;
    },
    MakeDir:function(directory){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/mkdir', {directory:directory}).then(function(response){
        if(response.data.Response=="Success"){
          deferred.resolve(response.data);
        }else {
          deferred.reject(response.data);
        }
      }, function(response){
        deferred.reject(response);
      });
      return deferred.promise;
    },
    CopyFile:function(from,to){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/copy', {from:from,to:to}).then(function(response){
        if(response.data.Response=="Success"){
          deferred.resolve(response.data);
        }else {
          deferred.reject(response.data);
        }
      }, function(response){
        deferred.reject(response);
      });
      return deferred.promise;
    },
    MoveFile:function(from,to){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/move', {from:from,to:to}).then(function(response){
        if(response.data.Response=="Success"){
          deferred.resolve(response.data);
        }else {
          deferred.reject(response.data);
        }
      }, function(response){
        deferred.reject(response);
      });
      return deferred.promise;
    },
    DeleteFile:function(remotePath){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/delete', {remotePath:remotePath}).then(function(response){
        if(response.data.Response=="Success"){
          deferred.resolve(response.data);
        }else {
          deferred.reject(response.data);
        }
      }, function(response){
        deferred.reject(response);
      });
      return deferred.promise;
    },
    UploadFile:function(remotePath, metaData){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/upload', {remotePath:remotePath,VideoMetaData:metaData}).then(function(response){
        if(response.data.Response=="Success"){
          deferred.resolve(response.data);
        }else {
          deferred.reject(response.data);
        }
      }, function(response){
        deferred.reject(response);
      });
      return deferred.promise;
    },
    ListDirectory:function(remotePath, recursive){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/listAll', {remotePath:remotePath,recursive:recursive}).then(function(response){
        if(response.data.Response=="Success"){
          deferred.resolve(response.data.Message);
        }else {
          deferred.reject(response.data);
        }
      }, function(response){
        deferred.reject(response);
      });
      return deferred.promise;
    },
    Log:function(type,message){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/log', {message:{type:type,data:message}}).then(function(response){
          deferred.resolve(response.data);
      }, function(response){
        deferred.reject(response.data);
      });
      return deferred.promise;
    },
    GetVersion:function(){
      var deferred=$q.defer();
      $http.get(BaseAddress+ '/api/version').then(function(response){
          deferred.resolve(response.data);
      }, function(response){
        deferred.reject(response.data);
      });
      return deferred.promise;
    },
    GetConfig:function(){
      var deferred=$q.defer();
      $http.get(BaseAddress+ '/api/config').then(function(response){
          deferred.resolve(response.data);
      }, function(response){
        deferred.reject(response.data);
      });
      return deferred.promise;
    },
    SetConfig:function(config){
      var deferred=$q.defer();
      $http.post(BaseAddress+ '/api/saveconfig',config).then(function(response){
          deferred.resolve(response.data);
      }, function(response){
        deferred.reject(response.data);
      });
      return deferred.promise;
    }
}
}]);
