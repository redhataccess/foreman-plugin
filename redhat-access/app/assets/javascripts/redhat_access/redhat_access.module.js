/**
 * Copyright 2013 Red Hat, Inc.
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
	'$httpProvider',
	function ($urlRouterProvider, $httpProvider) {
		$urlRouterProvider.otherwise('/search');
		$httpProvider.defaults.headers.common = {
			'X-CSRF-TOKEN': $('meta[name=csrf-token]').attr('content')
		};

	}
]).run(['TITLE_VIEW_CONFIG',
	'$http',
	function (TITLE_VIEW_CONFIG, $http) {
		TITLE_VIEW_CONFIG.show = true;
		$http({
			method: 'GET',
			url: 'redhat_access/configuration'
		}).
		success(function (data, status, headers, config) {
			if (data) {
				if (data.strataHostName) {
					strata.setStrataHostname(data.strataHostName);
				} else {
					console.log("Invalid configuration object " + data);
				}
				if (data.strataClientId) {
					strata.setRedhatClientID(data.strataClientId);
				} else {
					strata.setRedhatClientID("foreman-strata-client");
					console.log("Invalid configuration object " + data);
				}
			}
		}).
		error(function (data, status, headers, config) {
			console.log("Failed to read app configuration");
			strata.setRedhatClientID("foreman-strata-client");
		});


	}
]);

angular.module('RedhatAccess.logViewer').value('hideMachinesDropdown', true);