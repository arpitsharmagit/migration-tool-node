(function(){
	'use strict';

	function isiDevice(){
		return navigator.userAgent.match(/ipad|iphone|ipod/i);
	}

	Modernizr.addTest('multiplefileinput', function () {
		return !isiDevice() &&  'multiple' in document.createElement('input');
	});
})();;

window.nv.dev=false;;

/**
	Polyfill any missing native js methods
**/
(function(){
	'use strict';

	''.trim || (String.prototype.trim = // Use the native method if available, otherwise define a polyfill:
		function () {
			return this.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g,'');
		});


})();

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
	'use strict';

	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame){
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame){
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
}());

// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
(function (con) {
	'use strict';
	var prop, method;
	var empty = {};
	var dummy = function() {};
	var properties = 'memory'.split(',');
	var methods = ('assert,count,debug,dir,dirxml,error,exception,group,' +
		'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
		'time,timeEnd,trace,warn').split(',');
	while (prop = properties.pop()){
		con[prop] = con[prop] || empty;
	}
	while (method = methods.pop()){
		con[method] = con[method] || dummy;
	}
})(window.console = window.console || {});;

'use strict';

_.mixin({
/**
Taken from : https://github.com/jashkenas/underscore/issues/310
Allows accumulation of arguments accross calls to a throttled/debounced function.

func: function to throttle
combine(allargs, arg1, arg2, ...): function, reduces arguments that will eventually be passed to func
	allargs:	the value returned from the previous call to combine()
	args: the arguments of the current call
	returns: next value of allargs

Example:
	delayLog = _.debounceReduce(
		function() { console.log(arguments); },
		function(acc,args) {
			return (acc || []).concat(args);
		}, 5000);
	delayLog(3,4);
	delayLog(7,8,9);

	//After 5 seconds, calls console.log with the array [3,4,7,8,9]
**/
	debounceReduce: function(func, combine, wait) {
		var allargs,
		context,
		wrapper = _.debounce(function() {
			var args = allargs;
			allargs = undefined;
			func.apply(context, args);
		},	wait);

		return function() {
			context = this;
			allargs = combine.apply(context, [allargs,	Array.prototype.slice.call(arguments,0)]);
			wrapper();
		};
	},

	/**
		Modification of find() function, returns the index instead of the actual object.
		Returns -1 if not found;
	**/
	findIndexBy: function(array, iterator, context){
		var index = -1;
		_.any(array, function(value, i, list){
			if(iterator.call(context, value, i, list)){
				index = i;
				return true;
			}
		});
		return index;
	},

	deepEquals: function(a, b){
		if( a == b){
			return	true;
		}
		var equal = true;
		var i, len;
		if(_.isArray(a) && _.isArray(b) && a.length === b.length){
			for(i=0, len=a.length; i < len; i++){
				if(!_.deepEquals(a[i], b[i])){
					equal = false;
					break;
				}
			}
			return equal;
		}
		else if(_.isObject(a) && _.isObject(b)){
			var aKeys = _.keys(a);
			var bKeys = _.keys(b);
			if(aKeys.length !== bKeys.length){
				return false;
			}
			for(i=0, len=aKeys.length; i < len; i++){
				var key = aKeys[i];
				if(!_.deepEquals(a[key], b[key])){
					equal = false;
					break;
				}
			}
			return equal;
		}
		return false;
	},


	deepClone: function(obj) {
		if (!_.isObject(obj) || _.isFunction(obj)) {
			return obj;
		}

		if (_.isDate(obj)) {
			return new Date(obj.getTime());
		}

		if (_.isRegExp(obj)) {
			return new RegExp(obj.source, obj.toString().replace(/.*\//, ""));
		}

		var isArray = _.isArray(obj || _.isArguments(obj));
		var deepClone = _.deepClone;

		return _.reduce(obj, function(memo, value, key) {
			if (isArray) {
				memo.push(deepClone(value));
			} else {
				memo[key] = deepClone(value);
			}
			return memo;
		}, isArray ? [] : {});
	},



	sortByDesc: function(obj, iterator, context) {
		if(!_.isFunction(iterator)){
			var prop = iterator;
			iterator = function(obj){ return obj[prop]; };
		}

		return _.pluck(_.map(obj, function(value, index, list) {
			return {
				value: value,
				index: index,
				criteria: iterator.call(context, value, index, list)
			};
		}).sort(function(left, right) {
			var a = left.criteria;
			var b = right.criteria;
			if (a !== b) {
				if (a < b || a === void 0){
					return 1;
				}
				if (a > b || b === void 0){
					return -1;
				}
			}
			return left.index - right.index;
		}), 'value');
	},

	/**
	 * This function is in some versions of underscore
	 * This source was taken from http://underscorejs.org/docs/underscore.html
	 */
	partition: function(array, predicate) {
		var pass = [], fail = [];
		_.each(array, function(elem) {
			(predicate(elem) ? pass : fail).push(elem);
		});
		return [pass, fail];
	},

	/**
	 * Take elements from an array while the callback returns true
	 * implementation taken from https://gist.github.com/tokland/1222480#file-underscore_extensions-js-L35
	 */
	takeWhile: function(list, callback, context) {
		var xs = [];
		_.some(list, function(item, index, list) {
			var res = callback.call(context, item, index, list);
			if (res) {
				xs.push(item);
				return false;
			} else {
				return true;
			}
		});
		return xs;
	},

	flattenTree: function(tree, childPropertyName) {
		var result = [];
		_.each(tree, function(node) {
			result.push(node);
			result = result.concat(_.flattenTree(node[childPropertyName]));
		});
		return result;
	}
});;

'use strict';

angular.module("VBrick.Analysis", [])

.factory('AnalysisTransforms', ['Util', 'dateFilter', function(Util, dateFilter) {
	var self = {

		analysisNestedListToD3TimeSeries: function(obj, name, key, val) {
			return [{
				key: name || "",
				values: _.map(obj, function(o) {
					return [
						_.find(o.value, function(v) {
							return v.key === key;
						}).value,
						_.find(o.value, function(v) {
							return v.key === val;
						}).value
					];
				})
			}];
		},

		analysisListToD3TimeSeries: function(obj, name) {
			var self = this;
			return [{
				key: name || "",
				values: _.map(obj, function(keyValue) {
					return [
						Util.parseUTCDate(keyValue.key),
						keyValue.value
					];
				})
			}];
		},

		analysisListToD3TimespanSeries: function(obj, name) {
			return [{
				key: name || "",
				values: _.map(obj, function(keyValue) {
					return [
						Util.parseCSharpTimespan(keyValue.key),
						keyValue.value
					];
				})
			}];
		},

		analysisListToD3Series: function(obj, name) {
			return [{
				key: name || "",
				values: _.map(obj, function(val) {
					return [
						val.key,
						val.value
					];
				})
			}];
		},

		analysisListToD3DataArray: function(obj) {
			return _.map(obj, function(val) {
				return {
					key: val.key,
					value: val.value
				};
			});
		},

		/* calendar based weeks
		    this is a sample of how to use calendar aware labels if we decide to move away from just an interval
		 */
		/*xAxisTicksWeeks: function(series){
			var d3=window.d3;
			return d3.time.monday.range(
				new Date("2014 01"),
				new Date("2015 01"),
				1
			);
		},*/

		xAxisTicks: function(series){

			return _.chain(series[0].values)
				.map(function(pair, i){
					return i % 5 ? null : pair[0];
				})
				.compact()
				.value();
		},

		formatDate: function(date){
			return dateFilter(date, 'MMM d');
		},

		formatUTCDate: function(date) {
			var utc = new Date(date);
			utc.setMinutes(utc.getMinutes() + utc.getTimezoneOffset());
			return self.formatDate(utc);
		},

		formatInteger: function(val){
			return d3.format('d')(val);
		}
	};

	return self;
}]);;

'use strict';

angular.module("VBrick.Date", [])

.value('DateUtil', {
	fromTimestamp: function(t){
		var d = new Date();
		d.setTime(t);
		return d;
	},

	getToday: function(){
		return this.getStartOfDay();
	},
	getYesterday: function(){
		return this.getStartOfDay(this.addDays(new Date(), -1));
	},

	///returns a new Date set to the beginning of the given day/week/month/year
	//d:  a date object or null. If null then current time is used.
	getStartOfDay: function(d){
		d = d ? new Date(d.getTime()) : new Date();
		d.setMilliseconds(0);
		d.setSeconds(0);
		d.setMinutes(0);
		d.setHours(0);
		return d;
	},

	//returns current time of day in ms.
	getTimeOfDay: function(d){
		return d.getTime() - this.getStartOfDay(d).getTime();
	},

	getStartOfWeek: function(d){
		d = this.getStartOfDay(d);
		d.setDate(d.getDate() - d.getDay());
		return d;
	},
	getStartOfMonth: function(d){
		d = this.getStartOfDay(d);
		d.setDate(1);
		return d;
	},
	getStartOfYear: function(d){
		d = this.getStartOfMonth();
		d.setMonth(0);
		return d;
	},

	addHours: function(date, numHours){
		var d = new Date(date.getTime());
		d.setHours(d.getHours() + numHours);
		return d;
	},

	addDays: function(date, numDays){
		var d = new Date(date.getTime());
		d.setDate(d.getDate() + numDays);
		return d;
	},
	addMonths: function(date, numMonths){
		var d = new Date(date.getTime());
		d.setMonth(d.getMonth() + numMonths);
		return d;
	},
	addYears: function(date, numYears){
		var d = new Date(date.getTime());
		d.setFullYear(d.getFullYear() + numYears);
		return d;
	},

	daysBetween: function(d1, d2){
		var day = 24 * 60 * 60 * 1000;
		var delta = (d1.getTime() - d2.getTime())/day;
		return Math.round(delta);
	},

	daysInMonth: function(date){
		var d = new Date(date.getFullYear(), date.getMonth()+1, 0);
		return d.getDate();
	},

	daysInMonthOfYear: function(year, month){
		var d = new Date(year, month+1, 0);
		return d.getDate();
	},

	//gets the UTC Offset in ms
	getOffset: function(date){
		return -date.getTimezoneOffset() * 60 * 1000;
	}
});;

'use strict';

angular.module('VBrick.Shared.Media', []);
;

'use strict';

angular.module('VBrick.Push', ['VBrick.SignalR'])

.provider("PushHub", ['SignalRHubsConnectionProvider', function(SignalRHubsConnectionProvider){
	return SignalRHubsConnectionProvider.registerHubProxy("push", [
			"dispatchCommand",
			"subscribe",
			"unsubscribe",
			"dispatchCommandOnDisconnect",
			"tryCancelDisconnectCommand",
			"publishEvent"
		], [
			"routeMessage"
		]);
}])

.factory('PushService',
       ['$rootScope', '$q', 'PushHub', 'PushBus', 'SignalRHubsConnection', 'Observable',
function($rootScope,   $q,   PushHub,   PushBus,   SignalRHubsConnection,   Observable){

	var commandRouteListeners = {};

	var connectionState;
	SignalRHubsConnection.on({
		stateChanged: onStateChanged,
		reconnected: onReconnect,
		ConnectionReestablished: onReconnect
	});


	return {
		//Sets a token value that will be sent with all requests.
		setToken: function(token){
			PushHub.setState({token: token});
		},

		deleteToken: function(){
			PushHub.setState({token: null});
		},

		dispatchCommand: function(commandType, content, finalEvents){

			try{

				if(commandType === "network:LogOn" || commandType === "network:ConfirmUser"){
					console.log("Dispatching command: ",commandType);
				}
				else if(commandType !== "network:ExtendSessionTimeout") {
					console.log("Dispatching command: ",commandType, content);
				}

				content = JSON.stringify(content || {});

				var dispatchPromise = PushHub.server.dispatchCommand(commandType, "application/json", content, navigator.userAgent);

				var commandPromise = dispatchPromise.then(function(commandId){

					if(commandType !== "network:ExtendSessionTimeout") {
						console.log("Sent Command: ", commandId, commandType);
					}

					return awaitCommandCompletion(commandId, finalEvents);

				}, function(error){
					if(error.message && error.message.indexOf("Call .start() before .send()")>-1){
						if (SignalRHubsConnection.connection && SignalRHubsConnection.connection.state !== SignalRHubsConnection.State.Connected) {
						  SignalRHubsConnection.connection.start();
						}
					}
					else if(error && error.indexOf("Connection")>-1){
						if (SignalRHubsConnection.connection && SignalRHubsConnection.connection.state !== SignalRHubsConnection.State.Connected) {
						  SignalRHubsConnection.connection.start();
						}
					}			
					console.log("Failed to send command: ", error);
					return $q.reject(buildFailureResult({ error: error }));
				});

				commandPromise.$commandId = dispatchPromise;
				return commandPromise;

			}
			catch(e){
				return $q.reject(e);
			}
		},

		registerDisconnectCommand: function(commandType, content, key){
			var connectionId = SignalRHubsConnection.connection.id;
			key = key || connectionId;
			var self = this;
			return self.dispatchCommandOnDisconnect(commandType, content, key)
				.then(function(response){
					return function(){
						return self.cancelDisconnectCommand(key);
					};
				});
		},

		dispatchCommandOnDisconnect: function(commandType, content, key){
			console.log("Schedule disconnect command: ", commandType);
			return PushHub.server.dispatchCommandOnDisconnect(key, commandType, "application/json", JSON.stringify(content), navigator.userAgent)
				.then(function(response){
					console.log("Schedule ok");
					return response;
				}, function(err){
					console.log("Schedule error: ", err);
					return $q.reject(err);
				});
		},

		cancelDisconnectCommand: function(connectionId){
			connectionId = connectionId || SignalRHubsConnection.connection.id;
			console.log("Cancel disconnect command");
			return PushHub.server.tryCancelDisconnectCommand(connectionId)
				.then(function(success){
					console.log(success ? "Cancelled" : "Not Cancelled");
					return success;
				}, function(err){
					console.log("Cancel error: ", err);
					return $q.reject(err);
				});
		},

		publishEvent: function(eventType, content){
			console.log("Publish Event: ", eventType);
			return PushHub.server.publishEvent(eventType, "application/json", JSON.stringify(content), navigator.userAgent)
				.then(function(response){
					console.log("Publish Event success: ", response);
					return response;
				}, function(err){
					console.log("Publish Event error: ", err);
					return $q.reject(err);
				});
		}
	};


	function awaitCommandCompletion(commandId, finalEvents){
		var deferred = $q.defer();


		if(finalEvents && !_.isArray(finalEvents)){
			finalEvents = [finalEvents];
		}

		var handlers = {
			CommandStopped: function(e, message){
				deferred.reject(buildFailureResult(message));
				unsubscribe();
			},
			CommandFailed: function(e, message){
				deferred.notify(buildFailureResult(message));
			},
			CommandDenied: function(e, message) {
				deferred.reject(buildFailureResult({
					issues: [{id: 'CommandDenied'}]
				}));
				unsubscribe();
			}
		};

		if(!finalEvents){
			handlers.CommandFinished = function(e, message){
				deferred.resolve(message);
				unsubscribe();
			};
		}
		else{
			_.each(finalEvents, function(eventType){
				handlers[eventType] = function(e, message){
					deferred.resolve({
						eventType: eventType,
						message: message
					});
					unsubscribe();
				};
			});
		}

		function unsubscribe(){
			PushBus.unsubscribe(commandId, handlers, true);
		}

		PushBus.subscribe(commandId, handlers, true);

		return deferred.promise;

	}

	function buildFailureResult(result){
		return _.extend({
			issues: [],

			hasIssue: function(issueId){
				return _.findIndexBy(this.issues, function(issue) { return issue.id === issueId; }) >= 0;
			},

			hasDomainIssue: function(){
				return _.findIndexBy(this.issues, function(issue) { return issue.origin === 'Domain'; }) >= 0;
			},

			hasPlatformIssue: function(){
				return _.findIndexBy(this.issues, function(issue) { return issue.origin === 'Platform'; }) >= 0;
			}
		}, result||{});
	}

	function onStateChanged(event){
		connectionState = event.newState;
		if(connectionState === SignalRHubsConnection.State.Connected){
			PushBus.resubscribe();
		}
	}

	function onReconnect(event){
		PushBus.resubscribe();
	}




}]);


;

'use strict';


// create the VBrick.Security module object
angular.module('VBrick.Security', ['VBrick.Util', 'ui.router', 'VBrick.Push'])

.run(
       ['UserContext', '$rootScope', '$http', 'PushService', 'SecurityContext',
function(UserContext,   $rootScope,   $http,   PushService,   SecurityContext){

	onUserContextChange();

	$rootScope.$on('UserContext.Authenticated', updateSecurityToken);
	$rootScope.$on('UserContext.Change', onUserContextChange);

	function onUserContextChange(){
		updateSecurityToken();
		SecurityContext.reloadAuthorization();
	}

	function updateSecurityToken(){
		if(UserContext.isUserAuthenticated()){
			var token = UserContext.getAccessToken();
			$http.defaults.headers.common.Authorization = "VBrick " + token;
			PushService.setToken(token);
		}
		else{
			delete $http.defaults.headers.common.Authorization;
			PushService.deleteToken();
		}
	}
}])


.factory('Security.Startup', ['$q', 'SecurityContext', function($q, SecurityContext){

	return SecurityContext.initializationPromise;
}]);;

'use strict';

angular.module("VBrick.SignalR", [])


.provider("SignalRHubsConnection", ['Observable', function(Observable, SignalRStartup){

	var connectionUrl = null;
	var connectionOptions = {};
	var hubProxyCfg = {};

	var ConnectionState = {
		Connecting: 0,
		Connected: 1,
		Reconnecting: 2,
		Disconnected: 4
	};

	return {
		setUrl: function(url){
			connectionUrl = url;
		},
		setConnectionOptions: function(cfg){
			connectionOptions = cfg;
		},

		registerHubProxy: function(name, serverMethods, clientMethods){
			if(hubProxyCfg[name]){
				throw new Error("Hub Proxy already exists: "+name);
			}
			hubProxyCfg[name] = {
				serverMethods: serverMethods,
				clientMethods: clientMethods
			};

			return {
				$get: ['SignalRHubsConnection', function(SignalRHubsConnection){
					return SignalRHubsConnection.getProxy(name);
				}]
			};
		},

		$get: ['$q', '$rootScope', '$log', function($q, $rootScope, $log){
            var hubConnection = $.hubConnection(connectionUrl, connectionOptions);
			var hubProxies = {};
			var connectionObservable = new Observable();

            var startupPromise= awaitStartup();

			_.each(hubProxyCfg, function(proxyCfg, hubName){
				hubProxies[hubName] = createHubProxy(startupPromise, $q, $rootScope, hubConnection, hubName, proxyCfg.serverMethods, proxyCfg.clientMethods);
			});

			_.each([
				//Raised before any data is sent over the connection.
				'starting',
				//Raised when any data is received on the connection. Provides the received data.
				'received',
				//Raised when the client detects a slow or frequently dropping connection.
				'connectionSlow',
				//Raised when the underlying transport begins reconnecting.
				'reconnecting',
				//Raised when the underlying transport has reconnected.
				'reconnected',
				//Raised when the connection state changes. Provides the old state and the new state (Connecting, Connected, Reconnecting, or Disconnected).
				'stateChanged',
				//Raised when the connection has disconnected.
				'disconnected'
			], function(eventName){
				hubConnection[eventName](function(){
					connectionObservable.fire.apply(connectionObservable, _.flatten([eventName, _.toArray(arguments)]));

					if(!$rootScope.$$phase){
						$rootScope.$apply();
					}
				});
			});



			return _.extend(connectionObservable, {

				/**
				 * Starts the signalR connection. Returns a promise that resolves when the connection is established.
				 * Do not start until all hub proxies have been created, during app startup
				 * options - signalR hubConnection options object.
				 *    additionally:
				 *    reconnectRetryAttempts
				 *    reconnectRetryDelay -  if connection is dropped, attempt to reconnect with a delay between attempts.
				 */
    //            initialize: function (connectionUrl, connectionOptions) {

    //                        hubConnection = $.hubConnection(connectionUrl, connectionOptions);

    //                        startupPromise = awaitStartup();

    //                        _.each(hubProxyCfg, function (proxyCfg, hubName) {
    //                            hubProxies[hubName] = createHubProxy(startupPromise, $q, $rootScope, hubConnection, hubName, proxyCfg.serverMethods, proxyCfg.clientMethods);
    //                        });

    //                        _.each([
				////Raised before any data is sent over the connection.
    //                            'starting',
				////Raised when any data is received on the connection. Provides the received data.
    //                            'received',
				////Raised when the client detects a slow or frequently dropping connection.
    //                            'connectionSlow',
				////Raised when the underlying transport begins reconnecting.
    //                            'reconnecting',
				////Raised when the underlying transport has reconnected.
    //                            'reconnected',
				////Raised when the connection state changes. Provides the old state and the new state (Connecting, Connected, Reconnecting, or Disconnected).
    //                            'stateChanged',
				////Raised when the connection has disconnected.
    //                            'disconnected'
    //                        ], function (eventName) {
    //                            hubConnection[eventName](function () {
    //                                connectionObservable.fire.apply(connectionObservable, _.flatten([eventName, _.toArray(arguments)]));

    //                                if (!$rootScope.$$phase) {
    //                                    $rootScope.$apply();
    //                                }
    //                            });
    //                        });
    //                    },

                        setUrl: function (url,cfg) {
                            connectionUrl = url;
                            connectionOptions = cfg;
                            hubConnection.url = url;
                           // hubConnection = $.hubConnection(connectionUrl, connectionOptions);
                        },

				start: function(options, reconnect){
					this.options = options;
					var deferred = $q.defer();

					var userAgent = navigator.userAgent;

					//samsung galaxy note native browser - this is not ideal, but updating SignalR breaks the entire solution
				    //Mozilla/5.0 (Linux; U; Android 4.2.2; en-us; GT-N5110 Build/JDQ39) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30
					if(userAgent.match(/^Mozilla.*Linux.*U.*Android.*AppleWebKit.*KHTML.*Gecko.*Safari/) &&
						userAgent.indexOf("Chrome") == -1) {
						options.transport = options.transport || 'longPolling';
					}

					hubConnection.start(options)
						.done(function(){
							$log.log('Now connected, connection ID=' + hubConnection.id);
							deferred.resolve();

							connectionObservable.fire(reconnect ? "ConnectionReestablished" : "ConnectionEstablished");

							$rootScope.$apply();
						})
						.fail(function(error){
							$log.log('Could not Connect!');
							deferred.reject(error);
							$rootScope.$apply();

						});
					return deferred.promise;
				},

				startupPromise: startupPromise,

				getProxy: function(hubName){
					var proxy = hubProxies[hubName];
					if(!proxy){
						throw new Error("Hub Proxy was not found: "+hubName);
					}
					return proxy;
				},

				getConnectionStatus: function(){
					return this.connection.state;
				},

				connection: hubConnection,

				State: ConnectionState
			});

			function awaitStartup(){
				var deferred = $q.defer();
				connectionObservable.on("stateChanged", handler);

				function handler(e){
					if(e.newState === ConnectionState.Connected){
						deferred.resolve();
						connectionObservable.off("stateChanged", handler);
					}
					else if(e.newState === ConnectionState.Disconnected){
						deferred.reject();
						connectionObservable.off("stateChanged", handler);
					}
				}

				return deferred.promise;
			}

		}]
	};


	function createHubProxy(startupPromise, $q, $rootScope, connection, hubName, serverMethods, clientMethods){

		var proxy = connection.createHubProxy(hubName);
		var invoke = function(methodName){
			var args = arguments;
			return startupPromise.then(function(){
				var deferred = $q.defer();
				try{
					proxy.invoke.apply(proxy, args)
						.done(function(result){
							deferred.resolve(result);
							$rootScope.$apply();
						})
						.fail(function(error){
							deferred.reject(error);
							$rootScope.$apply();
						});
				}
				catch(e){
					deferred.reject(e);
				}
				return deferred.promise;
			});
		};

		var server = {};
		_.each(serverMethods, function(serverMethod){
			server[serverMethod] = _.partial(invoke, serverMethod);
		});

		var client = new Observable();

		var clientImpl = {};
		_.each(clientMethods, function(clientMethod){
			clientImpl[clientMethod] = function(){
				client.fire.apply(client, _.flatten([clientMethod, _.toArray(arguments)]));
				$rootScope.$apply();
			};
		});

		_.each(clientMethods, function(clientMethod){
			proxy.on(clientMethod, clientImpl[clientMethod]);
		});

		return {
			client: client,
			server: server,
			setState: function(state){
				_.each(state, function(value, key){
					if(value != null){
						proxy.state[key] = value;
					}
					else{
						delete proxy.state[key];
					}
				});
			}
		};
	}

}])

.factory('SignalR.Startup', ['$q', 'SignalRHubsConnection', function($q, SignalRHubsConnection){
	return SignalRHubsConnection.startupPromise;
}])

.run(['SignalR.Startup', 'SignalRHubsConnection', '$log', function(Startup, SignalRHubsConnection, $log){

	Startup.then(function(){
		var options = SignalRHubsConnection.options;
		var retryAttempts = options.reconnectRetryAttempts;
		var retryDelay = options.reconnectRetryDelay || 1000;
		var reconnecting = false;

		if(retryAttempts){
			SignalRHubsConnection.on("disconnected", function(){
				if(!reconnecting){
					reconnecting = true;
					reestablishConnection();
				}
			});

			SignalRHubsConnection.on("ConnectionReestablished", function(){
				reconnecting = false;
			});
		}

		function reestablishConnection(){
			console.log("SignalR disconnected, attempting to reconnect");
			var remainingAttempts = retryAttempts;
			window.setTimeout(reconnect, retryDelay);

			function reconnect(){
				$log.log("reestablishConnection, attempts remaining: ", remainingAttempts);
				SignalRHubsConnection.start(options, true)
					.catch(function(){
						if(--remainingAttempts){
							$log.log("delay then retry connect");
							window.setTimeout(reconnect, retryDelay);
						}
						else{
							SignalRHubsConnection.fire("ReestablishConnectionFailed");
						}
					});
			}
		}
	});

}]);

;

'use strict';


angular.module('VBrick.UI.Dialog', [])

.provider('Dialog', [function DialogProvider() {

	var configs = {};

	return {
		when: function(dialogName, config){
			if(configs[dialogName]){
				throw new Error("Dialog " + dialogName + " already in use");
			}

			configs[dialogName] = _.extend({
				windowClass: 'back-drop',
			}, config);
			return this;
		},

		$get: ['$modal', function($modal){
			return {
				getDialog: function(name){
					var config = configs[name];
					if(!config){
						throw new Error("Unknown Dialog Type: " + name);
					}

					return {
						open: function(dialogParams, options) {
							dialogParams = dialogParams || {};
							options = options || {};

							_.extend(config, options);

							config.resolve = {
								dialogParams: function(){
									return dialogParams;
								}
							};

							return $modal.open(config);
						}
					};
				}
			};
		}]
	};
}]);;

'use strict';

angular.module('VBrick.UI.DragAndDrop', [])


/**
	Angular wrapper around the jquery ui drag and drop sortable plugin.
	Example usage:

	<div sortable on-sort="updateSortOrder($sortableItemScope.item, $sortableItemIndex)">
		<div ng-repeat="item in items" >
			{{item.name}}.....
		</div>
	</div>
**/
.directive('vbSortable', ['$document', '$parse', '$timeout', function($document, $parse, $timeout){

	return {
		restrict: 'A', //Attributes only
		scope: {
			/**
				Callback expression. Will be evaluated when the sorting order changes. The following params will be available:
					$sortableItemScope: the scope of the item that was moved
					$sortableItemIndex: item's new index
			**/
			onSort: '&onSort',

			//jqueryui plugin params:
			cancel: '@cancel',
			placeholder: '@placeholder',
			sortOptions: '@sortOptions',
			forcePlaceholderSize: '@forcePlaceholderSize'
		},
		transclude: true,
		template: '<div class="ng-transclude"></div>',
		replace:true,

		link: function (scope, element, attrs) {



			var recievedItem;

			element.sortable(angular.extend({
				cancel: scope.cancel,

				placeholder: scope.placeholder,
				forcePlaceholderSize: true,

				helper: function(event, el){
					var ddHelper = el.find('.dd-helper');
					return ddHelper.
						clone().
						show();
				},

				//called when a linked draggable element is dropped into the sortable
				//this is the only way to get a reference to the draggable
				receive: function(e, ui){
					recievedItem = ui.item;
				},

				update: function(e, ui){

					var item = ui.item;
					var index = ui.item.index();
					var itemScope;

					if(recievedItem){
						item = recievedItem;
						recievedItem = null;
						itemScope = item.isolateScope().$parent;
					}
					else{
						itemScope = item.isolateScope();
					}




					if(itemScope){
						$timeout(function(){
							//getting exceptions from jquery ui if the dom is modified right now.
							// pause before doing this.
							scope.onSort({
								$sortableItemScope: itemScope,
								$sortableItemIndex: index
							});
							if(ui.item.hasClass('vb-draggable')){
								ui.item.remove();
							}
						}, 10);
					}
				}
			}, scope.sortOptions ? scope.$eval(scope.sortOptions) : null));
			element.disableSelection();

			scope.$watch('model', function(){
				element.sortable("refresh");
			});
		}
	};
}])

//Barebones directive that calls $().draggable() plugin on the element.
//plugin options can optionally be provided by the drag-options attribute
.directive('vbDraggableBare', function(){
	return {
		restrict: 'A', //Attributes only
		compile:function(element){
			element.addClass("draggable-bare");

			return function (scope, element, attrs) {
				var options = attrs.dragOptions ? scope.$eval(attrs.dragOptions) : {};
				element.draggable(options);

			};
		}
	};
})

.directive('vbDraggable', ['$document', '$parse', function($document, $parse){
	return {
		restrict: 'A', //Attributes only
		scope: {
			//The model data to be associated to the dragged item. This data will be passed to the drop target
			model: '=vbDraggable',

			//extra options to be passed into the draggable plugin
			dragOptions: '@dragOptions',

			dragHelper: '@dragHelper'
		},
		link: function (scope, element, attrs) {
			element.addClass("vb-draggable");

			element.draggable(angular.extend({
				//revert: 'invalid',
				//revertDuration: 100,
				scroll:false,
				helper: 'clone',
				start: function(e, ui){
					element.addClass("vb-dragging");
					if(ui.helper){
						$(ui.helper).addClass("vb-draggable-helper");
					}
				},
				stop: function(e, ui){
					element.removeClass("vb-dragging");
				}


			}, scope.dragOptions ? scope.$eval(scope.dragOptions) : null));


			element.disableSelection();
		}
	};
}])

.directive('vbDroppable', ['$parse', function($parse){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			var onDrop = attrs.onDrop ? $parse(attrs.onDrop) : null;
			var acceptFn = attrs.vbDroppableAccept ? $parse(attrs.vbDroppableAccept) : null;

			element.addClass('vb-droppable');
			element.droppable({
				hoverClass: 'vb-droppable-hover',

				accept: acceptFn ? function(draggable){

					var draggableScope = draggable.isolateScope();
					if(draggableScope) {
						return acceptFn(scope, {$draggable: draggableScope.model});
					}
				} : null,
				over: function(event, ui){
					ui.draggable.addClass("vb-draggable-hover");
					if(ui.helper){
						ui.helper.addClass("vb-draggable-hover");
					}
				},
				out: function(event, ui){
					ui.draggable.removeClass("vb-draggable-hover");
					if(ui.helper){
						ui.helper.removeClass("vb-draggable-hover");
					}
				},
				drop: function( event, ui ) {
					var containerPosition = element.offset();
					var draggableScope = ui.draggable.isolateScope();

					if(draggableScope && onDrop){
						window.setTimeout(function(){
							scope.$apply(function(){
								onDrop(scope, {
									$event: event,
									$draggable: draggableScope.model
								});
							});
						},10);
					}

				}
			});
		}
	};
}]);
;

(function(){

	'use strict';


	/**
		File Upload Directive.  Wrapper around jquery fileupload plugin

		Example:
			<form   method="post" enctype="multipart/form-data" action="/submit-url"
				file-upload="fileUpload"
				on-add="onAdd(file, event)"
				on-progress="onProgress(loaded, total, bitrate, event)">


				<input file type="file" name="video"/>
				<input file type="file" name="thumbnail"/>
				<input type="text" name="fileName" ng-model="fileName"/>
				<input type="text" name="description" ng-model="description"/>

			</form>
	**/
	angular.module('VBrick.UI.FileUpload', [])

	.directive("fileUpload",
	       ['$parse','$q','$log', 'FileUtil', 'UserContext', 'Util',
	function($parse,  $q,  $log,   FileUtil,   UserContext,   Util){

		return {
			restrict: 'A',
			link: function(scope, element, attrs, controller){
				var $el = $(element);
				$parse(attrs.fileUpload).assign(scope, controller);

				$el.fileupload({
					singleFileUploads: attrs.singleFileUploads === "true",
					dataType: "text",
					multipart: true,
					dropZone: $('.file-upload-drop-zone', element),
					add: function(e, data){
						scope.$apply(function(){
							var file = WrapFile(data);
							scope.$eval(attrs.onAdd, {file: file, event: e});
						});
					}
				});

				//Create a helper object to deal with the uploading file
				function WrapFile (file){

					var submitDeferred = null;
					var fileSubmission = null;
					var nativeFile = file.files[0]; //html5 file object

					var onProgress = function(event, data){
						if(data.files[0] === file.files[0]){
							submitDeferred.notify(data._progress);
						}
					};

					var removeProgressHandler = function(){
						$el.off('fileuploadprogress', onProgress);
					};

					$el.on('fileuploadprogress', onProgress);

					var fileName = FileUtil.parseFileName(nativeFile.name) || {};
					var extension = fileName.extension || '';

					return {
						name: nativeFile.name,
						prettyName: fileName.prettyName || '',
						extension: extension,

						size: nativeFile.size,
						isVideoFile: FileUtil.isVideoFile(extension),
						isImageFile: FileUtil.isImageFile(extension),
						inputName: file.fileInput && file.fileInput.attr("name"),

						setOptions: function(options){
							_.extend(file, options);
						},

						//upload the file
						submit: function(){
							if(submitDeferred){
								throw new Error("File upload in progress");
							}

							submitDeferred = $q.defer();

							file.url = Util.addQueryParams(file.url, {
								vbrickAccessToken: UserContext.getAccessToken()
							});

							fileSubmission = file.submit();

							fileSubmission.then(function (response){
									//prevent $apply in progress errors
									window.setTimeout(function(){
										submitDeferred.resolve(response);
										submitDeferred = null;
										scope.$apply();
									},0);

									removeProgressHandler();

								}, function(err){
									//prevent $apply in progress errors
									window.setTimeout(function(){
										submitDeferred.reject(err);
										submitDeferred = null;
										scope.$apply();
									},0);

									removeProgressHandler();

								});

							return submitDeferred.promise;
						},

						abort: function(){
							if(fileSubmission){
								fileSubmission.abort();
								submitDeferred === null;
							}
							removeProgressHandler();
						},

						getImageUrl: function(){
							var deferred = $q.defer();
							if(!window.FileReader || !nativeFile.type.match(/^image/)){
								deferred.reject();
							}
							else{
								var self=this;
								var reader = new FileReader();
								reader.onload = function(e) {
									scope.$apply(function(){
										deferred.resolve(e.target.result);
									});
								};

								// Read in the image file as a data URL.
								reader.readAsDataURL(nativeFile);
							}
							return deferred.promise;
						},

						getImageDimensions: function(url){
							var deferred = $q.defer();

							var img = $("<img>").attr("src", url)
								.on("load", function(e){
									deferred.resolve({
										width: this.width,
										height: this.height
									});
									img.remove();

									scope.$apply();
								})
								.on("error", function(e){
									deferred.reject(e);
									scope.$apply();
								});

							return deferred.promise;
						}
					};
				}
			}
		};
	}]);

})();;

