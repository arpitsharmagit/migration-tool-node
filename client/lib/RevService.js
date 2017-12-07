migrateApp.factory('RevService', ['$resource', '$http','$q','$rootScope','SearchService',  function ($resource,$http, $q,$rootScope,SearchService) {

        var RevService = {};

        var urlBase = '';

        RevService.init = function (url) {
            urlBase = url;
        };

        RevService.getBaseUrl=function(){
          return urlBase;
        };

        RevService.setToken = function (token) {
            $http.defaults.headers.common.Authorization = "VBrick " + token;
            //console.log($http.defaults.headers.common.Authorization);
        };

        RevService.getVideoStatus= function(videoId){
          return $resource(urlBase+'/api/v1/videos/:videoId/status').get({videoId:videoId}).$promise.then(function(data){return data.status});
        };
        RevService.getUserByUserName= function(username){
          var deferred=$q.defer();
          $resource(urlBase+'/api/v1/users/:username?type=username').get({username:username}).$promise
          .then(function(data){
            deferred.resolve(data.username);
          },function(errResponse){
            deferred.resolve("NotFound");
          });

          return deferred.promise;
        };

        RevService.getAccountId = function (userId) {
            return $resource(urlBase + '/network/users/:userId').get({ userId: userId }).$promise.then(function (data) {
                return data.accountId;
            });
        };

        RevService.getAuthorizationHeader = function () {
            return $http.post(urlBase + '/api/v1/auth', '');
        };

        RevService.getAuthorizationHeader = function () {
            return $http.post(urlBase + '/v1/auth', '');
        };



        RevService.createCategory= function (data) {
            return callRevApi('/api/v1/categories', data, 'POST');
        };

        RevService.getCategories = function () {
            return callRevApi('/api/v1/categories', null,  'GET');
        };

        RevService.createVideoUrl = function(videoUrl){
         return callRevApi('/api/v1/videos', videoUrl, 'POST')
        };

        RevService.getAllVideos= function () {
          var method = '/search/accounts/' + $rootScope.accountId + '/video?count=100000&qf=subtitle_en&scrollId=&sortDirection=asc&sortField=';
            return callRevApi(method, {}, 'GET');
        };

        RevService.getVideoById= function (data) {
          var method = '/api/v1/videos/' + data + '/details'
            return callRevApi(method, {}, 'GET');
        };
         RevService.updateVideoById= function (video) {
          var method = '/api/v1/videos/' + video.id;
            return callRevApi(method, video, 'PUT');
        };
        RevService.getDevices=function(){
          var deferred=$q.defer();
          $http.get(urlBase+'/devices/accounts/'+$rootScope.accountId+'/dmes/status').then(function(response){
              deferred.resolve(response.data.dmes);
              //console.log(response.data.dmes);
          },function(errResponse){
            deferred.reject();
          });
          // SearchService.getDevices({userId: $rootScope.userId,accountId:$rootScope.accountId,sortField:""})
          // .then(function (result) {
          //   if(_.isObject(result) && result.totalHits!==undefined){
          //     if(result.totalHits>0){
          //       var finalDevices=[];
          //       var promises=[];
          //       _.each(result.devices,function(device){
          //         promises.push($resource(urlBase + '/dme/:deviceId/status').get({ deviceId: device.id }).$promise);
          //       });
          //       $q.all(promises).then(function(data) {
          //         var combined = _.map(result.devices, function(device){
          //           return _.extend(device, _.findWhere(data, { id: device.id} ));
          //         });
          //         deferred.resolve(combined);
          //       });
          //     }
          //     else {
          //       deferred.reject();
          //     }
          //   }
          //   else {
          //     deferred.reject("Error in searching devices::");
          //   }
          // }).catch(function (response) {
          //     deferred.reject("SearchDevices Exception");
          // });
          return deferred.promise;
        }
        RevService.SearchVideo = function(query){

          // return $resource(urlBase+'api/v1/videos/search?q=Tags:query&count=10').get({query:query}).$promise.then(function(data){
          //   var deferred=$q.defer();
          //   if(data.videos.length>0){
          //     var video = _.find(data.videos,function(video){ return  _.contains(video.tags,query); });
          //      if(video){
          //        deferred.resolve(video);
          //      }
          //      else {
          //        deferred.reject("Video Not Found yet.");
          //      }
          //   }
          //   return deferred.promise;
          // });
          var deferred=$q.defer();
          SearchService.getVideos({
                query:'Tags"'+query+'"',
                userId: $rootScope.userId,
                accountId:$rootScope.accountId,
                scrollId:'',
                sortDirection:'asc',
                sortField:'_score',
                count: 1
                })
          .then(function (data) {
            if(_.isObject(data) && data.totalHits!==undefined){
                var video = _.find(data.videos,function(video){ return  _.contains(JSON.parse(video.tags),query); });
                if(video){
                  deferred.resolve(video);
                }
                else {
                  deferred.reject("Video Not Found yet.");
                }
            }
            else {
              deferred.reject("Rev Search didn't return any output.");
            }
          },function (response) {
              deferred.reject("SearchVideo Error");
          });
          return deferred.promise;
        };

        RevService.getVideoDetails= function(videoId){
          return $resource(urlBase+'/media/videos/:videoId/edit').get({videoId:videoId}).$promise.then(function(data){
            console.info('Video Details: ', data);
            return data;
          });
        }

        function callRevApi (url, data, type) {
          //var urlBase = 'http://10.10.4.178:12345/api/v1/';
          return $http({
             method: type,
             url: urlBase + url,
             data:  data,
             headers: {
              'Content-Type': 'application/json;charset=utf-8'
              }
          });
       }

        return RevService;
}]);
