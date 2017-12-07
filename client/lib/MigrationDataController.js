migrateApp.controller('MigrationDataController', ['$scope', '$rootScope', '$window','MaduroSllService', 'RevService', 'VemsService', 'LoggedUserContext','$q',
  function ($scope, $rootScope, $window, MaduroSllService, RevService, VemsService, UserContext, $q) {
      var _ = $window._,
      Q = $window.Q,
      PROMISE_TIMEOUT = 30000;
      var currArrayElement = 0;
      $scope.vbCategoryList = new Array();

      var parentNode;
      $scope.rootNode = [];
      $scope.liveMsg = '';
      $scope.storedMsg = '';
      $scope.categoriesCount = 0;
      $scope.categoriesSuccessCount = 0;
      $scope.categoriesErrorCount = 0;

      $scope.liveUrlCount = 0;
      $scope.liveUrlSuccessCount = 0;
      $scope.liveUrlErrorCount = 0;

      $scope.storedUrlCount = 0;
      $scope.storedUrlSuccessCount = 0;
      $scope.storedUrlErrorCount = 0;

      $scope.cleanupCount = 0;
      $scope.cleanupSuccessCount = 0;
      $scope.cleanupErrorCount = 0;
      $scope.cleanupMigrationLog = [];
      $scope.categoriesLog=[];
      $scope.liveURLLog=[];
      $scope.storedURLLog=[];
      $scope.User = UserContext.getUser();
      $rootScope.VemsSessionId = UserContext.GetVemsSessionId();
      $scope.server = UserContext.GetServerDetails();
      $scope.CategoryMappings = [];
      var contentCustomFieldsResult = {};

      $q.all(GetVemsData());

      $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
          if(fn && (typeof(fn) === 'function')) {
            fn();
          }
        } else {
          this.$apply(fn);
        }
      };
      $scope.DownloadCatLog=function(){
        var csvContent = "data:text/csv;charset=utf-8,";
        $scope.categoriesLog.forEach(function(infoArray, index){
           var dataString = infoArray.Status+" :: Message="+ infoArray.Message ;
           csvContent += index < $scope.categoriesLog.length ? dataString+ "\n" : dataString;
        });
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        var today=new Date();
        var printDate=(today.getMonth()+1) + '-' + today.getDate() + '-' + today.getYear();
        link.setAttribute("download", "CategoryImportLog"+printDate+".csv");
        link.click();
      }
      $scope.DownloadliveLog=function(){
        var csvContent = "data:text/csv;charset=utf-8,";
        $scope.liveURLLog.forEach(function(infoArray, index){
           var dataString = infoArray.Status+" :: Message="+ infoArray.Message ;
           csvContent += index < $scope.liveURLLog.length ? dataString+ "\n" : dataString;
        });
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        var today=new Date();
        var printDate=(today.getMonth()+1) + '-' + today.getDate() + '-' + today.getYear();
        link.setAttribute("download", "LiveURLImportLog"+printDate+".csv");
        link.click();
      }
      $scope.DownloadstoredLog=function(){
        var csvContent = "data:text/csv;charset=utf-8,";
        $scope.storedURLLog.forEach(function(infoArray, index){
           var dataString = infoArray.Status+" :: Message="+ infoArray.Message ;
           csvContent += index < $scope.storedURLLog.length ? dataString+ "\n" : dataString;
        });
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        var today=new Date();
        var printDate=(today.getMonth()+1) + '-' + today.getDate() + '-' + today.getYear();
        link.setAttribute("download", "StoredURLImportLog"+printDate+".csv");
        link.click();
      }
      $scope.importCategories = function(){
         $scope.msg = "";
        $scope.categorystatus ={processing: true, completed : false};
        _.each($scope.rootNode, function(cat){
           createCategory(cat, null)
         });
         function createCategory (category, parentId) {
            $scope.categoriesCount++;
            RevService.createCategory({name : category.name, parentCategoryId: parentId})
              .then(function (result){
                     var parentCategoryId = result.data.categoryId;

                     console.log("category imported- ", category.name);
                     categorylog("Success","category imported - "+ category.name);
                     $scope.categoriesSuccessCount++;
                     if(category.children)
                      {
                     _.each(category.children, function(child){
                        createCategory(child, parentCategoryId);
                      });

                     if($scope.categoriesCount == ($scope.categoriesSuccessCount + $scope.categoriesErrorCount))
                     {
                      if($scope.categoriesErrorCount > 0)
                      {
                        $scope.msg = "Categories imported succesfully but some failed. Please see console log for details";
                         $scope.categoriesSuccessCount = 0;
                        $scope.categoriesErrorCount = 0;
                         $scope.categoriesCount = 0;
                      }
                      else
                      {
                        $scope.msg = "Categories imported succesfully";
                         $scope.categoriesSuccessCount = 0;
                        $scope.categoriesErrorCount = 0;
                         $scope.categoriesCount = 0;

                      }
                      $scope.categorystatus.processing = false;
                       $scope.categorystatus.completed = true;
                      MapCategories();
                     }
                    }
                  },
                function(error){
                  $scope.categoriesErrorCount++;
                  //console.log('Category already Exists n Rev - ' , error.data.detail, ' ', category.name);
                  categorylog("Error",'Category already exists in Rev - ' + error.data.detail+ ' '+ category.name);
                  if($scope.categoriesCount == ($scope.categoriesSuccessCount + $scope.categoriesErrorCount))
                   {
                      if($scope.categoriesSuccessCount > 0)
                      {
                        $scope.msg = "Categories imported succesfully but some failed. Please see console log for details";
                        $scope.categoriesSuccessCount = 0;
                        $scope.categoriesErrorCount = 0;
                        $scope.categoriesCount = 0;
                      }
                      else
                      {
                        $scope.msg = "Error occured while importing categories.See log for details.";
                        $scope.categoriesSuccessCount = 0;
                        $scope.categoriesErrorCount = 0;
                         $scope.categoriesCount = 0;
                      }
                       $scope.categorystatus.processing = false;
                        $scope.categorystatus.completed = true;
                      MapCategories();
                   }
                });
              }
          };

          $scope.importLiveUrl = function(){

            $scope.liveMsg = "";
            if(!$scope.liveUrl || $scope.liveUrl.length == 0){
              alert("No live url to import.");
              livelog("Error","No live url to import.");
                return;
            }
            $scope.liveUrlStatus ={processing: true, completed:false};
            _.each($scope.liveUrl, function(linkUrl){
              $scope.liveUrlCount++;

              var linklCats = [];
              for(index =0; index < linkUrl.Categories.length; index++)
              {
                var category = _.where($scope.CategoryMappings, {"vemsId" : linkUrl.Categories[index].CategoryID})
                if(category.length > 0)
                {
                  linklCats.push(category[0].revId);
                }

              }
              var datalinkedUrl = {
                linkedUrl : {
                  "url" : linkUrl.ContentInstances[0].URL,
                  "encodingType" : linkUrl.ContentInstances[0].EnumEncodingTypeValue,
                  "type" : "Live"
                },
                categoryIds : linklCats,
                title : linkUrl.Title,
                uploader : $scope.User.username,
                IsActive:"True"
              };

              RevService.createVideoUrl(datalinkedUrl).then(function(result){
                $scope.liveUrlSuccessCount++;
                //console.log("live Url created successfully - " + result.data.videoId);
                livelog("Success","live Url created successfully - " + result.data.videoId);
                if($scope.liveUrlCount == ($scope.liveUrlSuccessCount + $scope.liveUrlErrorCount))
                 {
                  if($scope.liveUrlErrorCount > 0)
                  {
                    $scope.liveMsg = "Live Urls import completed but some failed. Please see console log for details";
                  }
                  else
                  {
                    $scope.liveMsg = "Live Urls imported succesfully";
                  }
                  $scope.liveUrlStatus.processing = false;
                  $scope.liveUrlStatus.completed = true;
                 }
              },
              function(error){
                //console.log('Error importing Live Url - ' + JSON.stringify(error));
                livelog("Error",'Error importing Live Url - ' + JSON.stringify(error));

                $scope.liveUrlErrorCount++;

                 if($scope.liveUrlCount == ($scope.liveUrlSuccessCount + $scope.liveUrlErrorCount))
                 {
                  if($scope.liveUrlSuccessCount > 0)
                  {
                    $scope.liveMsg = "Live Urls import completed but some failed. Please see console log for details";
                  }
                  else
                  {
                    $scope.liveMsg = "Error occured while importing Live Urls. Please see console log for details";

                  }
                  $scope.liveUrlStatus.processing = false;
                  $scope.liveUrlStatus.completed = true;
                 }

              });
            });
          };

          $scope.importStoredUrl = function(){
           $scope.storedMsg = "";
            if(!$scope.storedUrl || $scope.storedUrl.length == 0){
              alert("No stored url to import.");
              storedlog("Error","No stored url to import.");
                return;
            }
             $scope.storedUrlStatus ={processing: true, completed : false};
            _.each($scope.storedUrl, function(stdUrl){
                $scope.storedUrlCount++;
              var storedCats = [];
              for(i =0; i < stdUrl.Categories.length; i++)
              {
                var category = _.where($scope.CategoryMappings, {"vemsId" : stdUrl.Categories[i].CategoryID})
                if(category.length > 0)
                {
                  storedCats.push(category[0].revId);
                }
              }
              var dataStoredUrl = {
                linkedUrl : {
                            "url" : stdUrl.ContentInstances[0].URL,
                            "encodingType" : stdUrl.ContentInstances[0].EnumEncodingTypeValue,
                            "type" : "Vod"
                            },
                categoryIds : storedCats,
                title : stdUrl.Title,
                uploader : $scope.User.username,
                IsActive: "True"
              };
              RevService.createVideoUrl(dataStoredUrl).then(function(result){
                $scope.storedUrlSuccessCount++;
                //console.log("Stored Url created successfully - " + result.data.videoId);
                storedlog("Success","Stored Url created successfully - " + result.data.videoId);
                if($scope.storedUrlCount == ($scope.storedUrlSuccessCount + $scope.storedUrlErrorCount))
                 {
                  if($scope.storedUrlErrorCount > 0)
                  {
                    $scope.storedMsg = "Stored Urls import completed but some failed. Please see console log for details";
                  }
                  else
                  {
                    $scope.storedMsg = "Stored Urls imported succesfully";
                  }
                  $scope.storedUrlStatus.processing = false;
                   $scope.storedUrlStatus.completed = true;
                 }
              },
              function(error){
               //('Error importing Stored Url - ' + JSON.stringify(error));
               storedlog("Error",'Error importing Stored Url - ' + JSON.stringify(error));
                $scope.storedUrlErrorCount++;

                 if($scope.storedUrlCount == ($scope.storedUrlSuccessCount + $scope.storedUrlErrorCount))
                 {
                  if($scope.storedUrlSuccessCount > 0)
                  {
                    $scope.storedMsg = "Stored Urls import completed but some failed. Please see console log for details";
                  }
                  else
                  {
                    $scope.storedMsg = "Error occured while importing Stored Urls. Please see console log for details";
                  }
                  $scope.storedUrlStatus.processing = false;
                   $scope.storedUrlStatus.completed = true;
                 }

              });
            });
          };

      function CategoriesGetAllOnSuccess(result) {
       		//RESULT IS A VBLIST OBJECT
      		//store category paths in a string array with the fullpath
      		var categories = result.Entities;
      		$.each(categories, function () {
      			$scope.vbCategoryList.push({ id: this.CategoryID, name: this.Name, path: this.CategoryFullPath, parentId: this.ParentCategoryID });
      		});

          var sorterCategories = SortCategories('*!@_.()#^&%-=+01234567989abcdefghijklmnopqrstuvwxyz');

          $scope.vbCategoryList.sort(sorterCategories);

          if ($scope.vbCategoryList.length > 0) {
           var firstElement = $scope.vbCategoryList[currArrayElement];
           BuildTree(firstElement);
           MapCategories();
           $scope.$apply();
         }
       }

      function MapCategories () {
        RevService.getCategories()
            .then(function(result){
              $scope.RevCategories = result.data.categories;

              _.each(result.data.categories, function (category) {
                var vemsCategory = _.where($scope.vbCategoryList, {"path" : category.fullPath});
                if(vemsCategory.length > 0)
                {
                  $scope.CategoryMappings.push({'vemsId' : vemsCategory[0].id, 'revId': category.categoryId});
                }
              })
              }, function(error){

          });
      }

      //Tree Building functions
      function BuildTree(obj) {
           if (obj) {
            var categoryPath = obj.path;
            var tokens = categoryPath.split("/");
            for (var i = 0; i < tokens.length; i++) {
             if (i == 0) {
              parentNode = $scope.rootNode;
              FindCreateNode(parentNode, tokens[i], obj);
            }
            else {
              FindCreateNode(parentNode, tokens[i], obj);
            }
          }
          currArrayElement++;
          BuildTree($scope.vbCategoryList[currArrayElement]);
        }
      }

      function FindCreateNode(context, node, obj) {
           var foundNode = false;
           if(context.children)
           {
            _.forEach(context.children, function (child) {
              if(child.name == node)
              {
                parentNode = child;
                foundNode = true;
                return false;
              }
            });
          }
          else {
            _.forEach($scope.rootNode, function (child) {
              if(child.name == node)
              {
                parentNode = child;
                foundNode = true;
                return false;
              }
            });
        }
        if (foundNode)
        {
          return;
        }

        if(obj.parentId)
        {
          parentNode.children.push({"name": node, "path" :obj.path, 'id': obj.id, "parentID":obj.parentId, "children" : new Array()});
        }
        else {
          parentNode.push({"name": node, "path" :obj.path, "id": obj.id, "parentID":null, "children" : new Array()});
        }
      }

      //used to sort the object by Path
      function SortCategories(alphabet) {
        return function (a, b) {
          a = a.path.toLowerCase();
          b = b.path.toLowerCase();
          var index_a = alphabet.indexOf(a[0]),
          index_b = alphabet.indexOf(b[0]);

          if (index_a === index_b) {
              // same first character, sort regular
              if (a < b) {
               return -1;
             } else if (a > b) {
               return 1;
             }
             return 0;
           } else {
            return index_a - index_b;
          }
        }
      }

      function CreateSessionCookie(name, value) {
          document.cookie = name + "=" + value + "; path=/";
      }

      function GetVemsData() {

         MaduroSllService.CategoriesGetAll($scope.VemsSessionId, CategoriesGetAllOnSuccess);
         MaduroSllService.EnteredURLContentGetAll(4, $scope.VemsSessionId, livedURLGetAllOnSuccess);
         MaduroSllService.EnteredURLContentGetAll(3, $scope.VemsSessionId, storedURLGetAllOnSuccess);

         //VemsService.getDMEContent('/contents', {'publishingPoint' :15}).then(successHandler, errorHandler);
      }

      function livedURLGetAllOnSuccess(result){
        $scope.liveUrl = result.Entities;
      }

      function storedURLGetAllOnSuccess(result){
        $scope.storedUrl = result.Entities;
       }


/*-------------------------------------------DME Content------------------------------------------------------*/


    $scope.getDMEContent = function(){
      console.log($scope.SelectedDME);
    }

    function contentCustomFieldUpdateSuccessHandler(result){
      console.log("Content custom Field updated successfully.", result.data);
    }

    function contentCustomFieldUpdateErrorHandler(result){
      console.log("Error occured while updating content custom field.")
       console.log(JSON.stringify(result));
       $scope.dmeContentStatus.processing = false;
     }
/*-----------------------------------------------------Cleanup-------------------------------------------------------*/


$scope.StartCleanup = function(){

  if(confirm('This cleanup process is irreversible.  Do not start this process until all video content migration has been completed and verified.  Continue?')){
     $scope.cleanupStatus ={processing: true, completed : false};
    RevService.getAllVideos()
    .then(function(result){
      if(result.data.hits && result.data.hits.length > 0){
          console.log("Got List of videos for Cleanup.Total " , result.data.hits.length, "videos found for cleanup. Going to process for each video now...");
          cleanupLog("Success", "Got List of videos for Cleanup.Total " + result.data.hits.length +  " videos found for cleanup. Going to process for each video now...");

          _.each(result.data.hits, function(video){
            UpdateVideoTag(video.id);
          });
      }
      else{
        console.log("No video found for cleanup.");
        cleanupLog("Error", "No video found for cleanup.");
    }
  }, function(error){
        console.log("Getting all videos failed with following error", error);
        cleanupLog("Error", "Getting all videos failed with following error" + error);
              });
          }
}

function cleanupLog(status, Message){
  var statusMsg={
    logDate : getDateTime(),
    Status : status,
    Message:Message};
  $scope.cleanupMigrationLog.push(statusMsg);
}
function categorylog(Status,Message){
  var statusMsg={
    TimeStamp:getDateTime(),
    Status:Status,
    Message:Message};
  $scope.categoriesLog.push(statusMsg);
}
function livelog(Status,Message){
  var statusMsg={
    TimeStamp:getDateTime(),
    Status:Status,
    Message:Message};
  $scope.liveURLLog.push(statusMsg);
}
function storedlog(Status,Message){
  var statusMsg={
    TimeStamp:getDateTime(),
    Status:Status,
    Message:Message};
  $scope.storedURLLog.push(statusMsg);
}

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

function UpdateVideoTag(videoId){
  $scope.cleanupCount++;
   RevService.getVideoById(videoId)
      .then(function(result){
        console.log("Got Video Details for", videoId, "Going to update its tags now...");
        cleanupLog("Success", "Got Video Details for " +  videoId + ". Going to update its tags now...");
         var updatedVideo = result.data;
         if(result.data.tags && result.data.tags.length > 0){
            var vemsTag = _.filter(result.data.tags,function(tag) {
            return tag.indexOf( 'VEMS_' ) !== -1; }
            );

           if(vemsTag && vemsTag.length > 0){

            updatedVideo.tags = _.without(result.data.tags, _.first(vemsTag));
           }
         }
        RevService.updateVideoById(updatedVideo)
        .then(function(data){
          $scope.cleanupSuccessCount++;
          console.log("video tag updated successfully for ", updatedVideo.id);
          cleanupLog("Success", "video tag updated successfully for " + updatedVideo.id);
           if($scope.cleanupCount == ($scope.cleanupSuccessCount + $scope.cleanupErrorCount)){
              if($scope.cleanupErrorCount > 0)
              {
                $scope.cleanupMsg = "Cleanup process completed succesfully but some failed. Please see console log for details";
                 cleanupLog("Error", "Cleanup process completed succesfully but some failed. Please see console log for details");
                $scope.cleanupStatus.processing = false;
              }
              else
              {
                $scope.cleanupMsg = "Cleanup process completed succesfully";
                cleanupLog("Success", "Cleanup process completed succesfully")
                 $scope.cleanupStatus.processing = false;
              }
            }
        }, function(error){
           $scope.cleanupErrorCount++;
           console.log("Could not get update tag for", videoId, "Following error occured" , JSON.stringify(error));
          cleanupLog("Error", "Could not get update tag for", videoId, "Following error occured" , JSON.stringify(error));
           if($scope.cleanupCount == ($scope.cleanupSuccessCount + $scope.cleanupErrorCount)){
              if($scope.cleanupSuccessCount > 0)
              {
                $scope.cleanupMsg = "Cleanup process completed succesfully but some failed. Please see console log for details";
                 cleanupLog("Error", "Cleanup process completed succesfully but some failed. Please see console log for details");
                 $scope.cleanupStatus.processing = false;
              }
              else
              {
                $scope.cleanupMsg = "Cleanup process failed.See log for details.";
                cleanupLog("Error", "Cleanup process failed.See log for details.");
                 $scope.cleanupStatus.processing = false;
              }
            }
        })

      },function(error){

        $scope.cleanupErrorCount++;
        console.log("Could not get video details for videoID", videoId, "Following error occured" , JSON.stringify(error));

        if($scope.cleanupCount == ($scope.cleanupSuccessCount + $scope.cleanupErrorCount)){
          if($scope.cleanupSuccessCount > 0)
          {
            $scope.cleanupMsg = "Cleanup process completed succesfully but some failed. Please see console log for details";
          }
          else
          {
            $scope.cleanupMsg = "Cleanup process failed.See log for details.";
          }
        }
      });
}
}]);
