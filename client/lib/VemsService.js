'use strict'

migrateApp.factory('VemsService', ['$resource', '$http','$q',  function ($resource,$http, $q) {

	var VemsService = {};
	var urlBase = 'http://localhost:8000/api';

	VemsService.init = function (url) {
		urlBase = url + '/api';
	};

	VemsService.getDMEContent = function(url, data) {
		return callApi(url, data,  'POST');
	};
	VemsService.insertUpdateContentCustomField = function(url, data) {
			return callApi(url, data,  'POST');
		};

	VemsService.getContentThumbnail = function(url,data){
			return callApi(url, data,  'POST');
	};

	VemsService.getContentLinks = function(url,data){
			return callApi(url, data,  'POST');
	};

	VemsService.getContentComments = function(url,data){
			return callApi(url, data,  'POST');
	};

	VemsService.loginToVems = function(url,data){
			return callApi(url, data,  'POST');
	};

	VemsService.logoutFromVems = function(url,data){
			return callApi(url, data,  'POST');
	};
	VemsService.contentUploadDateTime = function(url,data){
			return callApi(url, data,  'POST');
	};

    VemsService.vemsCustomFields = function(url,data){
			return callApi(url, data,  'POST');
	};

	function callApi (url, data, type) {
		return $http({
			method: type,
			url: urlBase + url,
			data:  data,
			headers: {
				'Content-Type': 'application/json;charset=utf-8'
			}
		});
	}
	return VemsService;
}]);
