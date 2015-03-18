(function() {
    'use strict';
    angular.module('RedhatAccessInsights', [
            'ui.router',
            'telemetryWidgets',
            'telemetryConfig',
        ])
        .config(['$httpProvider', '$stateProvider','$urlRouterProvider',
            function($httpProvider, $stateProvider, $urlRouterProvider) {
                $httpProvider.defaults.headers.common = {
                    'X-CSRF-TOKEN': $('meta[name=csrf-token]').attr('content')
                };
                var authInteceptor = ['$q',
                    function($q) {
                        return {
                            'response': function(response) {
                                return response;
                            },
                            'responseError': function(rejection) {
                                if (rejection.status === 401) {
                                    location.reload();
                                }
                                return $q.reject(rejection);
                            }
                        };
                    }
                ];
                $httpProvider.interceptors.push(authInteceptor);
                $stateProvider.state('dashboard', {
                    url: '/?category?rule',
                    controller: 'OverViewCtrl',
                    template: '<div class="row"> < div style = "top: 100px;"
                    class = "col-md-6" >
                    <rha-telemetry-overview > </rha-telemetry-overview> </div> <div class = "col-md-6" >
                    <rha-telemetry-overview-details > </rha-telemetry-overview-details> </div> </div>',
                    params: {
                       category: null,
                       rule: null
                    }
                });
                $urlRouterProvider.otherwise('/');
            }
        ]).value('CONFIG', {
            preloadData: false,
            authenticate: false,
            API_ROOT: '/redhat_access/proactive_support/rs/telemetry/api/',
            ACCT_KEY: 'telemetry:account_number'
        })
        .run([
            'CONFIG', 'RhaTelemetryOverviewService',
            function(CONFIG, RhaTelemetryOverviewService) {
                //CONFIG.API_ROOT = '/redhat_access/proactive_support/rs/telemetry/api/';
                //CONFIG.authenticate = false;
                //CONFIG.preloadData = true;
                //RhaTelemetryOverviewService.getData()
                RhaTelemetryOverviewService.populateData(true);
            }
        ]);
})();
