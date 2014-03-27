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
	'templates.app',
	'RedhatAccess.security',
	'RedhatAccess.search',
	'RedhatAccessCases',
	'logViewer',
	'ui.router',
	'ui.bootstrap'

])
	.config(['$stateProvider',
		function ($stateProvider) {
			$stateProvider.state('search_main', {
				url: "/search_main",
				controller: 'SearchController',
				templateUrl: 'search/views/search.html'
			});
		}
	])
	.config(['$stateProvider',
		function ($stateProvider) {
			$stateProvider.state('logviewer', {
				url: "/logviewer",
				templateUrl: 'log_viewer/views/log_viewer.html'
			})
		}
	]);