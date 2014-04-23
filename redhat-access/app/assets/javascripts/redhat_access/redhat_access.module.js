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


strata.setRedhatClientID("foreman-strata-client");
//strata.setStrataHostname("api.foreman-strata-client.com");


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
	function ($urlRouterProvider) {
		$urlRouterProvider.otherwise('/search');
	}
]);


angular.module('RedhatAccess.header').value('HEADER_VIEW_CONFIG', {
	show: 'true'
});

//Only view logs from main server for now.
angular.module('RedhatAccess.logViewer').value('hideMachinesDropdown', true);