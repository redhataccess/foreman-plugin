angular.module('RedhatAccess.strata', ['ui.bootstrap']).service('strataService', ['$modal',
    function($modal) {

        var modalDefaults = {
            backdrop: true,
            keyboard: true,
            modalFade: true,
            templateUrl: '/assets/redhat_access/strata/login_form.html'
        };

        var modalOptions = {
            closeButtonText: 'Close',
            actionButtonText: 'OK',
            headerText: 'Proceed?',
            bodyText: 'Perform this action?',
            backdrop:'static'
        };

        this.login = function() {
            return this.showLogin(modalDefaults, modalOptions);
        };

        this.showLogin = function(customModalDefaults, customModalOptions) {
            //Create temp objects to work with since we're in a singleton service
            var tempModalDefaults = {};
            var tempModalOptions = {};
            //Map angular-ui modal custom defaults to modal defaults defined in service
            angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);
            //Map modal.html $scope custom properties to defaults defined in service
            angular.extend(tempModalOptions, modalOptions, customModalOptions);
            if (!tempModalDefaults.controller) {
                tempModalDefaults.controller = function($scope, $modalInstance) {
                    $scope.user = {
                        user: null,
                        password: null
                    };
                    $scope.modalOptions = tempModalOptions;
                    $scope.modalOptions.ok = function(result) {
                        //console.log($scope.user);
                        strata.setCredentials($scope.user.user,$scope.user.password);
                        $scope.user.password='';
                        $modalInstance.close($scope.user);
                    };
                    $scope.modalOptions.close = function(result) {
                        $modalInstance.dismiss('cancel');
                    };
                };
            }

            return $modal.open(tempModalDefaults).result;
        };

        this.strata = function() {
            return strata;
        };

    }
]);