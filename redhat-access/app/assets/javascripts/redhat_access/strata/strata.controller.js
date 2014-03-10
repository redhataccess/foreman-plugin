angular.module('RedhatAccess.strata').controller('StrataController', ['$scope', 'strataService',
    function($scope, strataService) {

        $scope.isLoggedIn = false;
        $scope.loggedInUser = '';

        strata.checkLogin(loginHandler);

        function loginHandler(result, authedUser) {

            if (result) {
                console.log("Authorized!");
                $scope.$apply(function() {
                    $scope.isLoggedIn = true;
                    //$scope.loggedInUser = strataService.getLoggedInUserName();
                    $scope.loggedInUser = authedUser.name
                });
            } else {
                $scope.$apply(function() {
                    $scope.isLoggedIn = false;
                    $scope.loggedInUser = '';
                });
            }
        };

        $scope.login = function() {
            strataService.login().then(function(authedUser) {
                if (authedUser) {
                    $scope.isLoggedIn = true;
                    $scope.loggedInUser = authedUser.name;
                }
            });

        };

        $scope.logout = function() {
            strata.clearCredentials();
            $scope.isLoggedIn = false;
        };


    }
]);