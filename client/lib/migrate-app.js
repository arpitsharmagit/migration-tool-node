'use strict';
// jshint: browser:true
/* global angular:true, window:true, _:true, Q:true */

var migrateApp = angular.module('migrateApp', ['ui.bootstrap',
                                              'ui.codemirror',
                                              //'smart-table',
                                              'ngResource',
                                              'VBrick.Util',
                                              'VBrick.Date',
                                              'VBrick.SignalR',
                                              'ui.router',
                                              'VBrick.Push',
                                              'ngRoute',
                                              'ngTable'
                                              ]);

if (typeof window !== 'undefined') {
  window.migrateApp = migrateApp;
}
migrateApp.filter('rightArrow',function() {
    return function(input) {
        if (input) {
            return input.replace(/\//g, ' -> ');
        }
    }
});
migrateApp.config(function ($routeProvider) {

    $routeProvider.when('/login', {

         templateUrl: "Templates/Login.html",
         controller: 'LoginController'
     }).when('/Migration', {
        templateUrl: "Templates/MigrationData.html",
        controller: 'MigrationDataController'
    }).otherwise({
        redirectTo: '/login'
      });

    //$locationProvider.html5Mode(true);
});
migrateApp.directive('onlyDigits', function () {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, element, attr, ctrl) {
        function inputValue(val) {
          if (val) {
            var digits = val.replace(/[^0-9]/g, '');

            if (digits !== val) {
              ctrl.$setViewValue(digits);
              ctrl.$render();
            }
            return parseInt(digits,10);
          }
          return undefined;
        }
        ctrl.$parsers.push(inputValue);
      }
    };
});
migrateApp.constant('SearchConstants', {
	maxDate: '9999-01-01T00:00:00Z',
	defaultScrollId: '',
	defaultSortField: '_score',
	sortAscending: 'asc',
	sortDescending: 'desc',
	initialPageSize: 100,
	pageSize: 300,
	itemTypes: {
		accessEntities: 'accessEntity',
		devices: 'device',
		videos: 'video'
	},
	accessEntityTypes: {
		user: 'User',
		team: 'Collection',
		group: 'Group',
		role: 'Role'
	}
})
.factory('SearchService',
       ['$resource', 'DateUtil', 'Util', 'SearchUtil', 'SearchConstants',
function($resource,   DateUtil,   Util,   SearchUtil, SearchConstants) {
    var urlBase = '';
    var searchResource = $resource(':BaseUrl/search/accounts/:accountId/:itemType');
    var countResource = $resource(':BaseUrl/search/accounts/:accountId/:itemType/count');

	return {
		itemTypes: SearchConstants.itemTypes,
		initialPageSize: SearchConstants.initialPageSize,
		pageSize: SearchConstants.pageSize,

		init : function (url) {
		    urlBase = url;
		},
		getDevices: function(searchParams) {
			return search(SearchConstants.itemTypes.devices, searchParams)
				.then(function(result){
					return {
						totalHits: result.totalHits,
						devices: result.hits
					};
				});
		},

		queryAccessEntities: function (searchParams) {
			searchParams.query = splitTerms(searchParams.query);

			if (searchParams.ids) {
				searchParams.query = appendValueListClause(searchParams.query, 'id', searchParams.ids);
			}

			if (searchParams.groupIds) {
				searchParams.query =  appendValueMatchClause(searchParams.query, 'GroupIds', searchParams.groupIds);
			}

			if(searchParams.type) {
				var appendFn = Array.isArray(searchParams.type) ? appendValueListClause : appendValueMatchClause;
				searchParams.query = appendFn(searchParams.query, 'Type', searchParams.type, true);
			}

			if(searchParams.sourceType) {
				searchParams.query = appendValueMatchClause(searchParams.query, 'SourceType', searchParams.sourceType, true);
			}

			return search(SearchConstants.itemTypes.accessEntities, searchParams)
				.then(function(result){
					return {
						totalHits: result.totalHits,
						accessEntities: result.hits,
						scrollId: result.scrollId
					};
				});
		},

		getVideos: function(searchParams) {

			//var userId = UserContext.getUser().id;
			//searchParams.accountId = UserContext.getAccount().accountId;

			if(searchParams.uploaded){
				searchParams.query = appendDateRangeClause(searchParams.query, 'WhenUploaded', searchParams.uploaded);
			}

			if (searchParams.category) {
				searchParams.query = appendValueMatchClause(searchParams.query, 'CategoryIds', searchParams.category);
			}

			if(searchParams.myUploads){
			    searchParams.query = appendValueMatchClause(searchParams.query, 'UploaderUserId', searchParams.userId);
			}

			if (searchParams.status) {
				searchParams.query = appendValueMatchClause(searchParams.query, 'IsActive', searchParams.status === 'active');
			}

			if (searchParams.ready) {
				searchParams.query = appendValueMatchClause(searchParams.query, 'Status', 'Ready', true);
			}

			if (searchParams.pendingApproval) {
				searchParams.query = appendValueMatchClause(searchParams.query, 'ApprovalStatus', 'PendingApproval');
			}

			if (searchParams.approvalProcessTemplateIds) {
				searchParams.query =  appendValueListClause(searchParams.query, 'ApprovalProcessTemplateId', searchParams.approvalProcessTemplateIds);
			}

			if (searchParams.uncategorized) { //really prepending and sequence seems to matter for this one
				searchParams.query = appendValueMatchClause(searchParams.query, '-CategoryIds', '*', true);
			} else if (searchParams.categoryPathIds) {
				searchParams.query = appendValueMatchClause(searchParams.query, 'CategoryPathIds', searchParams.categoryPathIds);
			}

			if(searchParams.videoType) {
				if (searchParams.videoType.toLowerCase() === 'live') {
					searchParams.query = appendValueMatchClause(searchParams.query, 'IsLive', true);
				} else if (searchParams.videoType.toLowerCase() === 'vod') {
					searchParams.query = appendValueMatchClause(searchParams.query, 'IsLive', false);
				}
			}

			return search(SearchConstants.itemTypes.videos, searchParams)
				.then(function(result){
          var finalresult={
						totalHits: 0,
						videos: [],
						scrollId: 0
					};
          if(result && result.totalHits !='undefined'){
            finalresult={
  						totalHits: result.totalHits,
  						videos: result.hits,
  						scrollId: result.scrollId
  					};
          }
					return finalresult;
				});
		},

		getCount: function(accountId, itemType, query){
			return countResource.get({itemType: itemType, accountId: accountId, q: query}).$promise
				.then(function(result){
					return result.count;
				});
		}
	};

	function search(itemType, searchParams) {
		searchParams.scrollId = searchParams.scrollId || SearchConstants.defaultScrollId;

		return $resource(urlBase+'/search/accounts/:accountId/:itemType').get({
			itemType: itemType,
			accountId: searchParams.accountId,
			q: searchParams.query,
			sortField: searchParams.sortField.toLowerCase() === SearchConstants.defaultSortField ? '' : searchParams.sortField,
			sortDirection: searchParams.sortAscending ? SearchConstants.sortAscending : SearchConstants.sortDescending,
			count: searchParams.count,
			qf: searchParams.qf,
			scrollId: searchParams.scrollId,
			fl: searchParams.fl
		}).$promise
			.then(function (result) {
				return {
					totalHits: result.totalHits,
					hits: SearchUtil.readSearchResult(result.hits),
					scrollId: result.scrollId
				};
			}, function (response) {
			    console.log(response);
			});
	}


	function appendDateRangeClause(query, fieldName, dateRangeName){

		var startDate, endDate;
		switch(dateRangeName){
		case 'today':
			startDate = DateUtil.getToday();
			break;

		case 'yesterday':
			startDate = DateUtil.getYesterday();
			endDate = DateUtil.getToday();
			break;

		case 'thisWeek':
			startDate = DateUtil.getStartOfWeek();
			break;

		case 'thisMonth':
			startDate = DateUtil.getStartOfMonth();
			break;

		case 'thisYear':
			startDate = DateUtil.getStartOfYear();
			break;

		default:
			throw new Error("Unknown date range: " + dateRangeName);
		}

		endDate = endDate ? endDate.toISOString() : SearchConstants.maxDate;

		return fieldName + ':[' + startDate.toISOString() + '+TO+' + endDate + ']' +
			( query ? ' AND (' + query + ')' : '');
	}

	function appendValueMatchClause(query, field, value, noQuotes){
		var quote = noQuotes ? '' : '"';

		return field + ':' + quote + value + quote +
			(query ? ' AND ' + query : '');
	}

	function appendOrClause(query1, query2) {
		return '(' + query1 + ') OR (' + query2 + ')';
	}

	function appendValueListClause(query, field, values) {
		return field + ':' + '(' + values.join('%20OR%20') + ')' +
			(query ? ' AND ' + query : '');
	}

	function splitTerms(query) {
		if (!query) {
			return '';
		}

		// if the user put in quotes or ampersands, or if there are already boolean operators in the query, send it as is
		if (query.match(/\"|AND |NOT /)) {
			return 'All:(' + query.replace(/ /g,"%20") + ')';
		}

		return 'All:' + "*" + query.replace(/ /g,"*%20*") + "*";
	}
}]);

migrateApp.factory('AuthenticationService',
       ['PushService', '$q', '$resource','$http',
function(PushService,   $q,   $resource, $http) {
    var baseURL;
    return {
        setBaseUrl:function(url)
        {
            baseURL=url;
        },
        //Authenticate user with the user's credentials. returns a promise that will resolve with the users auth token.
        authenticateUser: function (username, password) {
            return PushService.dispatchCommand("network:LogOn", {
                username:username,
                password:password
            }, ["LoggedOn", "LogOnFailed", "LogOnFailedMaintenance"]).then(function(result) {
                if (result.eventType === 'LoggedOn') {
                    return result.message;
                }
                else if (result.eventType === 'LogOnFailed') {
                    return $q.reject('LogOnFailed');
                }
                else if (result.eventType === 'LogOnFailedMaintenance') {
                    return $q.reject('LogOnFailedMaintenance');
                }
                else {
                    return $q.reject();
                }
            }, function(result) {
                if(result) {
                    if (result.hasIssue('LockedOut')) {
                        return $q.reject('LockedOut');
                    }
                    else if (result.hasIssue('NotActive')) {
                        return $q.reject('NotActive');
                    }
                }
                return $q.reject(result);
            });
        },


        //Session keep alive api.
        extendSessionTimeout: function(userId) {
            return  PushService.dispatchCommand("network:ExtendSessionTimeout", {
                userId: userId
            });
        },

        checkSessionHealth: function () {
            return $resource(baseURL+'/session').get().$promise;
        }
    };
}]);

migrateApp.factory('LoggedUserContext',
       ['AuthenticationService', '$rootScope', '$q', 'CookieUtil', 'PromiseUtil','RevService',
function(AuthenticationService,   $rootScope,   $q,   CookieUtil,  PromiseUtil, RevService){

    var accessTokenCookie = 'vbrickAccessToken';
    var vemsSessionId = '';
    var server = {
        vemsUrl : '',
        revUrl : ''
    };
    var userInfo = {
        accessToken: null,
        sessionStable: false,
        //The logged in user
        user: undefined,
        //The account the user is logged into
        accountId: ''
    };

    return {
        setUser: function(user,accountId){
            userInfo.accessToken =user.token;
            userInfo.sessionStable=!!user.token;
            userInfo.user=user;
            userInfo.accountId=accountId;
        },
        /**
      Returns the user who is currently logged in:
      { id, username }
    **/
        getUser: function(){
            return userInfo.user || {};
        },
        SetVemsSessionId : function(vemsid){
            userInfo.vemsSessionId = vemsid;
        },
        GetVemsSessionId : function(){
            return userInfo.vemsSessionId;
        },
        SetServerDetails : function(srv){
            server.vemsUrl = srv.vemsUrl;
            server.revUrl = srv.revUrl;
        },
        GetServerDetails : function(){
            return server;
        },
        setCookie:function(cookie){
            CookieUtil.set(accessTokenCookie,cookie);
        },
        getCookie:function(){
            return CookieUtil.get(accessTokenCookie);
        },
        removeCookie:function(){
            CookieUtil.unset(accessTokenCookie);
        },
        /**
      {id,name}
    **/
        getAccount: function(){
            return userInfo.account;
        },


        getAccessToken: function(){
            return userInfo.accessToken;
        },

        isUserAuthenticated: function(){
            return !!userInfo.accessToken;
        },

        isSessionStable: function(){
            return userInfo.sessionStable;
        },

        /**
      Attempt to authenticate a user
      Returns a promise object:
        If the login attempt fails, the promise will be rejected with the following result object:
        {
          isAuthenticateFailure - true if the user was not authenticated
          attemptsRemaining - If authentication failed, number of attempts that will be allowed until the account is locked.
          whenUnlocked - If the account was locked, date the account will be unlocked
        }
    **/
        authenticateUser: function(username, password){
            return AuthenticationService.authenticateUser(username, password)
        .then(function(user){
            if(user){
                var accountId;
                RevService.getAccountId(user.id).then(function (accountId) {
                    accountId= accountId;
                });;
                return initializeUserAuthentication(user,accountId);
            }
        });
        },

        /**
      Ends the users authenticated session. Logs the user out and invalidate the current access token
      returns promise

      localLogOut: do not call the logout server api.
    **/
        logOutUser: function(localLogOut){
            CookieUtil.unset(accessTokenCookie);
            return (localLogOut ? $q.when(true) : UserAuthenticationService.doLogout(userInfo.user.id))
          .finally(function(){
              userInfo.accessToken = null;
              userInfo.sessionStable = false;
              userInfo.user = null;

              $rootScope.$broadcast('LoggedUserContext.Change');
          });
        }
    };

    /**
   * Create the initial state of the user authentication
   * @param accessToken
   * @param user
   */
    function initializeUserAuthentication(user,accountId){
        userInfo.accessToken =user.token;
        userInfo.sessionStable=!!user.token;
        userInfo.user=user;
        userInfo.accountId=accountId;

        CookieUtil.set(accessTokenCookie, userInfo.accessToken);
        $rootScope.$broadcast('LoggedUserContext.Authenticated');

        return waitForSessionToStabilize()
      .then(function(){
          userInfo.sessionStable = true;
          $rootScope.$broadcast('LoggedUserContext.Change');
      });
    }

    function waitForSessionToStabilize(){
        return PromiseUtil.retryUntilSuccess(function(){
            return AuthenticationService.checkSessionHealth();
        });
    }

}]);

migrateApp.factory('Session', ['LoggedUserContext', 'AuthenticationService', '$state', '$location', 'SignalRHubsConnection','$rootScope',
function(UserContext, AuthenticationService, $state, $location, SignalRHubsConnection,$rootScope){

    var sessionKeepAliveInterval = 1 * 60000;

    var Session = {
        extendTimeout: function(){
            if(!UserContext.isUserAuthenticated()){
                throw new Error("There is no active session");
            }
            extendSessionTimeoutImpl();
        },


        createKeepalive: function(){
            var timer;

            var self = {
                begin: function(){
                    if(!UserContext.isUserAuthenticated()){
                        return;
                    }

                    keepAlive();

                    function keepAlive(){
                        timer = window.setTimeout(keepAlive, sessionKeepAliveInterval);
                        extendSessionTimeoutImpl();
                    }

                    return this;
                },

                beginWhenConnected: function() {
                    //if connected to SignalR, then go ahead and begin the keepAlive
                    if (SignalRHubsConnection.getConnectionStatus() === SignalRHubsConnection.State.Connected) {
                        console.log("Keep session alive begins.");
                        this.begin();
                    } else { //otherwise, wait for the connection and then begin
                        SignalRHubsConnection.on('stateChanged', onSignalRStateChange);
                    }

                    return this;
                },

                end: function(){
                    window.clearTimeout(timer);
                    timer = null;
                    SignalRHubsConnection.off('stateChanged', onSignalRStateChange);

                    return this;
                }
            };


            function onSignalRStateChange(change) {
                if (change.newState === SignalRHubsConnection.State.Connected) {
                    SignalRHubsConnection.off('stateChanged', onSignalRStateChange);

                    self.begin();
                }
            }

            return self;
        },
    };
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
    var extendSessionTimeoutImpl = _.throttle(function(){
        if(UserContext.isUserAuthenticated()){
          console.log("Session Extending."+getDateTime());
          AuthenticationService.extendSessionTimeout(UserContext.getUser().id, UserContext.getUser().accountId)
          .catch(function(err){
              if(err.hasIssue("CommandDenied")){
                  $location.url('/login');
                  console.log("Cannot do command: ", err);
              }
          });
        }
    }, sessionKeepAliveInterval);

    return Session;
}]);

migrateApp.config(['SignalRHubsConnectionProvider', function (SignalRHubsConnectionProvider) {
        SignalRHubsConnectionProvider.setConnectionOptions({
            useDefaultPath: false,
            logging: false
        });
    }]);

migrateApp.config(['$httpProvider', function($httpProvider) {

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    //keep session alive if http requests are going through;
    $httpProvider.interceptors.push(['$injector', function($injector) {
        var UserContext, Session;
        var isReady;

        //injecting UserContext would create a circular dependency -
        //  UserContext depends on http, and http depends on the httpProvider interceptors.
        return {
            request: function(config){
                //console.log(config);
                tryExtendSessionTimeout();
                return config;
            },
            response:function(response){
              var status = response.status;
              if (status == 401) {
                var location = $injector.get('$location') ;
                location.url("/login");
                return $q.reject(response);
              }
              return response;
            }
        };

        function tryExtendSessionTimeout(){
            try{
                if(!isReady){
                    var SignalRHubsConnection = $injector.get('SignalRHubsConnection') ;
                    var baseURL=$injector.get('RevService').getBaseUrl();
                    if(SignalRHubsConnection.getConnectionStatus() !== SignalRHubsConnection.State.Connected && baseURL===''){
                        return;
                    }

                    UserContext = $injector.get('LoggedUserContext');
                    Session = $injector.get('Session');
                    isReady = true;
                }

                if(UserContext.isSessionStable()){
                    Session.extendTimeout();
                }
            }catch(e){}
        }

    }]);
}]);
angular.module("qImproved", [])
.config(function ($provide) {
  $provide.decorator("$q", function ($delegate) {
    //Helper method copied from q.js.
    var isPromiseLike = function (obj) { return obj && angular.isFunction(obj.then); }

    /*
     * @description Execute a collection of tasks serially.  A task is a function that returns a promise
     *
     * @param {Array.<Function>|Object.<Function>} tasks An array or hash of tasks.  A tasks is a function
     *   that returns a promise.  You can also provide a collection of objects with a success tasks, failure task, and/or notify function
     * @returns {Promise} Returns a single promise that will be resolved or rejected when the last task
     *   has been resolved or rejected.
     */
    function serial(tasks) {
      //Fake a "previous task" for our initial iteration
      var prevPromise;
      var error = new Error();
      angular.forEach(tasks, function (task, key) {
        var success = task.success || task;
        var fail = task.fail;
        var notify = task.notify;
        var nextPromise;

        //First task
        if (!prevPromise) {
          nextPromise = success();
          if (!isPromiseLike(nextPromise)) {
            error.message = "Task " + key + " did not return a promise.";
            throw error;
          }
        } else {
          //Wait until the previous promise has resolved or rejected to execute the next task
          nextPromise = prevPromise.then(
            /*success*/function (data) {
              if (!success) { return data; }
              var ret = success(data);
              if (!isPromiseLike(ret)) {
                error.message = "Task " + key + " did not return a promise.";
                throw error;
              }
              return ret;
            },
            /*failure*/function (reason) {
              if (!fail) { return $delegate.reject(reason); }
              var ret = fail(reason);
              if (!isPromiseLike(ret)) {
                error.message = "Fail for task " + key + " did not return a promise.";
                throw error;
              }
              return ret;
            },
            notify);
        }
        prevPromise = nextPromise;
      });

      return prevPromise || $delegate.when();
    }

    $delegate.serial = serial;
    return $delegate;
  });
});
