(function () {
    'use strict';
    angular.module('RedhatAccessInsights', [
        'ui.router',
        'ui.bootstrap',
        'insights',
        'templates'
    ]).config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', '$provide', 'InsightsConfigProvider', '$injector',
        function ($httpProvider, $stateProvider, $urlRouterProvider, $locationProvider, $provide, InsightsConfigProvider, $injector) {
            $httpProvider.defaults.headers.common = {
                'X-CSRF-TOKEN': $('meta[name=csrf-token]').attr('content')
            };
            $provide.factory('AuthInterceptor', ['$injector',
                function ($injector) {
                    return {
                        responseError: function (response) {
                            var $q = $injector.get('$q');
                            var $window = $injector.get('$window');
                            if (response.status === 401) {
                                $window.location.reload();
                            } else if (response.status === 403) {
                                var message = 'You are not authorized to perform this action.';
                                response.data.errors = [message];
                                response.data.displayMessage = message;
                                $window.location.reload();
                            }
                            return $q.reject(response);
                        }
                    };
                }
            ]);
            $httpProvider.interceptors.push('AuthInterceptor');
            $stateProvider.state('manage', {
                url: '/manage',
                templateUrl: '/redhat_access/insights/templates/configuration', //TODO HACK!
                controller: 'ConfigurationCtrl'
            });
            $stateProvider.state('help', {
                url: '/help',
                templateUrl: '/redhat_access/insights/templates/help' //TODO HACK
            });
            $stateProvider.state('serviceerror', {
                url: '/proxyerror',
                templateUrl: '/redhat_access/insights/templates/error' //TODO HACK
            });
            $urlRouterProvider.otherwise('/overview');
            $locationProvider.html5Mode(true);

            // Insights UI configuration
            InsightsConfigProvider.setApiPrefix('/redhat_access/r/insights/view/api/');
            InsightsConfigProvider.setCanUnregisterSystems(REDHAT_ACCESS_SETTINGS.Insights.canUnregisterSystems);
            InsightsConfigProvider.setCanIgnoreRules(REDHAT_ACCESS_SETTINGS.Insights.canIgnoreRules);
            InsightsConfigProvider.setGettingStartedLink('https://access.redhat.com/insights/getting-started/satellite/6/');
            InsightsConfigProvider.setAllowExport(true);
            InsightsConfigProvider.setOverviewKey('overview-satellite6');
            InsightsConfigProvider.setPlannerEnabled(true);    
            var initInjector = angular.injector(['ng']);
            var $http = initInjector.get('$http');
            //TODO fix hard coded values for the ansibleRunner stuff
            InsightsConfigProvider.setAnsibleRunner(function ($location, planId, button) {
                if (button === "run") {
                    var data = {
                        'job_template_id' : 'Ansible: Run Insights maintenance plan',
                        'inputs' : { 
                          'organization_id' : REDHAT_ACCESS_SETTINGS.Insights.org_id,
                          'plan_id' : planId
                        }
                      };
                    $http.post('/api/v2/job_invocations/', data)
                    .success(function (response, status, headers) {
                        window.location = '/job_invocations/'+response.id;
                    })
                    .error(function (response, status, header) {
                        alert("failed to create job;");
                    });
                  
                } else if (button === "customize") {
                    window.location = "/job_invocations/new?template_id=" + REDHAT_ACCESS_SETTINGS.Insights.AnsibleRunnerTmplId + "&plan_id=" +planId;
                    //TODO - need to set ansibleRunnerTmplId in app/views/redhat_access/analytics_dashboard/index.html.erb
                }
            });
        }
    ]).value('SAT_CONFIG', {
        enableBasicAuth: REDHAT_ACCESS_SETTINGS.Insights.allowBasicAuth,
        isOrgSelected: REDHAT_ACCESS_SETTINGS.Insights.isOrgSelected,
        isSubscribedToRedhat: REDHAT_ACCESS_SETTINGS.Insights.isSubscribedToRedhat,
        isOrgDisconnected: REDHAT_ACCESS_SETTINGS.Insights.isOrgDisconnected,
    }).value('currentLocale', REDHAT_ACCESS_SETTINGS.currentLocale);
})();