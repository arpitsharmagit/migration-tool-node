/// <reference path="file://C:/maduro/UserInterfaces/VEMSWeb/Scripts/jquery/jquery.js'/>
/// <reference path="file://C:/maduro/UserInterfaces/VEMSWeb/Scripts/DataContracts/MaduroDC.js'/>
/// <reference path="file://C:/maduro/UserInterfaces/VEMSWeb/Scripts/WCFServiceProxy/MaduroSLL.js'/>
/// <reference path="encoder.js" />

var windowsAuthenticationFailureMsg = "The server failed to authenticate via Windows Authentication. Verify that Windows Authentication is enabled in IIS, or use the MaduroSSLSettings Configuration Tool to disable Single-Sign-On mode";
var webServerCommunicationFailureMsg = "Web Service Communications Error";
var requestTimedOutFailureMsg = "Your request took too long to process and has timed out. Please refresh the page and try again, or contact your administrator";
var serverErrorFailureMsg = "Server Error";
var isIFrameEmbedded = false;
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

var requiredMode = false;
var DefaultUserLoginPage = '//' + GetURLHostname() + '/VEMSWeb/VEMSHost.html?VBTemplate=Templates/UserLoginTemplate.xml';
var DefaultEmbeddedUserLoginPage = '//' + GetURLHostname() + '/VEMSWeb/VEMSHost.html?VBTemplate=Embedded/Templates/EmbeddedUserLoginTemplate.xml'; //Version of user login template used for embedded usage.

//Will be run on document ready for all Widgets
$(function () {
    ApplyStyleOverrides();
    SetErrorVariables();
});

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


/****************************************/
/* Maduro Global Javascript include
/* This is the kitched sink JS for
/* anything that doesn't fit in one of the
/* other includes
******************************************/

var UserHelpLinks = 'http://www.vbrick.com/help/mystro/6310/';
var AdminHelpLinks = 'http://www.vbrick.com/help/mystro/6310/';

///////////////////////////////////////////////////////////////////
// Javascript for localizing placeholder strings in the html
// according to the user's preferred language.

//Create patterns to find placeholders denoted by beginning and end markers
var placeHolderPatt = /<\$[ \t]*\x2F[A-z0-9\x2F]+[ \t]*\$>/g;  // \x2F is '/' char
//Placeholder possibly surrounded by white space
var placeHolderWithinSpacesPatt = /\s*<\$[ \t]*\x2F[A-z0-9\x2F]+[ \t]*\$>\s*/g;  // \x2F is '/' char
//Placeholder within an encoded HTML string
var placeHolderHTMLPatt = /&lt;\$[ \t]*\x2F[A-z0-9\x2F]+[ \t]*\$&gt;/g;  // \x2F is '/' char
//Beginning of placeholder within encoded HTML string with leading white space
var placeHolderHTMLSpacesBeginPatt = /^\s*&lt;\$/;
//End of placeholder within encoded HTML string with trailing white space
var placeHolderHTMLEndSpacesPatt = /\$&gt;\s*$/;

function ProcessLocalizedStrings() {
    try {
        ReplaceLocalizedStrings();
    }
    catch (err) { }

    try {
        //Now that this particular iframe is localized, make it visible.
        $(frameElement).css("visibility", "visible");
    }
    catch (err) { }

    var dayNames = GetCulturalDateTimeFormat("DayNames").split("|");
    var abbrevDayNames = GetCulturalDateTimeFormat("AbbrevDayNames").split("|");
    var monthNames = GetCulturalDateTimeFormat("MonthNames").split("|");
    var abbrevMonthNames = GetCulturalDateTimeFormat("AbbrevMonthNames").split("|");
    LocalizeDayMonthNamesForDateFormat(dayNames, abbrevDayNames, monthNames, abbrevMonthNames);
}

function ProcessLocalizedStringSingle(placeHolder) {
    //Pass zero for the length of the placeholder beginning/end markers
    return GetLocalizedStringLanguageText(placeHolder, 0);
}

function ReplaceLocalizedStrings() {
    $(':not(html):not(head):not(link):not(script[type!="text/html"]):not(body)').filter(function (i) {
        //Test if innerHTML begins with "<$" or ends with "$>"
        //with possible leading or trailing white space.
        //InnerHTML may contain more than one placeholder.
        if (this.innerHTML.match(placeHolderHTMLSpacesBeginPatt) != null
			|| this.innerHTML.match(placeHolderHTMLEndSpacesPatt) != null) {
            //Find all the placeholders in the innerHTML
            var placeHolders = this.innerHTML.match(placeHolderHTMLPatt);
            //Save reference to innerHTML of matching DOM element
            var elemInnerHTML = this.innerHTML;
            var markerLength = 0;
            if (placeHolders != null) {
                $.each(placeHolders, function () {
                    //Get the preferred language text for the placeholder
                    var prefLangText = GetLocalizedStringLanguageText(this, markerLength);
                    //Replace the placeholder in innerHTML of the DOM element with its replacement text
                    elemInnerHTML = elemInnerHTML.replace(this.toString(), prefLangText);
                });
            }
            //Update the innerHTML with all the replacements
            this.innerHTML = elemInnerHTML;
        }
        if (this.title != "" && this.title.match(placeHolderPatt) != null) {
            this.title = GetLocalizedStringLanguageText(this.title, 0);
        }
        if (this.value != undefined && this.value.match != undefined && this.value.match(placeHolderPatt) != null && this.innerHTML == "") {
            this.value = GetLocalizedStringLanguageText(this.value, 0);
        }
    });
}

function GetLocalizedStringLanguageText(placeHolder, markerLength) {
    //Set length of markers denoting beginning and end of placeholder
    if (markerLength == 0)
        markerLength = placeHolder.indexOf("$") + 1;
    //Extract the XPath from the placeholder
    var prefLangXPath = placeHolder.substring(markerLength, placeHolder.length - markerLength);
    //Use the XPath to get the replacement text from the Language XML doc
    var prefLangText = FindXPathInLanguageDoc(prefLangXPath);
    return prefLangText;
}

function GetCulturalDateTimeFormat(formatName) {
    return FindXPathInLanguageDoc("/Templates/DateTimeFormats/" + formatName);
}

//Find the passed XPath in the language XML doc object.
//Note: the XML doc object exists in VEMSHost.html so only one object is used by the widgets on a page.
//      It is referenced through the "p" variable.
function FindXPathInLanguageDoc(placeHolderLanguageXPath) {
    var languageText = "";
    try {
        //Use the XPath to get the replacement text from the Language XML doc
        if ($.browser.msie) {  // Internet Explorer
            var languageXMLNode = p.languageXmlDoc.selectSingleNode($.trim(placeHolderLanguageXPath));
            if (languageXMLNode)
                languageText = languageXMLNode.text;
        }
        else {
            if (navigator.userAgent.match(/Android/i)) {
                var xPathResult = document.evaluate($.trim(placeHolderLanguageXPath), p.languageXmlDoc, null, XPathResult.ANY_TYPE, null);
            }
            else {       // Other than Internet Explorer
                var xPathResult = p.languageXmlDoc.evaluate($.trim(placeHolderLanguageXPath), p.languageXmlDoc, null, XPathResult.ANY_TYPE, null);
            }
            var languageXMLNode = xPathResult.iterateNext();
            if (languageXMLNode) {
                languageText = languageXMLNode.textContent;
            }
        }
    }
    catch (err) { }
    return languageText;
}

function SetErrorVariables() {
    var windowsAuthenticationFailureMsglocalized = ProcessLocalizedStringSingle('<$/Templates/UserLandingPageTemplate/Widgets/TabsWidgetUser/WindowsAuthenticationErrorText$>')
    if (windowsAuthenticationFailureMsglocalized != null && windowsAuthenticationFailureMsglocalized != 'undefined' && windowsAuthenticationFailureMsglocalized != '')
        windowsAuthenticationFailureMsg = windowsAuthenticationFailureMsglocalized;

    var webServerCommunicationFailureMsglocalized = ProcessLocalizedStringSingle('<$/Templates/UserLandingPageTemplate/Widgets/TabsWidgetUser/WebServerCommunicationErrorText$>')
    if (webServerCommunicationFailureMsglocalized != null && webServerCommunicationFailureMsglocalized != 'undefined' && webServerCommunicationFailureMsglocalized != '')
        webServerCommunicationFailureMsg = webServerCommunicationFailureMsglocalized;

    var requestTimedOutFailureMsglocalized = ProcessLocalizedStringSingle('<$/Templates/UserLandingPageTemplate/Widgets/TabsWidgetUser/RequestTimedOutErrorText$>')
    if (requestTimedOutFailureMsglocalized != null && requestTimedOutFailureMsglocalized != 'undefined' && requestTimedOutFailureMsglocalized != '')
        requestTimedOutFailureMsg = requestTimedOutFailureMsglocalized;

    var serverErrorFailureMsglocalized = ProcessLocalizedStringSingle('<$/Templates/UserLandingPageTemplate/Widgets/TabsWidgetUser/ServerErrorText$>')
    if (serverErrorFailureMsglocalized != null && serverErrorFailureMsglocalized != 'undefined' && serverErrorFailureMsglocalized != '')
        serverErrorFailureMsg = serverErrorFailureMsglocalized;
};

// End of Javascript for localizing placeholder strings in the html
///////////////////////////////////////////////////////////////////

//This is our generic callback method used by
//our SLL proxy. This will be called on any
//low level SLL call failure
function onFailure(err, serviceProxy, xmlHttpRequest) {
    var msg = "";
    var severity = 'FATAL';
    var queryVariable = "";

    if (err.IsAjaxException) {
        if (err.Message === undefined || err.Message == 'Ajax Error: error') return;
        else if (err.Message == "500 System.ServiceModel.ServiceActivationException") {
            msg = windowsAuthenticationFailureMsg + ".\n\n";
        }
        else {
            if (err.IsAjaxException === undefined || err.IsAjaxException == false) {
                msg = webServerCommunicationFailureMsg + ":  ";
            }

            if (err.LocalizedMessage === undefined) {
                if (err.Message == "Ajax Error: timeout")
                    msg = requestTimedOutFailureMsg + ".\n\n";
                else
                    msg += err.Message + "\n\n";
            }
            else {
                msg += err.LocalizedMessage;
                severity = err.Severity;
            }
        }

    }
    else {
        msg = serverErrorFailureMsg + ":  ";
        if (err.LocalizedMessage === undefined) {
            msg += err.Message + "\n\n";
        }
        else {
            msg += err.LocalizedMessage;
            severity = err.Severity;
        }
    }

    queryVariable = GetQueryVariable('VBTemplate');
    if (queryVariable == 'Templates/VideoInfoTemplate.xml' || queryVariable == 'Templates/ClipVideoInfoTemplate.xml' || queryVariable == 'Embedded/Templates/EmbeddedVideoInfoTemplate.xml') {
        p.gBroker.Publish('on-videoinfo-error',
		{
		    message: msg
		});
        if (err.EnumExceptionActionID == 429)
            setTimeout(function () { LoginRedirect(GetLoginTemplate()); }, 2000);
    }
    else {
        p.gBroker.Publish('on-error',
		{
		    message: msg,
		    severity: severity,
		    action: err.EnumExceptionActionID
		});
    }
}

