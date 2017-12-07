/// <reference path="file://C:/maduro/UserInterfaces/VEMSWeb/Scripts/jQuery/jquery.js" />
/*
* ServiceProxy.js
* Version 0.964 - 11/5/09
*
* (c) 2008-2009 Rick Strahl, West Wind Technologies
* www.west-wind.com
*
* Licensed under MIT License
* http://en.wikipedia.org/wiki/MIT_License
*
* DP, 6/15/10 - Updated JSON2 Extensions to detect DateTime.MinValue coming
*               from WCF, replace with Date(0,0,0,0,0,0), and substitute back
*               when submitting to WCF.
* DP, 6/8/10 - Updated JSON2 library from www.json.org/json2.js and fixed
*              several issues relating to date compatibility.
* DP, 4/24/10 - AjaxExcepion added to this file from ww.jquery.js.
* JH, 6/25/10 - Increased timeout
* IM, 6/14/11 - Added InvokeTimeOut Method for the calls that would need longer timeouts (eg. Video Upload to YouTube..)
*/
  migrateApp.service('MaduroProxyService',['JSON2', function (JSON2) {
//------------------------------------------------------------------------------------
// ServiceProxy
//------------------------------------------------------------------------------------
this.ServiceProxy = function (serviceUrl) {
    /// <summary>
    /// Generic Service Proxy class that can be used to
    /// call JSON Services generically using jQuery.
    /// Includes all dependencies.
    /// </summary>
    /// <param name="serviceUrl" type="string">
    /// The Url of the service ready to accept the method name
    /// should contain trailing slash (or other URL separator ?,&)
    /// </param>
    /// <example>
    /// var proxy = new ServiceProxy("JsonStockService.svc/");
    /// proxy.invoke("GetStockQuote",{symbol:"msft"},
    ///              function(quote) { alert(result.LastPrice); },onPageError);
    ///</example>
    var _I = this;
    this.serviceUrl = serviceUrl;
    this.isWCF = true;

    function findGBroker(win) {
        var gbrokerWin;
        if ((win.parent == win) && (hasGBroker(win))) {
            //should only occur at the 'top';
            return win;
        }
        if (win.parent != win) {
            //loop through parent pages so long as we aren't at the parent and don't have a GBroker
            if (hasGBroker(win)) {

                return win;
            } else {
                gbrokerWin = findGBroker(win.parent);
            }
        }
        else if (!gbrokerWin) {
            //lastly, if we still don't have p, look for it internally
            if (hasGBroker(document)) {
                return document;
            }
        }

        return gbrokerWin;
    }

    var p = findGBroker(window);

    //Correct parameters for JSONP (i.e. dates). Must do for each parameter because the arguments are passed as an object.  We stringify each parameter.
    function StringifyObjectForJSONP(args) {
        $.each(args, function (i, n) {
            if (typeof n == "object") {
                args[i] = _I.isWCF ? JSON2.stringifyWCF(n) : JSON2.stringify(n);
            }
        });
    }

    this.invoke = function (method, params, callback, errorHandler, bare, useGet) {
        /// <summary>
        /// Calls a WCF/ASMX service and returns the result.
        /// </summary>
        /// <param name="method" type="string">The method of the service to call</param>
        /// <param name="params" type="object">An object that represents the parameters to pass {symbol:"msft",years:2}
        /// <param name="callback" type="function">Function called on success.
        /// Receives a single parameter of the parsed result value</parm>
        /// <param name="errorCallback" type="function">Function called on failure.
        /// Receives a single error object with Message property</parm>
        /// <param name="isBare" type="boolean">Set to true if response is not a WCF/ASMX style 'wrapped' object</parm>
        if (useGet == null || useGet == '' || useGet === undefined) {
            useGet = false;
        }

        // Service endpoint URL
        var url = _I.serviceUrl + method;

        if (navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/Android/i)) {
            params["dt"] = new Date();
        }
        if (useGet) {

            //Correct parameters for JSONP.
            StringifyObjectForJSONP(params);

            $.support.cors = true;
            $.ajax({
                url: url,
                data: params,
                type: "GET",
                processData: true,
                contentType: "application/javascript",
                timeout: 60000,
                dataType: "jsonp",  // not "json" we'll parse
                success: function (res) {
                    if (!callback) return;

                    // Use json library so we can fix up MS AJAX dates
                    var result = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);

                    //JSONP returns the result used.
                    bare = true;

                    // Bare message IS result
                    if (bare) {
                        callback(result);
                        p.gBroker.Publish('on-sll-complete', null);
                        return;
                    }

                },
                error: function (xhr, status) {
                    p.gBroker.Publish('on-sll-complete', null);
                    var err = null;
                    if (xhr.readyState == 4) {
                        var res = xhr.responseText;
                        if (res && res.charAt(0) == '{') {
                            err = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);
                            err.IsServerException = true;
                        }
                        if (!err) {
                            if (xhr.status && xhr.status != 200)
                                err = new AjaxException(xhr.status + " " + xhr.statusText, res);
                            else
                                err = new AjaxException("Ajax Error: " + status, res);
                        }
                    }
                    if (!err)
                        err = new AjaxException("Ajax Error: " + status);

                    if (errorHandler)
                        errorHandler(err, _I, xhr);
                }
            });
        }
        else {
          var json = _I.isWCF ? JSON2.stringifyWCF(params) : JSON2.stringify(params);
            $.ajax({
                url: url,
                data: json,
                type: "POST",
                processData: false,
                contentType: "application/json",
                timeout: 60000,
                dataType: "text",  // not "json" we'll parse
                success: function (res) {
                    if (!callback) return;

                    // Use json library so we can fix up MS AJAX dates
                    var result = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);

                    // Bare message IS result
                    if (bare)
                    { callback(result); return; }

                    // Wrapped message contains top level object node
                    // strip it off
                    for (var property in result) {
                        callback(result[property]);
                        break;
                    }

                  //  p.gBroker.Publish('on-sll-complete', null);
                },
                error: function (xhr, status) {

                    //dp.gBroker.Publish('on-sll-complete', null);
                    // var err = null;
                    // if (xhr.readyState == 4) {
                    //     var res = xhr.responseText;
                    //     if (res && res.charAt(0) == '{') {
                    //         err = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);
                    //         err.IsServerException = true;
                    //     }

                    // }

                    // //
                    // if (errorHandler)
                    //     errorHandler(err, _I, xhr);
                    //console.log(status);
                    alert('Some error occured while connecting to Vems server. Please check configuration.');
                }
            });
        }
    } //End invoke().

    this.invokeTimeOut = function (method, params, callback, errorHandler, bare, useGet, timeout) {
        /// <summary>
        /// Calls a WCF/ASMX service for the methods that needs longer timeouts and returns the result.
        /// </summary>
        /// <param name="method" type="string">The method of the service to call</param>
        /// <param name="params" type="object">An object that represents the parameters to pass {symbol:"msft",years:2}
        /// <param name="callback" type="function">Function called on success.
        /// Receives a single parameter of the parsed result value</parm>
        /// <param name="errorCallback" type="function">Function called on failure.
        /// Receives a single error object with Message property</parm>
        /// <param name="isBare" type="boolean">Set to true if response is not a WCF/ASMX style 'wrapped' object</parm>
        if (useGet == null || useGet == '' || useGet === undefined) {
            useGet = false;
        }
        if (timeout == null || timeout == '' || timeout === undefined) {
            timeout = 600000;
        }

        // Service endpoint URL
        var url = _I.serviceUrl + method;

        if (useGet) {
            //Correct parameters for JSONP.
            StringifyObjectForJSONP(params);

            $.ajax({
                url: url,
                data: params,
                type: "GET",
                processData: true,
                contentType: "application/javascript",
                timeout: timeout,
                dataType: "jsonp",  // not "json" we'll parse
                success: function (res) {
                    if (!callback) return;

                    // Use json library so we can fix up MS AJAX dates
                    var result = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);

                    //JSONP returns the result used.
                    bare = true;

                    // Bare message IS result
                    if (bare) {
                        callback(result);
                        p.gBroker.Publish('on-sll-complete', null);
                        return;
                    }

                },
                error: function (xhr, status) {
                    p.gBroker.Publish('on-sll-complete', null);
                    var err = null;
                    if (xhr.readyState == 4) {
                        var res = xhr.responseText;
                        if (res && res.charAt(0) == '{') {
                            err = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);
                            err.IsServerException = true;
                        }
                        if (!err) {
                            if (xhr.status && xhr.status != 200)
                                err = new AjaxException(xhr.status + " " + xhr.statusText, res);
                            else
                                err = new AjaxException("Ajax Error: " + status, res);
                        }
                    }
                    if (!err)
                        err = new AjaxException("Ajax Error: " + status);

                    if (errorHandler)
                        errorHandler(err, _I, xhr);
                }
            });
        }
        else {
            var json = _I.isWCF ? JSON2.stringifyWCF(params) : JSON2.stringify(params);

            $.ajax({
                url: url,
                data: json,
                type: "POST",
                processData: false,
                contentType: "application/json",
                timeout: timeout,
                async: true,
                dataType: "text",  // not "json" we'll parse
                success: function (res) {
                    if (!callback) return;

                    // Use json library so we can fix up MS AJAX dates
                    var result = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);

                    // Bare message IS result
                    if (bare)
                    { callback(result); return; }

                    // Wrapped message contains top level object node
                    // strip it off
                    for (var property in result) {
                        callback(result[property]);
                        break;
                    }

                    p.gBroker.Publish('on-sll-complete', null);
                },
                error: function (xhr, status) {
                    p.gBroker.Publish('on-sll-complete', null);
                    var err = null;
                    if (xhr.readyState == 4) {
                        var res = xhr.responseText;
                        if (res && res.charAt(0) == '{') {
                            err = _I.isWCF ? JSON2.parseWCF(res, useGet) : JSON2.parse(res, useGet);
                            err.IsServerException = true;
                        }
                        if (!err) {
                            if (xhr.status && xhr.status != 200)
                                err = new AjaxException(xhr.status + " " + xhr.statusText, res);
                            else
                                err = new AjaxException("Ajax Error: " + status, res);
                        }
                    }
                    if (!err)
                        err = new AjaxException("Ajax Error: " + status);

                    if (err.IsAjaxException && method == "LdapUserLoginSingleSignOn" && (err.Message == '401 Unauthorized' || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)) && callback)
                        callback({Exception: err.Message});
                    else if (errorHandler)
                        errorHandler(err, _I, xhr);
                }
            });
        }

    } // End InvokeTimeOut()
}                //End ServiceProxy().

