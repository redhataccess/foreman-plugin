/*global angular, $scope */

(function() {
    'use strict';

    angular.module('RedhatAccessInsights')
        .controller('ConfigurationCtrl', ['$scope', '$http', 'ConfigurationService', 'SAT_CONFIG',
            function($scope, $http, ConfigurationService ,SAT_CONFIG) {
                $scope.loading = true;
                $scope.creds = {};
                $scope.env = {
                  enableBasicAuth : SAT_CONFIG.enableBasicAuth
                };
                $scope.config = {};
                $scope.load = function() {
                    ConfigurationService.getConfig().success(function(data) {
                        //$scope.index();
                        $scope.loading = false;
                        $scope.config = data;
                        $scope.original = angular.copy(data);
                        console.log("Loaded...");
                    });
                };
                $scope.update = function() {
                    $scope.loading = true;
                    ConfigurationService.postConfig($scope.config).success(function() {
                        //$scope.index();
                        $scope.loading = false;
                        $scope.original = angular.copy($scope.config);
                        console.log("Saved...");
                    });
                };
                $scope.disableUpdateButton = function() {
                    return $scope.loading || angular.equals($scope.config, $scope.original);
                };
                $scope.load();
            }
        ]);
}());