(function(){
	'use strict';

	/**
	 Menu component - for adding dropdown menu behavior to bootstrap menu markup.

	See bootstrap documentation for more info: http://twitter.github.io/bootstrap/components.html#buttonDropdowns

	vb-menu: assign the menu controller to a property on the scope

	detach-menu: true/false. Default is true
		If true, then the menu will be detached from the dom, and appended to the body when open. When the menu is closed, the menul element will be moved back to the original location.
		This solves some issues with clipping off content if the menu is a child of a positioned element

	reposition-menu: true/false. Default is true (If detach-menu is true)
		When Using detatch-menu - the element will be repositioned to appear below the trigger element.
		If false, Prevent this from happening

	on-menu-open: event handler that will be called when the menu is opened

	open-on-hover: open the menu when the mouse hovers over the trigger element, false by default
		Clicking the trigger element will always open the menu - regardless of this setting


	Sample markup:
		<div class="btn-group vb-menu" detach-menu="false">
			<a class="btn" href="#">Main button</a>
			<a class="btn dropdown-toggle">
				<span class="caret"></span>
			</a>
			<ul class="dropdown-menu">
				<li><a href="#">Item 1</a></li>
				<li><a href="#">Item 2</a></li>
				<li><a href="#">Item 3</a></li>
				<li class="divider"></li>


			</ul>
		</div>
	 **/
	angular.module('VBrick.UI.Menu', [])

	.config(function(){
		$(document.body).on("keyup", function(e){
			if(e.which == 27){
				clearDropdowns();
			}
		});
		$(document.body).on("click", clearDropdowns);

	})

	.run(['$rootScope', function($rootScope){
		$rootScope.$on('$stateChangeSuccess', clearDropdowns);
	}])

	.directive("vbMenu", function(){
		return {
			restrict: 'AC',

			controller: ['$scope', '$element', '$attrs', '$parse', function($scope, $element, $attrs, $parse){
				var triggerEl = $(".dropdown-toggle", $element);
				var menuEl = $(".dropdown-menu", $element);
				$element.addClass("vb-menu");

				var isOpen = false;
				var self = this;
				var detachMenu = $attrs.detachMenu !== 'false';
				var repositionMenu = $attrs.repositionMenu !== 'false';
				var openOnHover = $attrs.openOnHover === 'true';
				var pageOverlay = $attrs.showOverlay === 'true';
				var overlay = angular.element("<div class='mobile-overlay'></div>");

				var onOpenFn = $attrs.onMenuOpen;
				if(onOpenFn){
					onOpenFn = $parse(onOpenFn);
				}
				if($attrs.vbMenu){
					$parse($attrs.vbMenu).assign($scope, this);
				}

				var onClick = function(e){
					var open = !isOpen;
					clearDropdowns();
					if(open){
						$scope.$apply(self.open);
					}
					e.stopPropagation();
				};
				triggerEl.on("click", onClick);
				$scope.$on("$destroy", function(){
					self.close();
					triggerEl.off("click", onClick);
				});


				if($attrs.closeOnClick === 'false'){
					var onMenuClick = function(e){
						e.stopPropagation();
					};
					menuEl.on("click", onMenuClick);
					$scope.$on("$destroy", function(){
						triggerEl.off("click", onMenuClick);
					});
				}

				if(openOnHover){
					var onHover = function(){
						clearDropdowns();
						$scope.$apply(self.open);
					};
					var onHoverOut = function(e){
						//If not hovering over the menu, and not hovering over the trigger element
						if(menuEl.has(e.relatedTarget).length === 0){
							if(e.relatedTarget !== triggerEl[0] && triggerEl.has(e.relatedTarget).length === 0){
								self.close();
							}
						}
					};

					menuEl.on("mouseout",onHoverOut);
					triggerEl.on("mouseout",onHoverOut);
					triggerEl.on("mouseenter", onHover);
					$scope.$on("$destroy", function(){
						self.close();
						triggerEl.off("mouseenter", onHover);
						triggerEl.off("mouseout", onHoverOut);
						menuEl.off("mouseout", onHoverOut);
					});


				}

				angular.extend(this, {
					open: function(){
						clearDropdowns();
						menuEl.addClass('open');
						$element.addClass('open');
						isOpen = true;

						if(detachMenu){
							menuEl.appendTo(document.body);
							if(repositionMenu){
								var pos = $element.offset();
								pos.top += $element.height()+2;
								menuEl.offset(pos);
							}
							if(pageOverlay){
								overlay.appendTo(document.body);
								$('body > div > .ui-view').addClass('blur');
							}
						}
						if(onOpenFn){
							onOpenFn($scope);
						}

					},
					close: function(){
						menuEl.removeClass('open');
						$element.removeClass('open');
						isOpen = false;

						if(detachMenu){
							menuEl.appendTo($element);
						}
						if(pageOverlay){
							overlay.remove();
							$('body > div > .ui-view').removeClass('blur');
						}
					},
					isOpen: function(){
						return isOpen;
					},
					isClosed: function(){
						return !isOpen;
					}
				});

			}]
		};
	});


	function clearDropdowns(){
		$('.vb-menu').each(function(el){
			$(this).data("$vbMenuController").close();
		});
	}

})();



;

'use strict';

angular.module("VBrick.UI.Multiselect", [])


/**

Multiselect form control

Example:
	<div vb-multiselect
		options="users"  //array of user objects that can be selected.
		repeat-item="user" //the name used within ng-repeat
		selector="id"  //defines the expression to select the value from each option.  In this case, ng-model will contain an array of user.id's
						//If this is missing, then the whole item is selected. Must be unique.

		ng-model="group.userIds"
		name="userIds"

		selected-items-heading="Assigned Roles"
		available-items-heading="Available Roles"

		search-query
		search-help-text="Find Roles"

		selected-filter-property="roleName" this is always required
		available-filter-property="roleName" this is always required

		status //optional object hash. States are loading, active, and error.

		//other angular form directives can be used
		required
		ng-required
		ng-change


		>

Validation:
	If an invalid value is present in ng-model, the field will be marked as invalid with the key: vbMultiselect

**/
.directive("vbMultiselect", ['$compile', '$parse', 'filterFilter', function($compile, $parse, filterFilter){

	return {
		restrict: 'A',
		transclude: true,
		templateUrl: function(tElement, tAttrs) {
			return tAttrs.templateUrl || '/shared/partials/vb-multiselect/admin-multiselect.html';
		},

		require: '?ngModel',
		scope: {
			selector: '@',
			repeatItem: '@',

			selectedItemsHeading: '@',
			availableItemsHeading: '@',

			selectedFilterProperty: '@',
			availableFilterProperty: '@',

			searchHelpText: '@',
			sortField: '@',

			status: '=?'
		},

		controller: ['$scope', function($scope) {

			_.extend($scope, {
				selectedFilterTxt: {},
				availableFilterTxt: {},
				addAll: function(){
					$scope.selectedOptions = $scope.selectedOptions.concat(filterFilter($scope.availableOptions, $scope.availableFilterTxt));
					$scope.availableOptions = _.difference($scope.availableOptions, $scope.selectedOptions);
					$scope.selectedOptions = sortList($scope.selectedOptions);
					$scope.updateModelValue();
				},
				removeAll: function(){
					$scope.availableOptions = $scope.availableOptions.concat(filterFilter($scope.selectedOptions, $scope.selectedFilterTxt));
					$scope.selectedOptions = _.difference($scope.selectedOptions, $scope.availableOptions);
					$scope.availableOptions = sortList($scope.availableOptions);
					$scope.updateModelValue();
				},
				add:function(item){
					var i = _.indexOf($scope.availableOptions, item);
					if(i >= 0){
						$scope.availableOptions.splice(i, 1);
						$scope.selectedOptions.push(item);
						$scope.selectedOptions = sortList($scope.selectedOptions);
						$scope.updateModelValue();
					}
				},
				remove: function(item){
					var i = _.indexOf($scope.selectedOptions, item);
					if(i >= 0){
						$scope.selectedOptions.splice(i, 1);
						$scope.availableOptions.push(item);
						$scope.availableOptions = sortList($scope.availableOptions);
						$scope.updateModelValue();
					}

				}
			});

			function sortList(options) {
				var sortField = $scope.sortField || 'name';
				return _.sortBy(options, function(option){
					return option[sortField];
				});
			}
		}],

		link: function($scope, el, attrs, ngModelCtrl, transcludeFn){
			var selectedEl = $('.selected-items', el);
			var availableEl = $('.available-items', el);

			var getKey = attrs.selector ? $parse(attrs.selector): _.identity;

			if(!$scope.availableFilterProperty) {
				throw new Error('available-filter-property is required when search is not lucene-driven');
			}

			$scope.status = $scope.status || { active: true };

			transcludeFn($scope, function(el, scope){
				var vsRepeat = $('<div vs-repeat class="repeater-container"></div>');
				var ngRepeat = $(
					'<div ng-click="remove(' + $scope.repeatItem + ')"' +
					' ng-repeat="' + $scope.repeatItem + ' in selectedOptions | filter:selectedFilterTxt track by $index"' +
					'></div>');

				vsRepeat.append(ngRepeat.append(el));
				$compile(vsRepeat)(scope);
				selectedEl.append(vsRepeat);
			});

			transcludeFn($scope, function(el, scope){
				var vsRepeat = $('<div vs-repeat class="repeater-container"></div>');
				var ngRepeat = $(
					'<div ng-click="add(' + $scope.repeatItem + ')"' +
					' ng-repeat="' + $scope.repeatItem + ' in availableOptions | filter:availableFilterTxt track by $index"' +
					'></div>');

				vsRepeat.append(ngRepeat.append(el));
				$compile(vsRepeat)(scope);
				availableEl.append(vsRepeat);
			});

			ngModelCtrl.$render = updateOptions;

			$scope.$parent.$watchCollection(attrs.options, function(options){
				$scope.options = options;
				updateOptions();
			});

			$scope.updateModelValue = function(){
				var value = _.map($scope.selectedOptions, getKey);
				ngModelCtrl.$setViewValue(value);
			};

			ngModelCtrl.$isEmpty = function(val){
				return !val || val.length < 1;
			};

			function updateOptions(){
				var values = ngModelCtrl.$modelValue;
				values = _.isArray(values) ? values.slice() : [];

				$scope.availableOptions = [];
				$scope.selectedOptions = [];

				_.each($scope.options, function(option){
					var key = getKey(option);
					var i = _.indexOf(values, key);
					if(i < 0){
						$scope.availableOptions.push(option);
					}
					else{
						values.splice(i, 1); //track any selected items that were not found in options
						$scope.selectedOptions.push(option);
					}
				});

				ngModelCtrl.$setValidity("vbMultiselect", !values.length);
			}
		}
	};
}]);;

'use strict';

angular.module("VBrick.UI.Videotile", [])

	.directive("videoTile", [function() {
		return {
			restrict: 'A',
			templateUrl: function(tElement, tAttrs) {
				return tAttrs.templateUrl || '/shared/partials/video-tile/video-tile.html';
			}
		};
	}]);;

'use strict';


angular.module('VBrick.Util', ['VBrick.Util.Filters', 'VBrick.Util.Directives'])

.constant('Util', {


	/**
		Encoded an object for form submission.
		Param obj:	shallow object - name/value pairs
		Return: application/x-www-form-url-encoded	String
	**/
	urlEncode: function (obj) {
		var parts = [];
		_.forEach(obj, function (value, key) {
			if(value === true){
				parts.push(encodeURIComponent(key));
			}
			else if (value !== undefined){
				parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
			}
		});
		return parts.join('&');
	},


	urlDecode: function(str){
		var result = {};
		if(str){
			var pairs = str.split(/&/);
			for(var i=0, ii=pairs.length; i < ii; i++){
				var pair = pairs[i].split(/=/);
				result[pair[0]] = pair[1] === undefined ? true : pair[1];
			}
		}
		return result;
	},

	decodeQueryString: function(){
		var qs = window.location.search.substring(1);
		return this.urlDecode(qs);
	},

	//Add query string parameters to the url
	addQueryParams: function(url, params){
		var hashIndex = url.indexOf('#');
		if(hashIndex < 0){
			hashIndex = url.length;
		}
		var hash = url.substring(hashIndex, url.length);

		var queryIndex = url.indexOf('?');
		var query = '';
		if(queryIndex >= 0){
			query = url.substring(queryIndex+1, hashIndex);
		}

		var queryParams = _.extend(this.urlDecode(query), params);

		query = this.urlEncode(queryParams);

		var urlHostAndPath = url.substring(0, queryIndex >= 0 ? queryIndex : hashIndex);

		return urlHostAndPath + '?' + query + hash;
	},



	//Utility function to parse an ISO-8601 formatted date/time string
	/**
		Input: string. Example: 2013-03-31T04:11:08.860Z
		Returns: a date object
	*/
	parseUTCDate: function(string) {
		var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:(\.\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
		                    // 1        2       3         4          5          6          7          8  9     10      11
		if(!string){
			return null;
		}

		if(string instanceof Date){
			return string;
		}

		var match = string.match(R_ISO8601_STR);
		if (match) {
			var date = new Date(0),
					tzHour = 0,
					tzMin	= 0,
					dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
					timeSetter = match[8] ? date.setUTCHours : date.setHours;

			if (match[9]) {
				tzHour = parseInt(match[9] + match[10],10);
				tzMin = parseInt(match[9] + match[11],10);
			}
			var millis = match[7] || 0;
			if(millis){ //convert the fractional second into milliseconds
				millis = Math.floor( parseFloat(millis, 10) * 1000 );
			}
			dateSetter.call(date, parseInt(match[1],10), parseInt(match[2],10) - 1, parseInt(match[3],10));
			timeSetter.call(date, parseInt(match[4]||0,10) - tzHour, parseInt(match[5]||0,10) - tzMin, parseInt(match[6]||0, 10), millis);
			return date;
		}
		return null;
	},

	/**
		Returns a length of time in milliseconds
	**/
	parseCSharpTimespan: function(timeStr){
		if(typeof timeStr === 'number'){
			return timeStr;
		}

		//[-][d.]hh:mm:ss[.ffffff]
		var parts = /^(-)?(\d*\.)?(\d\d):(\d\d):(\d\d\.?\d*)$/.exec(timeStr);
		            // 1   2      3      4      5

		if(!parts){
			return;
		}

		var days = parseInt(parts[2])||0;
		var hours = parseInt(parts[3])||0;
		var minutes = parseInt(parts[4])||0;
		var seconds = parseFloat(parts[5])||0;

		hours += days * 24;
		minutes += hours * 60;
		seconds += minutes * 60;
		var millis = Math.floor(seconds * 1000);
		if(parts[1] === '-'){
			millis = -millis;
		}
		return millis;
	},

	//Formats number of milliseconds into a c# timespan string
	formatCSharpTimespan: function(timespan){
		var isNegative = timespan < 0;
		timespan = Math.abs(timespan);

		var fractionalSeconds = String((timespan % 1000)/1000);

		var t = Math.floor(timespan/1000);
		var seconds = (t % 60) ;
		var minutes = Math.floor(t/60)%60;
		var hours = Math.floor(t/3600)%24;
		var days = Math.floor(t/86400);

		return (isNegative ? '-' : '') +
			(days > 0 ? days + '.' : '') +
			pad2(hours) + ':' + pad2(minutes) + ":" + pad2(seconds) +
			(fractionalSeconds>0 ? fractionalSeconds.slice(fractionalSeconds.indexOf('.')) : '');

		//i: a number less than 100
		//returns i formatted with up to two leading zeros -> pad2(1) === '01'
		function pad2(i){
			return ("00"+i).slice(-2);
		}
	},

	formatTimespan: function(timespan, full){
		if(angular.isString(timespan)){
			timespan = +timespan;
		}
		if(isNaN(timespan) || !angular.isNumber(timespan) || timespan < 0){
			return "";
		}

		var t = Math.floor(timespan/1000);

		var seconds = t%60;
		var minutes = Math.floor(t/60)%60;
		var hours = Math.floor(t/3600);

		if(hours > 0 || full){
			return hours + ":" + pad2(minutes) + ":" + pad2(seconds);
		}
		else{
			return pad2(minutes) + ":" + pad2(seconds);
		}

		//i: a number less than 100
		//returns a 2-length string - the number with leading zeros
		function pad2(i){
			return ("00"+i).slice(-2);
		}
	},

	/**
	 *
	 * @param macAddress
	 * @returns a mac address with all special characters removed
	 */
	formatMacAddressNumbersOnly: function(macAddress) {
		return macAddress.replace(/[^0-9a-zA-Z]+/g,'').toUpperCase();
	},

	compareSemanticVersion: function(a, b){
		a = a.split('.');
		b = b.split('.');

		var len = Math.min(a.length, b.length);

		for(var i=0; i<len; i++){
			if(+a[i] > +b[i]){
				return 1;
			}
			else if(+a[i] < +b[i]){
				return -1;
			}
		}

		return a.length > b.length ? 1 :
				a.length < b.length ? -1 : 0;
	},

	/**
	//Converts the following formats to rgba:
	//#fff, #ffffff, rgb(255,255,255), rgb(100%,100%,100%)
	**/
	normalizeHtmlColor: function(color){
		var r,g,b,a=1;
		var match;
		color = color || '';

		if(color[0] === '#'){
			color = color.substring(1);
			if(color.length === 3){
				r = parseInt(color.substring(0, 1) + color.substring(0, 1), 16);
				g = parseInt(color.substring(1, 2) + color.substring(1, 2), 16);
				b = parseInt(color.substring(2, 3) + color.substring(2, 3), 16);
			}
			else if(color.length === 6){
				r = parseInt(color.substring(0, 2), 16);
				g = parseInt(color.substring(2, 4), 16);
				b = parseInt(color.substring(4, 6), 16);
			}
		}
		else if(match = color.match(/^rgb(a?)\(\s*(-?[0-9.]+)(%?)\s*,\s*(-?[0-9.]+)(%?)\s*,\s*(-?[0-9.]+)(%?)\s*(,\s*(-?[0-9.]+))?\s*\)$/)){
			r = parseFloat(match[2]);
			r = match[3] ==='%' ?
				Math.floor(r*2.55) :
				Math.floor(r);
			g = parseFloat(match[4]);
			g = match[5] ==='%' ?
				Math.floor(g*2.55) :
				Math.floor(g);
			b = parseFloat(match[6]);
			b = match[7] ==='%' ?
				Math.floor(b*2.55) :
				Math.floor(b);


			a = match[1] === 'a' ? parseFloat(match[9]) : 1;

		}
		else{
			return null;
		}
		return 'rgba('+clamp(r,0,255)+','+clamp(g,0,255)+','+clamp(b,0,255)+','+clamp(a,0,1)+')';

		function clamp(val, min, max){
			return val<min ? min :
					val>max ? max :
					val;
		}
	}
});
;

'use strict';

angular.module('VBrick.Util.Directives', [])

//Todo: move this into a submodule.
.directive('vbPercentInput', ['$filter', function($filter){
	return {
		require: 'ngModel',
		link: function(scope, element, attr, ngModelController){

			var precision = attr.hasOwnProperty('precision') ? parseInt(attr.precision) : 2;

			ngModelController.$parsers.unshift(function(viewValue){
				var value = parseFloat(viewValue);
				if(!isNaN(value)){
					return value/100;
				}
			});

			ngModelController.$formatters.unshift(function(modelValue){
				return $filter('number')(modelValue*100, precision) ;
			});
		}
	};

}])


//Wrapper for spectrum jquery plugin
.directive('vbColorInput', [function(){
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attr, ngModelController){

			var options = attr.vbColorInput ? scope.$eval(attr.vbColorInput) : {};

			element.spectrum(angular.extend({
				change: function(color) {
					scope.$apply(function(){
						ngModelController.$setViewValue(color.toRgbString()); // rgb(), or rgba()
					});

				}

			}, options));

			scope.$watch(attr.ngModel, function(color){
				element.spectrum("set", color);
			});
		}
	};

}])


//Fork of ng-hide. hides using the visibility property instead of display
.directive('vbHidden', ['$animate', function($animate) {
	return function(scope, element, attr) {
		scope.$watch(attr.vbHidden, function(value){
			$animate[value ? 'addClass' : 'removeClass'](element, 'vb-hidden');
		});
	};
}])

//Fork of ng-show. hides using the visibility property instead of display
.directive('vbVisible', ['$animate', function($animate) {
	return function(scope, element, attr) {
		scope.$watch(attr.vbVisible, function(value){
			$animate[value ? 'removeClass' : 'addClass'](element, 'vb-hidden');
		});
	};
}])

.directive('vbImageRetry', [function() {
	return {
		link: function(scope, element, attrs) {
			var delay;
			var totalDelay;

			element.on('error', function(defaultImage) {
				if (!delay) {
					delay = 0;
					totalDelay = 0;
				}

				delay += 1000;
				totalDelay += delay;

				if (totalDelay <= 10000) {
					window.setTimeout(function() {
						element.attr('src', element.attr('src'));
					}, delay);
				}
				element.on('load', onLoad);

				function onLoad() {
					delay = totalDelay = 0;
					element.off('load', onLoad);
				}
			});
		}
	};
}]);;

'use strict';

angular.module('VBrick.Util.Filters', [])


/**
	Conditional filter. If the conditionExpr parameter evaluates to true, the filter returns the original expression's value
	If the condition is false, then returns null
	Example:
	{{ expression |vbIf:conditionExpr}}
**/
.filter('vbIf',function () {
	return function (input, condition) {
		if (condition) {
			return input;
		}
	};
})


/**
	Filter an array based on any arbitrary expression
	Argument: a string that will be parsed and evaluated for each element in the array
		if the string is empty then the filter will be skipped, leaving the whole array unchanged

	Examples:
		-- Show only items that have isSuspended property set to true
		<li ng-repeat="account in accounts | vbFilterExpr:'isSuspended'">
		-- Or False
		<li ng-repeat="account in accounts | vbFilterExpr:'!isSuspended'">

		--Read the filter expression from a form:
		<input type="radio" ng-model="suspendFilter" value="isSuspended">
		<li ng-repeat="account in accounts | vbFilterExpr:suspendFilter">

**/
.filter('vbFilterExpr', ['$parse', function($parse){

	return function (array, expression) {
		if (!expression || !angular.isArray(array)){
			return array;
		}

		var test = $parse(expression);
		var self = this||{};

		var filtered = [];
		for (var i=0, len=array.length; i<len; i++) {
			var val = array[i];
			if(test(self, val)){
				filtered.push(val);
			}
		}
		return filtered;
	};
}])


.filter('vbTruncate', function(){
	return function(text, length, endingTxt){
		endingTxt = endingTxt || '';

		if(text && typeof length ==='number' && text.length > length){
			return text.substr(0, length)+'...';
		}
		return text;
	};
})

.filter('fileSize', ['FileUtil', function(FileUtil){ return FileUtil.formatFileSize; }] )

.filter('vbTimespan', ['Util', function(Util){  return Util.formatTimespan; }] )

.filter("dateRangeFilter", function() {
	return function (items, filterDateField, from, to) {
		return items.filter(function (item) {
			return item[filterDateField] > from && item[filterDateField] < to;
		});
	};
});;

'use strict';

angular.module('VBrick.VideoPlayer', [
	'ui.bootstrap',
	'VBrick.Security',
	'VBrick.Util'
])
.directive('vbPlayer', ['$compile', '$window', 'Util', 'UserContext', function($compile, $window, Util, UserContext){
	return {
		controller: 'VideoPlayerController',
		restrict: 'A',
		scope: {
			player: '@vbPlayer',
			videoUrl: '@videoUrl',
			thumbnailUri: '=',
			subtitles: '=',
			playbackPositionUpdated: '&',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			canShowThumbnail: '&showThumbnail',
			playbackOptions: '=playbackOptions'
		},

		link: function(scope, $el, $attr){
			var childScope;
			var $element;

			scope.$watch("player", function(player){
				if(player){
					renderPlayer(player);
				}
			});

			function destroyElementIfExists(){
				if($element){
					$element.remove();
					$element = undefined;
				}

				if (childScope) {
					childScope.$destroy();
					childScope = undefined;
				}
			}

			function applyAccessTokenToVideoUrl(url) {
				if(url.indexOf($window.location.protocol + "//" + $window.location.host) === 0 && UserContext.isUserAuthenticated()){
					url = Util.addQueryParams(url, {
						vbrickAccessToken: UserContext.getAccessToken()
					});
				}

				return url;
			}

			function renderPlayer(player){
				var isValidPlayer = true;
				var url = applyAccessTokenToVideoUrl(scope.videoUrl);

				scope.playbackOptions.forEach(function(option){
					option.url = applyAccessTokenToVideoUrl(option.url);
				});


				destroyElementIfExists();

				$el.addClass("vb-player");
				$element = $('<div></div>');
				scope.thumbnailUri && $element.attr('thumbnail-uri', 'thumbnailUri');
				_.size(scope.subtitles) && $element.attr('subtitles', 'subtitles');

				switch(player){
				case 'Flash':
					$element.attr('vb-player-flash', url);
					break;
				case 'VbrickPc':
					if(scope.browser.msie){
						if(angular.isDefined($attr.playInModalIfIe)){
							$element.attr('vb-player-wmv', url);
						}
						else{
							$element.attr('vb-player-wmv-Impl', url);
						}
					}
					else{
						$element.attr('vb-player-vlc', url);
					}
					break;
				case 'VbrickMac':
					$element.attr('vb-player-mac', url);
					break;
				case 'Quicktime':
					$element.attr('vb-player-quicktime', url);
					break;
				case 'NativeAndriod':
				case 'NativeIos':
					$element.attr('vb-player-native', url);
					break;
				default:
					isValidPlayer = false;
					break;
				}

				if(isValidPlayer){
					if(angular.isDefined($attr.autoPlay)){
						$element.attr('auto-play', '');
					}

					if(angular.isDefined($attr.live)){
						$element.attr('live', $attr.live);
					}

					if(angular.isDefined($attr.duration)){
						$element.attr('duration', $attr.duration);
					}

					$element.attr('playback-position-updated', 'playbackPositionUpdated({time: time})');
					$element.attr('on-play', 'onPlay()');
					$element.attr('on-pause', 'onPause({timestamp: timestamp})');
					$element.attr('on-stop', 'onStop()');
					$element.attr('on-complete', 'onComplete({duration: duration})');
					$element.attr('show-thumbnail', 'canShowThumbnail()');
					$element.attr('playback-options', 'playbackOptions');

					$el.append($element);
					childScope = scope.$new();
					$compile($element)(childScope);
				}
			}
		}
	};
}])
.directive('vbPlaybackMenuButton', ['$compile', function($compile){
	return {
		//require: 'ngModel',
		restrict: 'A',
		templateUrl: '/shared/partials/media-player/vbrick-playback-menu-button.html',
		scope: {
			playbackOptions: '=',
			selectedPlaybackUrl: '@',
			onPlaybackOptionChange: '&',
			onToggle: '&'
		},
		link: function(scope, $element, $attributes) {
			scope.selectedPlayback = {url: scope.selectedPlaybackUrl};
			scope.updateSelection = function(playbackOption) {
				if (this.selectedPlayback.url !== playbackOption.url) { //ignore if it's already selected
					this.selectedPlayback.url = playbackOption.url;

					scope.playbackOptions.forEach(function(option){
						option.selected = false;
					});
					playbackOption.selected = true;

					scope.onPlaybackOptionChange({playbackOption: playbackOption});
				}
			};
		}
	};
}])
.directive('vbPlaybackCaptionControl', ['MediaLanguageTranslations', function(MediaLanguageTranslations){
	return {
		restrict: 'E',
		templateUrl: '/shared/partials/media-player/vbrick-playback-caption-control.html',
		scope: {
			subtitleOptions: '=',
			selectedSubtitle: '=',
			onSubtitleChange: '='
		},
		link: function(scope, $element, $attributes) {
			_.extend(scope, {

				changeSubtitle: scope.onSubtitleChange,

				//todo replace with the language it represents instead of a translation
				getLanguageName: function (subtitleOption) {
					return MediaLanguageTranslations[subtitleOption.languageCode];
				}
			});
		}
	};
}]);;

'use strict';

angular.module('VBrick.Date')
	.filter('clock', ['DateUtil', function(DateUtil){
		return function(input) {
			return DateUtil.convertSecondsToClockTime(input);
		};
	}]);;

'use strict';

angular.module("VBrick.Date")

.run(['$locale', function($locale){

	$locale.DATETIME_FORMATS.mediumDateShortTime =
		$locale.DATETIME_FORMATS.mediumDate + ' ' + $locale.DATETIME_FORMATS.shortTime;

}]);
;

'use strict';

angular.module("VBrick.Date")

.directive("vbDateInput", ['DateParser', '$filter', function(DateParser, $filter){
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, el, attr, ctrl){
			var format = attr.vbDateInput || 'shortDate';
			var dateFilter = $filter('date');
			var parseDate = DateParser(format);

			ctrl.$isEmpty = function(value){
				return !value;
			};

			ctrl.$formatters.unshift(function(date){

				ctrl.$setValidity('dateInput', !date || date instanceof Date);
				var result = dateFilter(date, format);
				return result;
			});

			ctrl.$parsers.unshift(function(dateStr){
				var date;
				if(!dateStr){
					ctrl.$setValidity('dateInput', true);
					return "";
				}
				else{
					date = parseDate(dateStr);
					ctrl.$setValidity('dateInput', !!date);
				}

				return date || dateStr;
			});

		}

	};
}])

/**
	Input for a time string
	Attrs:
		vb-time-input: a time format string. See docs for angular's filter directive
		base-date: a date object used to calculate the time of day.  For example: if base-date is 3/9/2014 (DST begins at 2:00am on 3/9), and the input value is 10:00 am. The output value will be 9 hours.
	Output value:
		the parsed time of day in ms
**/
.directive("vbTimeInput", ['DateParser', '$filter', '$parse', function(DateParser, $filter, $parse){
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, el, attr, ctrl){
			var format = attr.dateInput || 'shortTime';
			var dateFilter = $filter('date');
			var parseTime = DateParser(format, true);
			var baseDate = new Date();
			baseDate.setHours(0,0,0,0);

			scope.$watch(attr.baseDate, function(newBaseDate){
				baseDate = newBaseDate;
				if(!baseDate){
					baseDate = new Date();
					baseDate.setHours(0,0,0,0);
				}

				//Do not call $setViewValue here as it will trigger an ng-change
				//pitfall with this is that validators will not run either.
				var value = ctrl.$viewValue;
				if(value){
					value = parseTime(value, baseDate);
				}
				ctrl.$modelValue = value;
			});

			ctrl.$parsers.unshift(function(value){
				var result = value, valid = true;
				if(value){
					result = parseTime(value, baseDate);
					valid = result != null;
				}
				ctrl.$setValidity('timeInput', valid);

				return result;
			});

			ctrl.$formatters.unshift(function(){

				var time = ctrl.$modelValue;
				var result = time, valid;

				if(_.isNumber(time) && time >= 0){
					var date =  new Date();
					date.setTime(baseDate.getTime() + time);
					result = dateFilter(date, format);
					valid = true;
				}
				else{
					valid = !time;
				}
				ctrl.$setValidity('timeInput', valid);

				return result;

			});

		}

	};
}]);
;

'use strict';

angular.module("VBrick.Date")


/**
* Utility for parsing dates.  Format string can be any angular.js date filter format. Accepts $locale formats as well( such as: shortDate, fullDate)
*  Example:   var parser = DateParser('yyyy-MM-dd hh:mm:ss');
*             var date = parser("2014-01-25 14:00:00")
**/
.factory('DateParser', ['$locale', 'DateUtil', function($locale, DateUtil){

	var localeDtf = $locale.DATETIME_FORMATS;

	//matches one token at a time of the format string. Borrowed from angular.js dateFilter code
	var dateFormatSplit = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/;

	function buildDateParser(format, timeOnly){

		format = format || "shortDate";
		format = localeDtf[format] || format;


		var group = 1;
		var handlers = [];
		var dateRegExp = '';

		while(format) {
			var match = dateFormatSplit.exec(format);
			if (match) {
				var token = parseFormatToken(match[1]);

				if(token){
					var numGroups = token.numGroups || 1;
					handlers.push({
						numGroups: numGroups,
						group: group,
						fn: token.handler
					});
					group += numGroups;
					dateRegExp += token.re;
				}
				else{
					dateRegExp += escapeRegExp(match[1].replace(/(^'|'$)/g, '').replace(/''/g, "'"));
				}

				format = match.pop();
			} else {
				format = null;
			}
		}
		dateRegExp = new RegExp("^" + dateRegExp + "$", "i");



		return function(dateStr, baseDate){
			if(!baseDate){
				baseDate = new Date();
				baseDate.setHours(0,0,0,0);
			}


			var match = dateRegExp.exec(dateStr||"");
			var result;

			if(match){
				var dateParts = {};

				for(var i=handlers.length; i--;){
					var handler = handlers[i];
					var numGroups = handler.numGroups;
					var g = handler.group;
					var groups;

					if(handler.numGroups === 1){
						groups = match[g];
					}
					else{
						groups = match.slice(g, g+numGroups);
					}

					if(handler.fn(groups, dateParts) === false){
						return undefined;
					}
				}

				result = buildDate(dateParts, baseDate);
				if(timeOnly){
					result = result.getTime() - baseDate.getTime();
				}
			}

			return result;
		};
	}

	//formatToken: segment of the format string such as 'yyyy'
	//returns:  {
	// 	re: regular expression used to match this part of the date string
	//  numGroups: default 1.  The number of match groups in re
	//  handler: function that is called when re is matched. called with the params:
	//		match: string containing the matched section of the date string. if numGroups>1 this will be an array
	//		result:  an intermediate object to hold parts of the date
	//}
	function parseFormatToken(formatToken){
		var d4 = "(\\d{4})", d12 = "(\\d{1,2})",  d2 = "(\\d{2})";

		switch(formatToken){

		case 'yyyy':
			return { re: d4, handler: intSetter("year") };
		case 'y':
			return { re: d4, handler: intSetter("year") };

		case 'yy':
			return {
				//for 2 digit year, allow parsing of 4 digit year
				re: "(\\d{2}|\\d{4})",
				handler:function(match, result){
					var year = parseInt(match, 10);
					if(year < 68){
						year = 2000 + year;
					}
					else if(year >= 68 && year < 100){
						year = 1900 + year;
					}
					result.year =  year;
				}
			};

		//for 0 padded segments, allow 1 digit
		case 'MM':
			return { re: d12, handler: intSetter("month", 0, 11, -1) };
		case 'M':
			return { re: d12, handler: intSetter("month", 0, 11, -1) };

		case 'dd':
			//Note, validating the number of days in the specific month somewhere else
			return { re: d12, handler: intSetter("day", 1, 31) };
		case 'd':
			return { re: d12, handler: intSetter("day", 1, 31) };

		case 'HH':
			return { re: d12, handler: intSetter("hour", 0, 23) };
		case 'H':
			return { re: d12, handler: intSetter("hour", 0, 23) };
		case 'hh':
			return { re: d12, handler: intSetter("hour", 1, 12) };
		case 'h':
			return { re: d12, handler: intSetter("hour", 1, 12) };

		case 'mm':
			return { re: d2, handler: intSetter("minute", 0, 59) };
		case 'm':
			return { re: d12, handler: intSetter("minute", 0, 59) };

		case 'ss':
			return { re: d2, handler: intSetter("second", 0, 59) };
		case 's':
			return { re: d12, handler: intSetter("second", 0, 59) };

		case 'sss':
			return { re: "(\\d+)", handler: intSetter("millisecond", 0, 999) };

		case 'a':
			return parseStringToken(
				localeDtf.AMPMS,
				function(i, result){
					result.isAM = i == 0;
					result.isPM = !result.isAM;
				});

		case 'MMMM':
			return parseStringToken(
				localeDtf.MONTH,
				function(i, result){
					result.month = i;
				});

		case 'MMM':
			return parseStringToken(
			localeDtf.SHORTMONTH,
			function(i, result){
				result.month = i;
			});

		//Day of the week, add the regular expression, but treat as noop when parsing a date
		case 'EEEE':
			return parseStringToken(
				localeDtf.DAY,
				function(){});

		case 'EEE':
			return parseStringToken(
				localeDtf.SHORTDAY,
				function(){});

		case 'Z':
			return {
				re: "([+-]?\\d{4})",
				handler:function(match, result){
					var tz = parseInt(match, 10);
					var neg = tz < 0 ? -1 : 1;
					tz *= neg;
					result.timezoneOffsetMinutes = neg * Math.floor(tz / 100) * 60 * tz % 100;
				}
			};
		}

		function intSetter(prop, min, max, offset){
			return function(match, result){
				var val = parseInt(match, 10);
				if(val < min || val > max){
					return false;
				}
				result[prop] = val + (offset||0);

			};
		}

		//handle textual format tokens such as month name, am/pm, weekday name
		function parseStringToken(strings, handler){
			var segments = [];

			strings.forEach(function(str){
				str = escapeRegExp(str);
				segments.push("("+escapeRegExp(str)+")");
			});

			return {
				re: "(?:" + segments.join("|") +")",
				numGroups: strings.length,
				handler: function(matches, result){
					var i, len;
					for(i=0, len=matches.length; i<len; i++){
						if(matches[i]){
							break;
						}
					}

					if(i >= len){
						i=-1;
					}
					handler(i, result);
				}
			};
		}
	}

	function buildDate(parts, baseDate){
		baseDate = baseDate || new Date();
		baseDate.setHours(0,0,0,0);

		if(parts.isAM){
			if(parts.hour == 12){
				parts.hour = 0;
			}
		}
		else if(parts.isPM){
			if(parts.hour < 12){
				parts.hour += 12;
			}
		}

		var minute = parts.minute || 0;

		if(parts.timezoneOffsetMinutes !== undefined ){
			//getTimezoneOffset returns the negative offset
			minute += -(new Date().getTimezoneOffset()) + parts.timezoneOffsetMinutes;
		}


		var result = new Date(
			(parts.year != undefined) ? parts.year : baseDate.getFullYear(),
			(parts.month != undefined) ? parts.month : baseDate.getMonth(),
			(parts.day != undefined) ? parts.day : baseDate.getDate(),
			parts.hour || 0,
			minute,
			parts.second || 0,
			parts.millisecond || 0
		);

		//validate the day of month.
		if(parts.day != undefined){
			if(parts.day < 1 || parts.day > DateUtil.daysInMonthOfYear(parts.year, parts.month)){
				return null;
			}
		}

		return result;

	}

	function escapeRegExp(val){
		return val.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1");
	}


	return buildDateParser;

}]);





;

'use strict';

angular.module("VBrick.Date")