/// Failure handler for non-essential calls
function ignoreFailure(err, serviceProxy, xmlHttpRequest) {
    // do nothing
}

function safePlayerErrorPlacement(msg) {
    var queryVariable = GetQueryVariable('VBTemplate');
    if (queryVariable == 'Templates/VideoInfoTemplate.xml' ||
		queryVariable == 'Templates/ClipVideoInfoTemplate.xml' ||
		queryVariable == 'Templates/VideoApprovalTemplate.xml' ||
		queryVariable == 'Templates/VideoInfoPlaylistTemplate.xml' ||
		queryVariable == 'Templates/PresentationAdminTemplate.xml' ||
		queryVariable == 'Templates/PresentationViewerTemplate.xml' ||
		queryVariable == 'Templates/PresentationRecordedViewerTemplate.xml' ||
		queryVariable == 'Templates/AddVideoTemplate.xml' ||
		queryVariable == 'Embedded/Templates/EmbeddedVideoInfoTemplate.xml') {
        p.gBroker.Publish('on-videoinfo-error', { message: msg });
    }
    else {
        p.gBroker.Publish('on-error', { message: msg, severity: 'FATAL' });
    }
}

//TODO not sure where we will store this permanently
//returns applicationID
function GetApplicationID() {
    return '0ffb13f8-11ce-46b5-aa41-5b2703013086';
}

// Gets the user language preference, null if user has not selected
// this will get massaged on the backend sll method
function GetUserLanguage() {
    var langpref = $.cookie('userlangselection');
    if (langpref != null && langpref == 'null')
        langpref = null;
    return langpref;
}


function SetClientLandingPageTemplate(landingPageTemplate) {
    //$.cookie('clientLandingPageTemplate', landingPageTemplate, { expires: 90, path: '/' });
    CreateCookie('clientLandingPageTemplate', landingPageTemplate, 90);
}

function ClearLandingPageTemplate() {
    EraseCookie('clientLandingPageTemplate');
}

function GetClientLandingPageTemplate() {
    var loginTemplate = ReadCookie('clientLandingPageTemplate');
    if (!loginTemplate) loginTemplate = "Templates/UserLandingPageTemplate.xml";
    return loginTemplate;
}

function GetClientAllVideosPageTemplate() {
    var loginTemplate = ReadCookie('clientLandingPageTemplate');
    if (!loginTemplate) loginTemplate = "Templates/UserTemplatePlayerless.xml";
    return loginTemplate;
}

function SetUserHomePageTemplate(homePageTemplate) {
    //$.cookie('clientHomePageTemplate', homePageTemplate, { expires: 90, path: '/' });
    CreateCookie('clientHomePageTemplate', homePageTemplate, 90);
}


function UseUserHomePage() {
    if (GetUserHomePageTemplate() != null) return true;
    return false;
}

function GetUserHomePageTemplate() {
    var loginTemplate = ReadCookie('clientHomePageTemplate');
    return loginTemplate;
}

function ClearUserPageTemplate() {
    //$.cookie('clientHomePageTemplate', null, { expires: 90, path: '/' });
    EraseCookie('clientHomePageTemplate');
}

function SetLoginTemplate(template) {
    //$.cookie('loginTemplate', template, { expires: 90, path: '/' })
    CreateCookie('loginTemplate', template, 90);
}


function CreateCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function CreateSessionCookie(name, value) {
    document.cookie = name + "=" + value + "; path=/";
}
function setIDCookie(ID) {
            if (setIDcookie) {
                $.cookie("userIDforPrefs", ID, { path: '/' });
            }
        }

function ReadCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function EraseCookie(name) {
    CreateCookie(name, "", -1);
    deleteCookie(name);
}

function getCookie(name) {
    var start = document.cookie.indexOf(name + "=");
    var len = start + name.length + 1;
    if ((!start) && (name != document.cookie.substring(0, name.length))) {
        return null;
    }

    if (start == -1) return null;
    var end = document.cookie.indexOf(';', len);
    if (end == -1) end = document.cookie.length;
    return unescape(document.cookie.substring(len, end));
}

function setCookie(name, value, expires, path, domain, secure) {
    var today = new Date();

    today.setTime(today.getTime());

    if (expires) {
        expires = expires * 1000 * 60 * 60 * 24;
    }

    var expires_date = new Date(today.getTime() + (expires));
    document.cookie = name + '=' + escape(value) +
        ((expires) ? ';expires=' + expires_date.toGMTString() : '') + //expires.toGMTString()
        ((path) ? ';path=' + path : '') +
        ((domain) ? ';domain=' + domain : '') +
        ((secure) ? ';secure' : '');
}

function deleteCookie(name, path, domain) {
    if (getCookie(name)) document.cookie = name + '=' +
        ((path) ? ';path=' + path : '') +
        ((domain) ? ';domain=' + domain : '') +
        ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
}

//Get template to use for login.
//Arguments:
// isEmbedded: true/false to indicate if template is embedded. If isEmbedded is not provided (undefined or "" or null), this method will determine based on current template/widget.
function GetLoginTemplate(isEmbedded) {
    var loginTemplate;

    //We must know this value so get if not provided.
    if (isEmbedded == null || isEmbedded == '' || isEmbedded === undefined) {
        isEmbedded = GetEmbeddedAttributesForCurrentTemplateWidget().isEmbedded;
    }
    else {
        //Make sure a boolean.
        isEmbedded = ConvertValueToBoolean(isEmbedded);
    }

    //For embedded, we do not track login template in a cookie and we have a seperate embedded user login template. We always use default embedded login template.
    if (isEmbedded) {
        loginTemplate = DefaultEmbeddedUserLoginPage;
    }
    else {
        loginTemplate = ReadCookie('loginTemplate');
        if (!loginTemplate) loginTemplate = DefaultUserLoginPage;
    }
    return loginTemplate;
}

//Return non-embedded or embedded version of default user login template based on value for passed isEmbedded.
//Arguments:
// isEmbedded: true/false to indicate if template is embedded. If isEmbedded is not provided (undefined or "" or null), this method will determine based on current template/widget.
function GetDefaultUserLoginTemplate(isEmbedded) {
    //We must know this value so get if not provided.
    if (isEmbedded == null || isEmbedded == '' || isEmbedded === undefined) {
        isEmbedded = GetEmbeddedAttributesForCurrentTemplateWidget().isEmbedded;
    }
    else {
        //Make sure a boolean.
        isEmbedded = ConvertValueToBoolean(isEmbedded);
    }

    if (isEmbedded) {
        return DefaultEmbeddedUserLoginPage;
    }
    else {
        return DefaultUserLoginPage;
    }
}

function SetUserID(userID) {
    //$.cookie('userID', userID, { expires: 90, path: '/' });
    CreateCookie('userID', userID, 90);
}

function GetUserID() {
    //return $.cookie('userID');
    return ReadCookie('userID');
}

function CollapseFrame(frameSelector) {
    var theFrame = $(frameSelector, parent.document.body);
    //theFrame.height('25px');
    $(theFrame).animate({ height: '45px' });

}

function HideFrame(frameSelector) {
    var theFrame = $(frameSelector, parent.document.body);
    //theFrame.height('25px');
    $(theFrame).animate({ height: '0px' });

}

function ExpandFrame(frameSelector) {

    var theFrame = $(frameSelector, parent.document.body);
    //theFrame.height('304px');
    $(theFrame).animate({ height: '360px' });

}



//Templates allow for a override arguments to be passed
//in using javascript hash notation
//styleOverrides="{ body : [ {style:'background-color', value:'black'}, {style:'font-family', value:'verdana'}] }
//
//When the template is converted to HTML, it
//becomes an attribute of the hosting
//IFRAME called "styleOverrides"
//
//We check for the existence of these optional arguments
//convert them into a real HASH and then they can be used
//as objects using Dot notation
function GetOverrides(overrideType) {
    try {
        var hostFrame = window.frameElement;
        if (hostFrame) {
            var argString = hostFrame.getAttribute(overrideType);

            //convert styleOverrides string into a Javascript hash
            if (argString) {
                //do the object coversion
                var obj = eval('(' + argString + ')');
                return obj;
            }
        }

    } catch (e) { ; }
}


//grabs simple name/value pair arguments from parent iframe
//use this when we don't need to pass a hash/object
function GetOverrideSimple(overrideType) {
    try {
        var hostFrame = window.frameElement;
        if (hostFrame) {
            var argString = hostFrame.getAttribute(overrideType);
            return argString;
        }

    } catch (e) { ; }
}

function ApplyStyleOverrides() {
    var stylesObj = GetOverrides('styleOverrides');
    if (stylesObj) {
        $.each(stylesObj, function (key, value) {
            var styleElement = key;
            $.each(value, function () {
                $('.' + styleElement).css(this.style, this.value);
            });
        });
    }
    //add style sheet references if specified in template XML
    var commonCSSFile = GetOverrideSimple('commonCSSFile');
    if (commonCSSFile) {
        var link = $("<link>");
        link.attr("type", 'text/css');
        link.attr('rel', 'stylesheet');
        link.appendTo('head');
        link.attr('href', commonCSSFile);
        link.attr('class', 'dynamic_common_css');
    }

    var widgetCSSFile = GetOverrideSimple('widgetCSSFile');

    if (widgetCSSFile) {
        var link2 = $("<link>");
        link2.attr("type", 'text/css');
        link2.attr('rel', 'stylesheet');
        link2.appendTo('head');
        link2.attr('href', widgetCSSFile);
        link2.attr('class', 'dynamic_widget_css');
    }

    // IE doesn't always notice the presence of new stylesheets
    if ($.browser.msie) {
        if (commonCSSFile) {
            var headID = document.getElementsByTagName("head")[0];
            var cssNode = document.createElement('link');
            cssNode.type = 'text/css';
            cssNode.rel = 'stylesheet';
            cssNode.href = commonCSSFile;
            cssNode.media = 'screen';
            headID.appendChild(cssNode);
        }
        if (widgetCSSFile) {
            var headID = document.getElementsByTagName("head")[0];
            var cssNode = document.createElement('link');
            cssNode.type = 'text/css';
            cssNode.rel = 'stylesheet';
            cssNode.href = widgetCSSFile;
            cssNode.media = 'screen';
            headID.appendChild(cssNode);
        }

    }

}

