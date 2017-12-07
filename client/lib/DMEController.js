'use strict';
angular.module('migrateApp')

.controller('DMEController',['$scope', '$rootScope','$q','DMEService','RevService','VemsService','SearchService', 'MaduroSllService','$filter', 'ngTableParams',
  function($scope,$rootScope,$q,DMEService,RevService,VemsService,SearchService, MaduroSllService,$filter, ngTableParams){
  $scope.MigrationLog=[];
  $scope.MAX_CONCURRENT_INGEST =50;
  $scope.DeleteContentFromVEMS=true;
  $scope.DMEUploadPath='/UploadedVideos/';
  $scope.IngestFolder='/EdgeIngest/';
  $scope.INGEST_TIMEOUT=30; //max ingest time 5 mins
  $scope.pollInterval=0.5*60*1000;//poll interval every 2 mins
  $scope.statusPollInterval=1*60*1000;
  $scope.BatchSize=1;
  $scope.Ingesting=0;
  $scope.isQueueProcessing=false;
  $scope.IngestQueue=[];
  $scope.ftpSuccess=false;
  $scope.ftpCheckProcessing=false;
  //Migration Status Not Started,Error – Error - Missing File,Ingest in Progress,Ingested,Error – Ingest Timeout,Complete
  $scope.ContentID=2784;//Temp
  $scope.VideoID='1e786096-048e-4906-8736-fda38214f4f6';//Temp
  $scope.dmeContentStatus={processing:false};
  $scope.RefreshContentProcessing=false;
  $scope.showDmeContent =false;
  $scope.selectedDME=0;
  $scope.VideoCount=100;
  $scope.VemsCategoryList =  [];
  $scope.CategoryMappings = [];
  $scope.ftpPassword='';
  $scope.arrMigrationStatus = ["Not Started", "Ingest in Progress", "Ingested", "Complete", "Error - Missing File", "Error - Ingest Timeout", "All - Failed"];
  $scope.CustomFields = ["RevContentId", "RevLocation", "VEMSLocation", "MigrationStatus"];
  $scope.ftpConfig={
    host: undefined,
    port: undefined, // defaults to 21
    user: undefined, // defaults to "anonymous"
    pass: undefined, // defaults to "@anonymous"
    debugMode: false
  };
  var processTimer=undefined;
  $scope.selectAll=false ;

  $scope.$watch('selectAll', function(value) {
          angular.forEach($scope.data, function(item) {
            if(item.ContentStatus.MigrationStatus=='Not Started'){
              item.isSelected=value;
            }
          });
          $scope.selectedCotents=_.filter($scope.dmecontents, function(content){ return content.isSelected==true; }).length
      });
  function CategoriesGetAllOnSuccess(result) {
          //RESULT IS A VBLIST OBJECT
          //store category paths in a string array with the fullpath
          var categories = result.Entities;
         for (var i = 0; i < categories.length; i++){
            $scope.vbCategoryList.push({ id: categories[i].CategoryID, name: categories[i].Name, path: categories[i].CategoryFullPath, parentId: categories[i].ParentCategoryID });
          }

          MapCategories();
        }


function MapCategories () {
        RevService.getCategories()
        .then(function(result){

          _.each(result.data.categories, function (category) {
            var vemsCategory = _.where($scope.vbCategoryList, {"path" : category.fullPath});
            if(vemsCategory.length > 0)
            {
              $scope.CategoryMappings.push({'vemsId' : vemsCategory[0].id.toString(), 'revId': category.categoryId});
            }
          })

        }, function(error){

        });

      }

  var timers = new Array();

  function updateStatistics(){
    $scope.TotalMigrationStatus={
      Pending: _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Not Started"; }).length,
      InProgress: _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Ingest in Progress"; }).length ,
      Ingested: _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Ingested"; }).length,
      Compelete: _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Complete"; }).length,
      Failed: _.filter($scope.dmecontents, function(content){ return (content.ContentStatus.MigrationStatus == "Error - Missing File" || content.ContentStatus.MigrationStatus == "Error - Ingest Timeout" ); }).length
    }
    $scope.Ingesting=$scope.TotalMigrationStatus.InProgress;
  }
  function ClearAllTimer(){
    for (var i = 0; i < timers.length; i++){
        clearTimeout(timers[i]);
        timers=[];
    }
  }
  updateStatistics();

  angular.extend($scope,{
    getMigrationFilterData:function(){
      return [{id:"",title:"All"},
              {id:"All - Failed",title:"All - Failed"},
              {id:"Not Started",title:"Not Started"},
              {id:"Ingest in Progress",title:"Ingest in Progress"},
              {id:"Ingested",title:"Ingested"},
              {id:"Complete",title:"Complete"},
              {id:"Error - Missing File",title:"Error - Missing File"},
              {id:"Error - Ingest Timeout",title:"Error - Ingest Timeout"}
              ];
    },
    VideoCountChanged:function(){
      if(_.isNumber($scope.VideoCount) && ($scope.VideoCount>5000 || $scope.VideoCount<1)){
        alert("Batch value can be 1 to 5000");
      }
      if(_.isNumber($scope.VideoCount)){
        $scope.contentTable.count($scope.VideoCount);
      }
    },
    CheckFTPConnectivity:function(){
      if($scope.ftpPassword!=='' && $scope.selectedDME!=='0'){
        $scope.ftpCheckProcessing=true;
        $scope.ftpConfig.pass=$scope.ftpPassword;
        DMEService.Login($scope.ftpConfig).then(function(data){
          $scope.ftpCheckProcessing=false;
          $scope.ftpSuccess=true;
          alert(data.Message);
        },function(response){
          $scope.ftpCheckProcessing=false;
          $scope.ftpSuccess=false;
          alert("Please enter correct password.");
        });
      }
      else {
        alert("Please select DME and enter password.")
      }
    },
    StartIngest:function(){

      StartPollIngestInProgress();
      StartPostIngestAuto();

      VemsService.loginToVems('/vemslogin', {config : $rootScope.config})
      .then(function(data){
      VemsService.vemsCustomFields('/vems-custom-fields').then(function(data){
        if(data.data == "Error:: Custom fields get failed."){
          alert("Seems like Custom fields not set in vems.Please verify.")
        }
        if(data.data && data.data.length > 0){
         var filteredCustomFields =  _.select(data.data, function(customfield){
          return $scope.CustomFields.indexOf(customfield.Name) != -1;
        })
         if(filteredCustomFields && filteredCustomFields.length == 4){
          var dataToMigrate=_.filter($scope.dmecontents, function(content){ return (content.isSelected ==true && content.ContentStatus.MigrationStatus=="Not Started"); });
          if(dataToMigrate.length!==0) {
            _.each(dataToMigrate,function(content){$scope.IngestQueue.push(content)});
          }
          if($scope.isQueueProcessing==false){
            $scope.isQueueProcessing=true;
            ProcessQueue();
          }
          alert(dataToMigrate.length+" video(s) added to the ingest queue.");
        } else {
          alert("Not all custom fields are set in vems. Please set vems custom fields before starting ingest.");
          return;
        }
      }
      else{
         alert("Please set vems custom fields before starting ingest.");
          return;
      }
    }, function(error){
          alert("Error occured while fetching custom field details from Vems.Please contact administrator.");
          return;
    });
}, function(error){
   alert("Vems Login failed.");
          return;
});
},
    StopIngest:function(){
        alert($scope.IngestQueue.length+" video(s) removed from the ingest queue.");
        $scope.IngestQueue.length=0;
        $scope.isQueueProcessing=false;
    },
    checkTimeout:function(){
      if($scope.INGEST_TIMEOUT<1 || $scope.INGEST_TIMEOUT>120)
      {
        $scope.INGEST_TIMEOUT=1;
        alert("Valid Ingest Timout range is 1 to 120 mins.");
      }
    },
    onDMEChange:function () {
        $scope.showDmeContent =false;
        $scope.dmeContentStatus.processing = true;
        $scope.ftpSuccess=false;
        $scope.isQueueProcessing=false;
        var id=$scope.selectedDME;
        ClearAllTimer();

        if(id !='0'){
          $scope.ftpConfig = _.find($rootScope.dmes, function(dme){
            return dme.id == id;
          });
          VemsService.getDMEContent('/contents', {publishingPoint :id, config : $rootScope.config}).then(successHandler, errorHandler);
          MaduroSllService.CategoriesGetAll($scope.VemsSessionId, CategoriesGetAllOnSuccess);

        }
        else {
          $scope.dmeContentStatus.processing = false;
          alert("Please select a DME.")
        }
      },
    RefreshContent:function(){
      $scope.RefreshContentProcessing=true;
      VemsService.getDMEContent('/contents', {publishingPoint :$scope.selectedDME, config : $rootScope.config}).then(successHandler, errorHandler);
      },
    TestPoll:function(){
      // var IngestedContent = _.filter($scope.dmecontents, function(content){ return content.ContentID == $scope.ContentID; });
      // var video =_.first(IngestedContent);
      // VemsService.loginToVems('/vemslogin', {config : $rootScope.config})
      // .then(function(data){
      //   VemsService.getContentLinks('/contentLinks', {'contentId' : video.ContentID, 'sessionID' : $scope.VemsSessionId, revToken : $scope.revToken, videoID : video.ContentStatus.RevContentID})
      //   .then(function(s){
      //     console.log(s);
      //   },function(e){
      //     console.log(e);
      //   });
      // });

      // var query="VEMS_"+$scope.ContentID;
      // SearchService.getVideos({
      //       query:'Tags"'+query+'"',
      //       userId: $rootScope.userId,
      //       accountId:$rootScope.accountId,
      //       scrollId:'',
      //       sortDirection:'desc',
      //       sortField:'_score',
      //       count: 1
      //       })
      // .then(function (data) {
      //   if(_.isObject(data) && data.totalHits!==undefined){
      //     if(data.totalHits>0){
      //       var video =_.chain(data.videos).find(function(video){
      //        return  _.contains(JSON.parse(video.tags),query)
      //       }).value();
      //
      //       if(video){
      //         console.log("Resolved");
      //       }else {
      //         console.log("NotFound");
      //       }
      //     }
      //     else {
      //       console.log("Video Not Found yet.");
      //     }
      //   }
      //   else {
      //       console.log("Rev Search didn't return correct output.");
      //   }});
      //StartPollForStatus('VEMS_'+$scope.ContentID);
      // DMEService.CopyFile("/VMES/VEMS (138).mp4","/VEMS (138).mp4").then(function(successMove){
      //     console.log("Files uploaded successfully for ingest.")
      //   },function(errorUpload){
      //     console.log("Error in uploading video metaData: "+errorUpload.Message);
      //   });
      //TestPoll:function(){
      //StartPollForStatus('VEMSID_'+$scope.ContentID);
      var video = {
        ContentID : 2825,
        ContentStatus : {
          RevContentID : "cd668896-a76b-43d4-a46b-f4056b3f84c2"
        },
        ContentDetails :{uploader : 'admin'}
      };
      StartPostIngest(video);
    },
    TestVideoStatus:function(){
      RevService.getVideoStatus($scope.VideoID).then(function(status){
        console.log(status);
      });
    },
    TestVideoInstance:function(){
      RevService.getVideoDetails($scope.VideoID).then(function(orignalInstace){
        var DMEFileLocation=$scope.DMEUploadPath + orignalInstace.id + '.' + orignalInstace.videoKey.replace(/^(.*)\./,'');
        console.log(DMEFileLocation);
        console.log(orignalInstace);
      });
    },
    DownloadLog:function(){
      var csvContent = "data:text/csv;charset=utf-8,";
      $scope.MigrationLog.forEach(function(infoArray, index){
         var dataString = infoArray.Status+" :: ContentID="+infoArray.ContentID+ " Title="+infoArray.Title+" Message="+ infoArray.Message ;
         csvContent += index < $scope.MigrationLog.length ? dataString+ "\n" : dataString;
      });
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      var today=new Date();
      var printDate=(today.getMonth()+1) + '-' + today.getDate() + '-' + today.getYear();
      link.setAttribute("download", "IngestLog"+printDate+".csv");
      link.click();
    }
  });

function StartPostIngestAuto(){
   console.log("loggin in into Vems for post ingest...");
console.log($rootScope.RevURL);
 VemsService.loginToVems('/vemslogin', {config : $rootScope.config})
 .then(function(data){
  console.log(data.data);
  var IngestedContent = _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Ingested"; });
  _.each(IngestedContent,function(content){
    StartPostIngest(content);
  })
});
}

function StartPollIngestInProgress(){
  var IngestingContent = _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Ingest in Progress"; });
  _.each(IngestingContent,function(content){
    StartPollForStatus('VEMS_'+content.ContentID);
  })
}

function ProcessQueue() {
  var processRun=function(){
      if($scope.IngestQueue.length===0) {
        $scope.isQueueProcessing=false;
        clearTimeout(timer);
      }
      else {
            var IngestInProgress= _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Ingest in Progress"; }).length
            if(IngestInProgress<=$scope.BatchSize ){
              while($scope.Ingesting<$scope.BatchSize){
                //pop from array
                var contentToProcess = $scope.IngestQueue.shift();
                if(contentToProcess==undefined){
                  break;
                }
                //Start Process for content
                var dataToMigrate=_.filter($scope.dmecontents, function(content){ return (content.isSelected ==true && content.ContentStatus.MigrationStatus=="Not Started" && content.ContentID==contentToProcess.ContentID); });
                if(dataToMigrate.length!==0) {
                  $scope.Ingesting=$scope.Ingesting+1;
                  _.map(dataToMigrate,function (fContent){
                      fContent.ContentDetails.Tags.push('VEMS_'+fContent.ContentID);
                      RevService.getUserByUserName(fContent.ContentDetails.uploader).then(function(user){
                        if(user=="NotFound"){
                          console.log("User does not exist in Rev so setting as default...");
                          fContent.ContentDetails.uploader=$rootScope.defaultUploader.toLowerCase();
                        }
                         console.log("User exists in Rev - ", JSON.stringify(user));

                        var vemsCatIds = fContent.ContentDetails.CategoryIds;
                        fContent.ContentDetails.CategoryIds = MapVemstoRevCategory(vemsCatIds);

                        StartIngest(dataToMigrate).then(function(finalresult){
                          console.log(finalresult);
                        }, function(error){
                          $scope.IngestQueue.length=0;
                          $scope.isQueueProcessing=false;
                          alert("Some error occured while updaing content status in Vems.Please verify whether Vems server is up and running.");
                        });
                      });
                  });

                IngestInProgress= _.filter($scope.dmecontents, function(content){ return content.ContentStatus.MigrationStatus == "Ingest in Progress"; }).length
              }
            }

          }
        }
      }
    processRun();
    var timer=setInterval(processRun, 1000);//checks for every second to start new ingest for queued content
    processTimer=timer;
    timers.push(timer);
}
function StartIngest(arr){
    return arr.reduce(function(promise, item) {
        return promise.then(function(result) {
            return StartMigration(item, result);
        });
    }, $q.when("Init"));
}

function StartMigration(content,result){
  var deferred=$q.defer();
  if(content.ContentStatus.MigrationStatus=="Not Started"){

      MoveContent(content).then(function(successMsg){
        updateContentStatus(content.ContentID,{MigrationStatus:'Ingest in Progress',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
        log(content.ContentID,content.ContentDetails.Title,'Success',successMsg);
        VemsService.insertUpdateContentCustomField('/customfields', content).then(function(successMsg){
          if(successMsg.data == 'Error'){
            updateContentStatus(content.ContentID,{MigrationStatus:'Not Started',  VEMSContentPath:'',  RevContentLocation:'',  RevContentID:''});
               deferred.reject("Error");
          }else{
             console.log("CustomFields updated successfully.", successMsg.data);
             StartPollForStatus('VEMS_'+content.ContentID);
             deferred.resolve("Success");
          }
        },function(errMsg){
            console.log(JSON.stringify(errMsg));
        });

        //StartPollForStatus



      },function(errorMsg){
        content.isSelected=false;
        updateContentStatus(content.ContentID,{MigrationStatus:'Error - Missing File',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
        VemsService.insertUpdateContentCustomField('/customfields', content).then(function(successMsg){
            console.log("CustomFields updated successfully.", successMsg.data);
        },function(errMsg){
            console.log(JSON.stringify(errMsg));
        });
        log(content.ContentID,content.ContentDetails.Title,'Error',errorMsg);
        deferred.resolve("Error");
      });
  }
    return deferred.promise;
}

function successHandler(result){
  $scope.selectAll=false;
  var dmecontents = [];
if(result.data == "Error:: error occured in fetching dme contents from Vems"){
console.log("Error:: error occured in fetching dme contents from Vems");
log('', '', "Error", "Error occured in fetching dme contents from Vems");
}
else{
  //_.sortBy(result.data,"Title");
    _.each(result.data, function(content){
          var dmecontent = {
              isSelected: false,
              ContentID : content.ContentID,
              UploadDateTime : content.UploadDateTime,
              ContentDetails : {
                  "Title" : content.Title,
                  "Description" : content.Description,
                  "EnableComments" : true,
                  "EnableRatings" : true,
                  "EnableDownloads" : false,
                  "uploader" : content.UserName.toLowerCase(),
                  "IsActive" : true,
                  "AccessControlEntities" : [],
                  "Tags":[],
                  "CategoryIds": []
                },
                ContentStatus : {
                   "MigrationStatus" :content.MigrationStatus,
                   "VEMSContentPath" : content.VEMSLocation,
                   "RevContentLocation": content.RevLocation,
                   "RevContentID": content.RevContentId
                },
              Instances:  content.Instances.split(',')[0]==''? [] :content.Instances.split(',')
          };

          if(content.Public == 1){
            dmecontent.ContentDetails.VideoAccessControl = "Public";
          }

          if(content.Keywords && content.Keywords.length > 0){
             var arrKeywords = content.Keywords.split(',');
            _.each(arrKeywords, function(keyword){
                    dmecontent.ContentDetails.Tags.push(keyword);
            });
          }

          if(content.Categories && content.Categories.length > 0){
            var arrCats = content.Categories.split(',');
            _.each(arrCats, function(cat){
                    dmecontent.ContentDetails.CategoryIds.push(cat.trim());
            });
          }

          dmecontents.push(dmecontent);
    });
    $scope.dmecontents = dmecontents;
    $scope.contentTable = new ngTableParams({
                  page: 1,
                  count: $scope.VideoCount,
                  sorting: { "ContentDetails.Title": "asc" }
              },{
                  total: 0,
                  counts:[],
                  //dataset:$scope.dmecontents
                  getData: function ($defer, params) {
                    var filterParams=params.filter();

                    var customFilter={};
                    if(filterParams.ContentID){
                      _.extend(customFilter,{ContentID:filterParams.ContentID})
                    }
                    if(filterParams.Title){
                      _.extend(customFilter,{ContentDetails:{Title:filterParams.Title}});
                    }
                    if(filterParams.MigrationStatus){
                      if(filterParams.MigrationStatus =="All - Failed"){
                          _.extend(customFilter,{ContentStatus:{MigrationStatus:"Error - Ingest Timeout"}});
                          _.extend(customFilter,{ContentStatus:{MigrationStatus:"Error - Missing File"}});
                      }
                      else{
                        _.extend(customFilter,{ContentStatus:{MigrationStatus:filterParams.MigrationStatus}});
                      }
                    }

                    $scope.data = params.sorting() ? $filter('orderBy')($scope.dmecontents, params.orderBy()) : $scope.dmecontents;
                    $scope.data = params.filter() ? $filter('filter')($scope.data, customFilter) : $scope.data;

                    $scope.data = $scope.data.slice(0, $scope.VideoCount);
                    params.total($scope.data.length); // set total for recalc pagination
                    if(params.filter() && $scope.selectAll==true ){
                      angular.forEach($scope.dmecontents, function(item) {
                        if(item.ContentStatus.MigrationStatus=='Not Started'){
                          item.isSelected=false;
                        }
                      });
                      angular.forEach($scope.data, function(item) {
                        if(item.ContentStatus.MigrationStatus=='Not Started'){
                          item.isSelected=$scope.selectAll;
                        }
                      });
                    }
                    $scope.selectedCotents=_.filter($scope.dmecontents, function(content){ return content.isSelected==true; }).length
                    $defer.resolve($scope.data);
                  }
              });
    updateStatistics();

    $scope.showDmeContent =true;
    }
    $scope.dmeContentStatus.processing = false;
    $scope.RefreshContentProcessing=false;
}

function errorHandler(result)    {
   console.log("Error occured while fetching dme content.")
   console.log(JSON.stringify(result));
   $scope.dmeContentStatus.processing = false;
   $scope.RefreshContentProcessing=false;
   $scope.selectAll=false;
}

function MapVemstoRevCategory(categories){
  var revCats = [];

  if(categories && categories.length > 0){

    for (var i = 0; i < categories.length; i++){
      var catMapp = _.where($scope.CategoryMappings, {"vemsId" : categories[i].trim()})
      if(catMapp && catMapp.length > 0){
        revCats.push(catMapp[0].revId);
      }
    }
  }

  return revCats;
}

function MoveContent(content){
    var deferred=$q.defer();
    //move video file to ingest folder with metadata
    var FileName=content.ContentStatus.VEMSContentPath.replace(/^.*[\\\/]/, '');
    var sourcePathVideo=content.ContentStatus.VEMSContentPath;
    var targetPathVideo=$scope.IngestFolder+FileName;
    var targetPathJson=targetPathVideo.substring(0,targetPathVideo.lastIndexOf('.'))+'.json';

    DMEService.MoveFile(sourcePathVideo,targetPathVideo).then(function(successMove){
      DMEService.UploadFile(targetPathJson,content.ContentDetails).then(function(successUpload){
        deferred.resolve("Files uploaded successfully for ingest.")
      },function(errorUpload){
        deferred.reject("Error in uploading video metaData: "+JSON.stringify(errorUpload));
      });
    },function(errorMove){
        deferred.reject("Error in moving video file to ingest folder: "+JSON.stringify(errorMove));
    });
    return deferred.promise;
}

function CopyContent(content){
      var deferred=$q.defer();
      //copy video file to ingest folder with metadata
      var FileName=content.ContentStatus.VEMSContentPath.replace(/^.*[\\\/]/, '');
      var sourcePathVideo=content.ContentStatus.VEMSContentPath;
      var targetPathVideo=$scope.IngestFolder+FileName;
      var targetPathJson=targetPathVideo.substring(0,targetPathVideo.lastIndexOf('.'))+'.json';

      DMEService.CopyFile(sourcePathVideo,targetPathVideo).then(function(successMove){
        DMEService.UploadFile(targetPathJson,content.ContentDetails).then(function(successUpload){
          deferred.resolve("Files uploaded successfully for ingest.")
        },function(errorUpload){
          deferred.reject("Error in uploading video metaData: "+errorUpload.Message);
        });
      },function(errorMove){
          deferred.reject("Error in coping video file to ingest folder: "+errorMove.Message);
      });
      return deferred.promise;
  }

function StartPollForStatus(tag) {

    var totalPollTime = $scope.pollInterval;
    var MaxPollTime=$scope.INGEST_TIMEOUT*60*1000;
    var PollingContent = _.find($scope.dmecontents, function(content){ return content.ContentID == tag.split('VEMS_').pop(); });

    var findVideoWithVemsTag=function(){
      console.log("Checking Content Status for VEMS_" + PollingContent.ContentID);


      // Run only if times less then INGEST_TIMEOUT
      if(totalPollTime>MaxPollTime)
      {
        content.isSelected=false;
        updateContentStatus(PollingContent.ContentID,{MigrationStatus:'Error - Ingest Timeout',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined})
        log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Error','Ingest Timeout for '+tag);
        VemsService.insertUpdateContentCustomField('/customfields', PollingContent).then(function(successMsg){
            console.log("CustomFields updated successfully.", successMsg.data);
        },function(errMsg){
            console.log(JSON.stringify(errMsg));
        });
        clearTimeout(timer);
      }

      // Checking Video
      RevService.SearchVideo(tag)
      .then(function(data){
        log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Success','Ingested Video with tag '+tag+' Found. RevContentID = '+ data.id);
        updateContentStatus(PollingContent.ContentID,{MigrationStatus:undefined,  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:data.id});
        clearTimeout(timer);
        //Update Phase2
        StartPollForTranscodedStatus(PollingContent.ContentID,data.id);
      },
      function(errorMsg){
        //log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Error',errorMsg);
      });
      totalPollTime=totalPollTime+$scope.pollInterval
    }
    console.log('VEMS_'+PollingContent.ContentID +' scheduled for polling');

    findVideoWithVemsTag();//Polling Started
    log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Success','Polling started for '+tag);
    var timer=setInterval(findVideoWithVemsTag, $scope.pollInterval);
    timers.push(timer);

  }

function StartPollForTranscodedStatus(ContentID,VideoId) {
      var callCounter=1;
      var PollingContent = _.find($scope.dmecontents, function(content){ return content.ContentID == ContentID; });

      var checkVideoStatus=function(){
        console.log("Checking Transcode Status for VEMS_" + PollingContent.ContentID);
        RevService.getVideoStatus(VideoId).then(function(status){
          console.log('Transcode Polling Status for VEMS_'+PollingContent.ContentID+' '+ status);

          //clearTimout if video is transcoded
          if(status=="Ready"){
            //Call for DME instance of that video
            //log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Success','Video has been transcoded and ready.');
            RevService.getVideoDetails(VideoId).then(function(data){
              var video = data.video.video || data.video;
              var files = _(video.instances).chain().filter({ isOriginalInstance: true }).value();
              var orignalInstace= _.first(files);
              var DMEFileLocation=$scope.DMEUploadPath + orignalInstace.id + '.' + orignalInstace.videoKey.replace(/^(.*)\./,'');
              log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Success','Video has been ingested successfully!!!');
              updateContentStatus(PollingContent.ContentID,{MigrationStatus:'Ingested',  VEMSContentPath:undefined,  RevContentLocation:DMEFileLocation,  RevContentID:undefined});
              VemsService.insertUpdateContentCustomField('/customfields', PollingContent).then(function(successMsg){
                if(successMsg.data == 'Error'){
                  updateContentStatus(PollingContent.ContentID,{MigrationStatus:'Ingest in progress',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
                  $scope.IngestQueue.length=0;
                  $scope.isQueueProcessing=false;
                  alert("Some error occured while updaing content status in Vems.Please verify whether Vems server is up and running.");
                }else{
                 console.log("CustomFields updated successfully.", successMsg.data);
                 //Delete Other instances
                 if($scope.ftpSuccess){
                   _.forEach(PollingContent.Instances,function(instance){
                     DMEService.DeleteFile(instance).then(function(response){
                       log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Success','Video instance deleted successfully!!!'+instance);
                     },function(error){
                       log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Error','Video instance deleted failure!!!'+instance);
                     })
                   })
                 }
                  // POST Ingest Process Starting
                  StartPostIngest(PollingContent);

               }

             },function(errMsg){
              console.log(JSON.stringify(errMsg));
            });
            clearTimeout(timer);
          });
        }
          else if(status=="ProcessingFailed"){
            console.log('Transcode Status API call ProcessingFailed for '+PollingContent.ContentID);
            log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Error','Error - Ingest Phase2 Failed');
            updateContentStatus(PollingContent.ContentID,{MigrationStatus:'Error - Ingest Timeout',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
            VemsService.insertUpdateContentCustomField('/customfields', PollingContent).then(function(successMsg){
              if(successMsg.data == 'Error'){
                  updateContentStatus(PollingContent.ContentID,{MigrationStatus:'Ingest in progress',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
                  $scope.IngestQueue.length=0;
                  $scope.isQueueProcessing=false;
                  alert("Some error occured while updaing content status in Vems.Please verify whether Vems server is up and running.");
                }else{
                console.log("CustomFields updated successfully.", successMsg.data);

              }
            },function(errMsg){
                console.log(JSON.stringify(errMsg));
            });
            clearTimeout(timer);
        }
      },function(data){
          //Some API call error
          console.log('Transcode Status API call Failed for '+PollingContent.ContentID);
          log(PollingContent.ContentID,PollingContent.ContentDetails.Title,'Error','Transcode Status API call Failed');
          updateContentStatus(PollingContent.ContentID,{MigrationStatus:'Error - Ingest Timeout',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
          VemsService.insertUpdateContentCustomField('/customfields', PollingContent).then(function(successMsg){
              if(successMsg.data == 'Error'){
                  updateContentStatus(PollingContent.ContentID,{MigrationStatus:'Ingest in progress',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
                  $scope.IngestQueue.length=0;
                  $scope.isQueueProcessing=false;
                  alert("Some error occured while updaing content status in Vems.Please verify whether Vems server is up and running.");
                }else{
              console.log("CustomFields updated successfully.", successMsg.data);

            }
          },function(errMsg){
              console.log(JSON.stringify(errMsg));
          });
          clearTimeout(timer);
      });
    }
    callCounter++;

    console.log('VEMS_' + PollingContent.ContentID + ' scheduled for Transcode Status polling.');

    checkVideoStatus();
    var timer=setInterval(checkVideoStatus, $scope.statusPollInterval);
    timers.push(timer);

}
function FileLog(Message){
  DMEService.Log("Info",Message).then(function(s){
    console.log("FileLog:: "+s);
  },function(e){
    console.warn ("FileLogFailed:: "+e);
  })
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
    return  month + "/" + day + "/" +year + " " + hour + ":" + min + ":" + sec;
}
function log(ContentID,Title,Status,Message){
  var statusMsg={
    TimeStamp:getDateTime(),
    ContentID:ContentID,
    Title:Title,
    Status:Status,
    Message:Message};
  $scope.MigrationLog.push(statusMsg);
  FileLog(statusMsg.TimeStamp+" ContentID:"+ContentID+", Title:"+Title+", Message:"+Message);
}

function StartPostIngest(video){

  RevService.getUserByUserName(video.ContentDetails.uploader).then(function(user){
    if(user=="NotFound"){
      console.log("PI - user not found so setting default.");
      video.ContentDetails.uploader=$rootScope.defaultUploader.toLowerCase();
    }

   console.log("Started processing thumbnail for content ", video.ContentID);
   var thumbnailMigrationPromise = VemsService.getContentThumbnail('/contentThumbnail', {'contentId' : video.ContentID, 'sessionID' : $scope.VemsSessionId, revToken : $scope.revToken, videoID : video.ContentStatus.RevContentID});//.then(function (data){ console.log(data.data);}, function(error){ console.log(error);});
   console.log("Started processing linked docs for content ", video.ContentID);
   var contentLinkedDocsMigrationPromise =  VemsService.getContentLinks('/contentLinks', {'contentId' : video.ContentID, 'sessionID' : $scope.VemsSessionId, revToken : $scope.revToken, videoID : video.ContentStatus.RevContentID});//.then(function (data){ console.log(data.data);}, function(error){ console.log(error);});
   console.log("Started processing Content comments for content ", video.ContentID);
   var commentsMigrationPromise = VemsService.getContentComments('/contentComments', {'contentId' : video.ContentID, 'sessionID' : $scope.VemsSessionId, revToken : $scope.revToken, videoID : video.ContentStatus.RevContentID});//.then(function (data){ console.log(data.data);}, function(error){ console.log(error);});
   console.log("Started processing content upload date time for content ", video.ContentID);
   var uploadDatePromise = VemsService.contentUploadDateTime('/contentUploadDateTime', {'revToken' : $scope.revToken, 'videoID' : video.ContentStatus.RevContentID, 'whenUploaded' : video.UploadDateTime, 'userName' :  video.ContentDetails.uploader});

   $q.all([
      thumbnailMigrationPromise
    , contentLinkedDocsMigrationPromise
    , commentsMigrationPromise
    , uploadDatePromise
    ])
   .then(function(results) {
     var result =_.filter(results,function(message){
       return message.data.indexOf("Success::")>-1
     });
     if(result.length==4){

       console.log("Post ingestion complete for content");
       console.log(results[0].data);
       console.log(results[1].data);
       console.log(results[2].data);
       console.log(results[3].data);

       video.isSelected=false;
       updateContentStatus(video.ContentID,{MigrationStatus:'Complete',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
       VemsService.insertUpdateContentCustomField('/customfields', video).then(function(successMsg){
          if(successMsg.data == 'Error'){
            updateContentStatus(video.ContentID,{MigrationStatus:'Ingested',  VEMSContentPath:undefined,  RevContentLocation:undefined,  RevContentID:undefined});
            $scope.IngestQueue.length=0;
            $scope.isQueueProcessing=false;
          alert("Some error occured while updaing content status in Vems.Please verify whether Vems server is up and running.");
          }else{
           console.log("CustomFields updated successfully.", successMsg.data);
           log(video.ContentID,video.ContentDetails.Title,"Success","Post ingest complete.");
          }
        },function(errMsg){
            console.log(JSON.stringify(errMsg));
        });
     }
     else {
       console.log("Post ingestion failed::");
       console.log(results[0].data);
       console.log(results[1].data);
       console.log(results[2].data);
       console.log(results[3].data);
       log(video.ContentID,video.ContentDetails.Title,"Error","Post ingest failed.");
     }

   }, function(error) {
     console.log("Post ingestion failed  for content with following error", error);
     log(video.ContentID,video.ContentDetails.Title,"Error","Post ingest failed.");
   });
 })
.catch(function(error){
  console.log(error);
});
}

function updateContentStatus(ContentID,ContentStatus){
    $scope.dmecontents.forEach(function(content) {
      if (content.ContentID == ContentID) {
          if(ContentStatus.MigrationStatus!==undefined)
          {
            console.log(content.ContentDetails.Title,' Migration status changed from ',content.ContentStatus.MigrationStatus,' to ',ContentStatus.MigrationStatus);
            if(content.ContentStatus.MigrationStatus=="Ingest in Progress" && ContentStatus.MigrationStatus!="Ingest in Progress"){
                $scope.Ingesting=  $scope.Ingesting-1;
            }
            content.ContentStatus.MigrationStatus=ContentStatus.MigrationStatus;
          }
          if(ContentStatus.RevContentID!==undefined)
          {
            content.ContentStatus.RevContentID=ContentStatus.RevContentID;
          }
          if(ContentStatus.VEMSContentPath!==undefined)
          {
            content.ContentStatus.VEMSContentPath=ContentStatus.VEMSContentPath;
          }
          if(ContentStatus.RevContentLocation!==undefined)
          {
            content.ContentStatus.RevContentLocation=ContentStatus.RevContentLocation;
          }

          updateStatistics();
      }
  });
}
}]);