.directive("vbDateTimeInput", ['DateUtil', 'TimezoneService', '$q', '$timeout',
                       function(DateUtil,   TimezoneService,   $q,   $timeout){

	return {
		restrict: 'A',
		require: '?ngModel',
		scope: {
			timezoneId: '@',
			disableTimezoneWatch: '@'
		},
		template: [
			'<div ng-form>',
			'	<div class="form-group">',
			'		<input type="text"',
			'			class="form-control input-date"',
			'			ng-model="dateField.date" name="dateInput"',
			'			ng-change="onDateTimeChange()"',
			'			ng-required="required"',
			'			datepicker-popup="mediumDate"',
			'			is-open="datePickerIsOpen"',
			'			datepicker-options="{showWeeks: false}"',
			'			show-button-bar="false"/>',
			'		<span class="glyphicon glyphicon-calendar" style="cursor:pointer;" ng-click="toggleDatePicker()"></span>',
			'	</div>',

			'	<div class="form-group">',
			'		<input type="text" class="form-control input-time"',
			'			ng-model="dateField.time" name="timeInput"',
			'			ng-change="onDateTimeChange()"',
			'			ng-required="required"',
			'			vb-time-input="shortTime" base-date="dateField.date">',
			'	</div>',
			'</div>'
		].join(''),

		compile: function(el, attr){
			if(!attr.name){
				throw new Error("vb-date-input: name attribute missing");
			}
			var formName = attr.name + "-internal";

			el.children("[ng-form]").attr("name", formName);
			el.addClass("vb-date-time-input");

			return function($scope, el, attr, ngModelCtrl){
				var formCtrl = $scope[formName];
				$scope.dateInputCtrl = formCtrl.dateInput;

				attr.$observe('required', function(required) {
					$scope.required = required;
				});

				$scope.dateField = {};

				ngModelCtrl.$render = function(){};

				$scope.$watch(function(){
					var date = tryGetDate(ngModelCtrl.$modelValue);
					return date && date.getTime();

				}, function updateModel(){
					var utcDate = tryGetDate(ngModelCtrl.$modelValue);
					var utcTimestamp = utcDate ? utcDate.getTime() : null;
					var timezoneId = $scope.timezoneId;

					if(timezoneId === $scope.dateField.timezoneId &&
						utcTimestamp === $scope.dateField.utcTimestamp){
						return;
					}

					if(utcDate){

						getUTCOffset(utcDate, timezoneId, true).then(function(offset){

							var tzOffset = DateUtil.getOffset(utcDate) - offset;
							var adjustedDate = new Date(utcDate.getTime() - tzOffset);

							$scope.dateField = {
								tzOffset: tzOffset,
								date: DateUtil.getStartOfDay(adjustedDate),
								time: DateUtil.getTimeOfDay(adjustedDate),

								utcTimestamp: utcDate.getTime(),
								timezoneId: timezoneId
							};

						});

						$scope.dateField = {loading: true};
					}

					$scope.dateField = {};

				});

				if(_.isUndefined(attr.disableTimezoneWatch)){
					$scope.$watch("timezoneId", function(){
						var utcDate = tryGetDate(ngModelCtrl.$modelValue);
						var utcTimestamp = utcDate ? utcDate.getTime() : null;
						var timezoneId = $scope.timezoneId;

						if(timezoneId !== $scope.dateField.timezoneId &&
							utcTimestamp === $scope.dateField.utcTimestamp){

							return $scope.onDateTimeChange();
						}
					});
				}

				$scope.toggleDatePicker = function(){
					return !$scope.datePickerIsOpen &&
						$timeout(function(){
							$scope.datePickerIsOpen = true;
						}, 100);
				};

				$scope.onDateTimeChange = function(){
					var value = getDate();

					if(!value){
						$scope.dateField.utcTimestamp = null;
						ngModelCtrl.$setViewValue(null);
					}
					else{
						$scope.dateField.loading = true;
						updateDate().then(function(){
							$scope.dateField.loading = false;

							var oldDate = tryGetDate(ngModelCtrl.$modelValue);
							var newDate = getDate();

							var t1 = oldDate && oldDate.getTime();
							var t2 = newDate && newDate.getTime();

							if(t1 != t2){
								$scope.dateField.utcTimestamp = t2;
								ngModelCtrl.$setViewValue(newDate);
							}
						});
					}
				};

				function getDate(noOffset){
					var date = tryGetDate($scope.dateField.date);
					var time = $scope.dateField.time;
					if(date && _.isNumber(time)){

						var offset = noOffset ? 0 : $scope.dateField.tzOffset;

						return  new Date(date.getTime() + time + offset);
					}
				}

				function getTimestamp(){
					var value = getDate();
					return value && value.getTime();
				}

				function updateDate(){
					var dateTime = getDate(false);

					return getUTCOffset(dateTime, $scope.timezoneId)
						.then(function(offset){
							$scope.dateField.tzOffset = DateUtil.getOffset(dateTime) - offset;
						});
				}
			};
		}
	};

	function getUTCOffset(date, timezoneId, isUtc){
		if(timezoneId){
			if(date){
				return TimezoneService.getUTCOffset(timezoneId, [date], isUtc)
					.then(function(offsets){
						return offsets[0];
					});
			}
			else{
				return $q.when(0);
			}
		}
		return $q.when( DateUtil.getOffset(date) );
	}

	function tryGetDate(date){
		if(date && date instanceof Date){
			return date;
		}
	}

}]);
;

'use strict';

angular.module('VBrick.Date')

.factory('TimezoneService',
       ['$resource', 'Util', '$filter',
function($resource,   Util,   $filter) {

	var dateFilter = $filter('date');
	//TODO: Move to another URL - in /shared
	var tzOffsetResource = $resource('/shared/utc-offset/:timezoneId');


	return {

		//Returns the offset from UTC for each date in the given timezone
		//isUTCDate: if false, the date is sent without a timezone, treated as a date within the given timezone
		//			if true - send the date as an ISO-8601 string in UTC.
		getUTCOffset: function(timezoneId, dates, isUTCDate){

			return tzOffsetResource.get({
				timezoneId: timezoneId,
				dates: _.map(dates, function(date){
					if(isUTCDate){
						return date.toISOString();
					}
					else{
						//Send the dates without a timezone. DateTime will parse the date an Unspecified Kind value.
						return dateFilter(date, 'yyyy-MM-dd hh:mm:ss');
					}
				}).join('|')
			})
			.$promise
			.then(function(result){
				return _.map(result.offsets.$values, function(offset){
					return Util.parseCSharpTimespan(offset);
				});
			});
		}
	};
}]);;

'use strict';

angular.module('VBrick.Shared.Media')
.directive('vbVideoPlayer', ['$compile', 'UserContext', 'VideoService', 'Session', function($compile, UserContext, VideoService, Session){
	return {
		restrict: 'A',
		scope: {
			playbacks: '=',
			videoId: '@videoId',
			thumbnailUri: '=',
			playbackEnded: '&',
			playbackPositionUpdated: '&',
			live: '@',
			subtitles: '='
		},

		link: function(scope, $el, $attr){
			var childScope;
			var $element;
			var playbackStartTime = 0, videoPlayedSeconds = 0, lastPlayStartTime;
			var isPlaybackInitialized = false;
			var showThumbnail = true;
			var sessionId, autoPlay;

			var sessionKeepAlive = Session.createKeepalive();

			scope.$watch("playbacks", function(playbacks){
				var playback = getSelectedPlayback(playbacks);

				if(playback){
					renderPlayer(playback, _.pick(scope, 'thumbnailUri', 'subtitles'));
				}
			});

			scope.$on('destroy', sessionKeepAlive.end);

			scope.canShowThumbnail = function() {
				return showThumbnail;
			};

			scope.onPlay = function(){
				showThumbnail = false;
				lastPlayStartTime = new Date().getTime();

				var playback = getSelectedPlayback(scope.playbacks);

				if(!isPlaybackInitialized){
					playbackStartTime = new Date().getTime();
					isPlaybackInitialized = true;
					sessionId = getSessionId();

					VideoService.videoInitialPlaybackStarted(sessionId, playback.url, scope.videoId, playback.zoneId, playback.deviceId, playback.videoFormat, playback.player, scope.live);
				} else {
					VideoService.videoPlaybackStarted(sessionId, playback.url, scope.videoId, playback.zoneId, playback.deviceId, playback.videoFormat, playback.player);
				}

				sessionKeepAlive.begin();
			};

			scope.onPause = function(timestamp){

				VideoService.videoPlaybackPaused(sessionId, scope.videoId, Math.floor(timestamp.timestamp / 1000), getLastPlayDuration());

				sessionKeepAlive.end();
			};

			scope.onStop = function(){
				VideoService.videoPlaybackStopped(sessionId, scope.videoId, getVideoPlayedSeconds(), getLastPlayDuration());

				sessionKeepAlive.end();
			};

			scope.onComplete = function(duration){
				showThumbnail = !autoPlay;

				if(scope.playbackEnded){
					scope.playbackEnded();
				}

				VideoService.videoPlaybackCompleted(sessionId, scope.videoId, Math.floor(duration.duration / 1000), getLastPlayDuration());

				isPlaybackInitialized = false;
				playbackStartTime = 0;
				videoPlayedSeconds = 0;

				sessionKeepAlive.end();
			};

			function getLastPlayDuration() {
				return  Math.floor((new Date().getTime() - lastPlayStartTime) / 1000);
			}

			function destroyElementIfExists(){
				if($element){
					$element.remove();
					$element = undefined;
				}

				if (childScope) {
					childScope.$destroy();
					childScope = undefined;
				}
			}

			function renderPlayer(playback, options){
				destroyElementIfExists();

				$el.addClass("vb-player");
				$element = $('<div></div>');
				$element.attr('vb-player', playback.player);
				$element.attr('video-url', playback.url);
				options.thumbnailUri && $element.attr('thumbnail-uri', 'thumbnailUri');
				_.size(options.subtitles) && $element.attr('subtitles', 'subtitles');

				if(angular.isDefined($attr.playInModalIfIe)){
					$element.attr('play-in-modal-if-ie', '');
				}

				if(angular.isDefined($attr.autoPlay)){
					$element.attr('auto-play', '');
					showThumbnail = false;
					autoPlay = true;
				} else {
					autoPlay = false;
				}

				if(angular.isDefined($attr.live)){
					$element.attr('live', $attr.live);
				}

				if(angular.isDefined($attr.duration)){
					$element.attr('duration', $attr.duration);
				}

				$element.attr('playback-position-updated', 'playbackPositionUpdated({time: time})');
				$element.attr('on-play', 'onPlay()');
				$element.attr('on-pause', 'onPause({timestamp: timestamp})');
				$element.attr('on-stop', 'onStop()');
				$element.attr('on-complete', 'onComplete({duration: duration})');
				$element.attr('show-thumbnail', 'canShowThumbnail()');
				$element.attr('playback-options', 'playbacks');

				$el.append($element);
				childScope = scope.$new();
				$compile($element)(childScope);
			}

			function getVideoPlayedSeconds(){
				videoPlayedSeconds += Math.floor((new Date().getTime() - playbackStartTime) / 1000);
				return videoPlayedSeconds;
			}

			function getSessionId(){
				var userId = UserContext.getUser().id || (Math.random() + "").substr(2);
				return [
					scope.videoId,
					'_',
					userId,
					'_',
					Date.now()
				].join('');
			}

			function getSelectedPlayback(playbacks){
				if(playbacks && playbacks.length) {
					var playback = _.find(playbacks, function (option) {
							return option.selected === true;
						}) || playbacks[0];
					return playback;
				}
				return null;
			}
		}
	};
}]);;

'use strict';

angular.module('VBrick.Shared.Media')

.factory('VideoService',
	        ['$resource', 'PushService', 'Util', '$location', 'PromiseUtil', '$http', '$q', 'FileUtil', 'UserContext',
	function( $resource,   PushService, Util, $location, PromiseUtil, $http, $q, FileUtil, UserContext) {
		var videoEditResource = $resource('/media/videos/:videoId/edit');
		var videoPlaybackResource = $resource('/media/videos/:videoId');
		var videoPlaybackEmbedResource = $resource('/media/videos/:videoId/embed');
		var categoryResource = $resource('/media/:accountId/categories');

		var supplementalContentUploadQueue = PromiseUtil.createPromiseQueue();
		var transcriptionUploadQueue = PromiseUtil.createPromiseQueue();

		var VideoService = {
			getVideo: function (videoId) {
				return videoEditResource.get({ videoId: videoId }).$promise
					.then(function(response) {
						var video = response.video;
						video.mediaContent = response.mediaContent;
						video.accessControlEntities = response.accessControlEntities;

						generateSupplementalContentExtensions(response.mediaContent);

						return response;
					});
			},

			getVideoPlayback: function (videoId) {
				return videoPlaybackResource.get({ videoId: videoId })
					.$promise.then(function (response) {
						response.videoUser = response.videoUser || {};
						generateSupplementalContentExtensions(response.mediaContent);

						var video = response.video;
						video.whenUploaded = Util.parseUTCDate(video.whenUploaded);
						video.averageRating = Math.round(video.averageRating);
						video.duration = Util.parseCSharpTimespan(video.duration);
						video.comments = (video.comments || []);
						_.each(video.comments, function(comment){
							comment.videoId = video.id;
							comment.date = Util.parseUTCDate(comment.date);
							comment.showReplies = true;

							_.each(comment.childComments, function(childComment){
								childComment.parentCommentId = comment.id;
								childComment.videoId = video.id;
								childComment.date = Util.parseUTCDate(childComment.date);
							});
						});

						if(video.presentation){
							_.each(video.presentation.timeline, function(transition){
								transition.time = Util.parseCSharpTimespan(transition.time);
							});
						}

						//if unauthenticated, then don't return mediaContent
						if (!UserContext.isUserAuthenticated()) {
							response.mediaContent = [];
						}

						if (response.transcriptionFiles.length) {
							video.subtitles = response.transcriptionFiles.map(toPlayerDirectiveSubtitle);
						}

						return response;
					});
			},

			getCategories: function (accountId) {
				return categoryResource.get({ accountId: accountId }).$promise;
			},

			modifyVideo: function(video) {
				return PushService.dispatchCommand("media:SaveVideoDetails", {
					videoId: video.id,
					title: video.title,
					description: video.description,
					tags: video.tags,
					categoryIds: video.categoryIds || [],
					thumbnailUri: (video.thumbnailUri || ''),
					linkedUrl: video.linkedUrl,
					isActive: video.isActive,
					ratingsEnabled: video.ratingsEnabled,
					commentsEnabled: video.commentsEnabled,
					downloadingEnabled: video.downloadingEnabled,
					accessControl: video.accessControl,
					accessControlEntities: video.accessControlEntities.map(function(entity){
						return _.pick(entity, "id", "type", "canEdit");
					}),
					mediaContent: video.supplementalContent,
					transcriptionFiles: video.transcriptionFiles
				});
			},

			rateVideo: function(videoRating) {
				return PushService.dispatchCommand("media:RateVideo", videoRating);
			},

			uploadThumbnail: function(image) {
				return PushService.dispatchCommand("media:AddImageToVideo", image)
					.then(function(result){
						if(result.type === 'ImageCreated'){
							return {
								id: result.data.imageId,
								imageUploadUri: result.data.imageUploadUri
							};
						}
					});
			},
			deleteThumbnail: function(imageId, videoId) {
				return PushService.dispatchCommand("media:DeleteImage", {imageId: imageId, videoId: videoId});
			},

			deleteVideo: function(videoId) {
				return PushService.dispatchCommand("media:DeleteVideo", {videoId: videoId});
			},

			videoInitialPlaybackStarted: function(sessionId, url, videoId, zoneId, deviceId, videoFormat, player, live) {
				this.post(
					'/analytics/videos/playevent/initial',
					"sessionId=" + sessionId +
					"&url=" + url +
					"&videoId=" + videoId +
					"&zoneId=" + zoneId +
					"&deviceId=" + deviceId +
					"&videoFormat=" + videoFormat +
					"&player=" + player +
					"&live=" + live);
			},

			videoPlaybackStarted: function(sessionId, url, videoId, zoneId, deviceId, videoFormat, player) {
				this.post(
					'/analytics/videos/playevent/start',
					"sessionId=" + sessionId +
					"&url=" + url +
					"&videoId=" + videoId +
					"&zoneId=" + zoneId +
					"&deviceId=" + deviceId +
					"&videoFormat=" + videoFormat +
					"&player=" + player);
			},

			videoPlaybackPaused: function(sessionId, videoId, timestampSeconds, lastPlayDuration) {
				this.post(
					'/analytics/videos/playevent/pause',
					"sessionId=" + sessionId +
					"&videoId=" + videoId +
					"&timestampSeconds=" + timestampSeconds +
					"&lastPlayDuration=" + lastPlayDuration);
			},

			videoPlaybackStopped: function(sessionId, videoId, timestampSeconds, lastPlayDuration) {
				this.post(
					'/analytics/videos/playevent/stop',
					"sessionId=" + sessionId +
					"&videoId=" + videoId +
					"&timestampSeconds=" + timestampSeconds +
					"&lastPlayDuration=" + lastPlayDuration);
			},

			videoPlaybackCompleted: function(sessionId, videoId, duration, lastPlayDuration) {
				this.post(
					'/analytics/videos/playevent/complete',
					"sessionId=" + sessionId +
					"&videoId=" + videoId +
					"&duration=" + duration +
					"&lastPlayDuration=" + lastPlayDuration);
			},

			post: function(url, data) {
				$http({
					method: 'POST',
					url: url,
					data: data,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				});
			},

			getVideoPlaybackEmbed: function(videoId){
				return videoPlaybackEmbedResource.get({videoId: videoId}).$promise;
			},

			isValidSupplementalContentFile: function(extension) {
				return FileUtil.isPresentationFile(extension) || FileUtil.isDocumentFile(extension) ||
					FileUtil.isSpreadsheetFile(extension) || FileUtil.isArchiveFile(extension) ||
					FileUtil.isImageFile(extension);
			},

			uploadSupplementalContent: function(content, onCreationCallback) {
				return PushService
					.dispatchCommand('media:AddMediaContent', {
						videoId: content.videoId,
						filename: content.filename
					}, 'MediaContentAdded')
					.then(function(result) {
						if(content.cancelUpload) {
							VideoService.cancelSupplementalContentUpload({
								id: result.message.mediaContentId,
								videoId: content.videoId
							});
							return $q.reject('UploadCanceled');
						}

						content.id = result.message.mediaContentId;
						content.file.setOptions({
							url: result.message.mediaContentUploadUri
						});
						return content.id;
					})
					.then(onCreationCallback)
					.then(function() {
						return supplementalContentUploadQueue.enqueue(function(){
							var promise = content.file.submit();

							promise.then(function(){}, function(){}, function(progress){
								content.progress = progress.loaded/progress.total;
								content.bitrate = progress.bitrate;
							});

							return promise;
						});
					});
			},

			uploadTranscription: function(transcription, onCreationCallback) {
				return PushService
					.dispatchCommand('media:AddTranscriptionFile', {
						videoId: transcription.videoId,
						filename: transcription.filename,
						languageId: transcription.languageId
					}, 'TranscriptionFileAdded')
					.then(function(result) {
						if(transcription.cancelUpload) {
							VideoService.deleteTranscriptionFile({
								id: result.message.transcriptionFileId,
								videoId: transcription.videoId
							});
							return $q.reject('UploadCanceled');
						}

						transcription.id = result.message.transcriptionFileId;
						transcription.file.setOptions({
							url: result.message.transcriptionFileUploadUri
						});
						return transcription.id;
					})
					.then(onCreationCallback)
					.then(function() {
						return transcriptionUploadQueue.enqueue(function(){
							var promise = transcription.file.submit();

							promise.then(function(){}, function(){}, function(progress){
								transcription.progress = progress.loaded/progress.total;
								transcription.bitrate = progress.bitrate;
							});

							return promise;
						});
					});
			},

			cancelSupplementalContentUpload: function(content) {
				return PushService
					.dispatchCommand('media:CancelUploadingMediaContent', {
						videoId: content.videoId,
						mediaContentId: content.id
					});
			},

			deleteTranscriptionFile: function(transcriptionFile) {
				return PushService
					.dispatchCommand('media:RemoveTranscriptionFile', {
						videoId: transcriptionFile.videoId,
						transcriptionFileId: transcriptionFile.id
					});
			},

			deleteSupplementalContent: function(content) {
				return PushService
					.dispatchCommand('media:RemoveMediaContent', {
						mediaId: content.videoId,
						mediaContentId: content.id
					});
			},

			submitForApproval: function (video) {
				return PushService
					.dispatchCommand('media:SubmitVideoForApproval', {
						videoId: video.id,
						processTemplateId: video.approvalProcessTemplateId
					});
			},

			approveVideo: function (video, reason) {
				return PushService
					.dispatchCommand('media:ApproveVideo', {
						videoId: video.id,
						processTemplateId: video.approvalProcessTemplateId,
						reason: reason
					});
			},

			rejectVideo: function (video, reason) {
				return PushService
					.dispatchCommand('media:RejectVideo', {
						videoId: video.id,
						processTemplateId: video.approvalProcessTemplateId,
						reason: reason
					});
			}
		};

		return VideoService;

		function generateSupplementalContentExtensions(supplementalContent) {
			if (supplementalContent) {
				supplementalContent.forEach(function (content) {
					var parsed = FileUtil.parseFileName(content.filename);
					if (parsed) {
						var extension = content.extension = parsed.extension;
						content.isImageFile = FileUtil.isImageFile(extension);
					}
				});
			}
		}

		function toPlayerDirectiveSubtitle (transcriptionFile) {
			return {
				src: transcriptionFile.downloadUrl,
				languageCode: transcriptionFile.languageId
			};
		}
	}]);
;

'use strict';

angular.module('VBrick.Push')

.run(['$rootScope', 'PushBus', function($rootScope, PushBus){

	_.extend($rootScope.constructor.prototype, {

		/**
		*	Listen for incoming messages from the PushHub
		*	route: The route being subscribed to
		*	routeScope: Optional. If provided, limits incoming messages to those that match the route and routeScope
		*	handlers: object. {
		*		MessageType: function eventHandler(event, message){...}
		*	}
		*
		*
		*	Example:
		*		$scope.$onPush(userId, {
		*			LoggedOff: function(e, message){...}
		*		});
		*
		*		$scope.$onPush(accountId, "Admin.Users", {
		*			UserCreated: function(e, message){...}
		*		});
		*/
		$onPush: function(route, routeScope, handlers){

			var unsubscribe = PushBus.subscribe(route, routeScope, handlers);

			this.$on('$destroy', unsubscribe);

			return unsubscribe;
		}
	});

}])


.factory("PushBus", ['PushHub', 'Observable', '$q', 'SignalRHubsConnection', function(PushHub, Observable, $q, SignalRHubsConnection){

	var routeListeners = {};
	var Connected = SignalRHubsConnection.State.Connected;

	configureInboundMessageListener();

	var PushBus = {

		subscribe: function(route, scope, handlers, autoSubscribed){
			if(typeof scope === 'string' && arguments.length >= 3){
				route = getQualifiedRoute(route, scope);
				return subscribe(route, handlers, autoSubscribed);
			}

			return subscribe.apply(null, arguments);
		},

		unsubscribe: function(route, handlers, suppressLog){
			var listener = routeListeners[route];

			if(!listener){
				throw new Error("Not subscribed: " + route);
			}

			_.each(handlers, function(handler, messageType){
				listener.off(messageType, handler);
			});

			unsubscribeRouteIfUnused(route, suppressLog);
		},


		//Abstraction that allows setting handlers for a route that may change over time - such as the currently logged in userId
		subscribeToDynamicRoute: function(handlers){
			var route;
			var unsubscribeFn;

			return {
				setRoute: function(newRoute){
					if(route !== newRoute){
						if(route){
							unsubscribeFn();
						}

						if(newRoute){
							unsubscribeFn = PushBus.subscribe(newRoute, handlers);
						}

						route = newRoute;
					}
				}
			};
		},

		resubscribe: function(){
			console.log("Resubscribing push routes");
			_.each(routeListeners, function(listener, route){
				subscribeRoute(route)
					.catch(function(error){
						console.error("Error resubscribing to route: ", route, error);
					});
			});
		}

	};

	function subscribe(route, handlers, autoSubscribed){
		ensureSubscribed(route, autoSubscribed);

		addMessageHandlers(route, handlers);

		return _.bind(PushBus.unsubscribe, PushBus, route, handlers);
	}

	function getQualifiedRoute(route, scope){
		return route + ":" + scope;
	}

	function addMessageHandlers(route, handlers){
		var messageTypes = Object.keys(handlers);

		if(!messageTypes || !messageTypes.length){
			throw new Error("At least on handler is required");
		}

		var listener = routeListeners[route];

		_.each(messageTypes, function(messageType){
			listener.on(messageType, handlers[messageType]);
		});

	}

	function ensureSubscribed(route, autoSubscribed){
		if(!route){
			throw new Error("Route is required");
		}

		if(!routeListeners[route]){
			if(!autoSubscribed){
				subscribeRoute(route);
			}

			routeListeners[route] = new Observable();
		}
	}

	function unsubscribeRouteIfUnused(route, suppressLog){
		var listener = routeListeners[route];

		if(!listener.hasSubscribers()){
			unsubscribeRoute(route, suppressLog);
			delete routeListeners[route];
		}
	}

	function configureInboundMessageListener(){
		PushHub.client.on({
			routeMessage: function(route, messageType, messageContent){
				var listener = routeListeners[route];

				var suppress = false;

				if(listener && listener.hasSubscribers(messageType)){
					var message = parseMessage(route, messageType, messageContent);


					if(messageType === "CommandFinished") {
						if(message &&  message.type === "MessageScheduled" || message.type === "SessionTimeoutExtended") {
							suppress = true;
						}
					}

					if(!suppress){
						console.log("Inbound message: ", route, messageType, message);
					}

					//TODO: dummy event object added to avoid breaking listeners. Need to remove them later
					listener.fire(messageType, {}, message);
				}
				else{
					if(messageType !== "CommandFinished"){
						console.warn("Unhandled Inbound push message: ", route, messageType, messageContent);
					}
				}
			}
		});

	}

	function parseMessage(route, messageType, messageContent){
		var message;
		try{
			message = JSON.parse(messageContent);
		}
		catch(e){
			console.log("Unable to parse message: ", route, messageType);
			message = null;
		}

		return message;
	}

	function subscribeRoute(route){
		if(SignalRHubsConnection.getConnectionStatus() === Connected){
			console.log("Subscribe to route: ", route);
			return PushHub.server.subscribe(route)
				.catch(function(error){
					console.error("Error subscribing to route: ", route, error);
					return $q.reject(error);
				});
		}
	}

	function unsubscribeRoute(route, suppressLog){
		if(SignalRHubsConnection.getConnectionStatus() === Connected){
			if(!suppressLog){
				console.log("Unsubscribe Route: ", route);
			}
			return PushHub.server.unsubscribe(route)
				.catch(function(error){
					console.error("Error unsubscribing from route: ", route, error);
					return $q.reject(error);
				});
		}

	}


	return PushBus;

}]);
;

'use strict';

angular.module('VBrick.Security')

.controller('Security.ForgotPasswordController',
       ['$scope', 'UserAuthenticationService', 'PushService', 'UserContext',
function($scope, UserAuthenticationService, PushService, UserContext) {
	angular.extend($scope, {
		lastError: undefined,
		submit: function() {
			resetStatus();
			$scope.status.processing = true;

			$scope.lastError = undefined;

			UserAuthenticationService.requestPasswordReset($scope.username)
				.then(function() {
					resetStatus();
					$scope.status.success = true;
				}, function(error) {

					resetStatus();
					$scope.status.error = true;

					if (error.hasIssue('Inactive')) {
						$scope.lastError = 'Suspended';
					}
					else if (error.hasIssue('UserIsLdap')) {
						$scope.lastError = 'UserIsLdap';
					}
					else if (error.hasIssue('AwaitingSecurityQuestionReset')) {
						$scope.lastError = 'ExceededMaxResetAttempts';
					}
					else if (error.hasIssue('Confirming')) {
						$scope.lastError = 'Confirming';
					}
					else if (error.hasIssue('CommandDenied')) {
						$scope.lastError = 'ForgotPassword_CommandDenied';
					}
					else if (error.hasIssue('NotActive')) {
						$scope.lastError = 'NotActive';
					}
				});
		}
	});

	resetStatus();
	$scope.status.active = true;

	function resetStatus(){
		$scope.status = {};
	}
}]);
;

'use strict';

angular.module('VBrick.Security')

.controller('Security.LoginController',
       ['$scope', '$location', 'UserContext', '$stateParams', 'SignalRHubsConnection', '$timeout',
function($scope,   $location,   UserContext,   $stateParams,   SignalRHubsConnection,   $timeout) {

	var resetStatus = function(){
		$scope.status = {
			loading: false,
			processing: false,
			error: false,
			badCredentials: false,
			suspended: false,
			maintenance: false,
			lockedOut: false
		};
	};

	if(!doLogOut()){
		resetStatus();
		$scope.status.active = true;
		$scope.status.badCredentials = $stateParams.invalidCredentials;
	}

	//https://github.com/tbosch/autofill-event doesn't cause form autofill to fire onchange events in all browsers
	//angular not seeing data when this happens
	$timeout(scrapeFormState, 250);

	angular.extend($scope, {

		formData: {
			username: UserContext.getUser().username,
			password: null
		},

		submit: function(){
			resetStatus();
			$scope.status.processing = true;

			UserContext.authenticateUser($scope.formData.username, $scope.formData.password)
				.then(function() {
					var url = window.location.pathname + window.location.search;
					var fwdUrl = $stateParams.fwdUrl;

					if(!fwdUrl || fwdUrl.indexOf($location.path()) === 0){
						fwdUrl = '/';
					}

					var userLanguage = UserContext.getUser().language;
					var accountLanguage = UserContext.getAccount().language;
					if (userLanguage && userLanguage !== accountLanguage) {
						return window.setTimeout(function() {
							window.location.replace(url + "#" + fwdUrl);
						}, 100);
					}

					$location.url(fwdUrl);
				}, function(result) {
					resetStatus();
					$scope.status.active = true;

					if (result === 'LogOnFailed') {
						$scope.status.badCredentials = true;
					}
					else if (result === 'LockedOut') {
						$scope.status.lockedOut = true;
					}
					else if (result === 'NotActive') {
						$scope.status.suspended = true;
					}
					else if (result === 'LogOnFailedMaintenance') {
						$scope.status.maintenance = true;
					}
					else {
						$scope.status.error = true;
					}
				});

			$scope.formData.password = null;
		},

		//https://github.com/tbosch/autofill-event doesn't cause onchange events to be fired in all browsers
		handleBrowserAutofill: function() {
			$timeout(scrapeFormState);
		}
	});

	function scrapeFormState(){
		$scope.formData = {
			username: $('input[name=username]').val(),
			password: $('input[name=password]').val()
		};
	}

	//If User visits the login form after being logged in - automatically log them out;
	function doLogOut() {
		if(!UserContext.isUserAuthenticated()) {
			return;
		}

		resetStatus();
		$scope.status.loading = true;

		UserContext.logOutUser($stateParams.sessionEnded)
			.finally(function () {
				resetStatus();
				$scope.status.active = true;
				if($stateParams.sessionEnded){
					$scope.status.sessionEnded = true;
				}
				else{
					$scope.status.loggedOut = true;
				}


			});
		return true;
	}

}]);
;

'use strict';


angular.module('VBrick.Security')
.factory('LoginRedirectService', ['UserContext', '$state', '$location', '$window', function(UserContext, $state, $location, $window){

	var self = {
		redirectToLogin: function(fwdUrl){
			$window.location.href = self.getLoginLink(fwdUrl);
		},

		getLoginLink: function(fwdUrl){

			fwdUrl = sanitizeFwdUrl(fwdUrl || $location.url());

			if(UserContext.ssoEnabled() && (UserContext.getUser().isSsoUser || !UserContext.isUserAuthenticated())){
				return '/sso/login' + (fwdUrl ? "?fwdUrl=" + encodeURIComponent("/#" + fwdUrl) : "" );
			}

			return $state.href('login', {fwdUrl: fwdUrl});
		},

		redirectToLogout: function(params){
			$window.location.href = self.getLogoutLink(params);
		},

		getLogoutLink: function(params){
			params = params || {};
			params.fwdUrl = sanitizeFwdUrl(params.fwdUrl);

			var fwdState = UserContext.getUser().isSsoUser ?
				'sso-logout' :
				'login';

			return $state.href(fwdState, params);
		}

	};

	function sanitizeFwdUrl(fwdUrl){
		fwdUrl = fwdUrl || '';

		if(fwdUrl === '/' || fwdUrl.match(/login|logout/)){
			return '';
		}

		return fwdUrl;
	}

	return self;
}]);
;

'use strict';

angular.module('VBrick.Security')

.controller('Security.PasswordResetController',
       ['$scope', '$q', 'UserAuthenticationService', '$stateParams', '$state', 'PasswordValidationService',
function($scope,   $q,  UserAuthenticationService,   $stateParams,   $state,   PasswordValidationService) {

	loadData();

	var passwordRulesChecker;

	angular.extend($scope, {
		validatePassword: function() {
			$scope.passwordResetForm.confirmPassword.$setValidity("noMatch",
				!$scope.passwordReset.confirmPassword ||
				 $scope.passwordReset.password === $scope.passwordReset.confirmPassword);

			var result = passwordRulesChecker.validatePassword($scope.passwordReset.password);
			$scope.passwordResetForm.password.$setValidity('rules', result.valid);
			$scope.passwordResetForm.password.result = result;
		},

		submit: function() {
			resetStatus();
			$scope.status.loading = true;
			var data = {
				userId: $scope.passwordReset.userId,
				securityAnswer: $scope.passwordReset.securityAnswer,
				accountId: $scope.passwordReset.accountId,
				token: $stateParams.token,
				password: $scope.passwordReset.password
			};

			UserAuthenticationService.resetPassword(data)
				.then(function(result) {
					$state.go('login');
				}, function(result) {
					resetStatus();
					if (result === 'PasswordResetFailed') {
						$scope.status.active = true;
						$scope.status.passwordResetFailed = true;
					}
					else if (result.hasIssue('AwaitingSecurityQuestionReset')) {
						$scope.status.awaitingSecurityQuestionReset = true;
					}
					else{
						$scope.status.error = true;
					}
				});
		}
	});

	function resetStatus() {
		$scope.status = {};
	}

	function getPasswordReset(token) {
		return UserAuthenticationService.getUserPasswordReset(token)
			.then(function(passwordReset) {
				$scope.passwordReset = passwordReset;
				$scope.userId = passwordReset.userId;
			});
	}

	function getPasswordRulesChecker() {
		return PasswordValidationService.getPasswordRulesChecker($scope.passwordReset.accountId)
			.then(function(result) {
				passwordRulesChecker = result;
				$scope.passwordRules = passwordRulesChecker.rules;
			});
	}

	function loadData() {
		resetStatus();
		$scope.status.loading = true;

		getPasswordReset($stateParams.token)
			.then(function() {
				return getPasswordRulesChecker();
			})
			.then(function() {
				resetStatus();

				$scope.status.active = true;
			}, function(err) {
				resetStatus();

				if(err.status == 404){
					$scope.status.invalidToken = true;
				}
				else{
					$scope.status.error = true;
				}
			});
	}
}]);
;

'use strict';

angular.module('VBrick.Security')

