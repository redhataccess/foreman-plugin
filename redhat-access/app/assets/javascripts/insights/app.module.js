(function() {
    'use strict';
    angular.module('RedhatAccessInsights', [
            'ui.router',
            'ui.bootstrap',
            'insights',
            'templates'
        ])
        .config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', '$provide',
            function($httpProvider, $stateProvider, $urlRouterProvider, $locationProvider, $provide) {
                $httpProvider.defaults.headers.common = {
                    'X-CSRF-TOKEN': $('meta[name=csrf-token]').attr('content')
                };
                $provide.factory('AuthInterceptor', ['$injector',
                    function($injector) {
                        return {
                            responseError: function(response) {
                                var $q = $injector.get('$q');
                                var $window = $injector.get('$window');
                                if (response.status === 401) {
                                    $window.location.reload();
                                } else
                                if (response.status === 403) {
                                    var message = 'You are not authorized to perform this action.';
                                    response.data.errors = [message];
                                    response.data.displayMessage = message;
                                    $window.location.href = '/katello/403';
                                }
                                return $q.reject(response);
                            }
                        };
                    }
                ]);
                $httpProvider.interceptors.push('AuthInterceptor');
                $stateProvider.state('manage', {
                    url: '/manage',
                    templateUrl: 'insights/views/configuration.html',
                    controller: 'ConfigurationCtrl'
                });
                $stateProvider.state('nohosts', {
                    url: '/nohosts',
                    templateUrl: 'insights/views/nohosts.html'
                });
                $urlRouterProvider.otherwise('/overview');
                $locationProvider.html5Mode(true);
            }
        ]).value('SAT_CONFIG', {
            enableBasicAuth: true
        }).value('userEnvironment', {
            availableSystems: 0
        }).value('markActiveMenu', function() {}).run(['$rootScope', '$state', 'userEnvironment', 'markActiveMenu',
            function($rootScope, $state, userEnvironment, markActiveMenu) {
                $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
                    //console.log("State is : " + toState.name);
                    if ((toState.name === 'app.overview' || toState.name === 'app.systems') &&
                        userEnvironment.availableSystems == 0) {
                        event.preventDefault();
                        $state.go('nohosts');
                    }
                    if (toState.name === 'nohosts' && userEnvironment.availableSystems > 0) {
                        event.preventDefault();
                        $state.go('app.overview');
                    }
                    //markActiveMenu();
                });
            }
        ]);
})();