///Helper function that pulls params off of the querystring for window with broker (i.e. p)
function GetQueryVariable(variable) {
    var query = p.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return htmlEncode(pair[1]);
        }
    }
    return null;
}

//Pulls params passed into local iframe window
function GetLocalWindowQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return null;
}

///Helper function that pulls params off of the querystring for parent
function GetLocalWindowParentQueryVariable(variable) {
    //Put in try in case we do not have permission to parent window (i.e. embedded in SharePoint).
    try {
        var query = window.parent.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
    }
    catch (err) {
        return null;
    }
    return null;
}

function GetCurrentTemplate() {
    var template = GetQueryVariable("VBTemplate");
    return template;
}

function SetIsEmbedded(boolValue) {
    isIFrameEmbedded = boolValue;
}
function GetIsEmbedded() {
    return isIFrameEmbedded;
}



function GetSessionID() {
    var sessionID = ReadCookie("sessionID");
    if (!sessionID) sessionID = p.sessionID;
    try {
        var isAnonymous = (window.top.location.href.toLowerCase().indexOf('anonymous') > 0);
        if (isAnonymous) {
            sessionID = $.cookie('AnonymousSessionId');
        }
    }
    catch (exception) {
        var sessionID = ReadCookie("sessionID");
        if (!sessionID) sessionID = p.sessionID;
    }
    return sessionID;
}

function SetSessionID(sessionID) {
    CreateSessionCookie("sessionID", sessionID);
}

function ClearSessionID() {
    EraseCookie("sessionID");
}

//Redirect to the login template so user can login.
//Arguments:
// loginTemp: login template to redirect to. If a value not provided (undefined or "" or null), GetLoginTemplate() will be called.
// embeddedAttributes: object storing embedded attributes (obtained from GetEmbeddedAttributesForCurrentTemplateWidget()) for template/widget. If a value not provided (undefined or "" or null), this method will determine based on current template/widget.
// returnToTemplate: the template to return to if login successful. If value is undefined, this method will default to current template if embedded.
// preserveQSParametersForReturnToTemplate: should the current query string values be preserved if returning to a template after login successful. If value is undefined, this method will default to true if embedded.
function LoginRedirect(loginTemp, embeddedAttributes, returnToTemplate, preserveQSParametersForReturnToTemplate) {

    //If embedded attributes not provided, we need to determine because logic needs to know if embedded.
    if (embeddedAttributes == null || embeddedAttributes == '' || embeddedAttributes === undefined) {
        embeddedAttributes = GetEmbeddedAttributesForCurrentTemplateWidget();
    }

    //If returnToTemplate is undefined, we need to set a default if embedded. If null or "" we will accept that because a value was passed.
    if (returnToTemplate === undefined && embeddedAttributes.isEmbedded) {
        //If embedded and we are being re-directed to login page, we want to return to current template.
        //If an embedded template/widget is accessed and requires a session ID (i.e. user must login), the user will be redirected to the embedded version of the login template,
        //and upon successful login, the user will be redirected back to the initial template/widget.
        returnToTemplate = GetCurrentTemplate();
    }

    //If preserveQSParametersForReturnToTemplate is undefined, we need to set a default if embedded.  If null or "" we will accept that because a value was passed.
    if (preserveQSParametersForReturnToTemplate === undefined && embeddedAttributes.isEmbedded) {
        //If embedded and we are being re-directed to login page, we want to return to current template with current querystring parameters.
        preserveQSParametersForReturnToTemplate = true;
    }

    //If login template is not passed, the GetLoginTemplate() is called to get a value.
    if (loginTemp == null || loginTemp == '' || loginTemp === undefined) {
        loginTemp = GetLoginTemplate(embeddedAttributes.isEmbedded);
    }

    //Make sure we find top that contains broker. This check is needed for SharePoint or when the template is embedded in non VEMS site because top returns the topmost browser window
    //and not the parent window of the widget. The script may not have access to "top".
    //Until all the widgets are changed to use p = findGBroker() to get broker window, we will do it here.
    var pTop = findGBroker(window);

    //Redirect.
    pTop.TemplateNavigator.init(loginTemp, embeddedAttributes);
    pTop.TemplateNavigator.navigateRedirect(returnToTemplate, preserveQSParametersForReturnToTemplate);
}