.factory('PasswordValidationService',
    ['PushService', '$q', '$resource',
function(PushService, $q, $resource) {

	var passwordRulesResource = $resource('/network/accounts/:accountId/password-rules');

	return {
		getPasswordRulesChecker: function(accountId) {

			return passwordRulesResource.get({accountId: accountId}).$promise
				.then(function(rules) {

					return {
						rules: rules,

						validatePassword: function (password) {
							var counts = getCharacterCounts(password||"");
							var result = { valid: true };

							if(counts.length < rules.minimumLength) {
								result.valid = false;
								result.errorMinimumLength = true;
							}
							if(counts.upper < rules.minimumUppercaseLetterCount) {
								result.valid = false;
								result.errorMinimumUppercaseLetterCount = true;
							}
							if(counts.lower < rules.minimumLowercaseLetterCount) {
								result.valid = false;
								result.errorMinimumLowercaseLetterCount = true;
							}
							if(counts.digit < rules.minimumNumberCount) {
								result.valid = false;
								result.errorMinimumNumberCount = true;
							}
							if(counts.special < rules.minimumSpecialCharacterCount) {
								result.valid = false;
								result.errorMinimumSpecialCharacterCount = true;
							}

							return result;
						}
					};
				});
		}
	};

	function getCharacterCounts(password) {

		var counts = {
			length: password.length,
			upper: 0,
			lower: 0,
			digit: 0,
			special: 0
		};

		for(var i=0, len=password.length; i<len; i++){
			if(password.charAt(i).match(/[A-Z]/)){
				counts.upper++;
			}
			else if(password.charAt(i).match(/[a-z]/)){
				counts.lower++;
			}
			else if(password.charAt(i).match(/[0-9]/)){
				counts.digit++;
			}
			else if(password.charAt(i).match(/[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/)){
				counts.special++;
			}
		}
		return counts;
	}


}]);
;

'use strict';

angular.module('VBrick.Security')

.factory('RoleService',
       ['$resource', 'AccountService',
function($resource,   AccountService) {

	var rolesResource = $resource('/network/accounts/:accountId/roles');
	var rolesByAccountId = {};

	return  {
		get roles () {
			return rolesByAccountId[AccountService.workingAccountId];
		},

		fetchRoles: function() {
			var accountId = AccountService.workingAccountId;

			return rolesResource
				.get({accountId: accountId}).$promise
				.then(function(data) {
					rolesByAccountId[accountId] = data.roles;
				});
		}
	};
}]);
;

'use strict';

angular.module('VBrick.Security')

.controller('SSOLogoutController',
       ['$scope', 'UserContext', '$stateParams', 'LoginRedirectService',
function($scope,   UserContext,   $stateParams,   LoginRedirectService) {

	$scope.loginUrl = LoginRedirectService.getLoginLink($stateParams.fwdUrl);


	if (UserContext.isUserAuthenticated()) {
		$scope.status = {loading: true};

		UserContext.logOutUser($stateParams.sessionEnded)
			.finally(function () {
				$scope.status = {active: true};
			});
	}
	else{
		$scope.status = {active: true};
	}

}]);
;

'use strict';

angular.module('VBrick.Security')

/**
	Removes element from the dom if user does not have the required authorization key.

	<div vb-authorization-key="authorization-key">
		<span vb-alt>Show this when user has no access</span>
		<button>Delete all the users</button>
	</div>
**/

.directive('vbAuthorizationKey', [function(){
	return {
		restrict: 'A',
		priority: 1000001,
		compile: function(el, attr){

			var alt = $("[vb-alt], vb-alt", el);
			if(alt.length){
				alt.detach();
				attr.$set("vbAlt", alt, false);
			}
		}
	};
}])

.directive('vbAuthorizationKey', ['SecurityContext', function(SecurityContext){
	return {
		restrict: 'A',
		transclude: 'element',
		priority: 1000000,
		terminal: true,
		controller: 'AuthorizationDirectiveController',
		link: function($scope, el, attr, ctrl){

			var key = attr.vbAuthorizationKey;
			ctrl.setAuthorizeFn(function(SecurityContext){
				return SecurityContext.checkAuthorization(key);
			});

			if(attr.vbAlt){
				ctrl.setAltContent(attr.vbAlt);
			}

			ctrl.update();
		}
	};
}])


/**
Remove links from the page if the user does not have permission to visit that page.

 <!-- restrict access to admin page.  The portal.admin state is found in the child element. -->
<div vb-authorize-state>
	<span vb-alt>Show this when user has no access</span>
	<a ui-sref="portal.admin">Admin</a>
</div>

<!-- Similar to above.  The portal.admin state is defined as an attribute-->
<div vb-authorize-state="portal.admin">
	<a ui-sref="#/some-page">Admin</a>
</div>

**/
.directive('vbAuthorizeState', [function(){
	return {
		restrict: 'A',
		priority: 1000001,
		compile: function(el, attr){

			var stateName = attr.vbAuthorizeState;
			if(!stateName){
				stateName = findSrefState(el);
				attr.$set("vbAuthorizeState", stateName, false);
			}

			var alt = $("[vb-alt], vb-alt", el);
			if(alt.length){
				alt.detach();
				attr.$set("vbAlt", alt, false);
			}

			function findSrefState(el){
				var sref = el.attr("ui-sref") || el.find("[ui-sref]").attr("ui-sref");
				if(sref){
					var i = sref.indexOf("(");
					return (i < 0) ? sref : sref.substring(0,i);
				}
			}
		}
	};
}])

.directive('vbAuthorizeState', [function(){
	return {
		restrict: 'A',
		transclude: 'element',
		priority: 1000000,
		terminal: true,
		controller: 'AuthorizationDirectiveController',
		link: function($scope, el, attr, ctrl, transclude){
			var stateName = attr.vbAuthorizeState;

			if(!stateName){
				throw new Error("vbAuthorizeState directive missing value/nested ui-sref");
			}

			ctrl.setAuthorizeFn(function(SecurityContext){
				return SecurityContext.allowStateChangeSync(stateName);
			});

			if(attr.vbAlt){
				ctrl.setAltContent(attr.vbAlt);
			}

			ctrl.update();
		}
	};
}])

.controller('AuthorizationDirectiveController',
       ['$scope', 'SecurityContext', '$element', '$transclude', '$compile',
function($scope,   SecurityContext,   $element,   $transclude,   $compile){


	var authorize;
	var mainContent = buildTransclusionToggle($scope, $element, $transclude);
	var altContent;


	_.extend(this, {
		setAuthorizeFn: function(fn){
			authorize = fn;
		},
		setAltContent: function(alt){
			altContent  = buildTransclusionToggle($scope, $element, function(scope, linkFn){
				var clone = alt.clone();
				linkFn(clone);

				$compile(clone)(scope);
			});
		},

		update: function(){
			if(authorize && authorize(SecurityContext)){
				altContent && altContent.disable();
				mainContent.enable();
			}
			else{
				mainContent.disable();
				altContent && altContent.enable();
			}
		}

	});

	$scope.$on("SecurityContext.Change", this.update);



	function buildTransclusionToggle($scope, insertPosition, transclude){

		var childElement;
		var childScope;
		var enabled = false;

		return {
			enable: function(){
				if(!enabled){
					enabled = true;
					childScope = $scope.$new();
					transclude(childScope, function (clone) {
						childElement = clone;
						insertPosition.after(clone);
					});
				}
			},

			disable: function(){
				enabled = false;
				if (childElement) {
					childElement.remove();
					childElement = undefined;
				}
				if (childScope) {
					childScope.$destroy();
					childScope = undefined;
				}
			}
		};
	}

}]);
;

'use strict';

angular.module('VBrick.Security')

.factory('SecurityContext', ['$rootScope', '$q', '$state', 'UserAuthenticationService', 'UserContext',
                     function($rootScope,   $q,   $state,   UserAuthenticationService,   UserContext){

	var authorizationKeys = {};
	var initializationDeferred = $q.defer();


	var securityContext = {
		//promise that resolves when the service has been initialized
		initializationPromise: initializationDeferred.promise,

		//tracks state when data is reloaded.
		$promise: initializationDeferred.promise,

		checkAuthorization: function(authorizationKey){
			return authorizationKeys[authorizationKey];
		},

		allowStateChange: function(state){
			var authKey = getAuthorizationKey(state);
			if(authKey){
				return $q.when(securityContext.$promise)
					.then(function(){
						return securityContext.checkAuthorization(authKey);
					});
			}
			return $q.when(true);
		},

		allowStateChangeSync: function(state){
			var authKey = getAuthorizationKey(state);
			if(authKey){
				return securityContext.checkAuthorization(authKey);
			}
			return true;
		},

		getFirstAllowedStateChange: function(states){
			return $q.when(securityContext.$promise)
				.then(function(){
					return _.find(states, function(state){
						var authKey = getAuthorizationKey(state);
						return !authKey || securityContext.checkAuthorization(authKey);
					});
				});
		},

		reloadAuthorization: function(){
			authorizationKeys = {};
			securityContext.$promise = UserAuthenticationService.getAuthorization()
				.then(function(keys){

					_.each(keys, function(key){
						authorizationKeys[key] = true;
					});

				}, function(err){
					if(initializationDeferred){
						initializationDeferred.reject(err);
						initializationDeferred = null;
					}

				}).then(function(){
					securityContext.$promise = null;
					if(initializationDeferred){
						initializationDeferred.resolve(securityContext);
						initializationDeferred = null;
					}

					$rootScope.$broadcast("SecurityContext.Change");
				});
			return securityContext.$promise;
		}

	};

	function getAuthorizationKey(stateName){
		var state = $state.get(stateName);
		if(!state){
			throw new Error("State not found: "+stateName);
		}
		return state.authorizationKey;
	}

	return securityContext;

}]);
;

'use strict';


angular.module('VBrick.Security')

.factory('Session', ['UserContext', 'UserAuthenticationService', '$state', '$location', 'SignalRHubsConnection', function(UserContext, UserAuthenticationService, $state, $location, SignalRHubsConnection){

	var sessionKeepAliveInterval = 5 * 60000;

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

	var extendSessionTimeoutImpl = _.throttle(function(){
		if(UserContext.isUserAuthenticated()){
			UserAuthenticationService.extendSessionTimeout(UserContext.getUser().id, UserContext.getAccount().id)
				.catch(function(err){
					if(err.hasIssue("CommandDenied")){
						$state.go('login', {fwdUrl: $location.url()});
					}
					console.log("Cannot do command: ", err);
				});
		}
	}, sessionKeepAliveInterval);

	return Session;
}])

.config(['$httpProvider', function($httpProvider) {

	//keep session alive if http requests are going through;
	$httpProvider.interceptors.push(['$injector', function($injector) {
		var UserContext, Session;
		var isReady;

		//injecting UserContext would create a circular dependency -
		//	UserContext depends on http, and http depends on the httpProvider interceptors.
		return {
			request: function(config){
				tryExtendSessionTimeout();
				return config;
			}
		};

		function tryExtendSessionTimeout(){
			try{
				if(!isReady){
					var SignalRHubsConnection = $injector.get('SignalRHubsConnection') ;
					if(SignalRHubsConnection.getConnectionStatus() !== SignalRHubsConnection.State.Connected){
						return;
					}

					UserContext = $injector.get('UserContext');
					Session = $injector.get('Session');
					isReady = true;
				}

				if(UserContext.isSessionStable()){
					Session.extendTimeout();
				}
			}catch(e){}
		}

	}]);
}])

.run(['SignalRHubsConnection', 'Session', function(SignalRHubsConnection, Session){

	SignalRHubsConnection.on({
		//Attempt to extend session on reconnect. This forces the UI to bounce back to the login page if the session ended while the connection was down.
		reconnected: Session.extendTimeout
	});

}]);;

'use strict';

angular.module('VBrick.Security')

.config(['$stateProvider', function($stateProvider){

	$stateProvider.decorator('data', function(state, parent){
		var stateData = parent(state);

		state.resolve = _.extend({}, state.resolve);

		var authorizationKey = state.self.authorizationKey;
		var allowGuestAccess = state.self.allowGuestAccess;
		var allowAllAccess = state.self.allowAllAccess;

		if(!allowAllAccess || authorizationKey){
			addInterceptorToState();
		}


		function addInterceptorToState(){

			state.resolve["Security.Authorization"] = ['SecurityContext', 'UserContext', '$q', function(SecurityContext, UserContext, $q){
				return SecurityContext.initializationPromise
					.then(function(){
						var error401 = {status: 401}; //$stateChangeError below handles authentication vs. authorization routing

						if(!UserContext.isUserAuthenticated() &&
							!allowAllAccess &&
							!(allowGuestAccess && SecurityContext.checkAuthorization("guest"))){

							return $q.reject(error401); //not authenticated
						}


						if(authorizationKey){
							return SecurityContext.allowStateChange(state)
								.then(function(allowed){
									return allowed ||
										$q.reject(error401); //not authorized
								});
						}
					});
			}];
		}

		return stateData;
	});
}])

.run(
       ['$rootScope', '$state', '$location', '$timeout', 'SecurityContext', 'UserContext', 'LoginRedirectService',
function($rootScope,   $state,   $location,   $timeout,   SecurityContext,   UserContext,   LoginRedirectService){

	$rootScope.$on('$stateChangeError', function(e, toState, toParams, fromState, fromParams, error){
		var errorStatus = error && error.status;
		var errorReason = error && error.reason;

		switch (errorStatus) {
		case 401: //unauthorized
			if (!UserContext.isUserAuthenticated()) {
				redirectToLogin();
			} else {
				var isFromWithinPortal = fromState.name.lastIndexOf('portal', 0) === 0;

				$state.go(isFromWithinPortal ? 'portal.401' : '401', {reason: errorReason});
			}
			break;

		case 404: //not found
			$state.go('portal.404');
			break;
		}

		function redirectToLogin(){
			var fwdUrl = $location.url();

			$timeout(function(){
				LoginRedirectService.redirectToLogin(fwdUrl);
			}, 100);
		}
	});

	$rootScope.$on("$stateChangeStart", function(e, state, params){
		var redirectStates = state.secureRedirects;

		if(redirectStates && !e.defaultPrevented){ //not already preventing the change
			e.preventDefault();

			SecurityContext.getFirstAllowedStateChange(redirectStates)
				.then(function(state){
					if (state) {
						$state.go(state, params);
					} else {
						$state.go('401', params, {reload: true});
					}
				});
		}
	});
}]);
;

'use strict';

angular.module('VBrick.Security')

.factory('UserAuthenticationService',
       ['PushService', '$q', '$resource','$http',
function(PushService,   $q,   $resource, $http) {

	var userConfirmationResource = $resource('/network/users/confirm/:token');
	var userResource = $resource('/network/users/:userId');
	var passwordResetResource = $resource('/network/users/reset/:token');
	var authorizationResource = $resource('/authorization');
	var sessionResource = $resource('/session');

	return {

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

		confirmUser: function (userConfirmation) {
			return PushService.dispatchCommand("network:ConfirmUser", {
				userId:userConfirmation.userId,
				token:userConfirmation.token,
				password:userConfirmation.password,
				securityQuestion:userConfirmation.securityQuestion,
				securityAnswer:userConfirmation.securityAnswer
			});
		},

		/**
			Logs out the currently active user
			returns promise object
		**/
		doLogout: function (userId) {
			return PushService.dispatchCommand("network:LogOff", {
					userId:userId
				});
		},

		getUserConfirmation: function (token) {

			return userConfirmationResource.get({ token: token }).$promise
				.then(function (data) {
					return {
						userId: data.userId,
						accountId: data.accountId,
						username: data.username
					};
				});
		},

		getAuthorization: function(){
			return authorizationResource.get().$promise
				.then(function(result){
					return result.authorizationKeys;
				});
		},

		requestPasswordReset: function(username) {
			return PushService.dispatchCommand("network:RequestPasswordReset", { username: username });
		},

		getUserPasswordReset: function(token) {
			return passwordResetResource.get({token: token}).$promise;
		},

		resetPassword: function(passwordReset) {
			return PushService.dispatchCommand("network:ResetPassword", {
				token: passwordReset.token,
				userId: passwordReset.userId,
				securityAnswer: passwordReset.securityAnswer,
				password: passwordReset.password
			})
			.then(function(result) {
				if (result.type === 'PasswordResetFailed') {
					return $q.reject('PasswordResetFailed');
				}
				return result;
			});
		},

		checkSessionHealth: function () {
			return sessionResource.get().$promise;
		},

		getUserIp: function(userLocationUrl){
			if(document.documentMode <= 9) {
				return $http.jsonp(userLocationUrl + '?callback=JSON_CALLBACK')
				.then(function(callback){
					return callback.data.ip;
				});
			}
			else {
				var userLocationResource = $resource(userLocationUrl);
				return userLocationResource.get().$promise
				.then(function(result) {
					return result.ip;
				});
			}
		}
	};

}]);
;

'use strict';

/**
 * Handles the singup confirmation logic
 **/
angular.module('VBrick.Security')

.controller('Security.UserConfirmationController',
       ['$scope', '$log', '$q', '$stateParams', '$location', 'UserAuthenticationService', 'PasswordValidationService', 'UserContext',
function($scope, $log, $q, $stateParams, $location,  UserAuthenticationService, PasswordValidationService, UserContext) {

	var savingStatus = "saving";
	var errorStatus = "error";
	var activeStatus = "active";
	var loadingStatus = "loading";
	var suspendedStatus = "userSuspended";
	var invalidTokenStatus = "invalidToken";
	var userConfirmedStatus = "userConfirmed";

	$scope.status = loadingStatus;

	var passwordRulesChecker;

	getUserConfirmation();

	angular.extend($scope, {

		validatePassword: function() {
			$scope.userConfirmationForm.confirmPassword.$setValidity("noMatch", $scope.userConfirmation.password === $scope.userConfirmation.confirmPassword);
			if(passwordRulesChecker){
				var result = passwordRulesChecker.validatePassword($scope.userConfirmation.password);
				$scope.userConfirmationForm.password.$setValidity('rules', result.valid);
				$scope.userConfirmationForm.password.result = result;
			}
		},

		submit: function () {
			$scope.status = savingStatus;

			UserAuthenticationService.confirmUser($scope.userConfirmation)
				.then(function(){

					$scope.status = userConfirmedStatus;

					$scope.userConfirmedDialog.open().result
						.finally(function() {
							return UserContext.authenticateUser($scope.userConfirmation.username, $scope.userConfirmation.password)
								.then(function() {
									$location.url("/");
								}, function(err) {
									$location.url("/");
								});
						});
				}, function(err){
					$scope.status = errorStatus;
				});
		}
	});

	// internal function to help us check the validity of the token
	function getUserConfirmation() {
		var token = $stateParams.token;

		UserAuthenticationService.getUserConfirmation(token)
			.then(function (data) {
				$scope.userConfirmation = {
					userId: data.userId,
					username: data.username,
					token: token
				};
				$scope.userId = data.userId;
				$scope.accountId = data.accountId;

			})
			.then(function(){
				return getPasswordRulesChecker($scope.accountId);
			})
			.then(function(){
				$scope.status = activeStatus;
			}, function(err) {
				if(err && err.status === 404){
					$scope.status = invalidTokenStatus;
				}
				else {
					$scope.status = errorStatus;
				}
			});

	}

	function getPasswordRulesChecker(accountId) {
		return PasswordValidationService.getPasswordRulesChecker(accountId)
			.then(function(result) {
				passwordRulesChecker = result;
				$scope.passwordRules = passwordRulesChecker.rules;
			});
	}
}]);
;

'use strict';

/**
	User Context

	Holds information about the currently logged in user

		Fires the following events on the root scope:
			'UserContext.Change' - fires when a user logs in or out
									(Does not fire when application first loads, event if the user is already logged in)
**/
angular.module('VBrick.Security')

.factory('UserContext',
       ['UserAuthenticationService', '$rootScope', '$q', 'CookieUtil', 'VBrick.BootstrapContext', 'PromiseUtil',
function(UserAuthenticationService,   $rootScope,   $q,   CookieUtil,   BootstrapContext,          PromiseUtil){

	var accessTokenCookie = 'vbrickAccessToken';
	var userIpCookie = 'userIp';

	var accessToken = null;
	if(BootstrapContext.user && BootstrapContext.user.username){
		//only keep the accessToken if the server was able to identify the current user
		accessToken = CookieUtil.get(accessTokenCookie);
	}else{
		CookieUtil.unset(accessTokenCookie);
	}

	var bootstrapUser = BootstrapContext.user || {};
	var bootstrapAccount = BootstrapContext.account || {};
	var bootstrapUserLocation = BootstrapContext.userLocation || {};

	var userInfo = {

		accessToken: accessToken,
		sessionStable: !!accessToken,

		rootHostName: BootstrapContext.rootHostName,

		//The logged in user
		user: {
			id:  bootstrapUser.id,
			username: bootstrapUser.username,
			fullName: (bootstrapUser.firstName || '') + ' ' + (bootstrapUser.lastName || ''),
			firstName: bootstrapUser.firstName,
			lastName: bootstrapUser.lastName,
			language : bootstrapUser.language,
			isSsoUser: bootstrapUser.isSsoUser
		},

		//The account the user is logged into
		account: {
			id: bootstrapAccount.id,
			name: bootstrapAccount.name,
			language: bootstrapAccount.language,
			isRootAccount: bootstrapAccount.isRootAccount
		}

	};

	return {
		/**
			Returns the user who is currently logged in:
			{ id, username }
		**/
		getUser: function(){
			return userInfo.user || {};
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

		getRootHostName: function(){
			return userInfo.rootHostName;
		},

		ssoEnabled: function(){
			return BootstrapContext.ssoEnabled;
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
			return UserAuthenticationService.authenticateUser(username, password)
				.then(function(user){
					if(user){
						user.username = username;
						return initializeUserAuthentication(user);
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
			CookieUtil.unset(userIpCookie);
			return (localLogOut ? $q.when(true) : UserAuthenticationService.doLogout(userInfo.user.id))
					.finally(function(){
						userInfo.accessToken = null;
						userInfo.sessionStable = false;
						userInfo.user = null;

						$rootScope.$broadcast('UserContext.Change');
					});
		},

		checkUserLocation: function(){
			var userIp = CookieUtil.get(userIpCookie);
			if(bootstrapUserLocation.enabled && !userIp)
			{
				initializeUserLocation();
			}
		}
	};

	/**
	 * Create the initial state of the user authentication
	 * @param accessToken
	 * @param user
	 */
	function initializeUserAuthentication(user){
		userInfo.accessToken = user.token;
		userInfo.user = {
			id:  user.id,
			username: user.username,
			fullName: _.compact([user.firstName, user.lastName]).join(' '),
			language: user.language
		};

		CookieUtil.set(accessTokenCookie, userInfo.accessToken);
		$rootScope.$broadcast('UserContext.Authenticated');
		initializeUserLocation();

		return waitForSessionToStabilize()
			.then(function(){
				userInfo.sessionStable = true;
				$rootScope.$broadcast('UserContext.Change');
			});
	}

	function waitForSessionToStabilize(){
		return PromiseUtil.retryUntilSuccess(function(){
			return UserAuthenticationService.checkSessionHealth();
		});
	}

	function initializeUserLocation(){
		if(bootstrapUserLocation.enabled && bootstrapUserLocation.url)
		{
			UserAuthenticationService.getUserIp(bootstrapUserLocation.url)
			.then(function(ip){
				CookieUtil.set(userIpCookie, ip);
			});
		}
	}

}]);
;

'use strict';


angular.module("VBrick.SignalR")

.constant('Observable', (function(){

	function Observable(cfg){
		cfg = cfg || {};
		//eventType -> array of listener functions
		this.eventListeners = {};
		this.context = cfg.context || this;

		if(cfg.listeners){
			this.on(cfg.listeners);
		}
	}

	_.extend(Observable.prototype, {
		on: function(eventType, listener){
			if(arguments.length === 1){
				_.each(arguments[0], function(l, e){
					this.on(e, l);
				}, this);
			}
			else{
				var subscribers = this.eventListeners[eventType];
				if(!subscribers){
					subscribers = this.eventListeners[eventType] = [];
				}
				subscribers.push(listener);
			}

		},

		mon: function($scope, eventType, listener){
			if(arguments.length === 2){
				_.each(arguments[1], function(l, e){
					this.mon($scope, e, l);
				}, this);
			}
			else{
				this.on(eventType, listener);
				$scope.$on('$destroy', _.bind(this.off, this, eventType, listener));
			}
		},

		off: function(eventType, listener){
			var listeners = this.eventListeners[eventType] || [];
			var i = _.indexOf(listeners, listener);
			if(i>=0){
				listeners.splice(i, 1);
			}
		},

		fire: function(eventType){
			var args = Array.prototype.slice.call(arguments, 1);

			var subscribers = this.eventListeners[eventType] || [];

			var result;
			_.each(subscribers.slice(), function(listener){
				result = listener.apply(this.context, args);
			}, this);

			return result;
		},

		hasSubscribers: function(eventType){
			var numListeners = 0;
			var listeners = this.eventListeners;

			if(eventType){
				return listeners[eventType] && listeners[eventType].length > 0;
			}

			var events = Object.keys(listeners);

			_.each(events, function(event){
				numListeners += listeners[event] ? listeners[event].length : 0;
			});

			return numListeners > 0;
		}

	});

	return Observable;
})());
;

'use strict';

/**
	Confirmation dialog service that wraps the Angular Bootstrap Modal.

	Example usage:

	In your template:
		<vb-confirmation-dialog
			name="warningDialog"
			title="Warning"
			message="Are you sure?"
			cancel-text="Cancel"
			action-text="Ok">
		</vb-confirmation-dialog>

	In controller:
		$scope.warningDialog.open().result
			.then(function () {
				//dialog was accepted
			}, function() {
				//dialog was dismissed
			});
**/
angular.module('VBrick.UI.Dialog')

.config(['DialogProvider', function(DialogProvider){
	DialogProvider.when('ConfirmationDialog', {
		template: [
			'	<form>',
			'	<div class="modal-header">',
			'		<h4>{{title}}',
			'		<button class="close pull-right btn btn-transparent" ng-show="cancelText" ng-click="dismiss()">',
			'       <span class="glyphicons remove_2"></span></button></h4>',
			'	</div>',
			'	<div class="modal-body" ng-bind-html="message"></div>',
			'	<div class="modal-footer">',
			'		<button class="btn btn-white btn-admin" ng-show="cancelText" ng-click="dismiss()">{{cancelText}}</button>',
			'		<button class="btn btn-primary" type="submit" ng-show="actionText" ng-click="close()" autofocus>{{actionText}}</button>',
			'	</div>',
			'	</form>'
		].join(''),

		controller: ['$scope', '$modalInstance', 'dialogParams', function($scope, $modalInstance, dialogParams){
			$scope.title = dialogParams.title;
			$scope.message = dialogParams.message;
			$scope.cancelText = dialogParams.cancelText;
			$scope.actionText = dialogParams.actionText;

			$scope.close = $modalInstance.close;
			$scope.dismiss = $modalInstance.dismiss;
		}]
	});
}])

.directive('vbConfirmationDialog', ['$modal', '$parse', function($modal, $parse){
	return {
		restrict: 'AE',
		compile: function(el){
			el.css('display', 'none');
		},

		controller: ['$scope', '$attrs', 'Dialog', '$element', function($scope, $attrs, Dialog, $element){
			var setController = $parse($attrs.name).assign;
			setController($scope, this);

			this.open = function(){
				return Dialog.getDialog('ConfirmationDialog')
					.open({
						title: $attrs.title,
						message: $attrs.message || $element.html(),
						cancelText: $attrs.cancelText,
						actionText: $attrs.actionText
					});
			};
		}]
	};
}]);;

'use strict';


angular.module('VBrick.UI.Dialog')


/**
	A simple controller that exposes the dialog params object and other dialog functionality to the scope.
**/
.controller('SimpleDialogController', ['$scope', '$modalInstance', 'DialogParams', function($scope, $modalInstance, DialogParams){
	_.extend($scope, {
		DialogParams: DialogParams,
		close: $modalInstance.close,
		dismiss: $modalInstance.dismiss
	});
}]);;

'use strict';

angular.module("VBrick.UI.GridList", ['selectionModel'])

	/**
	* Generates a flex-based grid (with IE9 table layout fallback) based on a supplied configuration.
	* Features include:
	* - configurable field types (plain text, icon, thumbnail)
	* - multiple selection through a checkbox column (row is clickable)
	* - optional header
	*
	* Features coming soon:
	* - Interactive column sorting
	* - Filtering
	* - Single item selection
	* - Dynamic field visibility
	* - Tile view
	* - Infinite scroll
	* - Item action menu
	*
	* <vb-grid-list
	* 		items = list model
	* 		selected-items = holds selected items from the model (populated by selectionModel).
	* 		empty-msg = a message to display when the items model is empty.
	* 		item-id-field = unique identifier used for $trackBy.
	* 		selection-mode = "single" / "multiple". Includes a checkbox column. If not specified, then the grid items are not selectable.
	* 		sort-field = name of the field to sort the list by.
	* 		sort-desc = "true" / "false" (default)
	* >
	*		<columns
	*			show-header = "true" / "false". Whether or not to render the column headers.
	*		>
	*		<column
	*				field = name of the field in the item.
	*				binding = "true" / "false". Default is "false". Data binding is enabled when true.
	*				header = string to display as the column header (assuming show-header=true).
	*				type = "" (straight output of value) / "icon" / "thumb"
	*				icon-func = a function used by type="icon" which accepts the item and returns an appropriate CSS class name string.
	*				filters = AngularJS filters to apply the value. May specify multiple by separating them with a pipe (|).
	*			>
	*		</columns>
	* </vb-grid-list>
	*/
	.directive("vbGridList", ['$window', function($window) {
		return {
			restrict: 'E',
			template: getGridListTemplate,
			scope: {
				items: '=', //the list model.
				selectedItems: '=', //used by selectionModel to store selections
				emptyMsg: '@', //message to display when items has a size of 0
				sortField: '@',
				sortDesc: '@'
			},

			link: function(scope, elem, attrs) {
				addIconFuncsToScope(scope, elem);

				scope.$root.selectedItems = scope.selectedItems || [];

				_.extend(scope, {
					isSelectAll: false, //model for the select all checkbox

					selectOrDeselectAll: function() {

						scope.isSelectAll = !scope.isSelectAll;

						//select all checkbox clicked, so apply value across all the items
						scope.items.forEach(function(item){
							item.selected = scope.isSelectAll;
						});
					},

					onSelectionChange: function(item) {
						//a selection has changed in the list, so update the
						scope.isSelectAll = scope.selectedItems.length === scope.items.length && scope.selectedItems.length > 0;
					}
				});
			}
		};

		function getGridListTemplate(tElement, tAttrs){
			var template = [];
			var isIE9 = $window.navigator.appVersion.indexOf('MSIE 9.0') >= 0;
			var iconFuncs =  tElement.find('[icon-func]').map(function(index, elemWithIconFunc){
				return $(elemWithIconFunc).attr('icon-func');
			});

			//can't scroll the list with the IE9 fallback styling, so use this wrapper
			if (isIE9) {
				template.push('<div class="ie9-scroll-table">');
			}

			//header
			if (tAttrs.showHeader !== 'false') {
				template.push(getGridListHeaderTemplate(tElement, tAttrs));
			}

			//body
			template.push(getGridListBodyTemplate(tElement, tAttrs));

			//close the IE9 wrapper
			if (isIE9) {
				template.push('</div>');
			}

			//empty message
			template.push(getGridListEmptyMsgTemplate());

			//output a list of iconFunc names to the template element (for use during linking)
			tElement.attr('icon-funcs', iconFuncs.toArray().join(' '));

			return template.join('');
		}

		function getGridListHeaderTemplate(tElement, tAttrs) {
			var template = ['<header ng-hide="!items.length">'];
			var columnDefs = tElement.find('column');
			var isSelectionEnabled = !!tAttrs.selectionMode;

			//if select is enabled, include a select all checkbox
			if (isSelectionEnabled) {
				template.push('<div class="gridlist-checkbox-column">' +
					'<button type="button" class="btn btn-checkbox"'+
					'ng-class="{\'active\': isSelectAll}" ng-hide="!items.length"'+
					'ng-click="selectOrDeselectAll()">'+
					'<span class="glyphicons ok_2" ng-show="isSelectAll"></span>'+
					'</button>'+
					'</div>');
			}

			//output the header cells
			columnDefs.each(function(index, columnDef){
				columnDef = $(columnDef);

				template.push('<div ', getCellAlign(columnDef), ' ', getCellFlex(columnDef), '>', columnDef.attr('header'), '</div>');
			});

			template.push('</header>');

			return template.join('');
		}

		function getGridListBodyTemplate(tElement, tAttrs) {
			var template = [];
			var columnDefs = tElement.find('column');
			var trackBy = tAttrs.itemIdField ? 'item.' + tAttrs.itemIdField : '$index';
			var isSelectionEnabled = !!tAttrs.selectionMode;
			var selectionModelMode = tAttrs.selectionMode === 'multiple' ? 'multiple-additive' : 'single';

			//output an unordered list with list items generated with ng-repeat
			template.push('<ul ng-hide="!items.length">',
				'<li ng-repeat="item in items ',
				getOrderByExpression(),
				' track by ', trackBy,'" ',
				isSelectionEnabled ? 'class="selectable-item" selection-model selection-model-mode="' + selectionModelMode + '" selection-model-type="checkbox" selection-model-selected-items="selectedItems" selection-model-on-change="onSelectionChange(item)" ': '',
				'>'); //TODO: sort, etc.

			//if selection is enabled, include a checkbox cell
			if (isSelectionEnabled) {
				template.push('<div class="gridlist-checkbox-column">' +
					'<button type="button" class="btn btn-checkbox"'+
					'ng-class="{\'active\': item.selected}">'+
					'<span class="glyphicons ok_2" ng-show="item.selected"></span>'+
					'</button>'+
					'</div>');
			}

			//output cells for each column defintion
			columnDefs.each(function(index, columnDef){
				columnDef = $(columnDef);
				var textAlign = columnDef.attr('align');

				template.push('<div ', getCellAlign(columnDef), ' ', getCellFlex(columnDef), '>', renderCellByType(columnDef),'</div>');
			});

			template.push('</li></ul>');

			return template.join('');
		}

		function getGridListEmptyMsgTemplate() {
			return '<span ng-show="!items.length" class="gridlist-empty-msg">{{::emptyMsg}}</span>';
		}

		function renderCellByType($columnDef) {
			switch ($columnDef.attr('type')) {
			case 'thumb':
				return renderThumbnailCell($columnDef);

			case 'icon':
				return renderIconCell($columnDef);

			default:
				return renderDefaultCell($columnDef);
			}
		}

		function renderDefaultCell($columnDef) {
			return getFieldExpression($columnDef);
		}

		function renderThumbnailCell($columnDef) {
			var alText = ''; //TODO: flesh this stuff out more

			return ['<img src="', getFieldExpression($columnDef),'" alt="', ,'">'].join('');
		}

		function renderIconCell($columnDef) {
			var iconFunc = $columnDef.attr('icon-func');

			if (!iconFunc) {
				return '';
			}

			//calls the configured iconFunc which will determine an appropriate class to output for the icon
			return ['<span icon-func="', iconFunc,'" ng-class="', getBindingExpression($columnDef), 'iconFuncs[\'', iconFunc, '\'](item)" title=""></span>'].join(''); //TODO: title
		}

		function getFiltersExpression($columnDef) {
			var filters = $columnDef.attr('filters');

			//initial separating pipe is supplied may be followed by others in the supplied filters value
			return filters ? ' | ' + filters : '';
		}

		function getOrderByExpression() {
			return ' | orderBy: sortField:sortDesc';
		}

		function getBindingExpression($columnDef) {
			//if binding is not true (disabled), return the one-time binding prefix
			return $columnDef.attr('binding') === 'true' ? '' : '::';
		}

		function getFieldExpression($columnDef) {
			var filters = getFiltersExpression($columnDef);
			var binding = getBindingExpression($columnDef);

			//returns an expression for the configured field within item along with the appropriate binding type and filters applied.
			return ['{{', binding, 'item["', $columnDef.attr('field'),'"] ', filters, '}}'].join('');
		}

		function getCellAlign($columnDef) {
			return ['align="', $columnDef.attr('align'),'"'].join('');
		}

		function getCellFlex($columnDef) {
			var cellFlex = $columnDef.attr('flex');

			//if specified, returns inline styling for flex
			return cellFlex ? 'style="-ms-flex: ' + cellFlex + '; -webkit-flex: ' + cellFlex + '; flex: ' + cellFlex + '"' : '';
		}

		function addIconFuncsToScope(scope, elem) {
			//extract the iconFunc names from the icon-funcs attribute
			var iconFuncNames = elem.attr('icon-funcs').split(' ');

			scope.iconFuncs = {};

			//expose each into this scope
			iconFuncNames.forEach(function(iconFuncName){
				scope.iconFuncs[iconFuncName] = scope.$parent[iconFuncName];
			});
		}
	}]);;

'use strict';
angular.module('VBrick.UI.Dialog')

.config(['$provide', function($provide){
	$provide.decorator('insightDirective', ['$delegate', '$templateCache', function($delegate, $templateCache){

		var baseDirective = $delegate[0];

		baseDirective.templateUrl = function(tEl, tAttrs){
			return tAttrs.templateUrl || '/shared/partials/insight/insight.html';
		};

		var baseCompile = baseDirective.compile;
		baseDirective.compile = function(tEl, tAttrs){
			var location = $(tEl).find('.base-template');
			if(location){
				var baseTemplate = $($templateCache.get('insight.html'));
				location.replaceWith(baseTemplate);
			}
			return baseCompile.call(this, tEl, tAttrs);
		};

		return $delegate;
	}]);
}]);
;

'use strict';

angular.module("VBrick.UI.Toolbar", [])

	/*

	Standardized flexbox based layout for toolbars for wrapping flex-grid components.

	___________________
	Current CSS options

	.section-header -> h1
	.sub-section-header -> h2

	________
	Examples

	 <vb-toolbar class="section-header">
		 <div flex="fill">
		    <h1>@Strings.Reports_VideoHeader</h1>
		 </div>
		 <div>
		    <a class="btn btn-admin btn-white" ng-href="/analytics/videos/account/summary/{{accountId}}/csv" download>
		        @Strings.Reports_Csv
			 </a>
		 </div>
	 </vb-toolbar>

	 <vb-toolbar class="sub-section-header">
		 <div flex="fill">
			 <h2>@Strings.Reports_Top20Videos</h2>
		 </div>
	 </vb-toolbar>

	 // MOBILE NAV

	 this sticks to the top of the browser up to 992px

	 <vb-toolbar class="mobile-nav">
		 <div flex>
		    <button class="btn" ng-click="dme.selected = false">
		        <span class="glyphicons chevron-left"></span>
		    </button>
		 </div>
		 <div flex="fill">
		    {{ dme.name }}
		 </div>
	 </vb-toolbar>


	 // MODALS
	 <vb-toolbar edge-padding class="section-header">
		 <div flex="fill">
		    <h1>@Strings.Uploads_Import_SelectVideos</h1>
		 </div>
		 <div ng-show="webExRecordings.length">
		    <small>{{ webExRecordings.length }} @Strings.Media_Videos</small>
		 </div>
	 </vb-toolbar>

	 */


	.directive("vbToolbar", [function() {
		return {
			restrict: 'EA',
			controller: angular.noop,
			compile: function(element, attr){
				return {
					post: function(scope, element, attr) {

						if(!attr.hasOwnProperty('layout')){
							element.attr('layout', 'row');
						}
						if(!attr.hasOwnProperty('flexAlign')){
							element.attr('flex-align', 'center');
						}
						if(!attr.hasOwnProperty('layoutPadding')){
							element.attr('layout-padding', '0 100');
						}
						if(!attr.hasOwnProperty('edgePadding')){
							element.attr('layout-padding-no-edges', true);
						}

					}
				};
			}
		};
	}]);;

'use strict';

angular.module('VBrick.Util')

.constant('AudioBitrates', [
	{ code: '32', name: '32'},
	{ code: '40', name: '40'},
	{ code: '48', name: '48'},
	{ code: '56', name: '56'},
	{ code: '64', name: '64'},
	{ code: '80', name: '80'},
	{ code: '96', name: '96'},
	{ code: '112', name: '112'},
	{ code: '128', name: '128'},
	{ code: '160', name: '160'},
	{ code: '192', name: '192'},
	{ code: '224', name: '224'},
	{ code: '256', name: '256'},
	{ code: '320', name: '320'},
	{ code: '384', name: '384'},
	{ code: '448', name: '448'},
	{ code: '512', name: '512'}
])

.constant('AudioSampleRates', [
	{ code: '16000', name: '16'},
	{ code: '22050', name: '22.5'},
	{ code: '44100', name: '44.1'},
	{ code: '48000', name: '48'},
	{ code: '96000', name: '96'}
]);;

'use strict';

angular.module('VBrick.Util')


	/**
		Cookie Helper class
		Method get():
			Params:
				cookie: String
			Returns value of cookie
	**/
.constant('CookieUtil', {

	get: function (cookie) {
		var valueMatch = new RegExp(cookie + "=([^;]+)").exec(document.cookie);
		return valueMatch ? valueMatch[1] : null;
	},

	// return true only if the the cookie value has the string 'true' otherwise false
	getBoolean: function(cookie) {
		return this.get(cookie) === 'true';
	},

	unset: function (cookie) {
		var expires = new Date();
		expires.setTime(expires.getTime() - 1000);
		this.set(cookie, '', { expires: expires });
	},
	set: function (cookie, value, options) {
		var cookieString = cookie + '=' + value;

		options = options || {};
		cookieString += ';path=' + (options.path ? options.path : '/');
		cookieString += options.expires ? ';expires=' + options.expires.toUTCString() : '';
		cookieString += options.secure ? ';secure' : '';
		document.cookie = cookieString;
	}
});;

'use strict';

angular.module('VBrick.Util')

.constant('CountryCodes', [
	{ code: "US", name: "United States" },
	{ code: "AF", name: "Afghanistan" },
	{ code: "AX", name: "Åland Islands" },
	{ code: "AL", name: "Albania" },
	{ code: "DZ", name: "Algeria" },
	{ code: "AS", name: "American Samoa" },
	{ code: "AD", name: "Andorra" },
	{ code: "AO", name: "Angola" },
	{ code: "AI", name: "Anguilla" },
	{ code: "AQ", name: "Antarctica" },
	{ code: "AG", name: "Antigua and Barbuda" },
	{ code: "AR", name: "Argentina" },
	{ code: "AM", name: "Armenia" },
	{ code: "AW", name: "Aruba" },
	{ code: "AU", name: "Australia" },
	{ code: "AT", name: "Austria" },
	{ code: "AZ", name: "Azerbaijan" },
	{ code: "BS", name: "Bahamas" },
	{ code: "BH", name: "Bahrain" },
	{ code: "BD", name: "Bangladesh" },
	{ code: "BB", name: "Barbados" },
	{ code: "BY", name: "Belarus" },
	{ code: "BE", name: "Belgium" },
	{ code: "BZ", name: "Belize" },
	{ code: "BJ", name: "Benin" },
	{ code: "BM", name: "Bermuda" },
	{ code: "BT", name: "Bhutan" },
	{ code: "BO", name: "Bolivia, Plurinational State of" },
	{ code: "BQ", name: "Bonaire, Sint Eustatius and Saba" },
	{ code: "BA", name: "Bosnia and Herzegovina" },
	{ code: "BW", name: "Botswana" },
	{ code: "BV", name: "Bouvet Island" },
	{ code: "BR", name: "Brazil" },
	{ code: "IO", name: "British Indian Ocean Territory" },
	{ code: "BN", name: "Brunei Darussalam" },
	{ code: "BG", name: "Bulgaria" },
	{ code: "BF", name: "Burkina Faso" },
	{ code: "BI", name: "Burundi" },
	{ code: "KH", name: "Cambodia" },
	{ code: "CM", name: "Cameroon" },
	{ code: "CA", name: "Canada" },
	{ code: "CV", name: "Cape Verde" },
	{ code: "KY", name: "Cayman Islands" },
	{ code: "CF", name: "Central African Republic" },
	{ code: "TD", name: "Chad" },
	{ code: "CL", name: "Chile" },
	{ code: "CN", name: "China" },
	{ code: "CX", name: "Christmas Island" },
	{ code: "CC", name: "Cocos (Keeling) Islands" },
	{ code: "CO", name: "Colombia" },
	{ code: "KM", name: "Comoros" },
	{ code: "CG", name: "Congo" },
	{ code: "CD", name: "Congo, the Democratic Republic of the" },
	{ code: "CK", name: "Cook Islands" },
	{ code: "CR", name: "Costa Rica" },
	{ code: "CI", name: "Côte d'Ivoire" },
	{ code: "HR", name: "Croatia" },
	{ code: "CU", name: "Cuba" },
	{ code: "CW", name: "Curaçao" },
	{ code: "CY", name: "Cyprus" },
	{ code: "CZ", name: "Czech Republic" },
	{ code: "DK", name: "Denmark" },
	{ code: "DJ", name: "Djibouti" },
	{ code: "DM", name: "Dominica" },
	{ code: "DO", name: "Dominican Republic" },
	{ code: "EC", name: "Ecuador" },
	{ code: "EG", name: "Egypt" },
	{ code: "SV", name: "El Salvador" },
	{ code: "GQ", name: "Equatorial Guinea" },
	{ code: "ER", name: "Eritrea" },
	{ code: "EE", name: "Estonia" },
	{ code: "ET", name: "Ethiopia" },
	{ code: "FK", name: "Falkland Islands (Malvinas)" },
	{ code: "FO", name: "Faroe Islands" },
	{ code: "FJ", name: "Fiji" },
	{ code: "FI", name: "Finland" },
	{ code: "FR", name: "France" },
	{ code: "GF", name: "French Guiana" },
	{ code: "PF", name: "French Polynesia" },
	{ code: "TF", name: "French Southern Territories" },
	{ code: "GA", name: "Gabon" },
	{ code: "GM", name: "Gambia" },
	{ code: "GE", name: "Georgia" },
	{ code: "DE", name: "Germany" },
	{ code: "GH", name: "Ghana" },
	{ code: "GI", name: "Gibraltar" },
	{ code: "GR", name: "Greece" },
	{ code: "GL", name: "Greenland" },
	{ code: "GD", name: "Grenada" },
	{ code: "GP", name: "Guadeloupe" },
	{ code: "GU", name: "Guam" },
	{ code: "GT", name: "Guatemala" },
	{ code: "GG", name: "Guernsey" },
	{ code: "GN", name: "Guinea" },
	{ code: "GW", name: "Guinea-Bissau" },
	{ code: "GY", name: "Guyana" },
	{ code: "HT", name: "Haiti" },
	{ code: "HM", name: "Heard Island and McDonald Islands" },
	{ code: "VA", name: "Holy See (Vatican City State)" },
	{ code: "HN", name: "Honduras" },
	{ code: "HK", name: "Hong Kong" },
	{ code: "HU", name: "Hungary" },
	{ code: "IS", name: "Iceland" },
	{ code: "IN", name: "India" },
	{ code: "ID", name: "Indonesia" },
	{ code: "IR", name: "Iran, Islamic Republic of" },
	{ code: "IQ", name: "Iraq" },
	{ code: "IE", name: "Ireland" },
	{ code: "IM", name: "Isle of Man" },
	{ code: "IL", name: "Israel" },
	{ code: "IT", name: "Italy" },
	{ code: "JM", name: "Jamaica" },
	{ code: "JP", name: "Japan" },
	{ code: "JE", name: "Jersey" },
	{ code: "JO", name: "Jordan" },
	{ code: "KZ", name: "Kazakhstan" },
	{ code: "KE", name: "Kenya" },
	{ code: "KI", name: "Kiribati" },
	{ code: "KP", name: "Korea, Democratic People's Republic of" },
	{ code: "KR", name: "Korea, Republic of" },
	{ code: "KW", name: "Kuwait" },
	{ code: "KG", name: "Kyrgyzstan" },
	{ code: "LA", name: "Lao People's Democratic Republic" },
	{ code: "LV", name: "Latvia" },
	{ code: "LB", name: "Lebanon" },
	{ code: "LS", name: "Lesotho" },
	{ code: "LR", name: "Liberia" },
	{ code: "LY", name: "Libya" },
	{ code: "LI", name: "Liechtenstein" },
	{ code: "LT", name: "Lithuania" },
	{ code: "LU", name: "Luxembourg" },
	{ code: "MO", name: "Macao" },
	{ code: "MK", name: "Macedonia, the former Yugoslav Republic of" },
	{ code: "MG", name: "Madagascar" },
	{ code: "MW", name: "Malawi" },
	{ code: "MY", name: "Malaysia" },
	{ code: "MV", name: "Maldives" },
	{ code: "ML", name: "Mali" },
	{ code: "MT", name: "Malta" },
	{ code: "MH", name: "Marshall Islands" },
	{ code: "MQ", name: "Martinique" },
	{ code: "MR", name: "Mauritania" },
	{ code: "MU", name: "Mauritius" },
	{ code: "YT", name: "Mayotte" },
	{ code: "MX", name: "Mexico" },
	{ code: "FM", name: "Micronesia, Federated States of" },
	{ code: "MD", name: "Moldova, Republic of" },
	{ code: "MC", name: "Monaco" },
	{ code: "MN", name: "Mongolia" },
	{ code: "ME", name: "Montenegro" },
	{ code: "MS", name: "Montserrat" },
	{ code: "MA", name: "Morocco" },
	{ code: "MZ", name: "Mozambique" },
	{ code: "MM", name: "Myanmar" },
	{ code: "NA", name: "Namibia" },
	{ code: "NR", name: "Nauru" },
	{ code: "NP", name: "Nepal" },
	{ code: "NL", name: "Netherlands" },
	{ code: "NC", name: "New Caledonia" },
	{ code: "NZ", name: "New Zealand" },
	{ code: "NI", name: "Nicaragua" },
	{ code: "NE", name: "Niger" },
	{ code: "NG", name: "Nigeria" },
	{ code: "NU", name: "Niue" },
	{ code: "NF", name: "Norfolk Island" },
	{ code: "MP", name: "Northern Mariana Islands" },
	{ code: "NO", name: "Norway" },
	{ code: "OM", name: "Oman" },
	{ code: "PK", name: "Pakistan" },
	{ code: "PW", name: "Palau" },
	{ code: "PS", name: "Palestine, State of" },
	{ code: "PA", name: "Panama" },
	{ code: "PG", name: "Papua New Guinea" },
	{ code: "PY", name: "Paraguay" },
	{ code: "PE", name: "Peru" },
	{ code: "PH", name: "Philippines" },
	{ code: "PN", name: "Pitcairn" },
	{ code: "PL", name: "Poland" },
	{ code: "PT", name: "Portugal" },
	{ code: "PR", name: "Puerto Rico" },
	{ code: "QA", name: "Qatar" },
	{ code: "RE", name: "Réunion" },
	{ code: "RO", name: "Romania" },
	{ code: "RU", name: "Russian Federation" },
	{ code: "RW", name: "Rwanda" },
	{ code: "BL", name: "Saint Barthélemy" },
	{ code: "SH", name: "Saint Helena, Ascension and Tristan da Cunha" },
	{ code: "KN", name: "Saint Kitts and Nevis" },
	{ code: "LC", name: "Saint Lucia" },
	{ code: "MF", name: "Saint Martin (French part)" },
	{ code: "PM", name: "Saint Pierre and Miquelon" },
	{ code: "VC", name: "Saint Vincent and the Grenadines" },
	{ code: "WS", name: "Samoa" },
	{ code: "SM", name: "San Marino" },
	{ code: "ST", name: "Sao Tome and Principe" },
	{ code: "SA", name: "Saudi Arabia" },
	{ code: "SN", name: "Senegal" },
	{ code: "RS", name: "Serbia" },
	{ code: "SC", name: "Seychelles" },
	{ code: "SL", name: "Sierra Leone" },
	{ code: "SG", name: "Singapore" },
	{ code: "SX", name: "Sint Maarten (Dutch part)" },
	{ code: "SK", name: "Slovakia" },
	{ code: "SI", name: "Slovenia" },
	{ code: "SB", name: "Solomon Islands" },
	{ code: "SO", name: "Somalia" },
	{ code: "ZA", name: "South Africa" },
	{ code: "GS", name: "South Georgia and the South Sandwich Islands" },
	{ code: "SS", name: "South Sudan" },
	{ code: "ES", name: "Spain" },
	{ code: "LK", name: "Sri Lanka" },
	{ code: "SD", name: "Sudan" },
	{ code: "SR", name: "Suriname" },
	{ code: "SJ", name: "Svalbard and Jan Mayen" },
	{ code: "SZ", name: "Swaziland" },
	{ code: "SE", name: "Sweden" },
	{ code: "CH", name: "Switzerland" },
	{ code: "SY", name: "Syrian Arab Republic" },
	{ code: "TW", name: "Taiwan, Province of China" },
	{ code: "TJ", name: "Tajikistan" },
	{ code: "TZ", name: "Tanzania, United Republic of" },
	{ code: "TH", name: "Thailand" },
	{ code: "TL", name: "Timor-Leste" },
	{ code: "TG", name: "Togo" },
	{ code: "TK", name: "Tokelau" },
	{ code: "TO", name: "Tonga" },
	{ code: "TT", name: "Trinidad and Tobago" },
	{ code: "TN", name: "Tunisia" },
	{ code: "TR", name: "Turkey" },
	{ code: "TM", name: "Turkmenistan" },
	{ code: "TC", name: "Turks and Caicos Islands" },
	{ code: "TV", name: "Tuvalu" },
	{ code: "UG", name: "Uganda" },
	{ code: "UA", name: "Ukraine" },
	{ code: "AE", name: "United Arab Emirates" },
	{ code: "GB", name: "United Kingdom" },
	{ code: "UM", name: "United States Minor Outlying Islands" },
	{ code: "UY", name: "Uruguay" },
	{ code: "UZ", name: "Uzbekistan" },
	{ code: "VU", name: "Vanuatu" },
	{ code: "VE", name: "Venezuela, Bolivarian Republic of" },
	{ code: "VN", name: "Viet Nam" },
	{ code: "VG", name: "Virgin Islands, British" },
	{ code: "VI", name: "Virgin Islands, U.S." },
	{ code: "WF", name: "Wallis and Futuna" },
	{ code: "EH", name: "Western Sahara" },
	{ code: "YE", name: "Yemen" },
	{ code: "ZM", name: "Zambia" },
	{ code: "ZW", name: "Zimbabwe" }
]);
;

'use strict';

angular.module('VBrick.Util')

.constant('EncodingTypes', [
	'H264',
	'HLS',
	'HDS',
	'H264TS',
	'Mpeg4',
	'Mpeg2',
	'WM'
]);;

'use strict';

angular.module('VBrick.Util')

.constant('FileUtil', (function(){

	var imageFileExtensions = ['jpg', 'gif', 'png', 'svg'];
	var videoFileExtensions = ['avi', 'm4v', 'f4v', 'flv', 'swf', 'mpg', 'ts', 'mp4', 'avi', 'wmv', 'asf', 'mov', 'mkv'];
	var presentationFileExtensions = ['ppt', 'pptx'];
	var documentFileExtensions = ['doc', 'docx', 'txt', 'pdf'];
	var spreadsheetFileExtensions = ['xls', 'xlsx', 'csv'];
	var archiveFileExtensions = ['zip', 'rar', '7z'];
	var transcriptionFileExtensions = ['srt'];

	function includesFileExtension (extensions, extensionValue) {
		return _.contains(extensions, extensionValue);
	}

	var self = {

		imageFileExtensions: imageFileExtensions,
		isImageFile:_.partial(includesFileExtension, imageFileExtensions),

		videoFileExtensions: videoFileExtensions,
		isVideoFile: _.partial(includesFileExtension, videoFileExtensions),

		presentationFileExtensions: presentationFileExtensions,
		isPresentationFile: _.partial(includesFileExtension, presentationFileExtensions),

		documentFileExtensions: documentFileExtensions,
		isDocumentFile: _.partial(includesFileExtension, documentFileExtensions),

		spreadsheetFileExtensions: spreadsheetFileExtensions,
		isSpreadsheetFile: _.partial(includesFileExtension, spreadsheetFileExtensions),

		archiveFileExtensions: archiveFileExtensions,
		isArchiveFile: _.partial(includesFileExtension, archiveFileExtensions),

		transcriptionFileExtensions: transcriptionFileExtensions,
		isTranscriptionFile: _.partial(includesFileExtension, transcriptionFileExtensions),

		parseFileName: function(fileName){
			var matches = /^(.*)\.([^.]*)$/.exec(fileName);
			if(matches){
				return {
					prettyName: matches[1],
					extension: matches[2].toLowerCase()
				};
			}
		},

		formatFileSize: function (size, numDecimalPlaces, sizeInputUnit) {
			if (angular.isString(size)) {
				size = parseInt(size, 10);
			}
			if (size < 0 || (size !== 0 && !size)) {
				return size;
			}


			var units = [
				' Bytes', 'KB', 'MB', 'GB', 'TB' //...
			];
			var inputUnitIndex = sizeInputUnit ? units.indexOf(sizeInputUnit) || 0 : 0;

			for (var i = inputUnitIndex, len = units.length - 1; i < len; i++) {
				if (size < 1024) {
					break;
				}
				size /= 1024;
			}

			numDecimalPlaces = numDecimalPlaces || 2;
			var tens = Math.pow(10, numDecimalPlaces);

			return Math.floor(size * tens) / tens + '' + units[i];
		}
	};
	return self;
})());
;

'use strict';

angular.module('VBrick.Util')

.factory('IPAddress', function(){

	var ip4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
	var ip6Regex = /^([0-9a-f]{0,4}:){7}[0-9a-f]{1,4}$/i;

	return {
		/**
		 * Validates an IP address (v4 or v6)
		 */
		validate: function(ip){
			return !ip || validateIPv4(ip) || validateIPv6(ip);
		},

		/**
		 * Validates an IP Address range with format: { start: '...', end: '...' }
		 */
		validateRange: validateIPRange
	};


	function validateIPv4(value){
		if(value){

			var match;
			if(!(match = value.match(ip4Regex))){
				return false;
			}

			for(var i=1,ii=match.length; i<ii; i++){
				var octet = +match[i];
				if(octet < 0 || octet > 255){
					return false;
				}
			}
		}
		return true;
	}

	function validateIPv6(ip){
		return (/^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$/).test(ip);
	}


	function validateIPRange(ipRange){
		var start = ipRange.start,
			end = ipRange.end;

		var base;


		if(validateIPv4(start) && validateIPv4(end)){
			start = start.split('.');
			end = end.split('.');
			base = 10;
		}
		else if(validateIPv6(start) && validateIPv6(end)){
			start = start.split(':');
			end = end.split(':');
			base = 16;
		}
		else{
			return false;
		}


		for(var i=0, ii=start; i < start.length; i++){
			var a = parseInt(start[i], base);
			var b = parseInt(end[i], base);

			if(a > b){
				//end ip is before start
				return false;
			}
			if(a < b){
				//end ip is after start
				return true;
			}
		}

		//start == end, invalid
		return false;
	}
});
;

'use strict';

angular.module('VBrick.Util')

.factory('ImagePrefetcher', ['$q', '$rootScope', function($q, $rootScope) {
	return {

		/**
			Fetch the image URI and cache it in the browser.
			Returns a promise that is resolved when the image has loaded.

			Example:
			return ImagePrefetcher
				.fetch('http://imgs.xkcd.com/comics/estimation.png')
				.then(function(loc) {
					//handle success
				}, function(loc) {
					//handle failure
				});
		**/

		fetch: function(uri) {
			var deferred = $q.defer();

			loadImage(uri);

			return deferred.promise;

			function loadImage(uri) {
				//event handlers must be bound before setting the src attribute
				$(new Image())
					.load(function(event) {
						$rootScope.$apply(function() {
							deferred.resolve(uri);
						});
					})
					.error(function(event) {
						$rootScope.$apply(function() {
							deferred.reject(uri);
						});
					})
					.prop('src', uri);
			}
		}
	};
}]);;

'use strict';

angular.module('VBrick.Util')

.factory('LanguageCodes', [function() {
	var LanguageCodes = {
		languageCodes: [
			{code:"en", name: "English"},
			{code:"es", name: "Spanish"},
			{code:"fr", name: "French"},
			{code:"de", name: "German"}
		],
		get defaultLanguageCode () {
			return LanguageCodes.languageCodes[0].code;
		}
	};
	return LanguageCodes;
}]);
;

'use strict';

angular.module('VBrick.Util')

.factory('PromiseUtil', ['$q', '$timeout', function($q, $timeout){

	return {

		/**
			queue based on promises. Each enqueued operation runs synchronously until the queue is empty

			Example:
			var queue = PromiseQueue();

			queue.enqueue(function(){
				return loadData();
			});
		**/
		createPromiseQueue: function($scope){
			var head;
			var cancelled = false;

			if($scope){
				$scope.$on('$destroy', function(){
					cancelled = true;
				});
			}

			return {
				/**
					adds an operation to the queue
					fn:  a function that returns a promise;
				**/
				enqueue: function(fn){

					if(cancelled){
						return $q.reject('QueueCancelled');
					}

					var deferred = $q.defer();

					var wrappedFn = function(){

						if(cancelled){
							return $q.reject('QueueCancelled');
						}

						return $q.when(fn())
							.then(function(result){
								deferred.resolve(result);
							}, function(err){
								deferred.reject(err);
							});
					};

					head = (head ? head.then(wrappedFn) : wrappedFn());

					return deferred.promise;

				}

			};
		},

		/**
			Attempt to execute fn repeatedly until a successful result is returned.
				fn: A function that you would like to poll, must return a promise.
				isValueReady (optional function): recieves the result of fn's promise as a parameter, only called when fn resolves without error. Return true if the value is ready.
				shouldRetry (optional function): if fn's promise is rejected, this will be called with the failure value. Return true to abort further polling

			Returns a promise that will be resolved or rejected with the last poll attempt.
			Polling will back off according to the fibbonacci sequence( 1s, 1s, 2s, 3s, 5s, ..., up to 8s)

			example:

			PromiseUtil.retryUntilSuccess(function(){
				loadUsers();
			},
			function(userList){
				return userList && userList.length > 0;
			},
			function(error){
				//continue polling if request 404'd
				return error.statusCode === 404;
			});
		**/
		retryUntilSuccess: function(fn, isValueReady, shouldRetry){
			var deferred = $q.defer();

			isValueReady = isValueReady || function(val){ return true; };
			shouldRetry = shouldRetry || function(){ return true; };

			poll(1, 1);

			return deferred.promise;

			function poll(t1, t2){
				$q.when(fn())
					.then(function(value){

						if(isValueReady(value)){
							return deferred.resolve(value);
						}
						retryLater();

					}, function(err){
						//todo: make this a parameter
						if(t1 > 13 || !shouldRetry(err)){
							return deferred.reject(err);
						}
						retryLater();
					});

				function retryLater(){
					$timeout(function(){
						poll(t2, t1 + t2);
					}, t1 * 1000); //fibbonaci backoff
				}
			}
		}
	};

}]);;

'use strict';

angular.module('VBrick.Util')

//Mapping of Rights to the URL for that right. See AccountRights.cs
.constant('Rights', {
	EditDetails:  "http://vbrick.com/rights/account/accounts/editDetails",
	AddChild:  "http://vbrick.com/rights/account/accounts/addChild",
	EditChild:  "http://vbrick.com/rights/account/accounts/editChild",
	DeleteChild:  "http://vbrick.com/rights/account/accounts/deleteChild",
	Suspend:  "http://vbrick.com/rights/account/accounts/suspend",
	Unsuspend:  "http://vbrick.com/rights/account/accounts/unsuspend",
	MarkChildForDeletion:  "http://vbrick.com/rights/account/accounts/markChildForDeletion",
	EditSettings:  "http://vbrick.com/rights/account/accounts/editSettings",

	AddUsers:  "http://vbrick.com/rights/account/users/add",
	EditUsers:  "http://vbrick.com/rights/account/users/edit",
	DeleteUsers:  "http://vbrick.com/rights/account/users/delete",
	UnlockUsers:  "http://vbrick.com/rights/account/users/unlock",
	SuspendUsers:  "http://vbrick.com/rights/account/users/suspend",

	AddGroups:  "http://vbrick.com/rights/account/groups/add",
	EditGroups:  "http://vbrick.com/rights/account/groups/edit",
	DeleteGroups:  "http://vbrick.com/rights/account/groups/delete",

	ViewRoles:  "http://vbrick.com/rights/account/roles/view",

	AddDevices:  "http://vbrick.com/rights/account/devices/add",
	EditDevices:  "http://vbrick.com/rights/account/devices/edit",
	DeleteDevices:  "http://vbrick.com/rights/account/devices/delete",

	AddZones:  "http://vbrick.com/rights/account/zones/add",
	EditZones:  "http://vbrick.com/rights/account/zones/edit",
	DeleteZones:  "http://vbrick.com/rights/account/zones/delete",

	AddCDN:  "http://vbrick.com/rights/account/cdn/add",
	EditCDN:  "http://vbrick.com/rights/account/cdn/edit",
	DeleteCDN:  "http://vbrick.com/rights/account/cdn/delete",

	AddCategories:  "http://vbrick.com/rights/account/categories/add",
	EditCategories:  "http://vbrick.com/rights/account/categories/edit",
	DeleteCategories:  "http://vbrick.com/rights/account/categories/delete",

	AddLibraries:  "http://vbrick.com/rights/account/libraries/add",
	EditLibraries:  "http://vbrick.com/rights/account/libraries/edit",
	DeleteLibraries:  "http://vbrick.com/rights/account/libraries/delete",


	AddMedia:  "http://vbrick.com/rights/account/media/add",
	ApproveMedia:  "http://vbrick.com/rights/account/media/approve",
	RecordMedia:  "http://vbrick.com/rights/account/media/record",
	RequireMedia:  "http://vbrick.com/rights/account/media/require",
	RecommendMedia:  "http://vbrick.com/rights/account/media/recommend",
	FeatureMedia:  "http://vbrick.com/rights/account/media/feature",
	AddApprovalWorkflow:  "http://vbrick.com/rights/account/media/addApprovalWorkflow",
	EditApprovalWorkflow:  "http://vbrick.com/rights/account/media/editApprovalWorkflow",
	DeleteApprovalWorkflow:  "http://vbrick.com/rights/account/media/deleteApprovalWorkflow",

	EditTranscodingSettings:  "http://vbrick.com/rights/account/transcoding/editSettings",
	ViewTranscodingRules:  "http://vbrick.com/rights/account/transcoding/viewRules",
	AddTranscodingRules:  "http://vbrick.com/rights/account/transcoding/addRules",
	EditTranscodingRules:  "http://vbrick.com/rights/account/transcoding/editRules",
	DeleteTranscodingRules:  "http://vbrick.com/rights/account/transcoding/deleteRules",

	IndividualReports:  "http://vbrick.com/rights/account/reports/individual",
	AggregatedReports:  "http://vbrick.com/rights/account/reports/aggregated",
	DeviceReports:  "http://vbrick.com/rights/account/reports/device",
	ActivityReports:  "http://vbrick.com/rights/account/reports/activity",

	AddLiveEvents:  "http://vbrick.com/rights/account/events/addLive",
	EditLiveEvents:  "http://vbrick.com/rights/account/events/editLive",
	DeleteLiveEvents:  "http://vbrick.com/rights/account/events/deleteLive",

	AddRecordingEvents:  "http://vbrick.com/rights/account/events/addRecording",
	EditRecordingEvents:  "http://vbrick.com/rights/account/events/editRecording",
	DeleteRecordingEvents:  "http://vbrick.com/rights/account/events/deleteRecording",

	DeleteVideoComments:  "http://vbrick.com/rights/account/videos/deleteComments"
});;

'use strict';

angular.module('VBrick.Util')

.factory('SearchUtil', ['Util', function(Util) {
	return {
		readSearchResult: function(hits){
			return _.map(hits, function(hit){
				var obj = {id: hit.id};

				_.each(hit.fields, function(field){

					var name = camelCase(field.name);
					var value = field.value;

					switch(field.type){
					case 'Date':
						value = Util.parseUTCDate(value);
						break;
					case 'TimeSpan':
						value = Util.parseCSharpTimespan(value);
						break;
					case 'Int':
						value = +value;
						break;
					case 'Double':
						value = +value;
						break;
					case 'Boolean':
						value = (value && value.toLowerCase() === 'true');
						break;
					}

					obj[name] = value;

				});

				return obj;
			});
		}
	};
}]);

function camelCase(name){
	return name.charAt(0).toLowerCase() + name.substring(1);
}
;

'use strict';

angular.module('VBrick.Util.Directives')

.factory('StateChangeStatus', ['$timeout', '$rootScope', function($timeout, $rootScope){
	var status;

	var StateChangeComplete = "StateChangeComplete";
	var StateChangeStarted = "StateChangeStarted";
	var StateChangeError = "StateChangeError";

	var stateChangingTimeout;
	var delay = 200;

	var setStarted = _.partial(setStatus, StateChangeStarted);
	var setComplete = _.partial(setStatus, StateChangeComplete);
	var setError = _.partial(setStatus, StateChangeError);


	$rootScope.$on('$stateChangeStart', function(){
		if(!stateChangingTimeout){
			stateChangingTimeout = $timeout(setStarted, delay);
		}
	});

	$rootScope.$on('$stateChangeSuccess', setComplete);
	$rootScope.$on('$stateChangeCancel', setComplete);

	$rootScope.$on('$stateChangeError', function(e, toState, toParams, fromState, fromParams, error){
		if(error && error.status === 401){
			return;
		}

		setError();
	});

	function setStatus(newStatus){
		status = newStatus;

		if(stateChangingTimeout){
			$timeout.cancel(stateChangingTimeout);
			stateChangingTimeout = null;
		}
	}

	return {
		get complete(){
			return status === StateChangeComplete;
		},

		get changing(){
			return status === StateChangeStarted;
		},

		get error(){
			return status === StateChangeError;
		}
	};
}]);


;

//'use strict';

//angular.module("VBrick.Util")
//.config(["$stateProvider", function($stateProvider){
//	$stateProvider.modalState = function(name, cfg, modalOptions){
//		return $stateProvider.state(name, {
//			url: cfg.url,
//			authorizationKey: cfg.authorizationKey,

//			controller: ['$scope', '$modal', '$state', '$rootScope', function($scope, $modal, $state, $rootScope){
//				var modal = $modal.open( _.extend({
//					templateUrl: cfg.templateUrl,
//					template: cfg.template,
//					controller: cfg.controller,
//					scope: $scope,
//					animation: false //disabled to workaround a defect with modal in Angular UI Bootstrap 0.13.0 where it doesn't close when animation is enabled

//				}, modalOptions||{}));

//				if (!cfg.handleDismissal) {
//					modal.result
//						.finally(function () {
//							if($state.current.name === name){
//								$state.go($state.$current.parent.name);
//							}
//						});
//				}

//				$scope.$on('$destroy', function(){
//					modal.close();
//				});

//			}]
//		});
//	};
//}]);;

'use strict';

angular.module('VBrick.Util')

.constant('TimezoneCodes', [
	{ id: "Dateline Standard Time", name: "(UTC-12:00) International Date Line West" },
	{ id: "UTC-11", name: "(UTC-11:00) Coordinated Universal Time-11" },
	{ id: "Hawaiian Standard Time", name: "(UTC-10:00) Hawaii" },
	{ id: "Alaskan Standard Time", name: "(UTC-09:00) Alaska" },
	{ id: "Pacific Standard Time (Mexico)", name: "(UTC-08:00) Baja California" },
	{ id: "Pacific Standard Time", name: "(UTC-08:00) Pacific Time (US & Canada)" },
	{ id: "US Mountain Standard Time", name: "(UTC-07:00) Arizona" },
	{ id: "Mountain Standard Time (Mexico)", name: "(UTC-07:00) Chihuahua, La Paz, Mazatlan" },
	{ id: "Mountain Standard Time", name: "(UTC-07:00) Mountain Time (US & Canada)" },
	{ id: "Central America Standard Time", name: "(UTC-06:00) Central America" },
	{ id: "Central Standard Time", name: "(UTC-06:00) Central Time (US & Canada)" },
	{ id: "Central Standard Time (Mexico)", name: "(UTC-06:00) Guadalajara, Mexico City, Monterrey" },
	{ id: "Canada Central Standard Time", name: "(UTC-06:00) Saskatchewan" },
	{ id: "SA Pacific Standard Time", name: "(UTC-05:00) Bogota, Lima, Quito" },
	{ id: "Eastern Standard Time", name: "(UTC-05:00) Eastern Time (US & Canada)" },
	{ id: "US Eastern Standard Time", name: "(UTC-05:00) Indiana (East)" },
	{ id: "Venezuela Standard Time", name: "(UTC-04:30) Caracas" },
	{ id: "Paraguay Standard Time", name: "(UTC-04:00) Asuncion" },
	{ id: "Atlantic Standard Time", name: "(UTC-04:00) Atlantic Time (Canada)" },
	{ id: "Central Brazilian Standard Time", name: "(UTC-04:00) Cuiaba" },
	{ id: "SA Western Standard Time", name: "(UTC-04:00) Georgetown, La Paz, Manaus, San Juan" },
	{ id: "Pacific SA Standard Time", name: "(UTC-04:00) Santiago" },
	{ id: "Newfoundland Standard Time", name: "(UTC-03:30) Newfoundland" },
	{ id: "E. South America Standard Time", name: "(UTC-03:00) Brasilia" },
	{ id: "Argentina Standard Time", name: "(UTC-03:00) Buenos Aires" },
	{ id: "SA Eastern Standard Time", name: "(UTC-03:00) Cayenne, Fortaleza" },
	{ id: "Greenland Standard Time", name: "(UTC-03:00) Greenland" },
	{ id: "Montevideo Standard Time", name: "(UTC-03:00) Montevideo" },
	{ id: "Bahia Standard Time", name: "(UTC-03:00) Salvador" },
	{ id: "UTC-02", name: "(UTC-02:00) Coordinated Universal Time-02" },
	{ id: "Mid-Atlantic Standard Time", name: "(UTC-02:00) Mid-Atlantic" },
	{ id: "Azores Standard Time", name: "(UTC-01:00) Azores" },
	{ id: "Cape Verde Standard Time", name: "(UTC-01:00) Cape Verde Is." },
	{ id: "Morocco Standard Time", name: "(UTC) Casablanca" },
	{ id: "UTC", name: "(UTC) Coordinated Universal Time" },
	{ id: "GMT Standard Time", name: "(UTC) Dublin, Edinburgh, Lisbon, London" },
	{ id: "Greenwich Standard Time", name: "(UTC) Monrovia, Reykjavik" },
	{ id: "W. Europe Standard Time", name: "(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna" },
	{ id: "Central Europe Standard Time", name: "(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague" },
	{ id: "Romance Standard Time", name: "(UTC+01:00) Brussels, Copenhagen, Madrid, Paris" },
	{ id: "Central European Standard Time", name: "(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb" },
	{ id: "W. Central Africa Standard Time", name: "(UTC+01:00) West Central Africa" },
	{ id: "Namibia Standard Time", name: "(UTC+01:00) Windhoek" },
	{ id: "GTB Standard Time", name: "(UTC+02:00) Athens, Bucharest" },
	{ id: "Middle East Standard Time", name: "(UTC+02:00) Beirut" },
	{ id: "Egypt Standard Time", name: "(UTC+02:00) Cairo" },
	{ id: "Syria Standard Time", name: "(UTC+02:00) Damascus" },
	{ id: "E. Europe Standard Time", name: "(UTC+02:00) E. Europe" },
	{ id: "South Africa Standard Time", name: "(UTC+02:00) Harare, Pretoria" },
	{ id: "FLE Standard Time", name: "(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius" },
	{ id: "Turkey Standard Time", name: "(UTC+02:00) Istanbul" },
	{ id: "Israel Standard Time", name: "(UTC+02:00) Jerusalem" },
	{ id: "Jordan Standard Time", name: "(UTC+03:00) Amman" },
	{ id: "Arabic Standard Time", name: "(UTC+03:00) Baghdad" },
	{ id: "Kaliningrad Standard Time", name: "(UTC+03:00) Kaliningrad, Minsk" },
	{ id: "Arab Standard Time", name: "(UTC+03:00) Kuwait, Riyadh" },
	{ id: "E. Africa Standard Time", name: "(UTC+03:00) Nairobi" },
	{ id: "Iran Standard Time", name: "(UTC+03:30) Tehran" },
	{ id: "Arabian Standard Time", name: "(UTC+04:00) Abu Dhabi, Muscat" },
	{ id: "Azerbaijan Standard Time", name: "(UTC+04:00) Baku" },
	{ id: "Russian Standard Time", name: "(UTC+04:00) Moscow, St. Petersburg, Volgograd" },
	{ id: "Mauritius Standard Time", name: "(UTC+04:00) Port Louis" },
	{ id: "Georgian Standard Time", name: "(UTC+04:00) Tbilisi" },
	{ id: "Caucasus Standard Time", name: "(UTC+04:00) Yerevan" },
	{ id: "Afghanistan Standard Time", name: "(UTC+04:30) Kabul" },
	{ id: "Pakistan Standard Time", name: "(UTC+05:00) Islamabad, Karachi" },
	{ id: "West Asia Standard Time", name: "(UTC+05:00) Tashkent" },
	{ id: "India Standard Time", name: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
	{ id: "Sri Lanka Standard Time", name: "(UTC+05:30) Sri Jayawardenepura" },
	{ id: "Nepal Standard Time", name: "(UTC+05:45) Kathmandu" },
	{ id: "Central Asia Standard Time", name: "(UTC+06:00) Astana" },
	{ id: "Bangladesh Standard Time", name: "(UTC+06:00) Dhaka" },
	{ id: "Ekaterinburg Standard Time", name: "(UTC+06:00) Ekaterinburg" },
	{ id: "Myanmar Standard Time", name: "(UTC+06:30) Yangon (Rangoon)" },
	{ id: "SE Asia Standard Time", name: "(UTC+07:00) Bangkok, Hanoi, Jakarta" },
	{ id: "N. Central Asia Standard Time", name: "(UTC+07:00) Novosibirsk" },
	{ id: "China Standard Time", name: "(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi" },
	{ id: "North Asia Standard Time", name: "(UTC+08:00) Krasnoyarsk" },
	{ id: "Singapore Standard Time", name: "(UTC+08:00) Kuala Lumpur, Singapore" },
	{ id: "W. Australia Standard Time", name: "(UTC+08:00) Perth" },
	{ id: "Taipei Standard Time", name: "(UTC+08:00) Taipei" },
	{ id: "Ulaanbaatar Standard Time", name: "(UTC+08:00) Ulaanbaatar" },
	{ id: "North Asia East Standard Time", name: "(UTC+09:00) Irkutsk" },
	{ id: "Tokyo Standard Time", name: "(UTC+09:00) Osaka, Sapporo, Tokyo" },
	{ id: "Korea Standard Time", name: "(UTC+09:00) Seoul" },
	{ id: "Cen. Australia Standard Time", name: "(UTC+09:30) Adelaide" },
	{ id: "AUS Central Standard Time", name: "(UTC+09:30) Darwin" },
	{ id: "E. Australia Standard Time", name: "(UTC+10:00) Brisbane" },
	{ id: "AUS Eastern Standard Time", name: "(UTC+10:00) Canberra, Melbourne, Sydney" },
	{ id: "West Pacific Standard Time", name: "(UTC+10:00) Guam, Port Moresby" },
	{ id: "Tasmania Standard Time", name: "(UTC+10:00) Hobart" },
	{ id: "Yakutsk Standard Time", name: "(UTC+10:00) Yakutsk" },
	{ id: "Central Pacific Standard Time", name: "(UTC+11:00) Solomon Is., New Caledonia" },
	{ id: "Vladivostok Standard Time", name: "(UTC+11:00) Vladivostok" },
	{ id: "New Zealand Standard Time", name: "(UTC+12:00) Auckland, Wellington" },
	{ id: "UTC+12", name: "(UTC+12:00) Coordinated Universal Time+12" },
	{ id: "Fiji Standard Time", name: "(UTC+12:00) Fiji" },
	{ id: "Magadan Standard Time", name: "(UTC+12:00) Magadan" },
	{ id: "Kamchatka Standard Time", name: "(UTC+12:00) Petropavlovsk-Kamchatsky - Old" },
	{ id: "Tonga Standard Time", name: "(UTC+13:00) Nukualofa" },
	{ id: "Samoa Standard Time", name: "(UTC+13:00) Samoa" }
]);
;

'use strict';

angular.module('VBrick.Util')

.constant('USStateCodes', [
	{code:"AL", name: "Alabama"},
	{code:"AK", name: "Alaska"},
	{code:"AZ", name: "Arizona"},
	{code:"AR", name: "Arkansas"},
	{code:"CA", name: "California"},
	{code:"CO", name: "Colorado"},
	{code:"CT", name: "Connecticut"},
	{code:"DE", name: "Delaware"},
	{code:"FL", name: "Florida"},
	{code:"GA", name: "Georgia"},
	{code:"HI", name: "Hawaii"},
	{code:"ID", name: "Idaho"},
	{code:"IL", name: "Illinois"},
	{code:"IN", name: "Indiana"},
	{code:"IA", name: "Iowa"},
	{code:"KS", name: "Kansas"},
	{code:"KY", name: "Kentucky"},
	{code:"LA", name: "Louisiana"},
	{code:"ME", name: "Maine"},
	{code:"MD", name: "Maryland"},
	{code:"MA", name: "Massachusetts"},
	{code:"MI", name: "Michigan"},
	{code:"MN", name: "Minnesota"},
	{code:"MS", name: "Mississippi"},
	{code:"MO", name: "Missouri"},
	{code:"MT", name: "Montana"},
	{code:"NE", name: "Nebraska"},
	{code:"NV", name: "Nevada"},
	{code:"NH", name: "New Hampshire"},
	{code:"NJ", name: "New Jersey"},
	{code:"NM", name: "New Mexico"},
	{code:"NY", name: "New York"},
	{code:"NC", name: "North Carolina"},
	{code:"ND", name: "North Dakota"},
	{code:"OH", name: "Ohio"},
	{code:"OK", name: "Oklahoma"},
	{code:"OR", name: "Oregon"},
	{code:"PA", name: "Pennsylvania"},
	{code:"RI", name: "Rhode Island"},
	{code:"SC", name: "South Carolina"},
	{code:"SD", name: "South Dakota"},
	{code:"TN", name: "Tennessee"},
	{code:"TX", name: "Texas"},
	{code:"UT", name: "Utah"},
	{code:"VT", name: "Vermont"},
	{code:"VA", name: "Virginia"},
	{code:"WA", name: "Washington"},
	{code:"WV", name: "West Virginia"},
	{code:"WI", name: "Wisconsin"},
	{code:"WY", name: "Wyoming"},
	{code:"DC", name: "District of Columbia"},
	{code:"AS", name: "American Samoa"},
	{code:"GU", name: "Guam"},
	{code:"MP", name: "Northern Mariana Islands"},
	{code:"PR", name: "Puerto Rico"},
	{code:"UM", name: "United States Minor Outlying Islands"},
	{code:"VI", name: "Virgin Islands, U.S"}
]);;

'use strict';

angular.module('VBrick.Util')

.factory('ValidationService', function() {

	var macRegex = /^([a-f0-9]{2}[.:\-]?){5}[a-f0-9]{2}$/i;

	return {
		// check if something is an integer/whole number
		checkInteger: function(value) {
			if(_.isNumber(value)){
				value = value + "";
			}
			return !value || !!(/^-?[0-9]+$/).exec(value);
		},
		// check if something is an email with an intentionally lax regex
		checkEmail: function(value) {
			return !value || !!value.match(/.+@.+\..+/);
		},

		// check if something is a "short" text field (100 characters)
		checkShortText: function(value) {
			return this.checkLengthBetween(value, 0, 100);
		},
		// check if something is a "long" text field (5000 characters)
		checkLongText: function(value) {
			return this.checkLengthBetween(value, 0, 5000);
		},
		// helper function to check if something is between a certain length (useful for postal codes, phone numbers, etc.)
		checkLengthBetween: function(value, min, max) {
			return !value || checkRange(value.length, min, max);
		},
		// helper function to check if a string is a valid hostname
		// allowed: lower case letters, numbers, dots, and hyphens
		// dots and hyphens cannot be the first character
		checkHostnameText: function(value) {
			return !value || !!value.match(/^[a-z0-9][a-z0-9\-.]+$/i);
		},

		checkMacAddress: function(value) {
			return !value || !!value.match(macRegex);
		},

		checkUrl: function(value){
			//very loose URL check
			//http://tools.ietf.org/html/rfc3986
			return !value || !!value.match(/^([a-z][a-z0-9.\-+]+):\/\/([a-z0-9][a-z0-9\-.]+[^\s]*)$/i);
		}
	};

	function checkRange(value, min, max){
		return	(!_.isNumber(min) || value >= min) &&
				(!_.isNumber(max) || value <= max);
	}
});
;

'use strict';

angular.module('VBrick.Util.Directives')

.directive('vbSelect', function(){
	return {
		scope: {
			clickCallback: '&',
			selection: '=',
			options: '='
		},
		restrict: 'E',
		template: [
			'<select name="" style="display:none;"></select>',
			'<div class="custom-select">',
			'<div class="custom-text" ng-click="showDropdown = !showDropdown">{{ selection.currentSelection.name }}</div>',
			'<div class="select-list" ng-class="showDropdown ? \'open\' : \'hide\'" ng-click="showDropdown = !showDropdown" ng-mouseleave="showDropdown = !showDropdown">',
			'<ul>',
			'<li class="custom-select" ng-repeat="option in options" ng-click="clickCallback({value: option})" ng-class="selection.currentSelection.id === option.id ? \'selected\' : \'\'">{{option.name}}</li>',
			'</ul>',
			'</div>',
			'</div>'
		].join(''),
		link: function(scope, element, attr) {
		}
	};
});
;

'use strict';

angular.module('VBrick.Util.Directives')

	.directive('vbBulkIpInput',
		['IPAddress',
			function(IPAddress){
				return {
					restrict: 'A',
					require: 'ngModel',
					link: function(scope, elem, attr, ctrl) {
						ctrl.$parsers.push(function(inputValue){
							var parsed = parse(inputValue);
							ctrl.$setValidity('invalidIPAddresses', !inputValue || !!parsed);
							return parsed || inputValue;
						});

						ctrl.$formatters.push(function(modelValue){
							if(_.isString(modelValue)){
								return modelValue;
							}
							else{
								return _.map(modelValue, function(v){
									if(_.isString(v)){
										return v;
									}
									else{
										return v.start + '-' + v.end;
									}
								}).join('\n');
							}
						});
					}
				};

				function parse(textInput){
					var lines = textInput.split('\n');
					var result = [];

					for(var i=0, ii=lines.length; i<ii; i++){
						var line = lines[i].trim();

						if(line){
							var toks = line.split('-');
							var value;

							if(toks.length === 2){
								value = { start: toks[0].trim(), end: toks[1].trim() };
								if(!IPAddress.validateRange(value)){
									return false;
								}

							}
							else if(toks.length === 1){
								value = toks[0].trim();
								if(!IPAddress.validate(value)){
									return false;
								}
							}
							else{
								return false;
							}
							result.push(value);
						}

					}

					return result;
				}
			}]);
;

'use strict';

angular.module('VBrick.Util.Directives')

.directive('vbCarousel', ['$timeout', function($timeout) {
	return {
		restrict: 'EA',
		require: 'carousel',
		link: function(scope, elem, attrs) {
			var nextFn = scope[attrs.interceptNext];
			var prevFn = scope[attrs.interceptPrev];

			if (angular.isDefined(attrs.interceptNext) && typeof(nextFn) !== 'function') {
				throw new Error("interceptNext, if specified, must be a function on scope");
			}
			if (angular.isDefined(attrs.interceptPrev) && typeof(prevFn) !== 'function') {
				throw new Error("interceptPrev, if specified, must be a function on scope");
			}

			elem.addClass('vb-carousel');

			$timeout(function() {
				var carouselCtrl = angular.element(elem).isolateScope();

				if (angular.isDefined(nextFn)) {
					var origNext = carouselCtrl.next;
					carouselCtrl.next = function() {
						nextFn();
						origNext();
					};
				}

				if (angular.isDefined(prevFn)) {
					var origPrev = carouselCtrl.prev;
					carouselCtrl.prev = function() {
						prevFn();
						origPrev();
					};
				}
			}, 0);
		}
	};
}]);;

'use strict';

angular.module('VBrick.Util.Directives')

/**
 * Directive that displays multiple items within a carousel slide
 * Responsively changes the number of items in a slide group
 *
 * Usage:
 * <vb-carousel-strip>
 *   <vb-carousel-strip-item ng-repeat="video in videos">
 *     <!-- Insert inline video content here -->
 *   </vb-carousel-strip-item>
 * </vb-carousel-strip>
*/
.directive('vbCarouselStrip', ['$window', '$timeout', function($window, $timeout) {
	var NG_REPEAT_REGEX = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/;
	return {
		restrict: 'EA',
		scope: true,
		compile: function(element, attrs) {
			var carouselStripItemElement = element.find('vb-carousel-strip-item');
			if (!carouselStripItemElement) {
				return;
			}

			var match = carouselStripItemElement.attr('ng-repeat').match(NG_REPEAT_REGEX);
			var collectionName = match[2];

			element.wrapInner([
				'<carousel vb-carousel class="horizontal-carousel hidden-xs">',
				'<slide ng-repeat="slideGroup in slideGroups" active="slideGroup.active">',
				'<div class="row"></div>',
				'</slide>',
				'</carousel>'
			].join(''));

			return function(scope, element, attrs, ctrls) {
				var slideGroups = scope.slideGroups = [];
				var collectionLength = 0;

				scope.slideGroupLength = getChunkSize($window.innerWidth);
				angular.element($window).bind("resize", function () {
					scope.slideGroupLength = getChunkSize($window.innerWidth);
					scope.$apply();
				});

				scope.$watch('slideGroupLength', function (slideGroupLength) {
					if (collectionLength > 0) {
						chunkSlides(collectionLength, slideGroupLength);
					}
				});

				scope.$watchCollection(collectionName, function (collection) {
					collectionLength = collection && angular.isArray(collection) ? collection.length : 0;
					chunkSlides(collectionLength, scope.slideGroupLength);
				});

				function getChunkSize(windowWidth) {
					return windowWidth > 1199 ? 6 : 4;
				}

				function chunkSlides(collectionLength, chunkSize) {
					var oldSlideGroupLength = slideGroups.length;
					var slideGroupLength = Math.ceil(collectionLength / chunkSize);
					for (var i = 0; i < slideGroupLength; i++) {
						var slideGroup = {
							start: i * chunkSize,
							end: i * chunkSize + chunkSize
						};
						if (!slideGroups[i]) {
							slideGroups.push(slideGroup);
						} else {
							slideGroups[i].start = slideGroup.start;
							slideGroups[i].end = slideGroup.end;
						}
					}

					for (i = slideGroupLength; i < oldSlideGroupLength; i++) {
						slideGroups.pop();
					}

					if (slideGroups.length > 0) {
						slideGroups[0].active = true;
					}
				}
			};
		}
	};
}])

.directive('vbCarouselStripItem', function() {
	return {
		restrict: 'EA',
		priority: 1001,
		compile: function(element, attrs) {
			if (!attrs.ngRepeat) {
				return;
			}
			attrs.ngRepeat += '.slice(slideGroup.start, slideGroup.end)';
			//manually transclude because Angular won't
			element
				.wrapInner('<div class="carousel-shadow-spacer">')
				.addClass('col-sm-3 col-lg-2 hidden-xs');
		}
	};
})

.directive('vbCarouselAltTable', function() {
	return {
		link: function(scope, element, attrs) {
			element
				.wrap('<div class="visible-xs">')
				.addClass('carousel-mobile-list');
		}
	};
})

.directive('vbCarouselAltTr', function() {
	return {
		link: function(scope, element, attrs) {
			//manually add class because Angular can't transclude table-related elements
			element.addClass('table-item');
		}
	};
});
;

'use strict';

angular.module('VBrick.Util.Directives')

/***
 * Example:  <input type="text" ng-model="..." vb-disable-submit
 *
 * This will stop the input from submitting the whole form. Added because some components use nested forms that should not interfere with outer form
 ***/
.directive('vbDisableSubmit', function(){
	return {
		restrict: 'A',
		link: function(scope, el, attrs){
			el.on('keydown', function(event){
				if(event.keyCode === 13){
					event.preventDefault();
					return false;
				}
			});
		}
	};
});

;

'use strict';

angular.module('VBrick.Util.Directives')

.directive('vbElasticTextArea', [
	'$timeout',
	function($timeout) {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, element, attrs, ngModel) {
				$scope.initialHeight = $scope.initialHeight || element[0].style.height;
				var resize = function() {
					element[0].style.height = $scope.initialHeight;
					element[0].style.height = '' + element[0].scrollHeight + 'px';
				};

				element.on('blur keyup change', resize);

				$scope.$watch(function(){
					return ngModel.$modelValue;
				}, resize);

				$timeout(resize, 0);
			}
		};
	}
]);;

'use strict';

angular.module('VBrick.Util.Directives')

//Hack in a way to focus on an input element from within a view controller.
//To Use: $scope.<formName>.<inputName>.$focus();

.directive('input', function(){
	return {
		priority:-1,
		restrict: 'E',
		require: '?ngModel',
		link: function(scope, element, attr, ctrl) {
			if(ctrl){
				ctrl.$focus = function(){
					setTimeout(function(){
						//delay this. If the element is being unhidden, then the digest loop needs to complete first
						element.focus();
					}, 100);
				};
			}
		}
	};
})

.directive('textarea', function(){
	return {
		priority:-1,
		restrict: 'E',
		require: '?ngModel',
		link: function(scope, element, attr, ctrl) {
			if(ctrl){
				ctrl.$focus = function(){
					setTimeout(function(){
						//delay this. If the element is being unhidden, then the digest loop needs to complete first
						element.focus();
					}, 100);
				};
			}
		}
	};
})

.directive('autofocus', function() {
	return {
		restrict: 'A',
		link: function(scope, element) {
			setTimeout(function(){
				//delay this. If the element is being unhidden, then the digest loop needs to complete first
				element.focus();
			}, 100);
		}
	};
});;

'use strict';

angular.module('VBrick.Util.Directives')

/**
 * Directive for inline forms consisting of a text input and buttons on a single line
 * Automatically turns the submit button into a primary button that's disabled when the form is invalid
 *
 * Usage:
 * <form vb-inline-create name="formName" ng-submit="submitForm()">
 *  <input type="text" name="..." ng-model="...">
 *  <button type="submit">Create</button>
 *  <a class="btn-cancel" type="button">Anchor tag with button type</a>
 *  <label validation="nameInUse">Name is in use</label>
 * </form>

	Attributes:
		processing: If the expression evaluates to true, hide the buttons and show the processing label

 **/

.directive('vbInlineCreate', [function() {
	return {
		restrict: 'AE',
		compile: function(element, attrs) {
			var formName = element.attr('name');
			var processing = attrs.processing;
			var input = element.find('input').addClass('form-control');
			var buttons = getTransformedButtons(element.find('button,a[type=button]'));
			var validationLabels = getValidationLabels(element.find('label'));

			var inputContainer = angular.element('<div class="table-cell table-cell-fill"></div>')
										.append(validationLabels)
										.append(input);

			var buttonContainer = angular.element('<div class="table-cell"></div>');
			var buttonToolbar = angular.element('<div class="btn-toolbar"></div>')
										  .attr('ng-hide', processing)
									      .append(buttons);
			buttonContainer.append(buttonToolbar);

			element
				.prepend(buttonContainer)
				.prepend(inputContainer);

			function getValidationLabels(labels) {
				var wrappedValidationLabels = [];
				angular.forEach(labels, function(label) {
					label = angular.element(label);
					var validationAttr = label.attr('validation');
					var processingAttr = label.attr('processing');
					if (validationAttr || validationAttr === "") {
						var wrappedLabel = angular.element('<div class="alert alert-danger"></div>')
													.append(angular.element('<span class="glyphicons circle_exclamation_mark"></span>'))
													.append(label);

						validationAttr && wrappedLabel.attr('ng-show', formName + '.' + input.attr('name') + '.$error.' + validationAttr); //wrap input in ang elem?
						wrappedValidationLabels.push(wrappedLabel);

					} else if (processingAttr || processingAttr === "") {
						label.attr('ng-show', processing);
					}
				});
				return wrappedValidationLabels;
			}

			function getTransformedButtons(buttons) {
				angular.forEach(buttons, function(button) {
					button = angular.element(button).addClass('btn');
					if (button.attr('type') === 'submit') {
						button
							.addClass('btn-primary')
							.attr('ng-disabled', formName +  '.$invalid');
					} else {
						button.attr('type', 'button');
					}
				});
				return buttons;
			}
		}
	};
}]);;

'use strict';

angular.module('VBrick.Util.Directives')

/**
 * Directive for all text inputs
 * Currently only handles inputs with type="text" but in theory it could be expanded to all inputs
 *
 * Usage:
 * <vb-input inline is-pristine="expr">
 *  <label>Label Text</label>
 *	<input name=".." ng-model=".." ...>  --or--  <select ...> --or-- <textarea ...>
 *	   --or-- <any-tag class="vb-input-field"></>
 *	<label validation="required"> This Field is Required</label>
 * 	<label validation ng-show="...">Custom error</label>
 * </vb-input>

	Attributes:
		inline : for use in form-inline style form
		is-pristine: default true,  If the expression evaluates to true then only show error/success styles for dirty fields.
					 Use this when the form is used for create/edit dual purpose

	Notes:
		* The "name" attribute is required for validation, and should be included on any input or select elements included
		  inside the directive.


 **/

.directive('vbInput', [function() {
	return {
		restrict: 'EA',
		compile: function(element, attr) {

			var inline = attr.inline || attr.inline === "";
			var form = element.parents('form, ng-form, [ng-form], .ng-form').first();
			var formName = form.attr("name") || form.attr('ng-form');
			var input = $($("input", element)[0] || $("select", element)[0] || $("textarea", element)[0] || $(".vb-input-field", element)[0]);
			var inputName = input.attr("name");
			var formAndInput = formName + '.' + inputName;
			var ngRequired = input.attr("ng-required");
			var isRequired = !!(input.attr("required") || ngRequired);
			var readOnly = !!input.attr('readonly') || input.attr('ng-readonly');
			var disabled = !!input.attr('disabled') || input.attr('ng-disabled');

			element.addClass("vb-input");

			var pristineExpression = "(" + (attr.isPristine ? "(" + attr.isPristine+ ") && " : "") +formAndInput + ".$pristine)";
			var requiredExpression = pristineExpression +
				(ngRequired ? " && (" + ngRequired  + ")" : "");
			var readOnlyExpression = readOnly ? '(' + readOnly + ')' : 'false'; //don't need to show validations for readonly or required fields
			var disabledExpression = disabled ? '(' + disabled + ')' : 'false';

			var formGroupNgClass= formAndInput ? ("{" +
				(isRequired ? "  'required': " + requiredExpression + "," : "") +
				"                'has-error': !" + pristineExpression + " && " + formAndInput + ".$invalid && !" + readOnlyExpression + " && !" + disabledExpression + "," +
				"                'has-success': !" + pristineExpression + " && " + formAndInput + ".$valid && !" + readOnlyExpression + " && !" + disabledExpression +
				"}") : "";


			var container = $('<div class="form-group"></div>').appendTo(element)
				.attr("ng-class", formGroupNgClass)
				.append(getMainLabel());

			var innerContainer = (inline ? container : $('<div class="row"></div>').appendTo($('<div class="col-sm-9"></div>').appendTo(container)))
					.append(getWrappedInput());

			if(isRequired){
				innerContainer
					.append('<div class="required-field"></div>');
			}

			var validationLabels = getValidationLabels();
			if(validationLabels.length){
				innerContainer
					.append('<div class="success-field"></div>')
					.append($('<div class="error-field"></div>').append(validationLabels));
			}


			innerContainer.children().toggleClass('col-sm-6', !inline);


			function getMainLabel(){
				return element.children("label:not([validation])")
					.addClass("control-label")
					.toggleClass("col-sm-3", !inline);
			}

			function getValidationLabels(){
				return $("label[validation]", element)
					.addClass("control-label")
					.each(function(){
						var label = $(this);
						var flag = label.attr("validation");

						if(flag){
							label.attr("ng-show", formAndInput+".$error."+flag);
						}
					});
			}

			function getWrappedInput(){

				//checkboxes, button groups dont work right with the form-control class
				if(!input.hasClass("vb-input-field")){
					input.addClass("form-control");
				}

				input = $($(".vb-input-wrap", element)[0] || input);

				if(inline){
					return input;
				}

				return $("<div></div>").append(input).append($(".help-block", element));
			}
		}
	};

}]);
;

'use strict';

angular.module('VBrick.Util.Directives')

.directive('vbLoadingBar', ['$parse', function ($parse) {
	return {
		restrict: 'A', //Attributes only
		transclude: true,
		template: [
			'<div class="progress progress-striped active">',
			'	<div class="progress-bar progress-bar-info" style="width:100%"></div>',
			'</div>',
			'<div style="text-align: center;" ng-transclude></div>'
		].join(''),

		compile: function (tElement, tAttrs, transclude) {
			return function (scope, element, attrs) {
				element.addClass("loading-bar");
				if(attrs.vbLoadingBar){
					scope.$watch(attrs.vbLoadingBar, function (isLoading, oldVal) {
						element.toggleClass("hidden", !isLoading);
					});
				}
			};
		}
	};
}]);
;

'use strict';

angular.module('VBrick.Util.Directives')
.directive('vbMultiple', [function(){
	return {
		restrict: 'A',
		link: function(scope, $el, $attr){
			if(Modernizr.multiplefileinput){
				$el.prop('multiple', true);
			}
		}
	};
}]);;

'use strict';
angular.module('VBrick.Util.Directives')

/**
 * Apply this directive to a scrollable container and it will make your Bootstrap dropdown components
 * smarter about rendering within the visible region (vertically) by conditionally applying the "dropup" class.
 */
.directive('vbScrollContainerDropup', function(){
	return {
		restrict: 'AE',

		scope: {
			//Element inside the scrollable region that is a parent of the dropdown and may be measured to determine
			//the present position of our dropdown toggle relative to the region.
			scrollContainerOffsetChildSelector: '@',

			//Height of the dropdown-menu that will be displayed.
			scrollContainerMenuHeight: '='
		},

		link: function($scope, $element, $attributes) {
			var $scrollContainer = $($element);

			$($element).on('click', '.dropdown-toggle', function(event){
				//elements
				var $offsetChild = $(event.target).parents($scope.scrollContainerOffsetChildSelector);
				var $dropdown = $(event.target).parents('.dropdown');

				//measurements
				var scrollContainerOffsetTop = $scrollContainer.offset().top;
				var scrollContainerHeight = $scrollContainer.height();
				var rowElementOffsetTop = $offsetChild.offset().top;

				//toggle the dropup class appropriately
				var useDropup = rowElementOffsetTop > (scrollContainerOffsetTop + scrollContainerHeight - parseInt($scope.scrollContainerMenuHeight));

				$dropdown.toggleClass('dropup', useDropup);
			});
		}
	};
});;

'use strict';
angular.module('VBrick.Util.Directives')

/**
 * Autoscroll an item horizontally into view within a scrollbox
 *
 * Example: <ul
 * 	vb-scroll-item-x="activeItem.index" //index of the active element
 * 	selector="li" //css selector that selects all items
 * 	>
 * 	<li ng-repeat=...
 */
.directive("vbScrollItemX", [function(){

	return {
		restrict: 'EA',
		link: function($scope, $el, $attrs){

			$scope.$watch($attrs.vbScrollItemX, update);
			var slideSelector = $attrs.selector;


			var padding = 20;

			function update(index){

				var slide = $($(slideSelector, $el)[index]);

				if(slide[0]){
					var currentScrollPos = $el.scrollLeft();
					var slideLeftScrollPos = slide.offset().left - $el.offset().left + currentScrollPos;
					var slideRightScrollPos = slideLeftScrollPos - $el.width() + slide.width();

					if(currentScrollPos > slideLeftScrollPos){
						$el.scrollLeft(slideLeftScrollPos - padding);
					}
					else if(currentScrollPos < slideRightScrollPos){
						$el.scrollLeft(slideRightScrollPos + padding);
					}
				}
			}

		}
	};
}]);;

'use strict';

angular.module('VBrick.Util.Directives')

.directive('vbSelectOnClick', function(){
	return {
		restrict: 'EA',
		link: function(scope, el, attrs){
			el.on('click', function(){
				this.select();
			});
		}
	};
});;

'use strict';

angular.module('VBrick.Util.Directives')
/**
 * add vb-loading-spinner as an attribute of a div along with an appropriate ng-show directive
 */
.directive('vbLoadingSpinner', [function() {
	return {
		restrict: 'E',
		template: function(tElement, tAttrs) {
			var msg = tAttrs.msg || '';
			var opt = tAttrs.opt || ''; //this just keeps undefined from showing up in the html

			var msgTemplate = msg ? '<div class="status-msg"><h3>' + msg + '</h3></div>' : '';

			var defaultTemplate = msgTemplate +
								  '<span class="loader ' + tAttrs.size + ' ' + opt + '"></span>';
			var containerTemplate = '<div class="loading-container ' + tAttrs.size + '">' +
									msgTemplate +
									'<span class="loader '  + tAttrs.size + ' ' + opt + '"></span></div>';

			if(tAttrs.block){
				return containerTemplate;
			} else {
				return defaultTemplate;
			}
		}
	};
}]);
;

'use strict';

/**
 * This works around some limitiations of the ui-sref-active directive
 *    - toggles the class if any inner ui-sref is active.
 *    - Currently does not support relative states, or state parameters
 ***/

angular.module('VBrick.Util.Directives')
.directive('vbSrefAnyActive', ['$rootScope', '$state', function($rootScope, $state){

	return {
		restrict: 'A',

		compile: function(tElement, attrs){
			var className = attrs.vbSrefAnyActive;
			var states = $("[ui-sref]", tElement).map(function(i, tElement){
				var stateRef = tElement.getAttribute('ui-sref');
				return (/^([^(]+)/).exec(stateRef)[1];
			});

			return function($scope, iElement){
				checkState();

				$scope.$on('$stateChangeSuccess', function(state){
					checkState();
				});

				function checkState(){
					var isActive = _.any(states, function(state){
						return $state.includes(state);
					});

					iElement.toggleClass(className, isActive);
				}
			};
		}
	};

}]);

;

'use strict';

/**
	Stretches an element to the bottom of the screen
	to use, put the 'v-stretch' class on the correct element
	set class of "v-stretch-min-height":  to set the min-height style, instead of height
	attribute: anchor-bottom:  the gap to leave at the bottom of the element, in pixels. Default is 25 pixels


	Example:
	<div class="v-stretch v-stretch-min-height" anchor-bottom="25">...</div>
**/
angular.module('VBrick.Util.Directives')

.directive('vbStretch', ['$parse', function ($parse) {
	return {
		restrict: 'C',
		link:function(scope, el, attr){

			function handler(){
				var viewportHeight = $(window).height();
				var top =  el.offset().top;
				var bottomAnchor = attr.bottomAnchor || 50;
				var heightValue = viewportHeight-top-bottomAnchor;

				if(el.hasClass('vb-stretch-min-height')){
					el.css('min-height', heightValue);
				}
				else{
					el.height(heightValue);
				}
			}
			handler();
			$(window).resize(handler);
			scope.$on('$destroy', function(){
				$(window).off('resize', handler);
			});
			scope.$watch(_.debounce(handler, 100));
		}

	};
}]);
;

'use strict';
angular.module('VBrick.Util.Directives')

/**
	This directive will "tail" a scrollable element, scrolling to the bottom when new content is added.

	attributes:
		vb-tail: a watch expression that triggers a rescroll.  Set this to the ng-repeat array's length normally
		vb-tail-bottom: how far the user can scroll from the bottom to activate tailing. 32 by default

	example:

	<div class="comments-box" vb-tail="comments.length">
		<div ng-repeat="comments">....
**/
.directive("vbTail", [function(){

	return {
		restrict: 'EA',
		controller: ['$element', '$attrs', '$scope', function($element, $attrs, $scope){

			var tailBottom = +$attrs.vbTailBottom || 32;

			$scope.$watch($attrs.vbTail, update);

			var initialUpdate = true;

			function update(val){

				if(getScrollBottomDistance() < tailBottom){

					if(initialUpdate && val){
						initialUpdate = false;
						//allow extra time when the browser is rendering for the first time
						window.setTimeout(scrollToBottom, 1000);
					}
					else{
						window.setTimeout(scrollToBottom, 10);
					}
				}
			}

			function scrollToBottom(){
				$element.scrollTop($element.prop("scrollHeight") - $element.innerHeight());
			}

			function getScrollBottomDistance(){
				return $element.prop("scrollHeight") - $element.innerHeight() - $element.scrollTop();
			}


		}]
	};
}]);;

'use strict';

angular.module('VBrick.Util.Directives')


/**
 * The `vbTitle` directive allows you to set the page's title (document.title property) for any view or state.
 * The original title is saved and restored when the user navigates away. The title may contain dynamic content.
 *
 * example:  <vb-title>Admin - {{account.name}}</vb-title>
 */
.directive('vbTitle', ['$interpolate', function($interpolate){

	var id = 0;
	var titles = [{ id: nextId(), value: document.title }];

	function nextId(){
		return id++;
	}

	function syncTitle(){
		var title = titles[titles.length - 1].value;
		document.title = title;
	}

	function addTitle(title){
		var id = nextId();

		titles.push({id: id, value: title});
		syncTitle();

		return id;
	}

	function removeTitle(id){
		titles = _.reject(titles, function(title){
			return title.id === id;
		});
		syncTitle();
	}

	function updateTitle(id, title){
		var t = _.find(titles, function(title){
			return title.id === id;
		});

		if(t){
			t.value = title;
		}

		syncTitle();
	}

	return {
		restrict: 'E',

		compile: function(el){
			var text = el.text();
			el.remove();
			var interpolateFn = $interpolate(text, true);

			return function(scope){

				var id = addTitle(interpolateFn ? interpolateFn(scope) : text);

				if (interpolateFn) {
					scope.$watch(interpolateFn, function(title){
						updateTitle(id, title);
					});
				}

				scope.$on('$destroy', function(){
					removeTitle(id);
				});
			};
		}
	};
}]);
;

'use strict';

angular.module('VBrick.Util.Directives')

/**
	Allow use of translated strings in your controller.

	attributes:
		vbTranslationStrings or name:  The translation table will be published into the related scope, under this name.

	child elements:
		translation
			key attribute - the translation's key
			value attribute or innerHTML - the translation's value


	example:
	<vb-translation-strings name="translations">
		<translation key="error">@Model.Strings.ErrorMessage</translation>
		-- or --
		<translation key="error" value="@Model.Strings.ErrorMessage"></translation>
	</vb-translation-strings>

**/
.directive('vbTranslationStrings', [function(){

	return {
		restrict: 'EA',
		compile: function(el){
			el.css('display', 'none');
		},
		controller: ['$scope', '$attrs', '$element', '$parse', function($scope, $attrs, $el, $parse){
			$parse($attrs.vbTranslationStrings || $attrs.name).assign($scope, this);

			var ctrl = this;

			$('translation', $el).each(function(){
				var el = $(this);
				var key = el.attr("key");
				var val = el.attr("value") || el.html();

				ctrl[key] = val;
			});
		}]
	};
}]);;

'use strict';

angular.module('VBrick.Util.Directives')

.directive('vbInteger', ['ValidationService', function (ValidationService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var numberValidator = function(value) {
				ctrl.$setValidity('vbInteger', ValidationService.checkInteger(value));
				return value;
			};

			ctrl.$parsers.push(numberValidator);
			ctrl.$formatters.push(numberValidator);
		}
	};
}])

.directive('vbMin', [function(){
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {

			var minValue;
			scope.$watch(attr.vbMin, function(vbMin){
				minValue = vbMin;
				validate(ctrl.$modelValue);
			});

			function validate(value) {
				ctrl.$setValidity('vbMin', minValue == null || ctrl.$isEmpty(value) || value >= minValue);
				return value;
			}

			ctrl.$parsers.push(validate);
			ctrl.$formatters.push(validate);
		}
	};
}])

.directive('vbMax', [function(){
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {

			var maxValue;
			scope.$watch(attr.vbMax, function(vbMax){
				maxValue = vbMax;
				validate(ctrl.$modelValue);
			});

			function validate(value) {
				ctrl.$setValidity('vbMax', maxValue == null || ctrl.$isEmpty(value) || value <= maxValue);
				return value;
			}

			ctrl.$parsers.push(validate);
			ctrl.$formatters.push(validate);
		}
	};
}])

.directive('vbEmail', ['ValidationService', function (ValidationService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var emailValidator = function(value) {
				ctrl.$setValidity('vbEmail', ValidationService.checkEmail(value));
				return value;
			};

			ctrl.$parsers.push(emailValidator);
			ctrl.$formatters.push(emailValidator);
		}
	};
}])

