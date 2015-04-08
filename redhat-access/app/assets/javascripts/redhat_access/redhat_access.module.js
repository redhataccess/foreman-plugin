/**
 * Copyright 2014 Red Hat, Inc.
 *
 * This software is licensed to you under the GNU General Public
 * License as published by the Free Software Foundation; either version
 * 2 of the License (GPLv2) or (at your option) any later version.
 * There is NO WARRANTY for this software, express or implied,
 * including the implied warranties of MERCHANTABILITY,
 * NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
 * have received a copy of GPLv2 along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 */

/**
 *
 */
angular.module('RedhatAccess', [
    'ngSanitize',
    'RedhatAccess.header',
    'RedhatAccess.template',
    'RedhatAccess.security',
    'RedhatAccess.search',
    'RedhatAccess.cases',
    'RedhatAccess.logViewer',
    'ui.router',
    'ui.bootstrap'

]).config(['$urlRouterProvider',
    '$httpProvider', '$locationProvider', '$provide',
    function($urlRouterProvider, $httpProvider, $locationProvider, $provide) {
        $urlRouterProvider.otherwise('/search');
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
        $locationProvider.html5Mode(true);
    }
]).run(['TITLE_VIEW_CONFIG',
    '$http', 'securityService', 'hideMachinesDropdown', 'NEW_DEFAULTS', 'currentLocale', 'gettextCatalog',
    function(TITLE_VIEW_CONFIG, $http, securityService, hideMachinesDropdown, NEW_DEFAULTS, currentLocale, gettextCatalog) {
        TITLE_VIEW_CONFIG.show = true;
        hideMachinesDropdown.value = true;
        NEW_DEFAULTS.product = "Red Hat Satellite or Proxy"; //TODO read from server config
        NEW_DEFAULTS.version = "6.1"; //TODO read from server config
        gettextCatalog.currentLanguage = currentLocale;
        //console.log('Setting language to ' + currentLocale);
        // $http({
        //  method: 'GET',
        //  url: 'configuration'
        // }).
        // success(function (data, status, headers, config) {
        //  if (data) {
        //    if (data.strataHostName) {
        //      strata.setStrataHostname(data.strataHostName);
        //    } else {
        //      console.log("Invalid configuration object " + data);
        //    }
        //    if (data.strataClientId) {
        //      strata.setRedhatClientID(data.strataClientId);
        //    } else {
        //      strata.setRedhatClientID("foreman-strata-client");
        //      console.log("Invalid configuration object " + data);
        //    }
        //  }
        //  securityService.validateLogin(false).then(
        //    function (authedUser) {
        //      console.log("logged in user is " + authedUser)
        //    },
        //    function (error) {
        //      console.log("Unable to get user credentials");
        //    });
        // }).
        // error(function (data, status, headers, config) {
        //  console.log("Failed to read app configuration");
        //  strata.setRedhatClientID("foreman-strata-client");
        //  securityService.validateLogin(false).then(
        //    function (authedUser) {
        //      console.log("logged in user is " + authedUser)
        //    },
        //    function (error) {
        //      console.log("Unable to get user credentials");
        //    });
        // });
    }
]);

//angular.module('RedhatAccess.logViewer').value('hideMachinesDropdown.value);
