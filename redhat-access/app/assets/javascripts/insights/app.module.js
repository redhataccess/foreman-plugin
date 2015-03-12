(function () {
    'use strict';
    angular.module('RedhatAccessInsights', [
        'telemetryConfig',
        'telemetryTemplates',
        'telemetryApi',
        'oitozero.ngSweetAlert',
        'ui.router',
        'yaru22.angular-timeago',
        'localytics.directives',
        'ui.bootstrap',
        'ngTable',
        'angular-loading-bar'
    ])
        .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
            $urlRouterProvider.otherwise('/');
            $locationProvider.html5Mode(true);
        })
})();