.directive('vbShort', ['ValidationService', function (ValidationService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var shortValidator = function(value) {
				ctrl.$setValidity('vbShort', ValidationService.checkShortText(value));
				return value;
			};

			ctrl.$parsers.push(shortValidator);
			ctrl.$formatters.push(shortValidator);
		}
	};
}])

.directive('vbMaxLength', function() {
	return {
		restrict: 'A',
		require: 'ngModel',

		link: function(scope, elem, attr, ctrl) {
			var maxLength;
			scope.$watch(attr.vbMaxLength, function(vbMaxLength){
				maxLength = +vbMaxLength;
				validate(ctrl.$modelValue);
			});

			var validate = function(value) {
				ctrl.$setValidity('vbMaxLength', maxLength == null || ctrl.$isEmpty(value) || value.length <= maxLength);
				return value;
			};

			ctrl.$parsers.push(validate);
			ctrl.$formatters.push(validate);
		}
	};
})

.directive('vbLong', ['ValidationService', function (ValidationService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var longValidator = function(value) {
				ctrl.$setValidity('vbLong', ValidationService.checkLongText(value));
				return value;
			};

			ctrl.$parsers.push(longValidator);
			ctrl.$formatters.push(longValidator);
		}
	};
}])

/**
 * validates hostname input fields
 * usage: <input ... vb-hostname>
 */