//Get all the embedded attributes for the current template or widget. Note that attribtes have been URL decoded where needed.
//
//Note: The decodeURIComponent is used to decode (if not dataOverrides) so encodeURIComponent or equivalent should have been used to encode. Assume 'dataOverrides' are not encoded or decoded.
//
//Arguments:
//	objWidgetDataOverrides: the dataoverrides object associated with the widget if function called from a widget. If objWidgetDataOverrides is undefined,
//							this method will get the value from the current window (only available for iframes; i.e. widgets) if available.
//
//Returns: Attributes returned in object. Properties:
//	isEmbedded (bool)
//		: true/false indicating if template/widget is treated as embedded.
//	embeddedTheme (string)
//      : theme to use for template/widget if embedded. '' returned if not embedded. The value has been URL decoded.
//	embeddedCategory (string)
//		: special use case when content category is passed for embedded template/widget and handled by widget. '' returned if not embedded. The value has been URL decoded.
//  attributesQueryStringText(string)
//		: the text that needs to be added to URL's query string if attributes added to URL. '' returned if not embedded. The value has been URL encoded. Will always start with "&".
//  attributesDataOverridesText(string)
//		: the text that needs to be added to 'dataOverrides' if attributes added to 'dataOverrides'. '' returned if not embedded. The value has NOT been URL encoded because 'dataOverrides' not encoded.
function GetEmbeddedAttributesForCurrentTemplateWidget(objWidgetDataOverrides) {

    //If the widget's dataoverrides object is undefined, get the value because needed in logic below.
    //We only get if undefined because, if passed (whether "" or null), the calling script passed what was needed.
    if (objWidgetDataOverrides === undefined) {
        objWidgetDataOverrides = GetOverrides('dataOverrides');
    }

    //Get value for isEmbedded.
    //
    //If the template�s URL (i.e. top window location) or widget�s URL (i.e. local window location) or widget�s dataOverrides (uses attribute of iframe) has isEmbedded = true, then treat all as embedded.
    //If not provided, will default to false.
    var isEmbedded = false;

    //Set to true for special over-ride case documented below.
    var wasSpecialCaseEmbedOverride = false;

    //1. Check attribute provided with template�s URL (i.e. top window location). points to p = broker.
    isEmbedded = ConvertValueToBoolean(GetQueryVariable('isEmbedded'));

    //2. Check attribute provided with widget�s URL (i.e. local window location) if false so far.
    if (!isEmbedded) {
        isEmbedded = ConvertValueToBoolean(GetLocalWindowQueryVariable('isEmbedded'));
    }

    //3. Check attribute provided with widget�s dataOverrides (uses attribute of iframe) if false so far.
    if (!isEmbedded) {
        if (objWidgetDataOverrides != null && objWidgetDataOverrides != '' && objWidgetDataOverrides !== undefined) {
            isEmbedded = ConvertValueToBoolean(objWidgetDataOverrides.isEmbedded);
        }
    }

    // 4. Special over-ride case when we are dealing with a widget that was designed for purely embedded usage (i.e. EmbedContentListWidget.html).
    //These special case embedded only widgets will have the following variables defined:
    // - 1. The override_isEmbeddedTrue variable will exist in the widget indicating that it is an over-ride and takes precedence. The value must be true.
    // - 2. There may be a dft_embeddedTheme variable defined in widget and that is the default if no other embeddedTheme supplied.
    try {
        if (this.override_isEmbeddedTrue !== undefined && ConvertValueToBoolean(this.override_isEmbeddedTrue)) {
            isEmbedded = true;
            wasSpecialCaseEmbedOverride = true;
        }
    }
    catch (err) {
        //do nothing. the variable must have been undefined and browser threw exception.
    }


    //Get value for embeddedTheme.
    //
    //We will treat any embeddedTheme defined with the widget�s dataOverrides (uses attribute of iframe) as a default.
    //We will treat a non-empty embeddedTheme defined with the widget�s URL (i.e. local window location) as an over-ride to default.
    //We will treat a non-empty embeddedTheme defined with the template�s URL (i.e. top window location) as an over-ride to any previous value.
    //If not provided, the �embedded� theme will be used.
    var embeddedThemeURLDecoded = '';
    var embeddedThemeURLEncoded = '';
    var wasDefaultThemeUsed = false;

    //Only get if embedded because we do not care otherwise.
    if (isEmbedded) {

        var wasEmbeddedThemeFromDOvr = false;

        // 1. Special over-ride case when we are dealing with a widget that was designed for purely embedded usage (i.e. EmbedContentListWidget.html).
        //These special case embedded only widgets will have the following variables defined:
        // - 1. The override_isEmbeddedTrue variable will exist in the widget indicating that it is an over-ride and takes precedence. The value must be true.
        // - 2. There may be a dft_embeddedTheme variable defined in widget and that is the default if no other embeddedTheme supplied.
        if (wasSpecialCaseEmbedOverride) {

            //Check attribute provided with widget�s parent URL in case the embedded widget was included in a parent and the
            //parent does not have the broker. For example, the EmbedContentListWidget.html widget is included in
            //the EmbedContentList.html page but the broker (p) is included in EmbedContentListWidget.html. In this case,
            //GetQueryVariable() looks at broker page (p = EmbedContentListWidget.html) and
            //GetLocalWindowQueryVariable() looks at this window (EmbedContentListWidget.html) but we need to look at
            //EmbedContentList.html page for URL.
            embeddedThemeURLEncoded = GetLocalWindowParentQueryVariable('embeddedTheme');
        }

        //2. Check attribute provided with template�s URL (i.e. top window location).  points to p = broker.
        if (embeddedThemeURLEncoded == null || embeddedThemeURLEncoded == '' || embeddedThemeURLEncoded === undefined) {
            embeddedThemeURLEncoded = GetQueryVariable('embeddedTheme');
        }

        //3.Check attribute provided with widget�s URL (i.e. local window location) if empty so far.
        if (embeddedThemeURLEncoded == null || embeddedThemeURLEncoded == '' || embeddedThemeURLEncoded === undefined) {
            embeddedThemeURLEncoded = GetLocalWindowQueryVariable('embeddedTheme');
        }

        //4. Check attribute provided with widget�s dataOverrides (uses attribute of iframe) if empty so far.
        if (embeddedThemeURLEncoded == null || embeddedThemeURLEncoded == '' || embeddedThemeURLEncoded === undefined) {
            if (objWidgetDataOverrides != null && objWidgetDataOverrides != '' && objWidgetDataOverrides !== undefined) {
                embeddedThemeURLEncoded = objWidgetDataOverrides.embeddedTheme;

                if (embeddedThemeURLEncoded != null && embeddedThemeURLEncoded != '' && embeddedThemeURLEncoded !== undefined) {
                    wasEmbeddedThemeFromDOvr = true;
                }
            }
        }

        // 5. Special case when we are dealing with a widget that was designed for purely embedded usage (i.e. EmbedContentListWidget.html).
        //These special case embedded only widgets will have the following variables defined:
        // - 1. The override_isEmbeddedTrue variable will exist in the widget indicating that it is an over-ride and takes precedence. The value must be true.
        // - 2. There may be a dft_embeddedTheme variable defined in widget and that is the default if no other embeddedTheme supplied.
        if (embeddedThemeURLEncoded == null || embeddedThemeURLEncoded == '' || embeddedThemeURLEncoded === undefined) {
            if (wasSpecialCaseEmbedOverride) {
                try {
                    //Use default defined in widget if available.
                    if (this.dft_embeddedTheme !== undefined && this.dft_embeddedTheme != null && this.dft_embeddedTheme != '') {
                        embeddedThemeURLEncoded = this.dft_embeddedTheme;
                        wasDefaultThemeUsed = true;
                    }
                }
                catch (err) {
                    //do nothing. the variable must have been undefined and browser threw exception.
                }
            }
        }

        //6. This is default if nothing defined.
        if (embeddedThemeURLEncoded == null || embeddedThemeURLEncoded == '' || embeddedThemeURLEncoded === undefined) {
            embeddedThemeURLEncoded = 'dark';
            wasDefaultThemeUsed = true;
        }

        //7. Decode if obtained from URL because should have been endoded for URL. Dataoverrides and default would not have been URL encoded.
        embeddedThemeURLDecoded = embeddedThemeURLEncoded;
        if (embeddedThemeURLDecoded != null && embeddedThemeURLDecoded != '' && embeddedThemeURLDecoded !== undefined && !wasEmbeddedThemeFromDOvr && !wasDefaultThemeUsed) {
            embeddedThemeURLDecoded = decodeURIComponent(embeddedThemeURLDecoded);
        }

    }


    //Get value for embeddedCategory.
    //
    //We will treat any embeddedCategory defined with the widget�s dataOverrides (uses attribute of iframe) as a default.
    //We will treat a non-empty embeddedCategory defined with the widget�s URL (i.e. local window location) as an over-ride to default.
    //We will treat a non-empty embeddedCategory defined with the template�s URL (i.e. top window location) as an over-ride to any previous value.
    //If not provided, defaults to ��.
    var embeddedCategoryURLDecoded = '';
    var embeddedCategoryURLEncoded = '';

    //Only get if embedded because we do not care otherwise.
    if (isEmbedded) {

        var wasEmbeddedCategoryFromDOvr = false;

        //1.  Check attribute provided with template�s URL (i.e. top window location).  points to p = broker.
        embeddedCategoryURLEncoded = GetQueryVariable('embeddedCategory');

        //2. .Check attribute provided with widget�s URL (i.e. local window location) if empty so far.
        if (embeddedCategoryURLEncoded == null || embeddedCategoryURLEncoded == '' || embeddedCategoryURLEncoded === undefined) {
            embeddedCategoryURLEncoded = GetLocalWindowQueryVariable('embeddedCategory');
        }

        //3. Check attribute provided with widget�s dataOverrides (uses attribute of iframe) if empty so far.
        if (embeddedCategoryURLEncoded == null || embeddedCategoryURLEncoded == '' || embeddedCategoryURLEncoded === undefined) {
            if (objWidgetDataOverrides != null && objWidgetDataOverrides != '' && objWidgetDataOverrides !== undefined) {
                embeddedCategoryURLEncoded = objWidgetDataOverrides.embeddedCategory;

                if (embeddedCategoryURLEncoded != null && embeddedCategoryURLEncoded != '' && embeddedCategoryURLEncoded !== undefined) {
                    wasEmbeddedCategoryFromDOvr = true;
                }
            }
        }

        if (embeddedCategoryURLEncoded == null || embeddedCategoryURLEncoded == '' || embeddedCategoryURLEncoded === undefined) {
            embeddedCategoryURLEncoded = '';
        }

        //4. Decode if obtained from URL because should have been endoded for URL. Dataoverrides would not have been URL encoded.
        embeddedCategoryURLDecoded = embeddedCategoryURLEncoded;
        if (embeddedCategoryURLDecoded != null && embeddedCategoryURLDecoded != '' && embeddedCategoryURLDecoded !== undefined && !wasEmbeddedCategoryFromDOvr) {
            embeddedCategoryURLDecoded = decodeURIComponent(embeddedCategoryURLDecoded);
        }
    }


    //Get value for attributesQueryStringText and attributesDataOverridesText.
    //

    //Get query string text needed if attributes will be addeded to URL.
    //Get text needed if attributes will be addeded to dataOverrides.
    var attributesQueryStringText = '';
    var attributesDataOverridesText = '';

    //Only get if embedded because we do not care otherwise.
    //Note: do not include theme if default used because if a theme is provided with widget or dataoverride and not the template URL, the
    //default could over-ride a lower level theme which we do not want. For example, if template not provided a theme but theme defined in template xml as
    //dataoverride to widget, the default theme would be used by the template renderer because widget not loaded yet and if the renderer
    //redirected to login page, we wouldn't want to have default theme added to URL because that would take precedence going forward.
    if (isEmbedded) {
        attributesQueryStringText += "&isEmbedded=true";
        attributesDataOverridesText += "isEmbedded: 'True'";
        if (embeddedThemeURLEncoded != null && embeddedThemeURLEncoded != '' && embeddedThemeURLEncoded !== undefined && !wasDefaultThemeUsed) {
            attributesQueryStringText += "&embeddedTheme=" + embeddedThemeURLEncoded;
            attributesDataOverridesText += ", embeddedTheme: '" + embeddedThemeURLDecoded + "'"; //use decoded version.
        }
        if (embeddedCategoryURLEncoded != null && embeddedCategoryURLEncoded != '' && embeddedCategoryURLEncoded !== undefined) {
            attributesQueryStringText += "&embeddedCategory=" + embeddedCategoryURLEncoded;
            attributesDataOverridesText += ", embeddedCategory: '" + embeddedCategoryURLDecoded + "'"; //use decoded version.
        }
    }

    //Return object.
    return { isEmbedded: isEmbedded, embeddedTheme: embeddedThemeURLDecoded, embeddedCategory: embeddedCategoryURLDecoded, attributesQueryStringText: attributesQueryStringText, attributesDataOverridesText: attributesDataOverridesText };
}


//searches a listbox for a given text string
function SearchList(inText, listBox) {

    var iCount;
    var regEx = new RegExp(inText, 'i');

    $(listBox).find('option:enabled').each(function (index) {
        if ($(this).text().match(regEx)) {
            listBox.selectedIndex = index;
            return false;  //returning false exits the Each Loop
        }
    });
}

///Searches through objects in a VBList
//and returns the requested field
function FindValueInVBList(vbListObj, objectKey, objectKeyValue, fieldToReturn) {

    for (var i = 0; i < vbListObj.Entities.length; i++) {
        var vbObj = vbListObj.Entities[i];
        if (vbObj[objectKey] == objectKeyValue) {
            return (vbObj[fieldToReturn]);
        }
    }

}

//returns a specific object in a VBList based on the passed in key/value
function FindObjectInVBList(vbListObj, objectKey, objectKeyValue) {

    for (var i = 0; i < vbListObj.Entities.length; i++) {
        var vbObj = vbListObj.Entities[i];
        if (vbObj[objectKey] == objectKeyValue) {
            return vbObj;
        }
    }

}

//given an array of objects, finds the object with the matching key
function FindObjectInArray(vbObjArray, objectKey, objectKeyValue) {

    for (var i = 0; i < vbObjArray.length; i++) {
        var vbObj = vbObjArray[i];
        if (vbObj[objectKey] == objectKeyValue) {
            return vbObj;
        }
    }

}

//This version will find the object within an object in array. Return the top level object.
//For example, if array has an object with a property called PresentationPresenter (objectPrimaryKey) and that object contains another object with a property called PresentationPresenterID (objectSubKey).
function FindObjectWithinObjectInArray(vbObjArray, objectPrimaryKey, objectSubKey, objectSubKeyValue) {
    for (var i = 0; i < vbObjArray.length; i++) {
        var vbObjPrimary = vbObjArray[i];
        var vbObjSub = vbObjPrimary[objectPrimaryKey];
        if (vbObjSub[objectSubKey] == objectSubKeyValue) {
            return vbObjPrimary;
        }
    }
}

//sorts a dropdown list by the text values
function SortDropDownListByText(ddlSelector) {
    $(ddlSelector).each(function () {

        $(this).html($("option", $(this)).sort(function (a, b) {
            return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
        }));

        $(ddlSelector + ' option:first-child').attr("selected", "selected");

    });
}



function LoadWidgetToContainer(widget, containerWidget, destination) {
    //var p = findGBroker(window); this is declared and set at top of maduro.js.
    p.gBroker.Publish('on-load-widget', {
        widget: widget,
        containerWidget: containerWidget,
        destination: destination
    });
}

//pulls the hostname out of a url string
// function GetURLHostname() {
//     var url = document.location.href;
//     var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
//     return url.match(re)[1].toString();
// }

function CheckForNotNull(item) {
    if (item != null && item != 'null') {
        return true;
    }
    return false;
}

function CheckForEmptyString(item) {
    if (item == '')
        return true;
    else
        return false;

}

/*
* Date Format 1.2.3
* (c) 2007-2009 Steven Levithan <stevenlevithan.com>
* MIT license
*
* Modifications:
*
*	P. Brunner	25-FEB-2011		Swapped format characters for month and minute
*								to make all format chars the same as .NET DateTimeFormatInfo.
*								New char meanings:
*								    M = month
*								    MM = 2 digit month
*								    MMM = abbreviated month name
*								    MMMM = full month name
*								    m = minute
*								    mm = 2 digit minute
*
* Includes enhancements by Scott Trenda <scott.trenda.net>
* and Kris Kowal <cixar.com/~kris.kowal/>
*
* Accepts a date, a mask, or a date and a mask.
* Returns a formatted version of the given date.
* The date defaults to the current date/time.
* The mask defaults to dateFormat.masks.default.
*/

