/*global angular, $scope */

(function() {
    'use strict';

    var conf_url = '/redhat_access/telemetry_configuration';

    angular.module('Bastion.insights').factory('ConfigurationService', ['$http', function($http) {

        var postConfig = function(data) {
            return $http.put(conf_url, data);
        };

        var getConfig = function() {
            return $http.get(conf_url);
        };

        var getAccountInfo = function(){
           return $http.get('/redhat_access/r/insights/view/api/'+ 'me');
        };

        return{
            getConfig : getConfig,
            postConfig : postConfig,
            getAccountInfo : getAccountInfo
        };
    }]);
}());