.directive('vbHostname', ['ValidationService', function (ValidationService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var hostnameValidator = function(value) {
				ctrl.$setValidity('vbHostname', ValidationService.checkHostnameText(value));
				return value;
			};

			ctrl.$parsers.push(hostnameValidator);
			ctrl.$formatters.push(hostnameValidator);
		}
	};
}])


//Input value can be an ipv4 or ipv6 address
.directive('vbIpAddress', ['IPAddress', function (IPAddress) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var validate = function(value) {
				ctrl.$setValidity('vbIpAddress', IPAddress.validate(value));
				return value;
			};

			ctrl.$parsers.push(validate);
			ctrl.$formatters.push(validate);
		}
	};
}])

.directive('vbMacAddress', ['ValidationService', function (ValidationService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var macValidator = function(value) {
				ctrl.$setValidity('vbMacAddress', ValidationService.checkMacAddress(value));
				return value;
			};

			ctrl.$parsers.push(macValidator);
			ctrl.$formatters.push(macValidator);
		}
	};
}])

.directive('vbUrl', ['ValidationService', function (ValidationService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var validate = function(value) {
				ctrl.$setValidity('vbUrl', ValidationService.checkUrl(value));
				return value;
			};

			ctrl.$parsers.push(validate);
			ctrl.$formatters.push(validate);
		}
	};
}])

/**
Used for server side errors that come from invalid data
//usage: <input vb-clear-on-change="hostNameInUse">
		on the server side, if the error occurs, call formName.inputName.$setValidity("hostNameInUse", false);
		The error will be present on the form controller until data changes.
**/
.directive('vbClearOnChange', function () {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attr, ctrl) {
			var errorFlag = attr.vbClearOnChange;

			var update = function(value) {
				ctrl.$setValidity(errorFlag, true);
				return value;
			};

			ctrl.$parsers.push(update);
			ctrl.$formatters.push(update);
		}
	};
});
;


'use strict';

angular.module('VBrick.Util.Directives')


/**
 * Helper directive for use with virtual scroll
 *  vbVsPageLoad:  Expression to evaluate when data needs to be loaded. Must return a promise containing an object: { items, totalHits}
 *		The following locals are provided:
 *			index: the index to start loading data at
 *			count: the number of records to load
 *	pageSize: Expression, Number of records to load with each call.
 *
 *
 **/
