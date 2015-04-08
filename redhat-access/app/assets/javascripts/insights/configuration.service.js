/*global angular, $scope */

(function() {
    'use strict';

    var conf_url = '/redhat_access/telemetry_configuration';

    angular.module('RedhatAccessInsights').factory('ConfigurationService', ['$http', function($http) {

        var postConfig = function(data) {
            return $http.put(conf_url, data);
        };

        var getConfig = function() {
            return $http.get(conf_url);
        };
        return{
            getConfig : getConfig,
            postConfig : postConfig
        };
    }]);
}());
