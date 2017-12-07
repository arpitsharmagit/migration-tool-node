angular.module('migrateApp')

.controller('LoginController',
	['$scope','$rootScope', '$controller','$http', '$q', 'PushService', 'SignalRHubsConnection','SearchService','RevService','AuthenticationService','LoggedUserContext','Session','$location','MaduroSllService','DMEService',
	function ($scope, $rootScope, $controller, $http, $q, PushService, SignalRHubsConnection,SearchService, RevService,AuthenticationService,UserContext,Session,$location, MaduroSllService,DMEService) {
		$rootScope.$on('UserContext.Authenticated',function(){
			setInterval(function(){
			  Session.extendTimeout();
			}, 5*60*1000);
		});

		$rootScope.isCollapsedLogin = false;
		$rootScope.isCollapsedApp = true;

		//default config
		$scope.config= {
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
		$rootScope.config = $scope.config;

		$scope.status = {
			loading: false,
			processing: false,
			error: false,
			badCredentials: false,
			suspended: false,
			maintenance: false,
			lockedOut: false,
			connected: false,
			validRevUrl:false
		}

		$rootScope.categories;
		$rootScope.videos = [];

		var resetStatus = function () {
			$scope.status.loading = false,
			$scope.status.processing = false,
			$scope.status.error = false,
			$scope.status.badCredentials = false,
			$scope.status.suspended = false,
			$scope.status.maintenance = false,
			$scope.status.lockedOut = false,
			$scope.status.connected = false,
			$scope.status.validRevUrl = false
		};
		resetStatus();

		angular.extend($scope, {
			CheckConnection: function () {
				if (!$scope.status.validRevUrl && !$scope.status.processing) {
					$scope.status.processing = true;
					var revURL = $scope.config.rev.url + '/push/signalr';
					var connection = $.hubConnection(revURL, { useDefaultPath: false });
					connection.createHubProxy('push');
					connection.start().then(function () {
						$scope.status.validRevUrl = true;
						$scope.status.processing = false;

						if (!$scope.$$phase) {$scope.$apply();}
						console.log('Checking SignalR connection:: Success');
						connection.stop();
					}, function (error) {
						console.log('Checking SignalR connection:: Failed');
						$scope.status.validRevUrl = false;
						$scope.status.processing = false;

						$scope.error = error;
						alert('Unable to connect to Rev.  Please check the Rev URL or contact your system administrator.');
						if (!$scope.$$phase) {$scope.$apply();}
					});
				}
			},
			authenticateUser: function (username, password) {
				return $q.all([Connect()]).then(function () {
					return AuthenticationService.authenticateUser(username,password);
				}, function (status) {
					console.log('Connection status: ' + status);
					return $q.reject('ConnctionFailed');
				});
			},
      submit: function () {
      	$scope.status.loading = true;
      	$scope.loginStatus ={processing: true};
      	this.authenticateUser($scope.config.rev.username, $scope.config.rev.password)
      	.then(function (user) {
					$rootScope.$broadcast('UserContext.Authenticated');
      		console.log('logged in as ' + JSON.stringify(user.username));
					$rootScope.defaultUploader=user.username;
      		var accountId,baseURL;
					baseURL=$scope.config.rev.url.replace(/\+$/, '');
      		RevService.init(baseURL);
					SearchService.init(baseURL);

      		RevService.setToken(user.token);
      		RevService.getAccountId(user.id).then(function (accountId) {
      			console.log('AccountId as '+accountId);
      			accountId= accountId;
						$rootScope.accountId = accountId;
      		});

      		PushService.setToken(user.token);

      		$scope.status.authenticated = true;
      		$rootScope.isCollapsedLogin = true;
      		$rootScope.isCollapsedApp = false;
      		$rootScope.revToken = user.token;
      		UserContext.setUser(user,accountId);
					$rootScope.userId = user.id;

      		//console.log(JSON.stringify(UserContext.getUser()));
      		MaduroSllService.init(
					$scope.config.vems.url,
					$scope.config.vems.username,
					$scope.config.vems.password,
					//$scope.config.vemsApplicationId,
					$scope.config.vems.ClientIP,
					null);
					$rootScope.config = $scope.config;
        	MaduroSllService.UserLogin(loginOnSuccess);
      	}, function (error) {
      		$scope.status.error = true;
      		console.log('Rev log-in failed. ' + JSON.stringify(error));
      		alert("Rev login failed.  Please check your credentials or contact your system administrator.");
      		$scope.loginStatus.processing = false;
      		return;
      	});
			},
			saveConfig:function(){
				DMEService.SetConfig($scope.config).then(function(data){
					FileLog("Confguration Saved. "+JSON.stringify($scope.config));
					alert("Confguration Saved.");
				},function(err){
					FileLog(err);
					alert("Some error occured while saving configuration. Please check Log.");
				})
			}
		});

		DMEService.GetVersion().then(function(appVersion){
			$rootScope.appVersion=appVersion;
			console.log($rootScope.appVersion);
		});

		DMEService.GetConfig().then(function(appConfig){
			$rootScope.appConfig=appConfig;
			$scope.config=appConfig;
			console.table($rootScope.appConfig);
			angular.forEach($scope.revForm.revForm.$error.required, function(field) {
			    field.$setDirty();
			});
		});

		function loginOnSuccess(result) {
		   if (result.Exception) {
		     console.log("Vems login failed.  " + result.Exception.LocalizedMessage);
		     alert("VEMS login failed.  Please check your credentials or contact your system administrator.")
		     $scope.loginStatus.processing = false;
		     $scope.$apply();
		     return;
		   }
		   UserContext.SetVemsSessionId(result.SessionID);
		   UserContext.SetServerDetails({vemsUrl : $scope.config.vems.url, revUrl : $scope.config.rev.url});
			 $rootScope.RevURL=$scope.config.rev.url;
			 MaduroSllService.StoredServersGetAll(result.SessionID, storedServersGetAllOnSuccess);
		   $scope.loginStatus.processing=false;
		   $location.path('/Migration');
		   $scope.$apply();
		 }

		 function Connect(){
		 	var revURL = $scope.config.rev.url + '/push/signalr';
		 	var deferred = $q.defer();

		 	SignalRHubsConnection.setUrl(revURL, {
		 		useDefaultPath: false,
		 		logging: false
		 	});

		 	SignalRHubsConnection.start({ waitForPageLoad: false })
		 	.then(function () {
		 		$scope.status.connected = true;
		 		console.log('SignalR connection Established.');
		 		deferred.resolve('connected');
		 	}, function (error) {
		 		console.log('SignalR connection Failed.' + error);
		 		$scope.status.connectionError = true;
		 		$scope.error = error;
		 		deferred.reject('disconnected');
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

		 function storedServersGetAllOnSuccess(result) {
				 var storedServers = result.Entities;
				 var dmeServers = _.map( _.filter(storedServers, function(server){
						 return _.some(server.StoredServerPublishingPoints, function(point){
								 return point.EnumPublishingPointTypeValue == "FileServerHTTP";
						 });
				 }), function(dme){
					var filteredDME = {};
					filteredDME.name = dme.Name;
					var fileServerHTTPPubPoint = _.find(dme.StoredServerPublishingPoints, function(pubPoint){
					 return pubPoint.EnumPublishingPointTypeValue == "FileServerHTTP";
					});
					filteredDME.id =  fileServerHTTPPubPoint.StoredServerPublishingPointID;
					filteredDME.user = fileServerHTTPPubPoint.FtpUserName;
					filteredDME.pass = fileServerHTTPPubPoint.FtpPassword;
					filteredDME.port = fileServerHTTPPubPoint.FtpPort;
					filteredDME.debugMode = false;
					filteredDME.host = dme.StoredServerEntryPoints[0].HostName;
					return filteredDME;
				 });
				 var selectDME={
					 name:"---Select DME---",
					 id:"0",
					 user:undefined,
					 pass:undefined,
					 port:undefined,
					 host:undefined,
					 debugMode:false
				 };
				 dmeServers.unshift(selectDME);
				$rootScope.dmes = dmeServers;
		 }

		 $scope.status.loading = true;
}])
