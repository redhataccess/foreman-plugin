angular.module('RedhatAccess.strata').directive('loginStatus', function() {
    return {
        restrict: 'AE',
        scope: false,
        templateUrl: '/assets/redhat_access/strata/login_status.html'
    };
});