var dateFormat = function () {
    var token = /d{1,4}|M{1,4}|yy(?:yy)?|([HhmsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
		    val = String(val);
		    len = len || 2;
		    while (val.length < len) val = "0" + val;
		    return val;
		};

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
			    d: d,
			    dd: pad(d),
			    ddd: dF.i18n.dayNames[D],
			    dddd: dF.i18n.dayNames[D + 7],
			    M: m + 1,
			    MM: pad(m + 1),
			    MMM: dF.i18n.monthNames[m],
			    MMMM: dF.i18n.monthNames[m + 12],
			    yy: String(y).slice(2),
			    yyyy: y,
			    h: H % 12 || 12,
			    hh: pad(H % 12 || 12),
			    H: H,
			    HH: pad(H),
			    m: M,
			    mm: pad(M),
			    s: s,
			    ss: pad(s),
			    l: pad(L, 3),
			    L: pad(L > 99 ? Math.round(L / 10) : L),
			    t: H < 12 ? "a" : "p",
			    tt: H < 12 ? "am" : "pm",
			    T: H < 12 ? "A" : "P",
			    TT: H < 12 ? "AM" : "PM",
			    Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
			    o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
			    S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
} ();

// Some common format strings
dateFormat.masks = {
    "default": "ddd MMM dd yyyy HH:mm:ss",
    shortDate: "M/d/yy",
    mediumDate: "MMM d, yyyy",
    longDate: "MMMM d, yyyy",
    fullDate: "dddd, MMMM d, yyyy",
    shortTime: "h:mm TT",
    mediumTime: "h:mm:ss TT",
    longTime: "h:mm:ss TT Z",
    isoDate: "yyyy-MM-dd",
    isoTime: "HH:mm:ss",
    isoDateTime: "yyyy-MM-dd'T'HH:mm:ss",
    isoUtcDateTime: "UTC:yyyy-MM-dd'T'HH:mm:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
    monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};

// Set the day and month names defined within the dateFormat function to their localized values.
function LocalizeDayMonthNamesForDateFormat(LocalDayNames, LocalAbbrevDayNames, LocalMonthNames, LocalAbbrevMonthNames) {
    for (var i = 0; i < 7; i++) {
        dateFormat.i18n.dayNames[i] = LocalAbbrevDayNames[i];
        dateFormat.i18n.dayNames[i + 7] = LocalDayNames[i];
    }
    for (var i = 0; i < 12; i++) {
        dateFormat.i18n.monthNames[i] = LocalAbbrevMonthNames[i];
        dateFormat.i18n.monthNames[i + 12] = LocalMonthNames[i];
    }
}



function Pause(millis) {
    var date = new Date();
    var curDate = null;

    do { curDate = new Date(); }
    while (curDate - date < millis);
}


function ShowSuccessMessage(message) {
    var messText = message;
    $('#alertText').text(messText);
    $('#alertFrame').slideDown(800);
    setTimeout(function () {
        $('#alertFrame').slideUp(800, function () { $('#alertFrame').hide(); });
    }, 3000);
}

//make sure div doesnt exist when going to a new page
try {
    //Put in try in case we cannot access top. The use of top needs to be corrected because �top� returns the topmost browser window and not the parent window of the widget
    //and if template embededded in a non-VEMS hosted site, this script may not have access to topmost browser window. SCR 3167.
    //p should already point to top.
    $('#alertAdminFrame', p.document).remove();
} catch (e) { ; }

function ShowAdminSuccessMessage(message) {
    var messText = message;
    var alertAdminDivBox = '<div id="alertAdminFrame" class="background2 color1 border border6"><div id="alertAdminText" class="appLogo">' + messText + '</div></div>';
    $('#templateContainer', p.document).prepend(alertAdminDivBox);

    $('#alertAdminFrame', p.document).slideDown(1000);
    setTimeout(function () {
        $('#alertAdminFrame', p.document).slideUp(1000, function () {
            $('#alertAdminFrame', p.document).remove();
        })
    }, 3000)

}

function ShowSuccessMessageInGivenElements(message, frameName, textFieldName) {
    var messText = message;
    var textFieldSelector = "#" + textFieldName;
    var frameSelector = "#" + frameName;
    $(textFieldSelector).text(messText);
    $(frameSelector).slideDown(800);
    setTimeout(function () {
        $(frameSelector).slideUp(800, function () { $(frameSelector).hide(); });
    }, 3000);
}

// function GetURLHostname() {
//     var url = document.location.href;
//     var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
//     return url.match(re)[1].toString();
// }

function validateInteger(intervalInput) {
    var intCheckExp = /(^-?\d\d*$)/;
    return intCheckExp.test(intervalInput);
}

function ValidatePortRange(value) {
    if (parseInt(value) >= 1 && parseInt(value) <= 65535) {
        return true;
    } else {
        return false; //not in range
    }
}

function ValidateIPaddress(inputText) {
    var ipformat = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
    if (inputText.match(ipformat))
        return true;
    else
        return false;
}

function IsPositiveInt(testNumber) {
    var trimmed = $.trim(testNumber);
    if (trimmed == null || trimmed == '')
        return false;
    if (isNaN(testNumber) || testNumber.toString().indexOf(".") >= 0)
        return false;
    if (testNumber < 0 || testNumber > 2147483647)
        return false;
    return true;
}

function strip(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText;
}

function LoadWidgetToMain(widget, mainContainerWidget) {
    p.gBroker.Publish('on-load-widget-main', {
        widget: widget,
        mainContainerWidget: mainContainerWidget
    });
}

function TestPasswordPolicy(string, pattern) {
    var policyRegex = pattern;
    if (policyRegex != null) {
        var password = string;

        if (password.search(policyRegex) == -1) {
            p.gBroker.Publish('on-error', {
                message: 'Warning: Entered password does not meet the password complexity policy.',
                severity: 'FATAL'
            });
        } else {
            p.gBroker.Publish('on-error', {
                message: 'Entered password meets the current password complexity policy',
                severity: 'INFORMATIONAL'
            });

        }
    }

}

//Return true/false we well as display error message.
function ValidateEmailAddressFormat(inputValue) {
    var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (inputValue != null && inputValue != '') {
        if (inputValue.search(emailPattern) == -1) {
            p.gBroker.Publish('on-error', {
                message: 'The email address is not in a valid format (example: somename@vbrick.com).',
                severity: 'VALIDATION'
            });
            return false;
        }
    }
    return true;
}

function MakeFeatured(contentID) {
    var vbContent = new MaduroDC.VBContent();
    vbContent.ContentID = contentID;
    var vbFeaturedContent = new MaduroDC.VBFeaturedContent();
    vbFeaturedContent.Content = vbContent;
    vbFeaturedContent.StartDate = new Date();
    vbFeaturedContent.EndDate = null;
    sll.FeaturedContentAdd(vbFeaturedContent, sessionID, featuredContentOnSuccess);
}

function AddToFavorites(contentID) {
    sll.FavoriteContentAdd(contentID, sessionID, favoriteOnSuccess);
}

function externalWindowContentOnSuccess(result) {
    if (!result.Exception) {
        var contentInfo = result;
        LogPlay(contentInfo);
        var winref;
        winref = window.open(contentInfo.ContentInstance.URL, 'DiscoveryEducation');
        winref.focus();
        return;
    }
    else {

        return;
    }

}

function LogPlay(contentInfo) {
    var vbContentInstance = new MaduroDC.VBContentInstance();
    vbContentInstance = contentInfo.ContentInstance
    p.gBroker.Publish('on-load-discovery-video', vbContentInstance);
}

function featuredContentOnSuccess(result) {
    if (!result.Exception) {
        if (!showLightBox) {
            p.gBroker.Publish('on-specify-video', {
                type: 'feat'
            });
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Video has been Featured',
                severity: 'INFORMATIONAL'
            });
        }
        return;
    }
    else {
        if (!showLightBox) {
            p.gBroker.Publish('on-specify-video', {
                type: 'alreadyfeat'
            });
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Video is already Featured',
                severity: 'INFORMATIONAL'
            });
        }
        return;
    }
}

function favoriteOnSuccess(result) {

    if (!result.Exception) {
        if (!showLightBox) {
            p.gBroker.Publish('on-specify-video', {
                type: 'fav'
            });
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Video has been added as a Favorite',
                severity: 'INFORMATIONAL'
            });
        }
        return;
    }
    else {
        if (!showLightBox) {
            p.gBroker.Publish('on-specify-video', {
                type: 'alreadyfav'
            });
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Video has already been Favorited',
                severity: 'INFORMATIONAL'
            });
        }
        return;
    }
}

function CloseRecommendBox() {
    if (!showLightBox) {
        CloseAlertWindow();
    }
    else {
        document.getElementById('lightUsers').style.display = 'none';
        document.getElementById('lightGroups').style.display = 'none';
        document.getElementById('fade').style.display = 'none';
    }
}

var recommendContentID;
function Recommend(contentID) {
    requiredMode = false;
    recommendContentID = contentID;
    if (!showLightBox) {
        p.gBroker.Publish('on-specify-video', {
            type: 'function',
            which: 'rec',
            id: recommendContentID
        });
    }
    else {

        document.getElementById('lightUsers').style.display = 'block';
        document.getElementById('fade').style.display = 'block';
    }
}

function RecommendedUser(contentID, userID) {
    requiredMode = false;
    recommendContentID = contentID;
    if (!showLightBox) {
        p.gBroker.Publish('on-specify-video', {
            type: 'function',
            which: 'recUser',
            id: recommendContentID,
            userID: userID
        });
    }
    else {

        document.getElementById('lightUsers').style.display = 'block';
        document.getElementById('fade').style.display = 'block';
    }
}

function RequiredUser(contentID, userID) {
    requiredMode = false;
    recommendContentID = contentID;
    if (!showLightBox) {
        p.gBroker.Publish('on-specify-video', {
            type: 'function',
            which: 'reqUser',
            id: recommendContentID,
            userID: userID
        });
    }
    else {

        document.getElementById('lightUsers').style.display = 'block';
        document.getElementById('fade').style.display = 'block';
    }
}

