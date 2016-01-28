/*global angular, $scope */

(function() {
    'use strict';

    var conf_url = '/redhat_access/telemetry_configuration';

    angular.module('RedhatAccessInsights').factory('ConfigurationService', ['$http','InsightsConfig', function($http,InsightsConfig) {

        var postConfig = function(data) {
            return $http.put(conf_url, data);
        };

        var getConfig = function() {
            return $http.get(conf_url);
        };

        var getAccountInfo = function(){
           return $http.get(InsightsConfig.apiRoot + 'me');
        };

        return{
            getConfig : getConfig,
            postConfig : postConfig,
            getAccountInfo : getAccountInfo
        };
    }]);
}());
