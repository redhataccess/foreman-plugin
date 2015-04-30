(function() {
    'use strict';
    angular.module('RedhatAccessInsights', [
            'ui.router',
            'telemetryWidgets',
            'telemetryConfig',
            'telemetryRoutes'
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
                                    $window.location.href = '/users/login';
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
                    template: '<div class="panel panel-default">\n  <div class="panel-heading">\n    <h4>\n      General Configuration&nbsp;&nbsp;<i ng-show="loading" class="fa fa-spinner fa-spin fa-1-5x"></i>\n    </h4>\n  </div>\n  <div class="panel-body">\n    <form class="form-horizontal">\n      <div class="form-group">\n        <label for="rha-insights-enabled" class="col-lg-3 control-label">Enable Insights Service</label>\n        <div class="col-lg-6">\n          <div class="checkbox">\n            <input id="rha-insights-enabled" type="checkbox" ng-model="config.enable_telemetry" ng-disabled="loading"/>\n          </div>\n        </div>\n      </div>\n      <div class="form-group" ng-show="env.enableBasicAuth">\n        <label for="rha-insights-password" class="col-lg-3 control-label">Customer Portal Username</label>\n        <div class="col-lg-6">\n          <input id="rha-insights-password" type="text" size="32" ng-model="config.portal_user" ng-disabled="loading" class="form-control"/>\n        </div>\n      </div>\n      <div class="form-group" ng-show="env.enableBasicAuth">\n        <label for="rha-insights-password" class="col-lg-3 control-label">Customer Portal Password</label>\n        <div class="col-lg-6">\n          <input id="rha-insights-password" type="password" size="32" ng-model="config.portal_password" ng-disabled="loading" class="form-control"/>\n        </div>\n      </div>\n      <div class="form-group">\n        <div class="col-lg-offset-3 col-lg-6">\n          <input type="submit" value="Save" ng-click="update()" ng-disabled="disableUpdateButton()" class="btn btn-success"/>\n        </div>\n      </div>\n    </form>\n  </div>\n</div>\n',
                    controller: 'ConfigurationCtrl'
                });
                $urlRouterProvider.otherwise('/overview');
                $locationProvider.html5Mode(true);
            }
        ]).value('CONFIG', {
            preloadData: false,
            authenticate: false,
            API_ROOT: '/redhat_access/rs/telemetry/view/api/',
            ACCT_KEY: 'telemetry:account_number'
        }).value('SAT_CONFIG', {
            enableBasicAuth: true
        }).run([
            'RhaTelemetryOverviewService',
            function(RhaTelemetryOverviewService, enableBasicAuth) {
                //RhaTelemetryOverviewService.populateData(true);
            }
        ]);
})();
