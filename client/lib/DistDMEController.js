'use strict';
angular.module('migrateApp')

.controller('DistDMEController',['$scope', '$rootScope','$q','$timeout','DMEService','RevService','VemsService','LoggedUserContext','MaduroSllService',function($scope,$rootScope,$q,$timeout,DMEService,RevService,VemsService,UserContext,MaduroSllService){

$scope.BaseDMEData={StoredServerId:0,DMEName:'',Contents:[]};
$scope.DistributionLog=[];
$scope.ftpLabel=""
$scope.RevDMEs=[{deviceType: 0,id: "00000000-0000-0000-0000-000000000000",isActive: true,isCollectable: false,macAddresses: ["000000000000"],name: "----Select DME----",sequenceNumber: 0,version: "0.0.0.0",ipAddress:"0.0.0.0"}];
$scope.BaseDMEProcesssing=false;
$scope.DistributionProcessing=false;
$scope.FtpProcessing=false;
$scope.isLoggedIn=false;
$scope.Config={
  UseDefault:true,
  SelectAll:false,
  BaseDMEId:'00000000-0000-0000-0000-000000000000',
  FTPConnectionsCheck:false,
  username:"admin",
  password:"admin",
  IngestOrignal:true,
  DMEProcessStatus:'',
  TestText:'.'
};



angular.extend($scope,{
  getDevices:function(){
    MaduroSllService.StoredServersGetAll(UserContext.GetVemsSessionId(), function(result){
      //console.log(JSON.stringify(_.pluck(result.Entities,'Name','StoredServerEntryPoints','StoredServerPublishingPoints')));
      var VEMSDMEs = _.chain(result.Entities)
      .filter(function(server){
        return _.some(server.StoredServerPublishingPoints, function(point){ return point.EnumPublishingPointTypeID == 138;})})
      .map(function(dme){
          return {
            id: _.find(dme.StoredServerPublishingPoints,function(StoredServerPublishingPoint){
              return StoredServerPublishingPoint.EnumPublishingPointTypeID== 138;
            }).StoredServerPublishingPointID,
            host:_.first(dme.StoredServerEntryPoints).HostName
          }
      }).value();
      //console.log(VEMSDMEs);
      RevService.getDevices().then(function(successResponse){
        if(successResponse.length>0)
        {
          $scope.RevDMEs=[];
          $scope.RevDMEs=successResponse;
          $scope.RevDMEs.unshift({deviceType: 0,id: "00000000-0000-0000-0000-000000000000",isActive: true,isCollectable: false,macAddresses: ["000000000000"],name: "----Select DME----",sequenceNumber: 0,version: "0.0.0.0",InVems: true,ipAddress:"0.0.0.0"});
        }
        _.each($scope.RevDMEs,function(dme){
          var dmeInVEMS=_.find(VEMSDMEs,function(vemsDME){
            return vemsDME.host==dme.ipAddress
          });
          var InVems=false,StoredServerId='';

          if(dme.id=="00000000-0000-0000-0000-000000000000"){
            InVems=true;
          }
          if(dmeInVEMS!=undefined)
          {
              InVems=true;
              StoredServerId=dmeInVEMS.id;
          }
          _.extend(dme,{status:"N/A", useDefault:$scope.Config.UseDefault,selected:false,username:$scope.Config.username,password:$scope.Config.password, isBaseDME:false,InVems:InVems,StoredServerId:StoredServerId});
        });
        //console.log($scope.RevDMEs);
      },function(errorResponse){
        console.log(errorResponse);
      })
    });
  },
  onDMEChange:function(){
    $scope.BaseDMEProcesssing = true;

    _.each($scope.RevDMEs,function(dme){
      if(dme.id == $scope.Config.BaseDMEId){
        dme.isBaseDME=true;
        dme.selected=false;
      }else {
        dme.isBaseDME=false;
      }
    });

    if($scope.Config.BaseDMEId !='00000000-0000-0000-0000-000000000000'){
        $scope.BaseDME = _.find($scope.RevDMEs, function(dme){
        return dme.id == $scope.Config.BaseDMEId;
      });

      //fetch details from VEMS for base DME
      VemsService.getDMEContent('/contents', {publishingPoint :$scope.BaseDME.StoredServerId, config : $rootScope.config}).then(function(result){
        if(result.data.indexOf("Error::") > -1){
          alert(result.data);
          console.log(result.data);
          log("Error", result.data);
          $scope.BaseDMEProcesssing = false;
        }
        else{
          $scope.BaseDMEData={StoredServerId:$scope.BaseDME.StoredServerId,DMEName:$scope.BaseDME.name,Contents:[]};
          //var completedContent= _.filter(result.data,function(content){return content.MigrationStatus=="Complete"});
          $scope.BaseDMEData.contents= _.chain(result.data).filter(function(content){ return content.MigrationStatus=="Complete"})
          .map(function(content){
            return {
                ContentID : content.ContentID,
                Title : content.Title,
                MigrationStatus :content.MigrationStatus,
                VEMSContentPath : content.VEMSLocation,
                RevContentLocation: content.RevLocation,
                RevContentID: content.RevContentId,
                DistributionDetails:[]
              }
          }).value();

          $scope.BaseDMEProcesssing = false;
        }
      }, function(err){
        log("Error",err);
        $scope.BaseDMEProcesssing = false;
      });

    }
    else {
      $scope.BaseDMEProcesssing = false;
      alert("Please select Base DME.")
    }
  },
  StartDistribution:function(){
    $scope.BaseDMEProcesssing = true;

    _.each($scope.RevDMEs,function(dme){
      if(dme.id == $scope.Config.BaseDMEId){
        dme.isBaseDME=true;
        dme.selected=false;
      }else {
        dme.isBaseDME=false;
      }
    });

    if($scope.Config.BaseDMEId !='00000000-0000-0000-0000-000000000000'){
        $scope.BaseDME = _.find($scope.RevDMEs, function(dme){
        return dme.id == $scope.Config.BaseDMEId;
      });

      //fetch details from VEMS for base DME
      VemsService.getDMEContent('/contents', {publishingPoint :$scope.BaseDME.StoredServerId, config : $rootScope.config}).then(function(result){
        if(result.data.indexOf("Error::") > -1){
          alert(result.data);
          console.log(result.data);
          log("Error", result.data);
          $scope.BaseDMEProcesssing = false;
        }
        else{
          $scope.BaseDMEData={StoredServerId:$scope.BaseDME.StoredServerId,DMEName:$scope.BaseDME.name,Contents:[]};
          //var completedContent= _.filter(result.data,function(content){return content.MigrationStatus=="Complete"});
          $scope.BaseDMEData.contents= _.chain(result.data).filter(function(content){ return content.MigrationStatus=="Complete"})
          .map(function(content){
            return {
                ContentID : content.ContentID,
                Title : content.Title,
                MigrationStatus :content.MigrationStatus,
                VEMSContentPath : content.VEMSLocation,
                RevContentLocation: content.RevLocation,
                RevContentID: content.RevContentId,
                DistributionDetails:[],
                Instances:  content.Instances.split(',')[0]==''? [] :content.Instances.split(',')
              }
          }).value();

          $scope.BaseDMEProcesssing = false;
          PrcessDistribution();
        }
      }, function(err){
        log("Error",err);
        $scope.BaseDMEProcesssing = false;
      });

    }
    else {
      $scope.BaseDMEProcesssing = false;
      alert("Please select Base DME.")
    }
  },
  StopDistribution:function(){
    $scope.DistributionProcessing=false;
  },
  CheckFTPConnections:function(){
    var ftpConfigs=[];
    var selectedDMEs=_.filter($scope.RevDMEs,function(dme){ return dme.selected==true && dme.id !='00000000-0000-0000-0000-000000000000'});
    if(selectedDMEs.length>0){
      $scope.FtpProcessing=true;
      //delay in checking ftp CheckFTPConnection
      _.each(selectedDMEs,function(dme){
          var ftpConfig={host: dme.ipAddress,port: 21,user: dme.username,pass: dme.password};
          if(dme.useDefault){
            ftpConfig.user=$scope.Config.username;
            ftpConfig.pass=$scope.Config.password;
          }
          ftpConfigs.push(ftpConfig);
      })
      function CheckConnection(ftpConfig,result){
        console.log("Result from Previous Call:: "+result);
        var deferred=$q.defer();
        var selectedDMEs=_.filter($scope.RevDMEs,function(dme){ return dme.selected==true && dme.id !='00000000-0000-0000-0000-000000000000'});
        var findCurrentDME= _.find($scope.RevDMEs, function(dme){  return dme.ipAddress == ftpConfig.host});
        var currentDMEIndex = findWithAttr(selectedDMEs, 'ipAddress', ftpConfig.host);
        $scope.ftpLabel="Checking DME "+(currentDMEIndex+1)+" of "+selectedDMEs.length+" :  "+findCurrentDME.name;
        log("INFO","Checking DME "+(currentDMEIndex+1)+" of "+selectedDMEs.length+" :  "+findCurrentDME.name);

        DMEService.CheckLogin(ftpConfig).then(function(data){
          if(data.Response=="Success"){
            log("Success",ftpConfig.host + " ftp connection success.");
            deferred.resolve(true);
          }
          else {
            log("Error",ftpConfig.host + " ftp connection failure.");
            deferred.reject(false);
          }
        },function(response){
          log(response.Response,response.Message);
          deferred.reject(false);
        });
        return deferred.promise;
      }
      function FtpLoginChecks(arr) {
          return arr.reduce(function(promise, item) {
              return promise.then(function(result) {
                $scope.Config.FTPConnectionsCheck=true;
                  return CheckConnection(item, result);
              },function(result){
                $scope.Config.FTPConnectionsCheck=false;
                return result;
              });
          }, $q.when(["true"]));
      }
      FtpLoginChecks(ftpConfigs).then(function(finalresult){
        $scope.FtpProcessing=false;
        console.log(finalresult);
      },function(error){
         $scope.FtpProcessing=false;
        console.log(error);
      });
    }
    else{
      alert("Please select DME(s) for FTP connections checking.");
    }
  },
  onUseDefault:function(){
    //console.log($scope.Config.UseDefault);
    _.each($scope.RevDMEs,function(dme){
      dme.useDefault=$scope.Config.UseDefault;
      if(dme.isBaseDME==false){
        dme.selected=$scope.Config.SelectAll;
      }
      else {
        dme.selected=false;
      }
    });
  },
  Test:function(){
    console.log($scope.Config.TestText);
    if ($scope.isLoggedIn) {
      DMEService.ListDirectory($scope.Config.TestText,true).then(function(data){console.log(data);});
    }
    else {
      DMEService.Login({host: "172.22.2.210",pass: "admin",port: 21,user: "admin",debugMode:undefined}).then(function(data){
        $scope.isLoggedIn=true;
        DMEService.ListDirectory($scope.Config.TestText,true).then(function(data){console.log(data);
        });
      },function(response){
        console.log('loginFailed');
      });
    }
  },
  DownloadLog:function(){
    var csvContent = "data:text/csv;charset=utf-8,";
    $scope.DistributionLog.forEach(function(infoArray, index){
       var dataString = infoArray.Status+" :: "+ infoArray.Message ;
       csvContent += index < $scope.DistributionLog.length ? dataString+ "\n" : dataString;
    });
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    var today=new Date();
    var printDate=(today.getMonth()+1) + '-' + today.getDate() + '-' + today.getYear();
    link.setAttribute("download", "DistributionLog"+printDate+".csv");
    link.click();
  }
});
$scope.getDevices();
function PrcessDistribution(){
  $scope.DistributionProcessing=true;
  var selectedDMEs=_.filter($scope.RevDMEs,function(dme){ return dme.selected==true && dme.id !='00000000-0000-0000-0000-000000000000'});
  if($scope.BaseDME!=undefined && $scope.BaseDMEData.contents.length!=0 && selectedDMEs.length!=0){
      selectedDMEs.reduce(function(promise, item) {
          return promise.then(function(result) {
             return DistributeDME(item);
          });
      }, $q.when("Init")).then(function(data){
        $scope.DistributionProcessing=false;
        console.log("Distribution Completed.");
        log("Success","Distribution Completed.");
      },function(error){
        if(error=="Cancelled"){
          console.log("Distribution Cancelled.");
          log("Error","Distribution Cancelled.");
        }
        else {
          console.log("Distribution Failed.");
          log("Error","Distribution Failed.");
        }
      });
  }
  else {
    if(selectedDMEs.length==0){
      alert("Please select a DME for distribution.");
    }
    if($scope.BaseDMEData.contents.length==0){
      alert("There are no contents in Completed State to distribute.");
    }
    $scope.DistributionProcessing=false;
  }
}
function DistributeDME(dme){
  var rootDeferred=$q.defer();

  var firstContent=_.first($scope.BaseDMEData.contents);
  var baseFolder=firstContent.RevContentLocation.substring(0,firstContent.RevContentLocation.lastIndexOf('/')).toLowerCase();
  //Update status to In Progress
  dme.status="Not Started";
    var ftpConfig={host: dme.ipAddress,port: 21,user: dme.username,pass: dme.password};
    if(dme.useDefault){
      ftpConfig.user=$scope.Config.username;
      ftpConfig.pass=$scope.Config.password;
    }
    //Login ftp
    DMEService.Login(ftpConfig).then(function(data){
      dme.status="In Progress";
      $scope.Config.DMEProcessStatus="Fetching data from DME :: "+dme.name;
      console.log("Fetching data from DME :: "+dme.name);
      DMEService.ListDirectory('.',true).then(function(listoffiles){
        var data =_.chain(listoffiles).map(function(itm) { return itm.path.toLowerCase(); })
                  .filter(function(item){
                    return item.endsWith(".mp4") || item=="."+baseFolder;
                  }).value();

        console.log("Fetching data from DME :: "+dme.name+" :: Successful");
        log("Success","Fetching data from DME :: "+dme.name+" :: Successful");
        console.log("Validating data with Base DME :: "+$scope.BaseDME.name);
        log("Success","Validating data with Base DME :: "+$scope.BaseDME.name);
        $scope.Config.DMEProcessStatus="Validating "+dme.name+" data with Base DME :: "+$scope.BaseDME.name;

        _.each($scope.BaseDMEData.contents,function(content){
          var contentStatus={
            DMEHost:dme.ipAddress,
            Status:''
          };
          var vemsPath="."+content.VEMSContentPath.toLowerCase();
          var revPath="."+content.RevContentLocation.toLowerCase();

          if(_.contains(data,vemsPath)){
            contentStatus.Status="Found";
            console.log(content.VEMSContentPath +" found on "+dme.name+" DME.");
            log("Success",content.VEMSContentPath +" found on "+dme.name+" DME.");

            if(!_.contains(data,"."+baseFolder)){
              DMEService.MakeDir(baseFolder).then(function(success){
                log("Success","Base directory created on DME."+baseFolder);
              });
              data.push("."+baseFolder);
            }
          }
          else if(_.contains(data,revPath)){
            contentStatus.Status="Moved";
            console.log(content.RevContentLocation +" found on "+dme.name+" DME.");
            log("Success",content.RevContentLocation +" found on "+dme.name+" DME.");
          }
          else {
            contentStatus.Status="NotFound";
            console.log(content.VEMSContentPath +" not found on "+dme.name+" DME.");
            log("Error",content.VEMSContentPath +" not found on "+dme.name+" DME.");
          }
          content.DistributionDetails.push(contentStatus);
        });

        $scope.Config.DMEProcessStatus="Validating "+dme.name+" data with Base DME :: "+$scope.BaseDME.name+" :: Completed";
        console.log("Validating "+dme.name+" data with Base DME :: "+$scope.BaseDME.name+" :: Completed");
        log("Success","Validating "+dme.name+" data with Base DME :: "+$scope.BaseDME.name+" :: Completed");

        //Move Content
        var ValidDataToMove = _.chain($scope.BaseDMEData.contents).filter(function(content){
          return _.chain(content.DistributionDetails).filter(function(s){return s.DMEHost==dme.ipAddress}).some({Status:"Found"}).value()
        }).value();

        console.log("There are "+ValidDataToMove.length+" contents to migrate on DME "+dme.ipAddress);
        log("Success","There are "+ValidDataToMove.length+" contents to migrate on DME "+dme.ipAddress);
        var currentFile=1;
        var totalFiles=ValidDataToMove.length;

        function StartDistribution(arr){
          return arr.reduce(function(promise, item) {
            $scope.Config.DMEProcessStatus="Processing "+dme.name+" :: File "+currentFile+" of "+totalFiles;
              return promise.then(function(result) {
                currentFile++;
                var deferred=$q.defer();
                var distStatus= _.chain(item.DistributionDetails).filter(function(s){return s.DMEHost==dme.ipAddress}).first().value();
                if($scope.DistributionProcessing){
                    if($scope.Config.IngestOrignal){
                      DMEService.MoveFile(item.VEMSContentPath,item.RevContentLocation).then(function(response){
                        var successMsg=item.Title +" moved to "+item.RevContentLocation+" on "+dme.name+" DME.";
                        distStatus="Moved";
                        log("Success",successMsg);
                        //Deleting Other Instances
                        _.forEach(item.Instances,function(instance){
                          DMEService.DeleteFile(instance).then(function(response){
                            log(item.ContentID,item.Title,'Success','Video instance deleted successfully!!!'+instance);
                          },function(error){
                            log(item.ContentID,item.Title,'Error','Video instance does deleted failure!!!'+instance);
                          })
                        })
                        //Deleting Other Instances
                        deferred.resolve(successMsg);
                      },function(errorResponse){
                        var errorMsg=item.VEMSContentPath +" didn't move to "+item.RevContentLocation+" on "+dme.name+" DME."+JSON.stringify(errorResponse);
                        distStatus="Failed";
                        log("Error",errorMsg);
                        deferred.resolve(errorMsg);
                      });
                    }
                    else{
                      DMEService.DeleteFile(item.VEMSContentPath).then(function(response){
                        var successMsg=item.Title +" deleted from "+item.VEMSContentPath+" on "+dme.name+" DME.";
                        distStatus="Moved";
                        log("Success",successMsg);
                        //Deleting Other Instances
                        _.forEach(item.Instances,function(instance){
                          DMEService.DeleteFile(instance).then(function(response){
                            log(item.ContentID,item.Title,'Success','Video instance deleted successfully!!!'+instance);
                          },function(error){
                            log(item.ContentID,item.Title,'Error','Video instance does deleted failure!!!'+instance);
                          })
                        })
                        deferred.resolve(successMsg);
                      },function(errorResponse){
                        var errorMsg=item.VEMSContentPath +" didn't delete from "+item.VEMSContentPath+" on "+dme.name+" DME."+JSON.stringify(errorResponse);
                        distStatus="Failed";
                        log("Error",errorMsg);
                        deferred.resolve(errorMsg);
                      });
                    }
                  }
                  else {
                    deferred.reject("Distribution Cancelled.");
                  }
                return deferred.promise;
              });
          }, $q.when("Init"));
        }
        StartDistribution(ValidDataToMove).then(function(finalresult){
          dme.status="Complete";

          rootDeferred.resolve();
        },function(errorResult){
          dme.status="Cancelled";
          rootDeferred.reject("Cancelled");
        });
      });

    },function(response){
      console.log("Ftp Login failed for "+ftpConfig.host);
      log("Error","Ftp Login failed for "+ftpConfig.host)
      $scope.DistributionProcessing=false;
      rootDeferred.reject();
    });
    return rootDeferred.promise;
}

//Internal functions
function CheckFTPConnection(ftpConfig){
  var deferred=$q.defer();
  var selectedDMEs=_.filter($scope.RevDMEs,function(dme){ return dme.selected==true && dme.id !='00000000-0000-0000-0000-000000000000'});
  var findCurrentDME= _.find($scope.RevDMEs, function(dme){  return dme.ipAddress == ftpConfig.host});
  var currentDMEIndex = findWithAttr(selectedDMEs, 'ipAddress', ftpConfig.host);
  $scope.ftpLabel="Checking DME "+(currentDMEIndex+1)+" of "+selectedDMEs.length+" :  "+findCurrentDME.name;
  log("INFO","Checking DME "+(currentDMEIndex+1)+" of "+selectedDMEs.length+" :  "+findCurrentDME.name);

  DMEService.CheckLogin(ftpConfig).then(function(data){
    if(data.Response=="Success"){
      log("Success",ftpConfig.host + " ftp connection success.");
      deferred.resolve(true);
    }
    else {
      log("Error",ftpConfig.host + " ftp connection failure.");
      deferred.resolve(false);
    }
  },function(response){
    log(response.Response,response.Message);
    deferred.resolve(false);
  });
  return deferred.promise;
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
    return month + "/" + day + "/" +year + " " + hour + ":" + min + ":" + sec;
}
function log(Status,Message){
  $scope.DistributionLog.push({TimeStamp:getDateTime(),Status:Status, Message:Message});
  console.log(Status+" :: "+Message);
  FileLog(getDateTime()+" Status:"+Status+", Message:"+Message);
}
function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
}
}]);
