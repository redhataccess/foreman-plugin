/*global angular $scope */

(function () {
    'use strict';

    var creds_url = '/redhat_access/proactive_support/strata_credentials';

    angular.module('Telemetry').controller('CredentialsCtrl', function ($scope, $http) {
        $scope.stored = false;
        $scope.creds = {};

        $scope.clear_store = function () {
            $http.delete(creds_url + "/1").success(function (data) {
                $scope.creds = data;
            });
        };

        $scope.index = function () {
            $http.get(creds_url).success(function (data) {
                data.stored = true;
                $scope.creds = data;
            });
        };

        $scope.create = function () {
            $http.post(creds_url, $scope.creds).success(function () {
                $scope.index();
            });
        };

        $scope.index();
    });
}());