function SubmitUserGroupContentMain(userID, contentID) {
    var userChks = $('.recUser');
    var groupChks = $('.recGroup');
    var groupUserChks = $('.recGroupUser');

    if ($(".recUser:not(:checked)").length == 0 && $(".recGroup:not(:checked)").length == 0 && $(".recGroupUser:not(:checked)").length == 0) {
        var msg = 'Please unselect a User or Group to unrecommend this content to.'
        if (!isRec) {
            msg = 'Please unselect a User or Group to unrequire this content to.'
        }
        p.gBroker.Publish('on-error', {
            message: msg,
            severity: 'VALIDATION'
        });

        return false;
    }

    var userGroup = new MaduroDC.VBUserGroup();
    userGroup.ContentID = contentID;
    userGroup.Users = new Array();
    userGroup.Groups = new Array();
    userGroup.GroupUsers = new Array();

    $.each(userChks, function () {
        if (!$(this).attr('checked')) {
            userGroup.Users.push({ UserID: $(this).val() });
        }
    });

    $.each(groupChks, function () {
        if (!$(this).attr('checked')) {
            userGroup.Groups.push({ GroupID: $(this).val() });
        }
    });

    $.each(groupUserChks, function () {
        var grpID = $(this).attr('groupID');
        var parentGroup = $(".recGroup[value='" + grpID + "']");
        if (!$(this).attr('checked') && parentGroup.attr('checked')) {
            var users = new Array();
            users.push({ UserID: $(this).val() });
            userGroup.GroupUsers.push({ GroupID: $(this).attr('recommendedGroupID'), Users: users });
        }
    });
    if (isRec) {
        sll.UnRecommendContent(userGroup, userID, sessionID, UnRecommendContentSucess);
    }
    else {
        sll.UnRequireContent(userGroup, userID, sessionID, UnRequireContentSucess);
    }
}

function UnRecommendContentSucess(result) {
    if (result.Exception) {
        onFailure(result.Exception);
        return;
    }
    CloseRecommendBox();
    p.gBroker.Publish('on-unrecommend-done', {
        widget: 'MyRecommended',
        mainContainerWidget: 'myPageSpecialized',
        isRec: true
    });
}

function UnRequireContentSucess(result) {
    if (result.Exception) {
        onFailure(result.Exception);
        return;
    }
    CloseRecommendBox();
    p.gBroker.Publish('on-unrequire-done', {
        widget: 'MyRequired',
        mainContainerWidget: 'myPageSpecialized',
        isRec: false
    });
}
function SubmitUsersContent() {
    if (!requiredMode)
        SubmitRecommendUsers();
    else {
        SubmitRequiredUsers();
    }
}


function SubmitGroupsContent() {
    if (!requiredMode)
        SubmitRecommendGroups();
    else {
        SubmitRequiredGroups();
    }
}

function SubmitRequiredUsers() {

    if (!$("select#usersRecommended option:selected").length) {
        if (!showLightBox) {
            UpdateMessage('norecuser');
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Please select a User to require this content for.',
                severity: 'VALIDATION'
            });
        }
        return;
    }

    var selectedUserID = [];
    $('select#usersRecommended :selected').each(function (i, selected) {
        selectedUserID[i] = $(selected).val();
    });

    var vbRequiredContent = new MaduroDC.VBRequiredContent();
    var vbContent = new MaduroDC.VBContent();
    vbContent.ContentID = requiredContentID;
    vbRequiredContent.Content = vbContent;
    var totalDate = new Date();
    totalDate.setDate(totalDate.getDate() + 365);
    vbRequiredContent.ViewByDate = totalDate;
    sll.RequiredContentAddToUsers(vbRequiredContent, selectedUserID, sessionID, requiredContentOnSuccess);

}

function SubmitRequiredGroups() {

    if (!$("select#groupsRecommended option:selected").length) {
        if (!showLightBox) {
            UpdateMessage('norecgroup');
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Please select a Group to require this content for.',
                severity: 'VALIDATION'
            });
        }
        return;
    }

    var selectedGroupID = [];
    $('select#groupsRecommended :selected').each(function (i, selected) {
        selectedGroupID[i] = $(selected).val();
    });

    var vbRequiredContent = new MaduroDC.VBRequiredContent();
    var vbContent = new MaduroDC.VBContent();
    vbContent.ContentID = requiredContentID;
    vbRequiredContent.Content = vbContent;
    var totalDate = new Date();
    totalDate.setDate(totalDate.getDate() + 365);
    vbRequiredContent.ViewByDate = totalDate;
    sll.RequiredContentAddToGroups(vbRequiredContent, selectedGroupID, sessionID, requiredContentOnSuccess);

}


function SubmitRecommendUsers() {
    if (!$("select#usersRecommended option:selected").length) {
        if (!showLightBox) {
            UpdateMessage('norecuser');
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Please select a User to recommend this content to.',
                severity: 'VALIDATION'
            });
        }
        return;
    }

    var selectedUserID = [];
    $('select#usersRecommended :selected').each(function (i, selected) {
        selectedUserID[i] = $(selected).val();
    });

    var recommendedContent = new MaduroDC.VBRecommendedContent();
    var vbContent = new MaduroDC.VBContent();
    vbContent.ContentID = recommendContentID;
    recommendedContent.Content = vbContent;

    sll.RecommendedContentAddToUsers(recommendedContent, selectedUserID, sessionID, recommendContentOnSuccess);
}


function SubmitRecommendGroups() {
    if (!$("select#groupsRecommended option:selected").length) {
        if (!showLightBox) {
            UpdateMessage('norecgroup');
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Please select a Group to recommend this content to.',
                severity: 'VALIDATION'
            });
        }
        return;
    }

    var selectedGroupID = [];
    $('select#groupsRecommended :selected').each(function (i, selected) {
        selectedGroupID[i] = $(selected).val();
    });

    var recommendedContent = new MaduroDC.VBRecommendedContent();
    var vbContent = new MaduroDC.VBContent();
    vbContent.ContentID = recommendContentID;
    recommendedContent.Content = vbContent;

    sll.RecommendedContentAddToGroups(recommendedContent, selectedGroupID, sessionID, recommendContentOnSuccess);
}


function recommendContentOnSuccess(result) {

    if (!result.Exception) {
        if (!showLightBox) {
            UpdateMessage('rec');
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Video has been recommended',
                severity: 'INFORMATIONAL'
            });
        }
    }
    return;
}

var requiredContentID;
function MakeRequired(contentID) {
    requiredContentID = contentID;
    requiredMode = true;
    if (!showLightBox) {
        p.gBroker.Publish('on-specify-video', {
            type: 'function',
            which: 'req',
            id: requiredContentID
        });
    }
    else {

        document.getElementById('lightUsers').style.display = 'block';
        document.getElementById('fade').style.display = 'block';
    }
}

function LaunchControlDevice(cdName, cdType, cdCode, cdTemplate) {
    if (!showLightBox) {
        p.gBroker.Publish('on-specify-control-device', {
            type: 'function',
            which: 'controldevice',
            cdNameV: cdName,
            cdTypeV: cdType,
            cdCodeV: cdCode,
            cdTemplateV: cdTemplate
        });
    }
    else {

        document.getElementById('lightUsers').style.display = 'block';
        document.getElementById('fade').style.display = 'block';
    }
}

function requiredContentOnSuccess(result) {

    if (!result.Exception) {
        if (!showLightBox) {
            UpdateMessage('req');
        }
        else {
            p.gBroker.Publish('on-error', {
                message: 'Video has been marked as required',
                severity: 'INFORMATIONAL'
            });
        }
    }
    return;
}

function Navigate(template, destination) {
    if (!p) {
        var p = findGBroker(window);
    }
    p.gBroker.Publish('on-menu-navigate', {
        template: template,
        destination: destination
    });
}

function HTMLEncode(string) {
    return Encoder.htmlEncode(string, true);
}

function HTMLDecode(string) {
    return Encoder.htmlDecode(string);
}

//Get the standard time zone offset from UTC (not ADJUSTED for DST) and determine if DST honored.
//Only looks at current year.
//Returns object {doesSupportDaylightSavingTime, standardUtcOffsetInMinutes, daylightSavingTimeMonthBegin, daylightSavingTimeMonthEnd}
//Note: standardUtcOffsetInMinutes converted to correct sign (javascript had opposite sign).
//Note: daylightTransitionStartMonth and daylightTransitionEndMonth will be 0 if doesSupportDaylightSavingTime = false.
function GetStandardTimezoneUtcOffsetInfoForCurrentYear() {
    var doesSupportDaylightSavingTime = false;
    var standardUtcOffsetInMinutes;
    var daylightTransitionStartMonth = 0; //init
    var daylightTransitionEndMonth = 0; //init
    var priorGetTimezoneOffset = 0;

    //Check every month in year and get standard timezone offset from UTC.
    var testDate = new Date('1/1/' + (new Date().getFullYear()));
    standardUtcOffsetInMinutes = testDate.getTimezoneOffset();  // Note: getTimezoneOffset is opposite sign. in minutes.
    priorGetTimezoneOffset = standardUtcOffsetInMinutes;
    for (var month = 0; month < 12; month++) {
        testDate.setMonth(testDate.getMonth() + 1);
        if (testDate.getTimezoneOffset() > standardUtcOffsetInMinutes) {
            standardUtcOffsetInMinutes = testDate.getTimezoneOffset();
        }

        //Get start/end of DST.
        if (priorGetTimezoneOffset != testDate.getTimezoneOffset()) {
            doesSupportDaylightSavingTime = true;

            //The testDate is only for day 1 so the switch could have occurred at some point after day 1 in prior month.
            var dstDate = new Date(testDate);
            dstDate.setDate(dstDate.getDate() - 1);
            if (dstDate.getTimezoneOffset() != testDate.getTimezoneOffset()) {
                dstDate = testDate;
            }

            if (testDate.getTimezoneOffset() > priorGetTimezoneOffset) {
                daylightTransitionEndMonth = dstDate.getMonth() + 1;
            }
            else {
                daylightTransitionStartMonth = dstDate.getMonth() + 1;
            }
            priorGetTimezoneOffset = testDate.getTimezoneOffset();
        }
    }
    //Convert to correct sign.
    standardUtcOffsetInMinutes = standardUtcOffsetInMinutes * -1;
    return { doesSupportDaylightSavingTime: doesSupportDaylightSavingTime, standardUtcOffsetInMinutes: standardUtcOffsetInMinutes, daylightTransitionStartMonth: daylightTransitionStartMonth, daylightTransitionEndMonth: daylightTransitionEndMonth };
}