.directive('vbVsPageLoad', ['$parse', function($parse){

	return {
		restrict: 'A',
		priority: 1000,
		compile: function(element, attrs){

			var ngRepeatCollectionExpr = parseNgRepeatExpression();

			attrs.$set("ngRepeatCollectionExpr", ngRepeatCollectionExpr, false);

			function parseNgRepeatExpression(){
				var ngRepeat = $("[ng-repeat]", element).attr("ng-repeat");

				var match = ngRepeat.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);

				var collectionExpression = match && match[2];

				if(!collectionExpression){
					throw new Error("Unable to find ng-repeat collection");
				}

				return $parse(collectionExpression);
			}
		},

		controller: ['$scope', '$attrs', 'SearchService', 'SearchConstants', function($scope, $attrs, SearchService, SearchConstants) {
			var startIndex, endIndex, scrollId = SearchConstants.defaultScrollId, loading = false;

			var loadPageFn = $parse($attrs.vbVsPageLoad);
			var getItemsCollectionFn = $attrs.ngRepeatCollectionExpr;

			var unwatchStartIndex = $scope.$watch('startIndex', function(start){
				startIndex = start;
				updateIfReady();
			});

			var unwatchEndIndex = $scope.$watch('endIndex', function(end){
				endIndex = end;
				updateIfReady();
			});

			function updateIfReady(){
				if(startIndex == null || endIndex == null || loading) {
					return;
				}

				update();
			}

			function update(){
				var items = getItemsCollectionFn($scope);
				if(!items) {
					return loadPage(0)
						.then(function(resultScrollId) {
							scrollId = resultScrollId;
						});
				}

				if (endIndex < SearchService.pageSize / 2) {
					return;
				}

				deregisterWatchers();
				loadRemainingPages(1);
			}

			function loadRemainingPages(startPage) {
				loadPage(startPage)
					.then(function(count) {
						if (count >= SearchService.pageSize) {
							loadRemainingPages(++startPage);
						}
					});
			}

			function loadPage(pageIndex){
				loading = true;
				var pageSize = SearchService.pageSize;
				var index = pageIndex * pageSize;

				return loadPageFn($scope, {
					scrollId: scrollId,
					count: pageSize
				})
					.then(function(result){
						var items = getItemsCollectionFn($scope);

						if(!items){
							items = new Array(result.totalHits);
							getItemsCollectionFn.assign($scope, items);
						}

						var absoluteIndex = index;
						for(var i=0, ii=result.items.length; i<ii; ++i){
							items[absoluteIndex++] = result.items[i];
						}

						if (result.items.length < pageSize) {
							deregisterWatchers();
						}
						loading = false;
						return result.items.length;
					});
			}

			function deregisterWatchers() {
				unwatchStartIndex();
				unwatchEndIndex();
			}

		}]
	};
}])

.directive('onVsIndexChange', ['$parse', function($parse) {
	return function($scope, $element, $attrs){
		var expr = $parse($attrs.onVsIndexChange);
		var fn = function(){
			expr($scope);
		};
		$scope.$watch('startIndex', fn);
		$scope.$watch('endIndex', fn);
	};
}])

/**
 * Maintains a lastVisibleIndex value on scope, which represents the index of the last row that is visible to the user within the
 * scroll container. This may be helpful in customizing content behavior based on its position.
 *
 * Example: Each row has a menu button. We may position the menu based on its position within the scroll container. If the row is on the bottom,
 * then position the menu above the row.
 */
.directive('vsLastVisibleIndex', function() {
	return {
		restrict: 'A',
		priority: 1000,
		require: '?^vsRepeat',
		link: function($scope, $element, $attrs) {
			var $$horizontal = typeof $attrs.vsHorizontal !== "undefined";
			var clientSize =  $$horizontal ? 'clientWidth' : 'clientHeight';
			var scrollPos =  $$horizontal ? 'scrollLeft' : 'scrollTop';
			var scrollSize = $$horizontal ? 'scrollWidth' : 'scrollHeight';

			var updateLastVisibleIndex = function() {
				//update the last visible row index, which may be of use to the presentation (example: positioning of a menu below or above a row)
				var scrollPosValue = $scope.$scrollParent[0][scrollPos];
				var scrollSizeValue = $scope.$scrollParent[0][scrollSize];
				var scrollParentClientSizeValue = $scope.$scrollParent[0][clientSize];
				var numRowsVisible = Math.round(scrollParentClientSizeValue / $scope.elementSize);
				var remainingScrollSize = scrollSizeValue - scrollPosValue - scrollParentClientSizeValue;
				var isRemainingScrollLessThanElementSize = remainingScrollSize < $scope.elementSize;
				var lastVisibleIndex = numRowsVisible + Math.floor(scrollPosValue / $scope.elementSize) - $scope.startIndex - 1;

				//don't count the last row as visible until it is fully in view
				if (remainingScrollSize && isRemainingScrollLessThanElementSize) {
					--lastVisibleIndex;
				}


				$scope.lastVisibleIndex = Math.max(lastVisibleIndex, 0);
			};

			//update the last visible index on reinitialize of the repeat, scroll of the container, and resize of the window
			$scope.$on('vsRepeatReinitialized', updateLastVisibleIndex);
			$scope.$scrollParent.on('scroll', updateLastVisibleIndex);
			angular.element(window).on('resize', updateLastVisibleIndex);

			//clean up
			$scope.$on('$destroy', function(){
				$scope.$scrollParent.off('scroll', updateLastVisibleIndex);
				angular.element(window).off('resize', updateLastVisibleIndex);
			});
		}
	};
})

/**
 * A workaround for a longstanding Firefox defect where the browser will restore the previous scroll position to a container
 * after reloading the page. It will then report the initial position incorrectly.
 *
 * This directive works around the issue by manually resetting the scroll position.
 */
.directive('vsScrollToTop', ['$timeout', function($timeout){
	return {
		restrict: 'A',
		priority: 1000,
		require: '?^vsRepeat',
		link: function($scope) {
			var unbindWatcher = $scope.$watch('last', function(){
				$timeout(function(){
					//manually reset the scroll position (have to apply a non-zero value first to trigger a change)
					$scope.$scrollParent.scrollTop(1).scrollTop(0).scrollLeft(1).scrollLeft(0);
				}, 500);

				//clean up
				unbindWatcher();
			});
		}
	};
}]);;

'use strict';

angular.module('VBrick.Util.Directives')

/**
 * watchDimensions directive
 * Watches the dimensions of the container it is placed on and resizes the specified child content region for best fit while maintaining its proportions.
 *
 * OPTIONS
 *
 * watch-dimensions
 * Value should be a jQuery selector for the child element that you wish to resize so that it maintains its proportion
 * when this element's size has changed.
 *
 * natural-ratio
 * By default this assumes the content is 16:9 aspect. To override, include the natural-ratio attribute
 * and this will calculate the aspect ratio at first run based on the natural dimensions of the provided element to resize.
 *
 */
.directive('watchDimensions', ['$timeout', '$window', function($timeout, $window) {

	var userAgent = window.navigator.userAgent;
	var isInternetExplorerOrEdge = userAgent.indexOf('Trident') > 0 || userAgent.indexOf('Edge/') > 0;

	function isIE9AndUnder() {
		var msie = userAgent.indexOf('MSIE ');

		return msie > 0 && parseInt(userAgent.substring(msie + 5, userAgent.indexOf('.', msie)), 10) <= 9;
	}

	return {
		scope: {
			elementToResizeSelector: '@watchDimensions'
		},

		link: function($scope, $element, attrs) {
			if (!isInternetExplorerOrEdge || !isIE9AndUnder()) {// don't run on IE 9. IE 9 is too slow, and it chokes
				var ratio, inverse;
				var initialRun = true;
				var padding = 32;
				var naturalRatio = attrs.naturalRatio != null;
				var $elementToResize = $element.find($scope.elementToResizeSelector).first();

				var redraw = _.debounce(function() {
					var thisRatio = $element.height() / $element.width();

					if (!ratio || !isFinite(thisRatio)) {
						return $timeout(redraw, 100);
					}

					if(thisRatio >= ratio) { // constrain by width
						var elemWidth = $element.width() - padding;

						$elementToResize.css('width', naturalRatio ? '' : elemWidth).height(elemWidth * ratio);

					} else { // constrain by height
						var elemHeight = $element.height() - padding;

						$elementToResize.css('height', naturalRatio ? '' : elemHeight).width(elemHeight * inverse);
					}
				}, 100);

				if (naturalRatio) { //extract the ratio from the natural dimensions of the element
					var image = $elementToResize[0];

					image.onload = function() {
						ratio =  image.naturalHeight / image.naturalWidth;
						inverse = image.naturalWidth / image.naturalHeight;
						redraw();
					};

					//workaround an IE bug where it doesn't reliably fire the img onload event (this triggers it)
					if (isInternetExplorerOrEdge) {
						$elementToResize.attr('src', $elementToResize.attr('src'));
					}
				} else { //use 16:9
					ratio = 0.5625;
					inverse = 1.77777;
				}


				//apply various listeners which may trigger a redraw of $elementToResize

				$scope.$watch( function() { return $element.height()+$element.width(); }, function (newValue, oldValue) {
					if(newValue !== oldValue) {
						redraw();
					}
				});

				//provides a mechanism for manually signaling that a redraw should occur
				$scope.$on('REDRAW_WATCHDIMENSIONS', function(){
					$timeout(redraw, 200); // have to give DOM time to redraw, should attempt to optimize value at some point
				});

				//redraw on window resize
				var onWindowResize = function() {
					$timeout(redraw, 50);
				};
				angular.element($window).on('resize', onWindowResize);

				//clean up of the window listener
				$scope.$on('destroy', function(){
					angular.element($window).off('resize', onWindowResize);
				});

				// initial sizing. this fixes css issues with our player.
				$timeout(redraw);
			}
		}
	};
}]);;

'use strict';

