/*global angular, $scope */

(function() {
    'use strict';

    angular.module('Bastion.insights')
        .controller('ConfigurationCtrl', ['$scope', '$http', 'ConfigurationService',
            function($scope, $http, ConfigurationService) {
                $scope.loading = true;
                $scope.accountLoading = true;
                $scope.env = {
                    enableBasicAuth: false
                };
                $scope.config = {};
                $scope.portalAccount = {};
                $scope.load = function() {
                    ConfigurationService.getConfig().success(function(data) {
                        //$scope.index();
                        $scope.loading = false;
                        $scope.config = data;
                        $scope.originalConfig = angular.copy(data);
                        //console.log("Loaded...");
                    });
                };
                $scope.update = function() {
                    $scope.loading = true;
                    ConfigurationService.postConfig($scope.config).success(function() {
                        //$scope.index();
                        $scope.loading = false;
                        $scope.originalConfig = angular.copy($scope.config);
                        $scope.getAccountInfo();
                    }).error(function(response) {
                        $scope.getAccountInfo();
                    })

                };
                $scope.disableUpdateButton = function() {
                    return $scope.loading || angular.equals($scope.config, $scope.originalConfig);
                };

                $scope.getAccountInfo = function() {
                    $scope.accountLoading = true;
                    ConfigurationService.getAccountInfo().success(function(data) {
                        $scope.portalAccount = data;
                        $scope.accountLoading = false;
                    }).
                    error(function(data, status, headers, config) {
                        $scope.accountLoading = false;
                        $scope.portalAccount = {
                            connectionStatus: data.connectionStatus,
                            account: 'Unknown',
                            company: 'Unknown'
                        }
                    });
                };

                $scope.showConnectionStatus = function() {
                    return $scope.originalConfig ? $scope.originalConfig.enable_telemetry : false ;
                };


                $scope.load();
                $scope.getAccountInfo();
            }
        ]);
}());