//Split seconds into hours, minutues, and seconds compontent for the seconds passed.
//i.e. 90 seconds translates into 1 minute 30 seconds.
//i.e. 3690 seconds translates into 1 hour 1 minute 30 seconds.
function SplitSecondsIntoHoursAndMinutesAndSeconds(someSeconds) {
    var hours = '';
    var minutes = '';
    var seconds = '';

    if (someSeconds == 0) {
        hours = 0;
        minutes = 0;
        seconds = 0;
    }
    else {
        if (someSeconds != null && someSeconds != '') {
            hours = Math.floor(someSeconds / 60 / 60);
            someSeconds = someSeconds % (60 * 60); //balance
            minutes = Math.floor(someSeconds / 60);
            seconds = Math.round(someSeconds % 60);
        }
    }

    return { hours: hours, minutes: minutes, seconds: seconds }
}

function ConvertTimeToSeconds(complexTime) {
    //debugger;
    var time = complexTime.split(':');
    var hours = parseInt(time[0], 10);
    var minutes = parseInt(time[1], 10);
    var seconds = parseInt(time[2], 10);
    var totalTime = 0;

    if (hours != 0)
        totalTime += (hours * 60 * 60);
    if (minutes != 0)
        totalTime += (minutes * 60);
    totalTime += seconds;

    return totalTime;

}

//Convert the passed value to a boolean value if not already a boolean value.
//Logic:
//	true, yes, 1, will return true
//	false, no, 0 will return false
//	default is false so anything not expected will return false
function ConvertValueToBoolean(someValue) {
    var booleanValue = false; //default

    if (someValue === true) {
        //A boolean true already.
        booleanValue = true;
    }
    else if (someValue === false) {
        //A boolean false already.
        booleanValue = false;
    }
    else {
        if (someValue != null && someValue != '' && someValue !== undefined) {
            switch (someValue.toString().toLowerCase()) {
                case 'true':
                case 'yes':
                case '1':
                    booleanValue = true;
                    break;
                case 'false':
                case 'no':
                case '0':
                    booleanValue = false;
                    break;
                default:
                    booleanValue = false;
                    break;
            }
        }
    }
    return booleanValue;
}

function Shorten(title, num) {
    if (title != null)
        var contentText = title;
    else
        var contentText = '';
    if (contentText.length > num)
        contentText = contentText.substring(0, num) + "...";
    return contentText;
}

function ShortenR(title, num) {
    var contentText = '';
    if (title != null)
        contentText = title;
    if (contentText.length > num)
        contentText = "..." + contentText.substring(contentText.length - num);
    return contentText;
}

// Convert from seconds to milliseconds for VBPlayer
function ConvertDurationToMillsec(url) {
    var dur = "duration";
    dur = dur.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + dur + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var durValue = regex.exec(url);
    var newdur;
    if (durValue != null) {
        durValue = decodeURIComponent(durValue[1].replace(/\+/g, " "));
        newdur = durValue * 1000000;
        url = url.replace("duration=" + durValue, "duration=" + newdur);
    }
    return url;
}

function RemoveLicenseFromWMEnteredURL(url) {
    if (url.toLowerCase().indexOf("&license=") > -1) {
        var x = url.split("&license=");
        url = x[0];
    }
    return url;
}

function CorrectURLForQT(url) {

    //remove license and all other QS
    if (url.toLowerCase().indexOf("&") > -1) {
        var x = url.split("&");
        url = x[0];
    }

    //coerce protocol to non-VB
    if (url.toLowerCase().lastIndexOf("vb", 0) === 0) url = url.substring(2);
    return url;
}

function UserLoadPresentation(contentID) {
    //var p = findGBroker(window); this is declared and set at top of maduro.js.
    if (isiPad) {
        p.TemplateNavigator.init('iPadPresentationMetadataTemplate.xml&contentID=' + contentID);
        p.TemplateNavigator.navigate(GetSessionID());
    }
    else {
        p.TemplateNavigator.init('PresentationMetadataTemplate.xml&contentID=' + contentID);
        p.TemplateNavigator.navigate(GetSessionID());
    }

}

function UseriPadLoadPresentation(contentID) {
    //var p = findGBroker(window); this is declared and set at top of maduro.js.
    p.TemplateNavigator.init('iPadPresentationMetadataTemplate.xml&contentID=' + contentID);
    p.TemplateNavigator.navigate(GetSessionID());
}

function UserLoadViewerPresentation(contentID, PresentationID) {
    //var p = findGBroker(window); this is declared and set at top of maduro.js.
    $.cookie('fromURLLocSrc', null);
    $.cookie('fromURLLocSrc', p.document.location.href);
    p.TemplateNavigator.init('PresentationRecordedViewerTemplate.xml&contentID=' + contentID + '&presentationID=' + PresentationID);
    p.TemplateNavigator.navigate(GetSessionID());
}

function ConvertNullToEmptyString(textValue) {
    if (textValue == null) {
        return '';
    }
    else {
        return textValue;
    }
}
//////////////////TIME FORMATTING HELPER///////////////////
function TimeFormatter(t) {
    if (isNaN(t)) {
        t = "00:00:00";
    }
    else {

        sec = Math.floor(t);
        hours = padder(Math.floor(sec / 3600));
        minutes = padder(Math.floor((sec % 3600) / 60));
        seconds = padder((sec % 3600) % 60);
        t = hours + ":" + minutes + ":" + seconds;
    }
    return t;
}
function padder(num) {

    num = num + "";
    if (num.length == 1) {
        num = "0" + num;
    }
    return num;
}
function ClipDuration(start, end) {

    var t = (end - start);
    if (isNaN(t)) {
        t = "0:00:00";
    }
    else {
        t = TimeFormatter(t);
    }
    return t;
}

//Cloud Smart Tag generation.
//url: URL for Cloud Smart Tag generation.
//containerID: ID for container that will have innerHTML replaced with player embed code.
//isAutoPlayback: should playback start automatically when player loaded?
function GenerateVideoCloudSmartTag(url, containerID, isAutoPlayback) {
    //If the video is from the Cloud VOD, we need to replace some additional tokens.
    //The URL is actually a Smart Tag URL that will make a call to Cloud service and the service will
    //update the innerHTML for the {LocalHTMLPlayerContainerID} element in the client's HTML form
    //with the embed code to play the video based on client capability.
    //The {LocalHTMLPlayerContainerID} token can only be set in the client based on ID for player container.
    //{CloudSmartTagBaseURL} = Cloud VOD Service Smart Tag base URL - already set in URL.
    //{CloudApplicationID} = Cloud VOD Service Application ID - already set in URL.
    //{FileName} = Cloud Asset ID - already set in URL
    //Sample: {CloudSmartTagBaseURL}/applications/{CloudApplicationID}/assets/{FileName}/containers/{LocalHTMLPlayerContainerID}/smarttag.js

    //The implementation of smart tag works as follows:
    //1. Define a div that will be container for the player embed code.
    //2. Define javascript with a source = the URL we are setting here.
    var headID = document.getElementsByTagName("head")[0];
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    var newUrl = url.replace(/{LocalHTMLPlayerContainerID}/i, containerID) + "?height=100%&width=100%";
    if (isAutoPlayback) {
        newUrl = newUrl + "&autoPlayback=true";
    }
    newUrl = encodeURI(newUrl); //must encode.
    newScript.src = newUrl;
    headID.appendChild(newScript);
}

//for admin height - TD updated 5/29/12
function adjustAdminFrameHeight(heightValue) {

    var filterWidgetHeight = parseInt(heightValue) + 5;
    if (filterWidgetHeight < 675)
        $('#adminMain', p.document).css('height', '725px');
    else
        $('#adminMain', p.document).css('height', filterWidgetHeight + 'px');
}

function LoadContentInExternalWindow(contentID) {
    sll.PlayContentLoadWithPlayerController(contentID, sessionID, false, "", externalWindowContentOnSuccess);
}

function ShowAllDetail(type, contentID, OtherContentID, showControlDevice, fromPage) {
    if (!allowShowDetail)
        return;

    $.cookie('fromURLLocSrc', null);
    $.cookie('fromURLLocSrc', p.document.location.href);
    if (anchorTag != '')
        $.cookie('LinkAnchor', anchorTag);

    if (typeof (selectedTab) != "undefined" && selectedTab != '')
        $.cookie('seletedTabWidget', selectedTab);

    if (contentID == 'NONE')
        p.gBroker.Publish('on-error', { message: ProcessLocalizedStringSingle('<$/Templates/UserTemplatePlayerless/Widgets/ContentListWidget/NoItemsInPlaylistMessage$>') + '<br/>' + ProcessLocalizedStringSingle('<$/Templates/UserTemplatePlayerless/Widgets/ContentListWidget/AddNewOrContactAdminPlaylistMessage$>'), severity: 'WARNING' });
    else if (contentID == 'AON')
        p.gBroker.Publish('on-error', { message: ProcessLocalizedStringSingle('<$/Templates/UserTemplatePlayerless/Widgets/ContentListWidget/CanNotPlayAONPlaylist$>'), severity: 'WARNING' });
    else if (type == 'pop') {
        PopOutCanvasControl(contentID);
    }
    else {
        switch (type) {
            case 'normal':
                if (isiPad)
                    p.TemplateNavigator.init('iPadVideoInfoTemplate.xml&contentID=' + contentID);
                else {
                    var embeddedAttributes = GetEmbeddedAttributesForCurrentTemplateWidget();
                    if (embeddedAttributes.isEmbedded)
                        p.TemplateNavigator.init(GetCurrentTemplate() + '&contentID=' + contentID, embeddedAttributes);
                    else {
                        if (showControlDevice) {
                            p.TemplateNavigator.init('VideoInfoTemplate.xml&contentID=' + contentID + '&sd=1', embeddedAttributes);
                        }
                        else {
                            p.TemplateNavigator.init('VideoInfoTemplate.xml&contentID=' + contentID, embeddedAttributes);
                        }
                    }
                }
                break;
            case 'presentation':
                if (fromPage == 'landing') {
                    p.TemplateNavigator.init('PresentationMetadataTemplate.xml&contentID=' + contentID + '&fp=0');
                }
                else if (fromPage == 'myVideos') {
                    p.TemplateNavigator.init('PresentationMetadataTemplate.xml&contentID=' + contentID + '&fp=1');
                }
                else {
                    p.TemplateNavigator.init('PresentationMetadataTemplate.xml&contentID=' + contentID);
                }
                break;
            case 'ipadPresentation':
                p.TemplateNavigator.init('iPadPresentationMetadataTemplate.xml&contentID=' + contentID);
                break;
            case 'recordedPresentation':
                p.TemplateNavigator.init('PresentationRecordedViewerTemplate.xml&contentID=' + contentID + '&presentationID=' + OtherContentID);
                break;
            case 'clip':
                p.TemplateNavigator.init('VideoInfoTemplate.xml&contentID=' + OtherContentID + '&clipContentID=' + contentID);
                break;
            case 'playlist':
                p.TemplateNavigator.init('VideoInfoPlaylistTemplate.xml&contentID=' + contentID);
                break;
            case 'lyncMeeting':
                p.TemplateNavigator.init('LyncMeetingTemplate.xml&contentID=' + contentID);
                p.TemplateNavigator.navigateToLync();
                return;
                break;
        }
        p.TemplateNavigator.navigate();
    }
}