angular.module('VBrick.VideoPlayer')
.controller('VideoPlayerController', ['$scope', '$rootScope', function ($scope, $rootScope){
	var currentId = 1;

	_.extend($scope, {
		id: '',
		playerName: '',
		browser: {},
		currentLocation: function(){
			return {
				left: ($scope.stream.currentTime / $scope.stream.duration) * 100 + '%'
			};
		},
		controls: {
			isMuted: false,
			progressCtrl: null,
			volumeCtrl: null,
			playerContainerEl: null,
			onProgressSliderStart: null,
			onProgressSliderStop: null,
			onVolumeSliderStop: null,
			removeCurrentPlayer: null,
			appendVideoPlayerEl: null,
			createProgressControlSlider: createProgressControlSlider,
			createVolumeControlSlider: createVolumeControlSlider,
			toggleFullScreen: toggleFullScreen,
			toggleBrowserFullScreen: toggleBrowserFullScreen,
			isBrowserFullScreen: isBrowserFullScreen,
			canBrowserFullScreen: canBrowserFullScreen,
			isIEEmbedVideo: (document.documentMode < 11 && document.URL.indexOf('embed') > -1)
		},
		stream: {
			isPlaybackInitialized: false,
			autoPlay: false,
			isLive: false,
			state: 'stopped',
			currentTime: 0,
			duration: 0,
			isLoaded: false
		},
		pluginName: '',
		hasPlugin: false,
		safeApply: function(fn) {
			var phase = this.$root.$$phase;
			if(phase == '$apply' || phase == '$digest') {
				if(fn && (typeof(fn) === 'function')) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		},
		onDestroy: function(){
			if($scope.stream.state === 'playing'){
				if($scope.stream.isLive){
					$scope.onStop();
				}
				else{
					$scope.onPause({timestamp: $scope.stream.currentTime});
				}
			}
		}
	});

	$scope.browser = detectBrowser();

	$scope.$watch('pluginName', function(name) {
		if(name){
			$scope.hasPlugin = hasPlugin(name);
		}
	});

	$scope.$watch('playerName', function(name) {
		if(name){
			$scope.id = nextId(name);
		}
	});

	$scope.$watch('stream.state', function(value) {
		if(value){
			$rootScope.$broadcast('PLAYER_STATE_UPDATE', value);
		}
	});

	$scope.$watch('stream.duration', function(newDuration, oldDuration) {
		if($scope.controls.progressCtrl && (newDuration !== oldDuration)){
			$scope.controls.progressCtrl.slider( "option", "max", newDuration);
		}
	});

	$scope.$watch('stream.isLive', function(value) {
		if($scope.controls.progressCtrl){
			$scope.controls.progressCtrl.off('slidestop').on('slidestop', function(event, ui){
				if($scope.controls.onProgressSliderStop){
					$scope.controls.onProgressSliderStop(event, ui);
				}
			});
			$scope.controls.progressCtrl.off('slidestart').on('slidestart', function(event, ui){
				if($scope.controls.onProgressSliderStart){
					$scope.controls.onProgressSliderStart(event, ui);
				}
			});
		}
	});

	$scope.$watch("videoUrl", function(url){
		if($scope.controls.removeCurrentPlayer){
			$scope.controls.removeCurrentPlayer();
		}

		if(url && $scope.controls.appendVideoPlayerEl){
			$scope.controls.appendVideoPlayerEl(url);
		}
	});

	$scope.$on('$destroy', function(){
		if($scope.controls.removeCurrentPlayer){
			$scope.controls.removeCurrentPlayer();
		}
	});

	function detectBrowser(){
		var userAgent = navigator.userAgent;

		if(userAgent.search("MSIE") > -1 || (userAgent.search("Trident/") > -1 && userAgent.search("Windows") > -1)){
			return {
				msie: true
			};
		} else if(userAgent.search("Chrome") > -1 && userAgent.search("Safari") > -1){
			return {
				chrome: true
			};
		} else if(userAgent.search("Firefox") > -1){
			return {
				firefox: true
			};
		} else if(userAgent.search("Safari") > -1 && userAgent.search("Chrome") === -1){
			return {
				safari: true
			};
		} else if(userAgent.search("Opera") > -1){
			return {
				opera: true
			};
		}
	}

	function hasPlugin(name){
		var plugins = navigator.plugins || [];
		name = name.toLowerCase();

		return _.some(plugins, function(plugin){
			return (plugin.name.toLowerCase().indexOf(name) > -1 || plugin.description.toLowerCase().indexOf(name) > -1);
		});
	}

	function nextId(name){
		return name + (currentId++);
	}

	function createProgressControlSlider(){
		if($scope.controls.progressCtrl){
			$scope.stream.isPlaybackInitialized = false;

			if($scope.controls.progressCtrl.data('ui-slider')){
				$scope.controls.progressCtrl.slider('destroy');
			}

			$scope.controls.progressCtrl.slider({
				orientation: 'horizontal',
				range: 'min',
				max: $scope.stream.duration || 0,
				min: 0,
				value: 0
			});
		}
	}

	function createVolumeControlSlider(){
		if($scope.controls.volumeCtrl){
			if($scope.controls.volumeCtrl.data('ui-slider')){
				$scope.controls.volumeCtrl.slider('destroy');
			}

			$scope.controls.volumeCtrl.slider({
				orientation: 'horizontal',
				range: 'min',
				max: 100,
				min: 0,
				value: 100
			});

			$scope.controls.volumeCtrl.off('slidestop').on('slidestop', function(event, ui){
				if($scope.controls.onVolumeSliderStop){
					$scope.controls.onVolumeSliderStop(event, ui);
				}
			});
		}
	}

	var escapeEvent = function (e) {
		if (e.which == 27){
			stopFullScreen();
			$rootScope.$digest();
		}
	};

	function startFullScreen() {
		var body = angular.element(document.body);
		$scope.fullScreen = true;
		$rootScope.noNav = true;
		$scope.$emit('fullScreenToggled', $scope.fullScreen);
		body.bind("keyup", escapeEvent);
	}

	function stopFullScreen() {
		if ( $scope.fullScreen ){
			var body = angular.element(document.body);
			$scope.fullScreen = false;
			$rootScope.noNav = false;
			$scope.$emit('fullScreenToggled', $scope.fullScreen);
			body.unbind("keyup", escapeEvent);
		}
	}

	function canBrowserFullScreen(){
		var elem = document.getElementById('player-wrap');
		//elem = null;  /// Not all browsers support full screen mode methods.  To debug old browsers, uncomment the statement.
		return ( elem && (elem.requestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen));
	}

	function toggleBrowserFullScreen(exitOnly) {
		var called = false;
		var elem = document.getElementById('player-wrap');
		//elem = null;  /// Not all browsers support full screen mode methods.  To debug old browsers, uncomment the statement.

		if (!elem) {
			return called;
		}
		else if (!exitOnly && !document.fullscreenElement &&    // alternative standard method
			!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
				called = true;
			} else if (elem.msRequestFullscreen) {
				elem.msRequestFullscreen();
				called = true;
			} else if (elem.mozRequestFullScreen) {
				elem.mozRequestFullScreen();
				called = true;
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
				called = true;
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
				called = true;
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
				called = true;
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
				called = true;
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
				called = true;
			}
		}
		return called;
	}

	function isBrowserFullScreen() {
		return (document.fullscreenElement ||    // alternative standard method
			document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
	}

	function toggleFullScreen(exitOnly) {
		if(!toggleBrowserFullScreen(exitOnly)){
			if (exitOnly || $scope.fullScreen){
				stopFullScreen();
			}
			else{
				startFullScreen();
			}
		}
	}
}]);;

'use strict';

/**
 * This leverages the Strobe Media Player.
 * Its JavaScript API is defined in org.osmf.player.configuration.JavaScriptBridge
 */
angular.module('VBrick.VideoPlayer')
.directive('vbPlayerFlash', ['$timeout', 'MediaLanguageTranslations', function($timeout, MediaLanguageTranslations){
	var swfVersion = '10.1.0';
	var player;

	return {
		controller: 'VideoPlayerController',
		restrict: 'A',
		scope: {
			videoUrl: '@vbPlayerFlash',
			thumbnailUri: '=',
			subtitles: '=',
			playbackPositionUpdated: '&',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			canShowThumbnail: '&showThumbnail',
			playbackOptions: '='
		},
		templateUrl: '/shared/partials/media-player/vbrick-flash-player.html',

		link: function(scope, $el, $attr){
			$el.addClass("vb-player");

			var eventHandlerName, player;
			var canChangeProgressSliderValue = true;
			var restorePlaybackPosition;
			var pauseAfterRestore;

			scope.playerName = 'VbrickFlashPlayer';
			scope.hasPlugin = swfobject.hasFlashPlayerVersion("11.1.0");
			scope.controls.playerContainerEl = $("div.player-placeholder", $el);
			scope.controls.volumeCtrl = $('div.progress-indicator-volume', $el);
			scope.controls.progressCtrl = $('div.progress-indicator', $el);
			scope.controls.removeCurrentPlayer = removeCurrentPlayer;
			scope.controls.appendVideoPlayerEl = appendVideoPlayerEl;
			scope.controls.onVolumeSliderStop = onVolumeSliderStop;
			scope.controls.onProgressSliderStop = onProgressSliderStop;
			scope.controls.onProgressSliderStart = onProgressSliderStart;
			scope.stream.autoPlay = angular.isDefined($attr.autoPlay);
			scope.stream.isLive = angular.isDefined($attr.live) && $attr.live === 'true';

			scope.controls.createProgressControlSlider();
			scope.controls.createVolumeControlSlider();

			_.extend(scope, {
				play: function(){
					if(player && player.getCanPlay()){

						if (scope.stream.isLive && isHlsPlayback() && player.getPaused()) {
							player.load(); //fresh load rather than playback from the buffer to work around flashls issue
						} else {
							player.play2();
						}

						scope.stream.state = 'playing';
						scope.onPlay();
					}
				},
				pause: function(){
					if(player && player.getCanPause()){
						player.pause();
						scope.stream.state = 'paused';
						scope.onPause({timestamp: scope.stream.currentTime});
					}
				},
				stop: function(){
					if(player){
						player.stop2();

						//workaround for flashls defect where it doesn't correctly stop playback
						if (isHlsPlayback()) {
							player.pause();
						}

						scope.stream.state = 'stopped';
						scope.stream.currentTime = 0;
						scope.onStop();
					}
				},
				setMute: function(){
					if(player){
						scope.controls.isMuted = !scope.controls.isMuted;
						player.setMuted(scope.controls.isMuted);
					}
				},
				onPlaybackOptionChange: function(playbackOption) {
					var isPlaying = scope.stream.state === 'playing';
					var isNotLive = !scope.stream.isLive;

					//capture playback position
					var playbackPosition = player.getCurrentTime();

					if (isPlaying) {
						player.stop2();
					}

					if (playbackPosition && isNotLive) {
						restorePlaybackPosition = playbackPosition;
						pauseAfterRestore = !isPlaying;
					}

					//apply playback url to the player
					player.setMediaResourceURL(playbackOption.url);

					//just start playing again if a live stream was playing
					if (isPlaying && !isNotLive) {
						this.play();
					}
					switchPlayerSubtitle(scope.selectedSubtitle);
				},
				onSubtitleOptionChange: function (subtitleOption) {
					switchPlayerSubtitle(subtitleOption);
					scope.selectedSubtitle = subtitleOption;
				}
			});

			function switchPlayerSubtitle (subtitleOption) {
				var index = scope.subtitles.indexOf(subtitleOption);
				player.switchSubtitlesIndex(index);
			}

			function reloadUrlIfHttp(){
				var url = scope.videoUrl.toLowerCase();

				if(player != null && (url.indexOf('http://') == 0 || url.indexOf('https://') == 0)){
					player.setMediaResourceURL(scope.videoUrl);
				}
			}

			function onJavaScriptBridgeCreatedEvent(){}

			function onDurationChangeEvent(duration){
				if(!scope.stream.isLive){
					scope.safeApply(function(){
						scope.stream.duration = duration * 1000;
					});
				}
			}

			function onCurrentTimeChangeEvent(timeSeconds){
				if(!scope.stream.isLive && canChangeProgressSliderValue){
					var timeMs = timeSeconds * 1000;

					scope.safeApply(function(){
						scope.controls.progressCtrl.slider('value', timeMs);
						scope.stream.currentTime = timeMs;
						scope.playbackPositionUpdated({time: timeMs});
					});
				}

				if (restorePlaybackPosition && player.getPlaying() && player.getCanSeek()) {
					restorePosition();
				}
			}

			function restorePosition() {
				player.seek(restorePlaybackPosition);

				if (pauseAfterRestore) {
					scope.pause();
				}

				pauseAfterRestore = false;
				restorePlaybackPosition = null;
			}

			function onCompleteEvent(ended){
				if (ended) {
					scope.safeApply(function() {
						scope.onComplete({duration: scope.stream.duration});
						scope.stream.state = 'stopped';
						scope.stream.currentTime = 0;
						scope.controls.progressCtrl.slider('value', 0);
						scope.controls.toggleFullScreen(true);

						// set the url again when the playback is complete. There is an internal issue with Strobe Media Player where
						// the player wont play the stream second time and stuck in ready status. This calls flushed it out.
						reloadUrlIfHttp();
					});
				}
			}

			function onFullScreenChangeEvent(isFullScreen){
				if(!isFullScreen) {
					if(player.getPlaying()){
						scope.safeApply(function() {
							scope.stream.state = 'playing';
						});
					}
					else if(player.getPaused()){
						scope.safeApply(function() {
							scope.stream.state = 'paused';
						});
					}
				}
			}

			function onVolumeChangeEvent(volume, muted){
				scope.safeApply(function() {
					scope.controls.volumeCtrl.slider('value', muted ? 0 : volume * 100);
					scope.controls.isMuted = muted;
				});
			}

			function appendVideoPlayerEl(url){
				var placeholder = $("<div></div>").attr("id", scope.id).appendTo(scope.controls.playerContainerEl);

				//Bind the swf event handler to a global function, and remove it when the scope is destroyed
				eventHandlerName = 'swfEventHandler' + scope.id;

				window[eventHandlerName] = function swfEventHandler(playerId, event, args){
					if(player == null){
						player = document.getElementById(scope.id);
					}

					switch(event){
					case 'onJavaScriptBridgeCreated':
						onJavaScriptBridgeCreatedEvent();
						break;
					case 'durationchange':
						onDurationChangeEvent(args.duration);
						break;
					case 'timeupdate':
						onCurrentTimeChangeEvent(args.currentTime);
						break;
					case 'complete':
						onCompleteEvent(args.ended);
						break;
					case 'fullscreenchange':
						onFullScreenChangeEvent(args.isFullScreen);
						break;
					case 'volumechange':
						onVolumeChangeEvent(args.volume, args.muted);
						break;
					case 'emptied':
						$timeout(onEmptiedEvent, 100);
						break;
					}
				};

				var flashVars = {
					src: url,
					playButtonOverlay: false,
					conrolBarMode: 'none',
					autoPlay: scope.stream.autoPlay,
					bufferTime: 8,
					javascriptCallbackFunction: eventHandlerName
				};

				if (isHlsStreamAvailable()) {
					flashVars.plugin_hls = '/shared/swf/flashlsOSMF.swf';
				}

				if (isCaptionsAvailable()) {
					flashVars.plugin_captions = '/shared/swf/CaptionsPlugin.swf';
				}

				if (isSubtitlesAvailable()) {
					_.extend(flashVars, getSubtitleFlashVars());
				}

				swfobject.embedSWF(
					'/shared/swf/StrobeMediaPlayback.swf',
					scope.id,
					"100%",
					"100%",
					swfVersion,
					'/shared/lib/swfobject/expressInstall.swf',
					flashVars,
					{
						quality: 'high',
						bgcolor: '#000000',
						allowscriptaccess: 'always',
						allowfullscreen: 'true',
						wmode: 'opaque'
					},
					{ name: scope.id });

				if(scope.stream.autoPlay){
					scope.stream.state = 'playing';
					scope.onPlay();
				}
			}

			function onEmptiedEvent() {
				if (restorePlaybackPosition) {
					scope.play();
				}
			}

			function removeCurrentPlayer(){
				scope.onDestroy();

				if(scope.stream.state === 'playing' || scope.stream.state === 'paused' && player.stop2){
					player.stop2();
				}
				scope.controls.playerContainerEl.empty();

				if(eventHandlerName){
					delete window[eventHandlerName];
				}

				player = null;
			}

			function onVolumeSliderStop(event, ui){
				var value = ui.value / 100;

				player.setVolume(value);
				player.setMuted(value === 0);
			}

			function onProgressSliderStart(event, ui){
				canChangeProgressSliderValue = false;
			}

			function onProgressSliderStop(event, ui){
				var canSeek = false;

				if (player && event.originalEvent !== undefined){
					var seekValue = ui.value / 1000;
					canSeek = (player.getState() != "ready" && player.canSeekTo(seekValue));

					if (canSeek){
						player.seek(seekValue);
					}
				}

				canChangeProgressSliderValue = true;
				return canSeek;
			}

			function isHlsStreamAvailable() {
				return true; //TODO: look at first playback option (test for m3u8?)
			}

			function isSubtitlesAvailable() {
				return _.size(scope.subtitles);
			}

			function getSubtitleFlashVars () {
				//ref: http://git.vbrick.com/VBrick/Avenger/tree/dev/FlashPlayer/Subtitles-denivip
				return {
					plugin_subs: '/shared/swf/SubtitlesPlugin.swf',
					subs_namespace: 'org.denivip.osmf.subtitles',
					subs_src: encodeURIComponent(JSON.stringify({
						subtitles: scope.subtitles.map(toFlashSubtitle)
					}))
				};

				function toFlashSubtitle (vbPlayerSubtitle) {
					return {
						src: vbPlayerSubtitle.src,
						label: MediaLanguageTranslations[vbPlayerSubtitle.languageCode],
						language: vbPlayerSubtitle.languageCode
					};
				}
			}

			function isCaptionsAvailable() {
				return false; //TODO: implement logic once we have this data
			}

			function isHlsPlayback() {
				return !!player.getSrc().match(/.m3u8$/); //video src ends with .m3u8;
			}
		}
	};
}]);;

'use strict';

angular.module('VBrick.VideoPlayer')
.directive('vbPlayerMac', ['$timeout', '$interval', function($timeout, $interval){

	return {
		controller: 'VideoPlayerController',
		restrict: 'A',
		scope: {
			videoUrl: '@vbPlayerMac',
			thumbnailUri: '=',
			playbackPositionUpdated: '&',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			canShowThumbnail: '&showThumbnail',
			playbackOptions: '='
		},
		templateUrl: '/shared/partials/media-player/vbrick-mac-player.html',

		link: function(scope, $el, $attr){
			$el.addClass("vb-player");

			var player, currentPositionInterval;

			scope.playerName = 'VbrickMacPlayer';
			scope.pluginName = 'Cardinal Peak Nutcracker';
			scope.controls.playerContainerEl = $("div.player-placeholder", $el);
			scope.controls.volumeCtrl = $('div.progress-indicator-volume', $el);
			scope.controls.progressCtrl = $('div.progress-indicator', $el);
			scope.controls.isClosedCaptionOn = false;
			scope.controls.removeCurrentPlayer = removeCurrentPlayer;
			scope.controls.appendVideoPlayerEl = appendVideoPlayerEl;
			scope.controls.onVolumeSliderStop = onVolumeSliderStop;
			scope.controls.onProgressSliderStop = onProgressSliderStop;
			scope.controls.onProgressSliderStart = onProgressSliderStart;
			scope.stream.autoPlay = angular.isDefined($attr.autoPlay);
			scope.stream.isLive = angular.isDefined($attr.live) && $attr.live === 'true';

			scope.controls.createProgressControlSlider();
			scope.controls.createVolumeControlSlider();

			_.extend(scope, {
				play: function(){
					if(player){
						if(!scope.stream.isLoaded){
							player.Open(scope.videoUrl, 0);
							scope.stream.isLoaded = true;
						}
						else{
							player.Play();
						}

						scope.onPlay();
					}
				},
				pause: function(){
					if(player){
						player.Pause();
						scope.onPause({timestamp: scope.stream.currentTime});
					}
				},
				stop: function(){
					if(player){
						player.Stop();
						scope.onStop();
					}
				},
				setMute: function(){
					if(player){
						scope.controls.isMuted = player.Mute = !player.Mute;
					}
				},
				toggleClosedCaption: function(){
					if(player && scope.stream.state === 'playing'){
						scope.controls.isClosedCaptionOn = !scope.controls.isClosedCaptionOn;
						player.ClosedCaption = scope.controls.isClosedCaptionOn;
					}
				},
				onPlaybackOptionChange: function(playbackOption) {
					var isPlaying = scope.stream.state === 'playing';
					var isNotLive = !scope.stream.isLive;

					//capture playback position
					var playbackPosition = player.GetStreamTime();

					if (isPlaying) {
						cancelCurrentPositionInterval();
						player.Stop();
					}

					//apply playback url to the player
					player.Open(playbackOption.url, 0);

					if (isNotLive && playbackPosition) {
						player.Pause();
						player.Play(playbackPosition);
					}

					if (!isPlaying) {
						player.Pause();
					}
				}
			});

			function onPlaying(){
				scope.stream.state = 'playing';
				createCurrentPositionInterval();
			}

			function onPaused(){
				scope.stream.state = 'paused';
				cancelCurrentPositionInterval();
			}

			function onStopped(){
				scope.stream.state = 'stopped';
				if(scope.stream.currentTime === scope.stream.duration){
					scope.onComplete({duration: scope.stream.duration});
					scope.controls.toggleFullScreen(true);
				}
				scope.stream.currentTime = 0;
				cancelCurrentPositionInterval();
				scope.controls.progressCtrl.slider('value', 0);
			}

			function onPlayStateChange(state){
				switch(state.toString()){
				case '2':
					onPlaying();
					break;
				case '3':
					onPaused();
					break;
				case '4':
					onStopped();
					break;
				case '7': // Failed to load the video
					onStopped();
					break;
				default:
					break;
				}
			}

			function updateCurrentTime(){
				var timeMs = player.GetStreamTime() * 1000;

				scope.stream.currentTime = timeMs;
				scope.controls.progressCtrl.slider('value', timeMs);
				scope.playbackPositionUpdated({time: timeMs});
			}

			function appendVideoPlayerEl(url){
				scope.stream.isLoaded = false;

				var placeholder = $('<embed controls="none" width="100%" height="100%" type="video/x-vbrick"></embed>').attr('id', scope.id).appendTo(scope.controls.playerContainerEl);

				player = document.getElementById(scope.id);

				window.StatusChanged = onPlayStateChange;
				player.ClosedCaption = false;

				if(scope.stream.autoPlay){
					player.Open(url, 0);
					scope.stream.isLoaded = true;
					scope.onPlay();
				}
			}

			function removeCurrentPlayer(){
				scope.onDestroy();

				if(player){
					if(scope.stream.state === 'playing'){
						player.Stop();
					}
					player = null;
				}
				scope.controls.playerContainerEl.empty();
				cancelCurrentPositionInterval();
			}

			function createCurrentPositionInterval(){
				if(!scope.stream.isLive && !currentPositionInterval){
					currentPositionInterval = $interval(function(){
						if(!scope.stream.isLive){
							scope.stream.duration = player.GetDuration() * 1000;
						}
						updateCurrentTime();
					}, 500);
				}
			}

			function cancelCurrentPositionInterval(){
				if(currentPositionInterval){
					$interval.cancel(currentPositionInterval);
					currentPositionInterval = undefined;
				}
			}

			function onVolumeSliderStop(event, ui){
				player.SetVolume(ui.value / 100);
				scope.$apply(function() {
					scope.controls.isMuted = (ui.value == 0);
				});
			}

			function onProgressSliderStart(event, ui){
				cancelCurrentPositionInterval();
			}

			function onProgressSliderStop(event, ui){
				if (player){
					player.Pause();
					player.Play(ui.value / 1000);
					createCurrentPositionInterval();
				}
			}
		}
	};
}]);
;

'use strict';

angular.module('VBrick.VideoPlayer')
.directive('vbPlayerNative', ['$timeout', '$log', '$rootScope', '$window', function($timeout, $log, $rootScope, $window){
	return {
		controller: 'VideoPlayerController',
		restrict: 'A',
		scope: {
			videoUrl: '@vbPlayerNative',
			playbackPositionUpdated: '&',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			playbackOptions: '='
		},
		templateUrl: '/shared/partials/media-player/vbrick-native-player.html',

		link: function(scope, $el, $attr){
			$el.addClass("vb-player");

			var player;
			var iPhone = navigator.userAgent.match(/iPhone/i);

			scope.playerName = 'VbrickNativePlayer';
			scope.hasPlugin = true;
			scope.controls.playerContainerEl = $("div.player-placeholder", $el);
			scope.controls.volumeCtrl = $('div.progress-indicator-volume', $el);
			scope.controls.progressCtrl = $('div.progress-indicator', $el);
			scope.controls.isClosedCaptionOn = false;
			scope.controls.removeCurrentPlayer = removeCurrentPlayer;
			scope.controls.appendVideoPlayerEl = appendVideoPlayerEl;
			scope.controls.onVolumeSliderStop = onVolumeSliderStop;
			scope.controls.onProgressSliderStop = onProgressSliderStop;
			scope.showControls = scope.browser.safari;
			scope.stream.autoPlay = angular.isDefined($attr.autoPlay);
			scope.stream.isLive = angular.isDefined($attr.live) && $attr.live === 'true';

			scope.controls.createProgressControlSlider();
			scope.controls.createVolumeControlSlider();

			_.extend(scope, {
				play: function(){
					if(player){
						player.play();
						scope.onPlay();
					}
				},
				pause: function(){
					if(player){
						player.pause();
						scope.onPause({timestamp: scope.stream.currentTime});
					}
				},
				stop: function(){
					if(player){
						player.pause();
						scope.onStop();
					}
				},
				setMute: function(){
					if(player){
						player.muted = scope.controls.isMuted = !scope.controls.isMuted;
					}
				},
				fullscreen: function(){
					if(player){
						if(player.requestFullscreen){
							player.requestFullscreen();
						} else if(player.mozRequestFullScreen){
							player.mozRequestFullScreen(); // Firefox
						} else if (player.webkitRequestFullscreen) {
							player.webkitRequestFullscreen(); // Chrome and Safari (new)
						} else if (player.webkitEnterFullscreen) {
							player.webkitEnterFullscreen(); // Safari
						}
					}
				},
				onPlaybackOptionChange: function(playbackOption) {
					var isPlaying = scope.stream.state === 'playing';
					var isNotLive = !scope.stream.isLive;

					//capture playback position
					var playbackPosition = player.currentTime;

					if (isPlaying) {
						player.pause();
					}

					//apply playback url to the player
					player.src = playbackOption.url;

					if (isPlaying) {
						if (isNotLive) {
							$(player).one('loadeddata', function(){
								player.currentTime = playbackPosition;
							});
						}
						player.play();
					} else if (playbackPosition && isNotLive) { //paused
						$(player).one('loadeddata', function(){
							player.currentTime = playbackPosition;
							player.pause();
						});
						player.play();
					}
				}
			});

			function appendVideoPlayerEl(url){
				var placeholder = $(getVideoTag(url)).appendTo(scope.controls.playerContainerEl);

				player = document.getElementById(scope.id);
				// enable thumbnails on iOS
				angular.element(player).attr('poster', scope.$parent.thumbnailUri);

				attachEvents();
			}

			function getVideoTag(url){
				return [
					'<video id="',
					scope.id,
					'" width="100%" height="100%"',
					scope.stream.autoPlay ? ' autoplay' : '',
					'>',
					'<source src="',
					url,
					'"></video>'
				].join('');
			}

			function removeCurrentPlayer(){
				scope.onDestroy();

				if(player){
					player.pause();
					removeEventListeners();
					player = null;
				}
				scope.controls.playerContainerEl.empty();
			}

			function onPlaying(){
				scope.safeApply(function(){
					// need to check for state to be playing because it can buffer and raises this playing event
					if(iPhone && scope.stream.state !== 'playing'){
						scope.onPlay();
					}

					scope.stream.state = 'playing';
				});
			}

			function onPause(){
				scope.safeApply(function(){
					scope.stream.state = 'paused';

					if(iPhone){
						scope.onPause({timestamp: scope.stream.currentTime});
					}
				});
			}

			function onEnded(){
				scope.safeApply(function(){
					scope.onComplete({duration: scope.stream.duration});
					scope.stream.state = 'stopped';
					scope.stream.currentTime = 0;
					scope.controls.progressCtrl.slider('value', 0);
				});
			}

			function onDurationChange(){
				scope.safeApply(function(){
					var value = player.duration;

					scope.stream.isLive = (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY || value === 0);

					if(!scope.stream.isLive){
						scope.stream.duration = value * 1000;
					}
				});
			}

			function onTimeUpdate(){
				scope.safeApply(function(){
					if(!scope.stream.isLive){
						scope.stream.currentTime = player.currentTime * 1000;
						scope.controls.progressCtrl.slider('value', scope.stream.currentTime);
						scope.playbackPositionUpdated({time: scope.stream.currentTime});
					}
				});
			}

			function onVolumeChange(){
				scope.safeApply(function(){
					scope.controls.volumeCtrl.slider('value', player.volume * 100);
				});
			}

			function attachEvents(){
				player.addEventListener('ended', onEnded, false);
				player.addEventListener('playing', onPlaying, false);
				player.addEventListener('durationchange', onDurationChange, false);
				player.addEventListener('timeupdate', onTimeUpdate, false);
				player.addEventListener('play', onPlaying, false);
				player.addEventListener('pause', onPause, false);
				player.addEventListener('volumechange', onVolumeChange, false);
			}

			function removeEventListeners() {
				player.removeEventListener('ended', onEnded);
				player.removeEventListener('playing', onPlaying);
				player.removeEventListener('durationchange', onDurationChange);
				player.removeEventListener('timeupdate', onTimeUpdate);
				player.removeEventListener('play', onPlaying);
				player.removeEventListener('pause', onPause);
				player.removeEventListener('volumechange', onVolumeChange);
			}

			function onVolumeSliderStop(event, ui){
				player.volume = ui.value / 100;
			}

			function onProgressSliderStop(event, ui){
				if (player){
					player.currentTime = ui.value / 1000;
				}
			}
		}
	};
}]);
;

'use strict';

angular.module('VBrick.VideoPlayer')
.directive('vbPlayerQuicktime', ['$timeout', '$log', '$interval', function($timeout, $log, $interval){

	return {
		controller: 'VideoPlayerController',
		restrict: 'A',
		scope: {
			videoUrl: '@vbPlayerQuicktime',
			thumbnailUri: '=',
			playbackPositionUpdated: '&',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			canShowThumbnail: '&showThumbnail',
			playbackOptions: '='
		},
		templateUrl: '/shared/partials/media-player/vbrick-quicktime-player.html',

		link: function(scope, $el, $attr){
			$el.addClass("vb-player");

			var player, currentPositionInterval;

			scope.playerName = 'VbrickQuicktimePlayer';
			scope.controls.playerContainerEl = $("div.player-placeholder", $el);
			scope.controls.volumeCtrl = $('div.progress-indicator-volume', $el);
			scope.controls.progressCtrl = $('div.progress-indicator', $el);
			scope.controls.isClosedCaptionOn = false;
			scope.controls.removeCurrentPlayer = removeCurrentPlayer;
			scope.controls.appendVideoPlayerEl = appendVideoPlayerEl;
			scope.controls.onVolumeSliderStop = onVolumeSliderStop;
			scope.controls.onProgressSliderStop = onProgressSliderStop;
			scope.controls.onProgressSliderStart = onProgressSliderStart;
			scope.controls.isFullScreenDisabled = navigator.platform.lastIndexOf('Win', 0) === 0; //disable for Windows users
			scope.stream.autoPlay = angular.isDefined($attr.autoPlay);
			scope.stream.isLive = angular.isDefined($attr.live) && $attr.live === 'true';

			scope.controls.createProgressControlSlider();
			scope.controls.createVolumeControlSlider();

			_.extend(scope, {
				play: function(){
					if(player){
						player.Play();
						scope.onPlay();
						createCurrentPositionInterval();
					}
				},
				pause: function(){
					if(player){
						player.Stop();
						destroyCurrentPositionInterval();
						scope.onPause({timestamp: scope.stream.currentTime});
						scope.stream.state = 'paused';
					}
				},
				stop: function(){
					if(player){
						player.Stop();
						player.Rewind();
						destroyCurrentPositionInterval();
						scope.onStop();
						scope.stream.state = 'stopped';
					}
				},
				setMute: function(){
					if(player){
						scope.controls.isMuted = !scope.controls.isMuted;
						player.SetMute(scope.controls.isMuted);
					}
				},

				onPlaybackOptionChange: function(playbackOption) {
					resetRetryNumbers();

					var isPlaying = scope.stream.state === 'playing';
					var isNotLive = !scope.stream.isLive;

					//capture playback position
					var playbackPosition = getCurrentTime();

					if (isPlaying) {
						destroyCurrentPositionInterval();
						player.Stop();
					}

					if (scope.browser.safari) {
						//AV-9513 - the QT player does not scale properly on MAC.  So recreate player here to switch a new URL.
						scope.controls.playerContainerEl.empty();
						var placeholder = $(getObjectTag(playbackOption.url, scope.stream.autoPlay)).appendTo(scope.controls.playerContainerEl);

						player = document.getElementById(scope.id);

						if(scope.stream.autoPlay){
							createCurrentPositionInterval();
						}
					}
					else {
						//apply playback url to the player
						player.SetURL(playbackOption.url);
					}

					$log.log("set url ", playbackOption.url);

					if (isPlaying) {
						$timeout(function(){playAndSeekWithRetry(playbackPosition, isNotLive);}, 500);
					} else if (playbackPosition && isNotLive) { //paused
						$timeout(function() {stopAndSeekWithRetry(playbackPosition);}, 500);
					}
				}
			});

			detectQuicktimePlugin();

			function resetRetryNumbers() {
				numPlayRetries = 0;
				numPlayAndSeekRetry = 0;
				numStopAndSeekRetry = 0;
			}

			var maxNumberPlayRetries = 30;
			var numPlayRetries = 0;
			function playWithRetry() {
				try {
					player.Play();	// this call might fail because it takes time to SetTime.
				}
				catch(ex) {
					numPlayRetries++;

					if ( numPlayRetries < maxNumberPlayRetries) {
						$log.log("play retry #", numPlayRetries);
						$timeout(playWithRetry, 1000);
					}
				}
			}

			var maxNumberPlayAndSeekRetries = 30;
			var numPlayAndSeekRetry = 0;
			function playAndSeekWithRetry(playbackPosition, isNotLive) {
				try {
					player.Play();
				}
				catch (ex) {
					// the player is not ready, wait and retry
					numPlayAndSeekRetry++;

					if ( numPlayAndSeekRetry < maxNumberPlayAndSeekRetries ){
						$log.log("play and seek retry #", numPlayAndSeekRetry);
						$timeout(function(){playAndSeekWithRetry(playbackPosition, isNotLive);}, 500);
					}
					return;
				}

				// The player is ready now.
				createCurrentPositionInterval();

				if (isNotLive) {
					player.Stop();
					seekTo(playbackPosition);
					$log.log("playAndSeekWithRetry set time ", playbackPosition);

					playWithRetry();
				}
			}

			var maxNumberStopAndSeekRetries = 20;
			var numStopAndSeekRetry = 0;
			function stopAndSeekWithRetry(playbackPosition) {
				try {
					player.Stop();
				}
				catch (ex) {
					// The player is not ready.  Wait and retry
					numStopAndSeekRetry++;

					if ( numStopAndSeekRetry < maxNumberStopAndSeekRetries ) {
						$log.log("stop and seek retry #", numStopAndSeekRetry);
						$timeout(function() {stopAndSeekWithRetry(playbackPosition);}, 500);
					}
					return;
				}

				// The player is ready at this point.
				seekTo(playbackPosition);
				$log.log("stopAndSeekWithRetry set time ", playbackPosition);
			}

			function detectQuicktimePlugin(){
				if(scope.browser.msie){
					scope.hasPlugin = true; //for IE, we refer to cab file
				}
				else{
					scope.pluginName = 'QuickTime';
				}
			}

			function onPlaying(){

				if(scope.stream.state !== 'playing'){
					scope.stream.state = 'playing';

					var value = getDuration();

					if(scope.stream.duration !== value){
						scope.stream.duration = value;
					}
				}
			}

			function onStopped(){
				scope.stream.currentTime = 0;
				scope.controls.progressCtrl.slider('value', 0);
				scope.stream.state = 'stopped';
			}

			function onPaused(){
				scope.stream.state = 'paused';
			}

			function onMediaComplete(){
				destroyCurrentPositionInterval();
				onStopped();
				scope.onComplete({duration: scope.stream.duration});
				scope.controls.toggleFullScreen(true);
			}

			function appendVideoPlayerEl(url){
				var placeholder = $(getObjectTag(url, scope.stream.autoPlay)).appendTo(scope.controls.playerContainerEl);

				player = document.getElementById(scope.id);

				// Need this for firefox, if not rtsp wont play
				if(scope.browser.firefox){
					player.SetURL(url);
				}

				if(scope.stream.autoPlay){
					createCurrentPositionInterval();
					scope.onPlay();
				}
			}

			function removeCurrentPlayer(){
				scope.onDestroy();
				destroyCurrentPositionInterval();

				if(player){
					if(scope.stream.state === 'playing'){
						player.Stop();
					}
					player = null;
				}
				scope.controls.playerContainerEl.empty();
			}

			function getObjectTag(url, autoPlay){
				if(scope.browser.msie){
					return [
						'<object id="',
						scope.id,
						'" classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" height="100%" width="100%">',
						'<param name="',
						url.indexOf("rtsp://") === 0 ? 'QTSRC' : 'SRC',
						'" value="',
						url,
						'">',
						'<param name="AutoPlay" value="',
						autoPlay,
						'">',
						'<param name="Controller" value="false">',
						'<param name="showlogo" value="false">',
						'<param name="Scale" value="ASPECT">',
						'<PARAM name="TARGET" VALUE="quicktimeplayer">',
						'<param name="wmode" value="transparent">',
						'<PARAM name="HREF" VALUE="javascript:function(){}"></object>'
					].join('');
				}
				else if(scope.browser.safari){
					return [
						'<object id="',
						scope.id,
						'" height="100%" width="100%" type="video/quicktime" data="',
						url,
						'"><param name="',
						url.indexOf("rtsp://") === 0 ? 'QTSRC' : 'QTSRC',
						'" value="',
						url,
						'">',
						'<param name="AutoPlay" value="',
						autoPlay,
						'">',
						'<param name="Controller" value="false">',
						'<PARAM name="TARGET" VALUE="quicktimeplayer">',
						'<param name="showlogo" value="false">',
						'<param name="Scale" value="ASPECT"></object>'
					].join('');
				}
				else{
					return [
						'<embed id="',
						scope.id,
						'" ',
						url.indexOf("rtsp://") === 0 ? 'QTSRC' : 'QTSRC',
						'="',
						url,
						'" height="100%" width="100%" type="video/quicktime" src="" SAVEEMBEDTAGS="true" target="QuickTimePlayer" autoplay="',
						autoPlay,
						'" controller="false" wmode="transparent" scale="ASPECT" showlogo="false" wmode="transparent" enablejavascript="true"></embed>'
					].join('');
				}
			}

			function seekTo(value){
				if(player){
					player.SetTime((value * player.GetTimeScale()) / 1000);
				}
			}

			function getDuration() {
				return (player.GetDuration() / player.GetTimeScale()) * 1000;
			}

			function getCurrentTime(){
				try {
					return (player.GetTime() / player.GetTimeScale()) * 1000;
				} catch (ex) {
					return 0;
				}
			}

			function checkState(){
				if(player){
					//player.GetEndTime() wont work on safari in some cases, so safe to check GetDuration()
					if (player.GetTime() === player.GetDuration()) {
						onMediaComplete();
						return;
					}

					switch(player.GetRate()){
					case 0:
						onPaused();
						break;
					case 1:
						onPlaying();
						break;
					}
				}
			}

			function createCurrentPositionInterval(){
				if(!currentPositionInterval){
					currentPositionInterval = $interval(function(){
						if(!scope.stream.isLive){
							scope.controls.progressCtrl.slider('value', scope.stream.currentTime = getCurrentTime());
							scope.playbackPositionUpdated({time: scope.stream.currentTime});
						}
						checkState();
					}, 500);
				}
			}

			function destroyCurrentPositionInterval(){
				if(currentPositionInterval){
					$interval.cancel(currentPositionInterval);
					currentPositionInterval = undefined;
				}
			}

			function onVolumeSliderStop(event, ui){
				player.SetVolume(ui.value);
				scope.controls.isMuted = (ui.value === 0);
			}

			function onProgressSliderStart(event, ui){
				destroyCurrentPositionInterval();
			}

			function onProgressSliderStop(event, ui){
				if (player){
					player.Stop();
					seekTo(ui.value);
					player.Play();
					createCurrentPositionInterval();
				}
			}
		}
	};
}]);
;

'use strict';

angular.module('VBrick.VideoPlayer')
.directive('vbPlayerVlc', ['$window', '$timeout', function($window, $timeout){

	return {
		controller: 'VideoPlayerController',
		restrict: 'A',
		scope: {
			videoUrl: '@vbPlayerVlc',
			thumbnailUri: '=',
			playbackPositionUpdated: '&',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			canShowThumbnail: '&showThumbnail',
			playbackOptions: '='
		},
		templateUrl: '/shared/partials/media-player/vbrick-pc-player.html',

		link: function(scope, $el, $attr){
			$el.addClass("vb-player");

			var player;
			var canChangeCurrentTime = true;
			var windowResizeWhilePaused = false;

			scope.playerName = 'VbrickVlcPlayer';
			scope.pluginName = 'vlc';
			scope.controls.playerContainerEl = $("div.player-placeholder", $el);
			scope.controls.volumeCtrl = $('div.progress-indicator-volume', $el);
			scope.controls.progressCtrl = $('div.progress-indicator', $el);
			scope.controls.isClosedCaptionOn = false;
			scope.controls.removeCurrentPlayer = removeCurrentPlayer;
			scope.controls.appendVideoPlayerEl = appendVideoPlayerEl;
			scope.controls.onVolumeSliderStop = onVolumeSliderStop;
			scope.controls.onProgressSliderStart = onProgressSliderStart;
			scope.controls.onProgressSliderStop = onProgressSliderStop;
			scope.stream.autoPlay = angular.isDefined($attr.autoPlay);
			scope.stream.isLive = angular.isDefined($attr.live) && $attr.live === 'true';
			scope.stream.duration = $attr.duration;

			scope.controls.createProgressControlSlider();
			scope.controls.createVolumeControlSlider();

			_.extend(scope, {
				play: function(){
					if(player){
						if (windowResizeWhilePaused) { //window was resized, so apply workaround so that the video out will scale appropriately
							windowResizeWhilePaused = false;
							restartPlaybackAtCurrentPosition();
						} else {
							player.playlist.play();
						}

						scope.onPlay();
					}
				},
				pause: function(){
					if(player){
						player.playlist.pause();
						scope.onPause({timestamp: scope.stream.currentTime});
					}
				},
				stop: function(){
					if(player){
						player.playlist.stop();
						scope.onStop();
						scope.stream.state = 'stopped';
					}
				},
				setMute: function(){
					if(player){
						player.audio.toggleMute();
						scope.controls.isMuted = player.audio.mute;
					}
				},
				toggleClosedCaption: function(){
					if(player && scope.stream.state === 'playing'){
						scope.controls.isClosedCaptionOn = !scope.controls.isClosedCaptionOn;

						if(scope.controls.isClosedCaptionOn){
							player.subtitle.track = 2;
						}
						else{
							player.subtitle.track = -1;
						}
					}
				},

				onPlaybackOptionChange: function(playbackOption) {
					var isPlaying = player.playlist.isPlaying;
					var isNotLive = !scope.stream.isLive;

					//capture playback position
					var playbackPosition = player.input.time;

					if (isPlaying) {
						//stop
						player.playlist.stop();
					}

					//apply playback url to the player
					player.playlist.items.clear();
					player.playlist.add(playbackOption.url);

					var self = this;
					$timeout(function(){
						if (isPlaying) {
							self.play();

							//start playback of new option at the last position (if not live and was playing)
							if (isNotLive) {
								player.input.time = playbackPosition;
							}
						} else if (playbackPosition && isNotLive) {
							self.play();
							player.input.time = playbackPosition;
							restorePositionAndPause = true;
						}
					}, 100);
				}
			});

			var restorePositionAndPause = null;

			function onStopped(){
				scope.safeApply(function(){
					scope.stream.state = 'stopped';

					if(!scope.stream.isLive){
						scope.stream.currentTime = 0;
						scope.controls.progressCtrl.slider('value', 0);
					}
				});
			}

			function onPaused(){
				scope.safeApply(function(){
					scope.stream.state = 'paused';
				});
			}

			function onPlaying(){
				scope.safeApply(function(){
					// VLC with wmv files when paused and played, going back to start point. So, this weird trick
					if(player.input.time === 0 && scope.stream.currentTime > 0 && endsWith(scope.videoUrl, '.wmv')){
						player.input.time = scope.stream.currentTime;
					}
					scope.stream.state = 'playing';

					if (restorePositionAndPause) {
						scope.pause();
						restorePositionAndPause = false;
					}
				});
			}

			function onMediaComplete(){
				onStopped();

				scope.safeApply(function(){
					scope.onComplete({duration: scope.stream.duration});
					scope.controls.toggleFullScreen(true);

					//workaround for getting video output when you hit play again in the event that the window/video was resized
					unregisterPlayerEvents();
					player.playlist.stop();
					registerPlayerEvents();
				});
			}

			function onDurationChanged(){
				if(!scope.stream.isLive){
					// Need to do this weird logic because vlc for wmv streams, not getting the duration
					// correctly. So, need to rely on the duration that is passed in attribute
					if(($attr.duration || $attr.duration === 0) && player.input.length > 0){
						scope.safeApply(function(){
							scope.stream.duration = player.input.length;
						});
					}
				}
			}

			function onPositionChanged(){
				if(!scope.stream.isLive && canChangeCurrentTime){
					var timeMs = player.input.time;

					scope.safeApply(function(){
						scope.stream.currentTime = timeMs;
						scope.controls.progressCtrl.slider('value', timeMs);
						scope.playbackPositionUpdated({time: timeMs});
					});
				}
			}

			function registerVLCEvent(event, handler) {
				if (player) {
					if (player.attachEvent) {
						// Microsoft
						player.attachEvent(event, handler);
					}
					else if (player.addEventListener) {
						// Mozilla: DOM level 2
						player.addEventListener(event, handler, false);
					}
					else {
						// DOM level 0
						player["on" + event] = handler;
					}
				}
			}

			function unregisterVLCEvent(event, handler) {
				if (player) {
					if (player.detachEvent) {
						// Microsoft
						player.detachEvent(event, handler);
					} else if (player.removeEventListener) {
						// Mozilla: DOM level 2
						player.removeEventListener(event, handler, false);
					} else {
						// DOM level 0
						player["on" + event] = null;
					}
				}
			}

			function appendVideoPlayerEl(url){
				$timeout(function() { //$timeout = workaround for VLC player events not being reliably reestablished (ex: while playing a video navigate to another video and play)
					$(getObjectTag(url, scope.stream.autoPlay)).appendTo(scope.controls.playerContainerEl);

					player = document.getElementById(scope.id);

					registerPlayerEvents();

					if(scope.stream.autoPlay){
						scope.onPlay();
						scope.stream.state = 'playing';
					}

					registerWindowResizeEvent();
				});
			}

			var onWindowResize;
			function registerWindowResizeEvent() {
				onWindowResize = _.debounce(onWindowResizeEnd, 500);
				$($window).resize(onWindowResize);
			}

			function unregisterWindowResizeEvent() {
				$($window).off('resize', onWindowResize);
			}

			function registerPlayerEvents() {
				registerVLCEvent('MediaPlayerPlaying', onPlaying);
				registerVLCEvent('MediaPlayerPaused', onPaused);
				registerVLCEvent('MediaPlayerEndReached', onMediaComplete);
				registerVLCEvent('MediaPlayerTimeChanged', onDurationChanged);
				registerVLCEvent('MediaPlayerPositionChanged', onPositionChanged);
			}

			function unregisterPlayerEvents() {
				unregisterVLCEvent('MediaPlayerPlaying', onPlaying);
				unregisterVLCEvent('MediaPlayerPaused', onPaused);
				unregisterVLCEvent('MediaPlayerEndReached', onMediaComplete);
				unregisterVLCEvent('MediaPlayerTimeChanged', onDurationChanged);
				unregisterVLCEvent('MediaPlayerPositionChanged', onPositionChanged);
			}

			function removeCurrentPlayer(){
				scope.onDestroy();

				if(player){
					if(scope.stream.state === 'playing' || scope.stream.state === 'paused'){
						player.playlist && player.playlist.stop();
					}

					unregisterPlayerEvents();

					if(player.playlist && player.playlist.items && player.playlist.items.count > 0){
						player.playlist.items.clear();
					}

					player = null;
				}
				scope.controls.playerContainerEl.empty();

				unregisterWindowResizeEvent();
			}

			function onVolumeSliderStop(event, ui){
				player.audio.volume = ui.value * 2; // vlc player takes volume in the range [0-200]

				scope.controls.isMuted = player.audio.mute = (ui.value == 0);
			}

			function onProgressSliderStart(event, ui){
				if (player && !scope.stream.isLive){
					canChangeCurrentTime = false;
				}
			}

			function onProgressSliderStop(event, ui){
				if (player && !scope.stream.isLive){
					player.input.time = ui.value;
					canChangeCurrentTime = true;
				}
			}

			function getObjectTag(url, autoStart){
				return [
					'<embed id="',
					scope.id,
					'" name="',
					scope.id,
					'" width="100%" height="100%" type="application/x-vlc-plugin" target="',
					url,
					'" autostart="',
					autoStart,
					'" windowless="true" allowfullscreen="false" controls="false" branding="false" />',
				].join('');
			}

			function endsWith(url, extension){
				return url.indexOf(extension, url.length - extension.length) !== -1;
			}

			/**
			 * If the video is presently playing, go ahead and apply the resize workaround.
			 * If the video is paused, set a flag so that the workaround is applied when the video is played.
			 */
			function onWindowResizeEnd() {
				if (player.playlist.isPlaying) { //rejection of duplicate resize events
					restartPlaybackAtCurrentPosition();
				} else if (player.input.state === 4) { //paused
					windowResizeWhilePaused = true;
				}
			}

			/**
			 * Workaround for the VLC plugin not updating the video size when the window is resized.
			 * If the video is playing, we stop and play to force a resize of the video output.
			 * The playback position is restored on play, except in the case of live streams as it does not apply.
			 */
			function restartPlaybackAtCurrentPosition() {
				//unregister event listeners so that actions here aren't captured by analytics
				unregisterWindowResizeEvent();
				unregisterPlayerEvents();

				var playerTime = player.input.time;

				//stop and restart playback
				player.playlist.stop();
				player.playlist.play();

				//restore the playback position (except for live streams)
				if (!scope.stream.isLive) {
					player.input.time = playerTime;
				}

				//restore event listeners
				registerPlayerEvents();
				registerWindowResizeEvent();
			}
		}
	};
}]);
;

'use strict';

angular.module('VBrick.VideoPlayer')
.directive('vbPlayerWmv', ['$timeout', '$interval', 'Dialog', function($timeout, $interval, Dialog){

	return {
		restrict: 'A',
		scope: {
			videoUrl: '@vbPlayerWmv',
			thumbnailUri: '=',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			canShowThumbnail: '&showThumbnail'
		},
		templateUrl: '/shared/partials/media-player/vbrick-wmv-player.html',

		link: function(scope, $el, $attr){
			var autoPlay = angular.isDefined($attr.autoPlay);
			var isLive = angular.isDefined($attr.live) && $attr.live === 'true';

			$el.addClass("vb-player");

			_.extend(scope, {
				play: function(){
					Dialog.getDialog('VbrickPlayerWmvImpl').open({
						videoUrl: scope.videoUrl,
						autoPlay: autoPlay,
						isLive: isLive,
						onPlay: scope.onPlay,
						onStop: scope.onStop,
						onPause: scope.onPause,
						onComplete: scope.onComplete
					});
				}
			});
		}
	};
}]);
;

'use strict';

angular.module('VBrick.VideoPlayer')
.directive('vbPlayerWmvImpl', ['$timeout', '$interval', '$document', function($timeout, $interval, $document){

	return {
		controller: 'VideoPlayerController',
		restrict: 'A',
		scope: {
			videoUrl: '@vbPlayerWmvImpl',
			thumbnailUri: '=',
			playbackPositionUpdated: '&',
			onPlay:'&',
			onStop:'&',
			onPause:'&',
			onComplete:'&',
			canShowThumbnail: '&showThumbnail',
			playbackOptions: '='
		},
		templateUrl: '/shared/partials/media-player/vbrick-pc-player-modal.html',

		link: function(scope, $el, $attr){
			$el.addClass("vb-player vb-player-ie");

			scope.noVideoOverlay = getIsNoVideoOverlay();
			if (scope.noVideoOverlay) {
				var $body = $document.find('body');

				$body.addClass('navbar-fixed-top-disabled');
				$el.addClass('vb-player-no-video-overlay');

				scope.$on('$destroy', function() { //clean up
					$body.removeClass('navbar-fixed-top-disabled');
				});
			}

			var player, currentPositionInterval;
			var playState = -1;
			var discardPlayerEvent = false;
			var restorePlaybackPosition;
			var pauseAfterRestore = false;

			scope.playerName = 'VbrickWmvPlayer';
			scope.hasPlugin = true; // The plugin is loaded as a cab file
			scope.controls.playerContainerEl = $("div.player-placeholder", $el);
			scope.controls.volumeCtrl = $('div.progress-indicator-volume', $el);
			scope.controls.progressCtrl = $('div.progress-indicator', $el);
			scope.controls.isClosedCaptionOn = false;
			scope.controls.removeCurrentPlayer = removeCurrentPlayer;
			scope.controls.appendVideoPlayerEl = appendVideoPlayerEl;
			scope.controls.onVolumeSliderStop = onVolumeSliderStop;
			scope.controls.onProgressSliderStop = onProgressSliderStop;
			scope.controls.onProgressSliderStart = onProgressSliderStart;
			scope.stream.autoPlay = angular.isDefined($attr.autoPlay);
			scope.stream.isLive = angular.isDefined($attr.live) && $attr.live === 'true';

			scope.controls.createProgressControlSlider();
			scope.controls.createVolumeControlSlider();

			_.extend(scope, {
				play: function(){
					if(player){
						player.controls.play();
						createCurrentPositionInterval();
					}
				},
				pause: function(){
					if(player){
						player.controls.pause();
						scope.onPause({timestamp: scope.stream.currentTime});
					}
				},
				stop: function(){
					if(player && (player.playState != 0)){
						player.controls.stop();
						scope.onStop();
					}
				},
				setMute: function(){
					if(player){
						player.settings.mute = scope.controls.isMuted = !scope.controls.isMuted;
					}
				},
				toggleClosedCaption: function(){
					if(player && scope.stream.state === 'playing'){
						scope.controls.isClosedCaptionOn = !scope.controls.isClosedCaptionOn;

						var url = scope.videoUrl;

						if(scope.controls.isClosedCaptionOn){
							player.closedCaption.captioningID = 'ccdiv';
							url = url.replace('cc=off', 'cc=on_ovl');
						}
						else{
							player.closedCaption.captioningID = '';
							url = url.replace('cc=on_ovl', 'cc=off');
						}

						reloadPlayerOnCCChange(url);
					}
				},

				safeApply: function(fn) {
					var phase = this.$root.$$phase;
					if(phase == '$apply' || phase == '$digest') {
						if(fn && (typeof(fn) === 'function')) {
							fn();
						}
					} else {
						this.$apply(fn);
					}
				},

				startFullScreen: function() {
					var container = angular.element(document.getElementsByClassName("ie-modal-player"));
					scope.safeApply( function() {
						scope.fullScreen = true;

						// For presentation cases, inform parent elements the change.
						scope.$emit('fullScreenToggled', scope.fullScreen);

						container.addClass("ie-modal-player-fs");
						container.addClass("full-screen-video");
						container.removeClass("ie-modal-player");
					});

					angular.element(document.body).bind("keyup", escapeEvent);
					addEscListenerForFS();
				},
				stopFullScreen: function() {
					var container = angular.element(document.getElementsByClassName("ie-modal-player-fs"));
					if ( scope.fullScreen ){
						scope.safeApply( function() {
							scope.fullScreen = false;

							// For presentation cases, inform parent elements the change.
							scope.$emit('fullScreenToggled', scope.fullScreen);

							container.addClass("ie-modal-player");
							container.removeClass("ie-modal-player-fs");
							container.removeClass("full-screen-video");
						});

						angular.element(document.body).unbind("keyup", escapeEvent);
						removeEscListenerForFS();
					}
				},
				toggleFullScreen: function(exitOnly) {
					if ( scope.controls.canBrowserFullScreen(exitOnly) ){
						var paused = false;
						if ( !scope.controls.isBrowserFullScreen() ) {
							paused = pauseForFS();
							scope.safeApply(function(){
								scope.controls.toggleBrowserFullScreen();
							});
							if ( paused ){
								restartForFS();
							}
							$timeout(function(){
								addEscListenerForFS();
								fullScreenResize(true);
							}, 500);
						}
						else {
							paused = pauseForFS();
							scope.safeApply(function() {
								scope.controls.toggleBrowserFullScreen();
							});
							if ( paused ){
								restartForFS();
							}
							$timeout(function(){
								removeEscListenerForFS();
								fullScreenResize(false);
							}, 500);
						}
					}
					else {
						if (exitOnly || scope.fullScreen ){
							scope.stopFullScreen();
						}
						else {
							scope.startFullScreen();
						}
					}
				},
				onPlaybackOptionChange: function(playbackOption) {
					var isPlaying = scope.stream.state === 'playing';
					var isNotLive = !scope.stream.isLive;

					//capture playback position
					var playbackPosition = player.controls.currentPosition;

					if (isPlaying) {
						player.controls.stop();
					}

					//apply playback url to the player
					player.URL = playbackOption.url;

					if (isPlaying) {
						if (isNotLive) {
							restorePlaybackPosition = playbackPosition;
						}

						this.play();
					} else if (isNotLive && playbackPosition) { //paused vod
						//To restore the position as expected, have to trigger play.
						//The play handler will do the job of updating the position and immediately pausing.
						restorePlaybackPosition = playbackPosition;
						pauseAfterRestore = true;

						this.play();
					}
				},
				onPlaybackOptionMenuToggle: function(isOpen) {
					scope.isPlaybackOptionsMenuOpen = isOpen;
				}
			});

			function pauseForFS(){
				if(scope.stream.state === 'playing'){
					discardPlayerEvent = true;
					player.controls.pause();
					return true;
				}
				else {
					return false;
				}
			}

			function restartForFS(){
				player.controls.play();
				$timeout(function(){
					discardPlayerEvent = false;
				}, 50);
			}

			function fullScreenResize(isFullScreen) {
				var elem = document.getElementById('player-wrap');
				if ( isFullScreen ) {
					var winWidth = $(window).width();
					var winHeight = $(window).height();
					var offset = 40;

					var width = Math.round ((winHeight-offset) * 16 / 9);
					if ( width < winWidth ) {
						scope.safeApply(function(){
							elem.style.width = width + "px";
						});
					}
				}
				else {
					scope.safeApply(function(){
						elem.style.width = "100%";
					});
					scope.safeApply(function(){
						elem.style.width = "";
					});
				}
			}

			var escapeEvent = function (e) {
				if (e.which == 27){
					scope.safeApply(function(){
						scope.stopFullScreen();
					});
				}
			};

			var skipEscapeEvent = function (e) {
				if (e.which == 27){
					e.preventDefault();

					$timeout(function(){
						removeEscListenerForFS();
						fullScreenResize(false);
					}, 50);
				}
			};

			function addEscListenerForFS(){
				$(window).keydown(skipEscapeEvent);
			}

			function removeEscListenerForFS(){
				$(window).off('keydown', skipEscapeEvent);
			}

			function reloadPlayerOnCCChange(url){
				var currentPosition = 0;

				if(!scope.stream.isLive){
					currentPosition = player.controls.currentPosition;
				}

				destroyCurrentPositionInterval();

				player.controls.stop();

				player.URL = url;

				if(!scope.stream.isLive){
					player.controls.currentPosition = currentPosition;
				}
				player.controls.play();
			}

			function onStopped(){
				scope.stream.state = 'stopped';
				destroyCurrentPositionInterval();
				scope.stream.currentTime = 0;
				scope.controls.progressCtrl.slider('value', 0);
			}

			function onPaused(){
				scope.stream.state = 'paused';
				destroyCurrentPositionInterval();
			}

			function onPlaying(){
				if(scope.stream.state !== 'playing'){
					scope.onPlay();
					scope.stream.state = 'playing';

					var value = player.currentMedia.duration * 1000;
					scope.stream.duration = value;
				}

				if (restorePlaybackPosition) {
					player.controls.currentPosition = restorePlaybackPosition;
					restorePlaybackPosition = null;

					if (pauseAfterRestore) {
						scope.pause();
						pauseAfterRestore = false;
					}
				}
			}

			function onMediaComplete(){
				onStopped();

				scope.onComplete({duration: scope.stream.duration});
				scope.toggleFullScreen(true);
			}

			function onPlayStateChange(state){
				if (discardPlayerEvent) {
					return;
				}

				switch(state.toString()){
				case '1':
					onStopped();
					break;
				case '2':
					onPaused();
					break;
				case '3':
					onPlaying();
					break;
				case '8':
					onMediaComplete();
					break;
				default:
					break;
				}
			}

			function updateCurrentPosition(){
				if(!scope.stream.isLive){
					var timeMs = player.controls.currentPosition * 1000;
					scope.stream.currentTime = timeMs;
					scope.controls.progressCtrl.slider('value', timeMs);
					scope.playbackPositionUpdated({time: timeMs});
					// The Player is just not sending the stop event at the end of the stream and it looks like playing. Happens only for rtsp streams.
					if(scope.stream.state === 'playing' && player.currentMedia.duration !== 0) {
						if ( player.currentMedia.duration === player.controls.currentPosition){
							player.controls.stop();
						}

						if ( Math.abs(player.currentMedia.duration - player.controls.currentPosition) < 0.5){
							$timeout(function(){
								scope.toggleFullScreen(true);
							}, 1200);
						}
					}
				}
			}

			function appendVideoPlayerEl(url){
				$(getObjectTag(url, scope.stream.autoPlay)).appendTo(scope.controls.playerContainerEl);

				playState = -1;
				player = document.getElementById(scope.id);

				window.PlayStateChange = onPlayStateChange;

				window.StatusChange = function StatusChange(){}; // Need to define this even though not used.
				player.closedCaption.captioningID = '';
				player.settings.invokeURLs = false;
				player.stretchToFit = "1";

				if(scope.stream.autoPlay){
					scope.onPlay();
					createCurrentPositionInterval();
				}
			}

			function removeCurrentPlayer(){
				scope.onDestroy();
				destroyCurrentPositionInterval();

				if(player){
					if(scope.stream.state === 'playing' || scope.stream.state === 'paused'){
						player.controls.stop();
					}
					if (player.close) {
						player.close();
					}
					delete window.PlayStateChange;
					delete window.StatusChange;
					player.URL = '';
					player = null;
				}
				scope.controls.playerContainerEl.empty();
			}

			function createCurrentPositionInterval(){
				if(!currentPositionInterval){
					currentPositionInterval = $interval(function(){
						if(playState !== player.playState){
							playState = player.playState;
							onPlayStateChange(player.playState);
						}

						updateCurrentPosition();
					}, 500);
				}
			}

			function destroyCurrentPositionInterval(){
				if(currentPositionInterval){
					$interval.cancel(currentPositionInterval);
					currentPositionInterval = undefined;
				}
			}

			function onVolumeSliderStop(event, ui){
				player.settings.volume = ui.value;
				scope.$apply(function() {
					scope.controls.isMuted = player.settings.mute = (ui.value == 0);
				});
			}

			function onProgressSliderStart(){
				destroyCurrentPositionInterval();
			}

			function onProgressSliderStop(event, ui){
				if (player){
					player.controls.currentPosition = ui.value / 1000;
					createCurrentPositionInterval();
				}
			}

			function getObjectTag(url, autoStart){
				return [
					'<object id="',
					scope.id,
					'" classid="CLSID:6BF52A52-394A-11d3-B153-00C04F79FAA6" width="100%" height="100%" type="application/x-oleobject">',
					'<param name="Url" value="',
					url,
					'">',
					'<param name="AutoStart" value="',
					autoStart,
					'">',
					'<param name="uiMode" value="none">',
					'<param name="windowlessVideo" value="', !getIsNoVideoOverlay(),'">',
					'</object>',
					'<object codeBase="/shared/plugins/VBPlayerComponents.cab#version=6,3,6,0" height="0" width="0" classid="clsid:699E6BEC-7E58-4BA4-835C-DCB5B07BEE22" VIEWASTEXT></object>',
					'<div id="ccdiv"></div>'
				].join('');
			}

			/**
			 * If the playback options contain a url using a streaming protocol, then our Windows Media plugin will kick in.
			 * WMP12 covers most of our standard codecs through standard  play, but MS didn't bother to implement many of them to work with streaming protocols.
			 * The plugin does not abide by the WMP's windowlessMode setting and will render on top of any HTML content.
			 * @param  Array playbackOptions [description]
			 * @return boolean true if a streaming protocol, so overlaying of content on the video should be disabled.
			 */
			function getIsNoVideoOverlay() {
				return !!_.find(scope.playbackOptions, function(option) {
					return option.url.lastIndexOf('vbrtsp', 0) === 0 ||
						option.url.lastIndexOf('rtsp', 0) === 0 ||
						option.url.lastIndexOf('rtmp', 0) === 0;
				});
			}
		}
	};
}]);
;

//@ sourceMappingURL=shared.js.map