//HACK - This is a duplicate of a function in Maduro.js, required to properly set "p" value here.
function hasGBroker(loc) {
	//If the location exists, and we can access its properties, and gBroker exists, return true.
	if (loc) {
		//This check fails on cross-domain, since properties of cross-domain regions can't be accessed.
		try {
			var temp = loc.location.hostname;
		}
		catch (err) {
			return false;
		}
		return loc.gBroker !== undefined;
	}
	return false;
}

//------------------------------------------------------------------------------------
// AjaxException
//------------------------------------------------------------------------------------
this.AjaxException = function(message, detail) {
	/// <summary>
	/// Ajax Exception - Taken from West-Wind ww.jquery.js
	/// (originally "Callback Exception") and then modified to use
	///	property names consistent with WCF-generated server exceptions.
	/// </summary>
	this.IsAjaxException = true;
	this.ExceptionType = "Ajax.Exception";
	if (typeof (message) == "object") {
		if (message.message)
			this.Message = message.message;
		else if (message.Message)
			this.Message = message.Message;
	}
	else
		this.Message = message;

	if (detail)
		this.ExceptionDetail = detail;
	else
		this.ExceptionDetail = null;
} //End AjaxException().

if (!this.JSON2) {
	this.JSON2 = {};
}

(function () {

	function f(n) {
		// Format integers to have at least two digits.
		return n < 10 ? '0' + n : n;
	} //End f().

	//DP, 6/8/2010 - Adding the toJSON method to the Date object produces a
	//"Can't execute code from a freed script" error in IE7 when called from
	//a subform.  Created standalone utility function instead.
	function dateToISO(date) {
		//Reset date object to avoid issues in IE where object type is lost
		//and UTC methods fail.
		date = new Date(date.getTime());
		return date.getUTCFullYear() + '-' +
			f(date.getUTCMonth() + 1) + '-' +
			f(date.getUTCDate()) + 'T' +
			f(date.getUTCHours()) + ':' +
			f(date.getUTCMinutes()) + ':' +
			f(date.getUTCSeconds()) + 'Z';
	} //End dateToISO().
	//if (typeof Date.prototype.toJSON !== 'function') {
	//	Date.prototype.toJSON = function(key) {
	//		return isFinite(this.valueOf()) ?
	//			this.getUTCFullYear() + '-' +
	//			f(this.getUTCMonth() + 1) + '-' +
	//			f(this.getUTCDate()) + 'T' +
	//			f(this.getUTCHours()) + ':' +
	//			f(this.getUTCMinutes()) + ':' +
	//			f(this.getUTCSeconds()) + 'Z' : null;
	//	}; //End toJSON().
	//	String.prototype.toJSON =
	//	Number.prototype.toJSON =
	//	Boolean.prototype.toJSON = function(key) {
	//		return this.valueOf();
	//	}; //End toJSON().
	//}

	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap,
		indent,
		meta = {    // table of character substitutions
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"': '\\"',
			'\\': '\\\\'
		},
		rep;

	function quote(string) {
		// If the string contains no control characters, no quote characters, and no
		// backslash characters, then we can safely slap some quotes around it.
		// Otherwise we must also replace the offending characters with safe escape
		// sequences.
		escapable.lastIndex = 0;
		return escapable.test(string) ?
			'"' + string.replace(escapable, function (a) {
				var c = meta[a];
				return typeof c === 'string' ? c :
					'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) + '"' :
			'"' + string + '"';
	} //End quote().

	function str(key, holder) {
		// Produce a string from holder[key].
		var i,          // The loop counter.
			k,          // The member key.
			v,          // The member value.
			length,
			mind = gap,
			partial,
			value = holder[key];

		// If the value has a toJSON method, call it to obtain a replacement value.
		if (value && typeof value === 'object') {
			if (false && typeof value.toJSON === 'function') {
				value = value.toJSON(key);
			} else if (Object.prototype.toString.call(value) === '[object Date]') {
				//DP, 6/8/2010 - Special handling for dates that don't natively
				//implement toJSON.
				value = dateToISO(value);
			}
		}

		// If we were called with a replacer function, then call the replacer to
		// obtain a replacement value.
		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}

		// What happens next depends on the value's type.
		switch (typeof value) {
			case 'string':
				return quote(value);

			case 'number':
				// JSON numbers must be finite. Encode non-finite numbers as null.
				return isFinite(value) ? String(value) : 'null';

			case 'boolean':
			case 'null':
				// If the value is a boolean or null, convert it to a string. Note:
				// typeof null does not produce 'null'. The case is included here in
				// the remote chance that this gets fixed someday.
				return String(value);
				// If the type is 'object', we might be dealing with an object or an array or
				// null.

			case 'object':
				// Due to a specification blunder in ECMAScript, typeof null is 'object',
				// so watch out for that case.
				if (!value) {
					return 'null';
				}
				// Make an array to hold the partial results of stringifying this object value.
				gap += indent;
				partial = [];

				// Is the value an array?
				if (Object.prototype.toString.apply(value) === '[object Array]') {
					// The value is an array. Stringify every element. Use null as a placeholder
					// for non-JSON values.
					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}
					// Join all of the elements together, separated with commas, and wrap them in
					// brackets.
					v = partial.length === 0 ? '[]' :
					gap ? '[\n' + gap +
							partial.join(',\n' + gap) + '\n' +
								mind + ']' :
						  '[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}

				// If the replacer is an array, use it to select the members to be stringified.
				if (rep && typeof rep === 'object') {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						k = rep[i];
						if (typeof k === 'string') {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				} else {
					// Otherwise, iterate through all of the keys in the object.
					for (k in value) {
						if (Object.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}

				// Join all of the member texts together, separated with commas,
				// and wrap them in braces.
				v = partial.length === 0 ? '{}' :
				gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
						mind + '}' : '{' + partial.join(',') + '}';
				gap = mind;
				return v;
		} //End switch (typeof data).
	} //End str().

	// If the JSON object does not yet have a stringify method, give it one.
	if (typeof JSON2.stringify !== 'function') {
		JSON2.stringify = function (value, replacer, space) {
			// The stringify method takes a value and an optional replacer, and an optional
			// space parameter, and returns a JSON text. The replacer can be a function
			// that can replace values, or an array of strings that will select the keys.
			// A default replacer method can be provided. Use of the space parameter can
			// produce text that is more easily readable.
			var i;
			gap = '';
			indent = '';

			// If the space parameter is a number, make an indent string containing that
			// many spaces.
			if (typeof space === 'number') {
				for (i = 0; i < space; i += 1) {
					indent += ' ';
				}
				// If the space parameter is a string, it will be used as the indent string.
			} else if (typeof space === 'string') {
				indent = space;
			}

			// If there is a replacer, it must be a function or an array.
			// Otherwise, throw an error.
			rep = replacer;
			if (replacer && typeof replacer !== 'function' &&
					(typeof replacer !== 'object' ||
					 typeof replacer.length !== 'number')) {
				throw new Error('JSON.stringify');
			}

			// Make a fake root object containing our value under the key of ''.
			// Return the result of stringifying the value.
			return str('', { '': value });
		}; //End stringify().
	} //End stringify.

	// If the JSON object does not yet have a parse method, give it one.
	if (typeof JSON2.parse !== 'function') {
		JSON2.parse = function (text, reviver, useGet) {
			// The parse method takes a text and an optional reviver function and useGet property used when SLL method invoked (was JSONP used?), and returns
			// a JavaScript value if the text is a valid JSON text.
			var j;

			function walk(holder, key) {
				// The walk method is used to recursively walk the resulting structure so
				// that modifications can be made.
				var k, v, value = holder[key];
				if (value && typeof value === 'object') {
					for (k in value) {
						if (Object.hasOwnProperty.call(value, k)) {
							v = walk(value, k);
							if (v !== undefined) {
								value[k] = v;
							} else {
								delete value[k];
							}
						}
					}
				}
				return reviver.call(holder, key, value);
			} //End walk().

			if (useGet) {
				//JSONP is used and does not need additional parsing because object structure already returned.

				// In the optional nth stage, we recursively walk the new structure, passing
				// each name/value pair to a reviver function for possible transformation.
				// This logic will fix WCF dates as needed.
				return typeof reviver === 'function' ?
				walk({ '': text }, '') : text;
			}
			else {

				// Parsing happens in four stages. In the first stage, we replace certain
				// Unicode characters with escape sequences. JavaScript handles many characters
				// incorrectly, either silently deleting them, or treating them as line endings.
				text = String(text);
				cx.lastIndex = 0;
				if (cx.test(text)) {
					text = text.replace(cx, function (a) {
						return '\\u' +
						('0000' + a.charCodeAt(0).toString(16)).slice(-4);
					});
				}

				// In the second stage, we run the text against regular expressions that look
				// for non-JSON patterns. We are especially concerned with '()' and 'new'
				// because they can cause invocation, and '=' because it can cause mutation.
				// But just to be safe, we want to reject all unexpected forms.

				// We split the second stage into 4 regexp operations in order to work around
				// crippling inefficiencies in IE's and Safari's regexp engines. First we
				// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
				// replace all simple value tokens with ']' characters. Third, we delete all
				// open brackets that follow a colon or comma or that begin the text. Finally,
				// we look to see that the remaining characters are only whitespace or ']' or
				// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
				if (/^[\],:{}\s]*$/.
				test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
				replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
				replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

					// In the third stage we use the eval function to compile the text into a
					// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
					// in JavaScript: it can begin a block or an object literal. We wrap the text
					// in parens to eliminate the ambiguity.
					j = eval('(' + text + ')');

					// In the optional fourth stage, we recursively walk the new structure, passing
					// each name/value pair to a reviver function for possible transformation.
					return typeof reviver === 'function' ?
					walk({ '': j }, '') : j;
				}

				// If the text is not JSON parseable, then a SyntaxError is thrown.
				throw new SyntaxError('JSON.parse');
			} //not JSONP.
		}; //End parse().
	} //End parse.
} ());   //End JSON2 function() enclosure.

//------------------------------------------------------------------------------------
// JSON2 Extensions for Microsoft WCF Date Handling
//------------------------------------------------------------------------------------
(function() {
	var reISO = /^(\d{1,4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
	//var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;
	// original var reMsAjax = /^\/Date\((d|-|.*)\)\/$/;
	// captures timezone portion
	var reMsAjax = /^\/Date\((\d+)([-+]\d{4})?\)[\/\\]$/;

	if (typeof JSON2.stringifyWCF !== 'function') {
		JSON2.stringifyWCF = function(json) {
			/// <summary>
			/// WCF specific stringify that encodes dates in the
			/// a WCF compatible format ("/Date(9991231231)/")
			/// Note: this format works ONLY with WCF.
			///       ASMX can use ISO dates as of .NET 3.5 SP1
			/// </summary>
			/// <param name="key" type="var">property name</param>
			/// <param name="value" type="var">value of the property</param>
			return JSON2.stringify(json, function(key, value) {
				if (typeof value == "string") {
					var a = reISO.exec(value);
					if (a) {
						//DP, 6/15/2010:
						//If year <= 1900, return .NET's DateTime.MinValue
						//representation of "/Date(-62135578800000-0500)/" instead.
						//This would capture a Date(0,0,0,0,0,0) value (Dec 31 1899 00:00:00 GMT).
						if (a[1] <= 1900) {
							return '/Date(-62135578800000-0500)/';
						}
						var val = '/Date(' + new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6])).getTime() + ')/';
						//DP, 6/8/2010:
						//It is necessary to set "this[key] = val" when using FireFox's
						//built-in JSON.stringify function.  This is undesirable because
						//it changes the date format in the passed object structure.
						//We're using own our JSON code instead.
						//this[key] = val;
						return val;
					}
				}
				return value;
			})
		}; //End stringifyWCF().
	} //End stringifyWCF.

	if (typeof JSON2.parseWCF !== 'function') {
		JSON2.parseWCF = function(json, useGet) {
			/// <summary>
			/// parses a JSON string and turns ISO or MSAJAX date strings
			/// into native JS date objects
			/// </summary>
			/// <param name="json" type="var">json with dates to parse</param>
			/// </param>
			/// <param name="useGet" type="var">useGet property used when SLL method invoked (was JSONP used?)</param>
			/// </param>
			/// <returns type="value, array or object" />
			try {
				var res = JSON2.parse(json, function(key, value) {
					if (typeof value === 'string') {
						if (value == '/Date(-62135578800000-0500)/') {
							//DP, 6/15/2010:
							//"/Date(-62135578800000-0500)/" represents the .NET
							//DateTime.MinValue = returned by WCF in place of null date.
							//This value is too negative for JavaScript and has unreliable
							//translation to dates values across different browsers.
							//Special handling of the return value should be done here:
							//Examples:
							//   value = null;
							//   value = new Date(0);  ==> Dec 31 1969 19:00:00 GMT
							//   value = new Date(0, 0, 0, 0, 0, 0);  ==> Dec 31 1899 00:00:00 GMT
							return new Date(0, 0, 0, 0, 0, 0);
						}
						var a = reISO.exec(value);
						if (a) {
							//ISO date format of "2010-06-08T20:19:03Z".
							return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
						}
						a = reMsAjax.exec(value);
						if (a) {
							//WCF date format of "/Date(1276028343000)/".
							//var b = a[1].split(/[-+,.]/);
							//return new Date(b[0] ? +b[0] : 0 - +b[1]);

							// get UNIX ms timestamp as number
							var timestamp = parseInt(a[1], 10);
							// turn 2nd portion to ms. 36000 = 60 (hour to min) * 60 (min to sec) * 1000 (sec to ms) / 100 (0500 = 500 not 5)
							var timezone = parseInt(a[2], 10) * 36000;
							if (!isNaN(timezone)) {
                                //console.log('DATETIME: timezone included in %s. unfixed: %s, fixed: %s', key, dateFormat(timestamp, "h:mm tt"),dateFormat(timestamp + timezone, "h:mm tt"));
								timestamp += timezone;
							}
							return new Date(timestamp);
						}
					}
					return value;
				}, useGet);
				return res;
			} catch (e) {
				// orignal error thrown has no error message so rethrow with message
				throw new Error("JSON content could not be parsed");
				return null;
			}
		}; //End parseWCF().
	} //End parseWCF.
} ()); //End JSON2 Extensions function() enclosure.
 }]);