var IsCanvasWindowLoaded = true;
var persistentWindowCheck;
function PopOutCanvasControl(ID, activityID) {
    var embeddedAttributes = GetEmbeddedAttributesForCurrentTemplateWidget();

    if (!$.cookie('popWindowGrid')) {
        if (IsCanvasWindowLoaded) {
            IsCanvasWindowLoaded = false;
            clearInterval(persistentWindowCheck);
            //$.cookie('popWindowExists', true);

            //canvasWindow = window.open(protocol + GetURLHostname() + '/VEMSWeb/VEMSHost.html?VBTemplate=Templates/VideoCanvasTemplate.xml', 'vbPlayerCanvas', 'width=' + screen.width + ', height=' + screen.height + ', scrollbars=yes, resizable=yes, top=0, left=0');

            if ($.cookie('AnonymousSessionId')) {
                if (embeddedAttributes.attributesQueryStringText == '') {
                    embeddedAttributes.attributesQueryStringText = '?anonymous=1';
                }
                else {
                    embeddedAttributes.attributesQueryStringText += '&anonymous=1';
                }
            }

            if (typeof activityID !== "undefined")
                canvasWindow = window.open(protocol + GetURLHostname() + '/VEMSWeb/VEMSHost.html?VBTemplate=Templates/VideoCanvasTemplate.xml' + embeddedAttributes.attributesQueryStringText + '&contentID=' + ID + '&aid=' + activityID, '_blank', 'width=553, height=419, scrollbars=no, menubar=no, status=no, titlebar=no, toolbar=no, resizable=yes, top=0, left=0');
            else
                canvasWindow = window.open(protocol + GetURLHostname() + '/VEMSWeb/VEMSHost.html?VBTemplate=Templates/VideoCanvasTemplate.xml' + embeddedAttributes.attributesQueryStringText + '&contentID=' + ID, '_blank', 'width=553, height=419, scrollbars=no, menubar=no, status=no, titlebar=no, toolbar=no, resizable=yes, top=0, left=0');

            persistentWindowCheck = setInterval('if (($(\'#playerCanvas\', canvasWindow.window.document.body).attr(\'class\') != undefined) && (!IsCanvasWindowLoaded)) { ' +
			'$(\'#playerCanvas\', canvasWindow.window.document.body).append(\'<div style="float:left; margin:-40px 10px 10px 0;width:100%;height:100%;"><iframe src="Widgets/VideoPlayerControllerWidget.html" dataOverrides="{ hidePlayerControls: \\\'False\\\', videoHeight: \\\'295\\\', videoWidth:\\\'533\\\', useTrafficCop: \\\'false\\\', canvasContentID: \\\'' + ID + '\\\' }" commoncssfile="../Styles/user.css" scrolling="no" frameborder="0" style="visibility:hidden; margin:0; padding:0; height:100%; width:100%;"></iframe></div>\'); ' +
			'IsCanvasWindowLoaded = true; }', 500);
        }
    }
    else {
        clearInterval(persistentWindowCheck);
        canvasWindow = window.open('', 'vbPlayerCanvas');
        $('#playerCanvas', canvasWindow.window.document.body).append('<div style="float:left; margin:-40px 10px 10px 0;width:100%;height:100%;"><iframe src="Widgets/VideoPlayerControllerWidget.html" dataOverrides="{ hidePlayerControls: \'False\', videoHeight: \'295\', videoWidth:\'533\', useTrafficCop: \'false\', canvasContentID: \'' + ID + '\' }" commoncssfile="../Styles/user.css" scrolling="no" frameborder="0" style="visibility:hidden; margin:0; padding:0; height:100%; width:100%;"></iframe></div>');
        canvasWindow.focus();
    }
}

function RedirectToMobilePage(page, queryParams) {
    var url;
    var i = 0;
    var queryString = '';
    if (queryParams != null) {
        $.each(queryParams, function (key, value) {
            if (i == 0) {
                queryString += '?' + key + '=' + value;
                i = 1;
            }
            else {
                queryString += '&' + key + '=' + value;
            }
        });
    }
    switch (page) {
        case 'metadata':
            window.location.replace(protocol + GetURLHostname() + '/VEMSWeb/Widgets/IPadPresentationMetadata.html' + queryString);
            break;
        case 'login':
            window.location.replace(protocol + GetURLHostname() + '/VEMSWeb/Widgets/IPadLogin.html' + queryString);
            break;
        case 'home':
            window.location.replace(protocol + GetURLHostname() + '/VEMSWeb/Widgets/MobileHome.html' + queryString);
            break;
        case 'myVideos':
            window.location.replace(protocol + GetURLHostname() + '/VEMSWeb/Widgets/MyVideosMobile.html' + queryString);
            break;
        case 'allVideos':
            window.location.replace(protocol + GetURLHostname() + '/VEMSWeb/Widgets/ContentListWidgetiPad.html' + queryString);
            break;
        case 'videoInfo':
            window.location.replace(protocol + GetURLHostname() + '/VEMSWeb/Widgets/MobileVideoInfoWidget.html' + queryString);
            break;
        case 'viewer':
            window.location.replace(protocol + GetURLHostname() + '/VEMSWeb/Widgets/IPadLiveWebcast.html' + queryString);
    }
}

function ShowAllDetailMobile(type, contentID, OtherContentID, showControlDevice, fromPage) {
    if (!allowShowDetail)
        return;

    if (contentID == 'NONE')
        p.gBroker.Publish('on-error', { message: ProcessLocalizedStringSingle('<$/Templates/UserTemplatePlayerless/Widgets/ContentListWidget/NoItemsInPlaylistMessage$>') + '<br/>' + ProcessLocalizedStringSingle('<$/Templates/UserTemplatePlayerless/Widgets/ContentListWidget/AddNewOrContactAdminPlaylistMessage$>'), severity: 'WARNING' });
    else if (contentID == 'AON')
        p.gBroker.Publish('on-error', { message: ProcessLocalizedStringSingle('<$/Templates/UserTemplatePlayerless/Widgets/ContentListWidget/CanNotPlayAONPlaylist$>'), severity: 'WARNING' });
    else {
        switch (type) {
            case 'normal':
                if (showControlDevice) {
                    RedirectToMobilePage('videoInfo', { contentID: contentID, sd: 1, frompg: fromPage });
                }
                else {

                    RedirectToMobilePage('videoInfo', { contentID: contentID, sd: 1, frompg: fromPage });

                }
                break;
            case 'presentation':
                if (fromPage == 'landing') {
                    RedirectToMobilePage('metadata', { contentID: contentID, fp: 0 });
                }
                else if (fromPage == 'myVideos') {
                    RedirectToMobilePage('metadata', { contentID: contentID, fp: 1 });
                }
                else {
                    RedirectToMobilePage('metadata', { contentID: contentID });
                }
                break;
            case 'clip':
                RedirectToMobilePage('videoInfo', { contentID: OtherContentID, clipContentID: contentID });
                //p.TemplateNavigator.init('VideoInfoTemplate.xml&contentID=' + OtherContentID + '&clipContentID=' + contentID);
                break;
            case 'playlist':
                //p.TemplateNavigator.init('VideoInfoPlaylistTemplate.xml&contentID=' + contentID);
                break;
        }
    }
}

function MobileInitTheme() {
    if (!$.cookie('defaultTheme'))
        sll.ThemeGetActive(GetApplicationID(), MobileThemeGetActiveOnSuccess);
    else
        ManageTheme();
}

function MobileThemeGetActiveOnSuccess(result) {
    if (result.Exception) {
        onFailure(result.Exception);
        return;
    }
    var active = result.Name;
    $.cookie('defaultTheme', active.split(' ').join('-'), { path: '/' });
    if (!$.cookie('activeThemeID'))
        $.cookie('activeThemeID', result.ThemeID, { path: '/' });

    ManageTheme();
}

function GetZonalEntryPoint(appserver) {
    var zonalAppServerEntryPoint = null;
    if (appserver.FtpEntryPointIndex != 0) {
        $.each(appserver.AppServerEntryPoints, function () {
            if (this.AppServerEntryPointID == appserver.FtpEntryPointIndex) {
                zonalAppServerEntryPoint = this;
            }
        });
    }
    else {
        zonalAppServerEntryPoint = appserver.AppServerEntryPoints[0];
    }
    return zonalAppServerEntryPoint;
}

function htmlEncode(value) {
    if (value) {
        return jQuery('<div />').text(value).html();
    } else {
        return '';
    }
}

function TextAreaHTMLEncode(value) {
    if (value) {
        return jQuery('<div />').text(value).html();
    }
    else {
        return '';
    }
}

function URLHTMLEncode(string) {
    return Encoder.URLhtmlEncode(string, true);
}

function htmlDecode(value) {
    if (value) {
        return $('<div />').html(value).text();
    } else {
        return '';
    }
}

function InitAntiXSS() {

    $('input[type=text]').not(".urlInput").each(function (index) {
        $(this).change(function () {
            $(this).val(htmlEncode($(this).val()));
        });
    });

    $('input[type=text]').not(".urlInput").live('change', function () {
        $(this).val(htmlEncode($(this).val()));
    });


    $(".urlInput").each(function (index) {
        $(this).change(function () {
            $(this).val(URLHTMLEncode($(this).val()));
        });
    });

    $(".urlInput").live('change', function () {
        $(this).val(URLHTMLEncode($(this).val()));
    });


    $('textarea').not(".inputBig").live('change', function () {
        $(this).val(TextAreaHTMLEncode($(this).val()));
    });

    $(".txtBox").not('input[type=password]').each(function (index) {
        $(this).change(function () {
            $(this).val(TextAreaHTMLEncode($(this).val()));
        });
    });
    $(".txtBox").not('input[type=password]').live('change', function () {
        $(this).val(TextAreaHTMLEncode($(this).val()));
    });

}
