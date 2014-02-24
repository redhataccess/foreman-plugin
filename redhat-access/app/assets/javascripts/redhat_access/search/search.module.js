/**
 * @ngdoc module
 * @name  Bastion.activation-keys
 *
 * @description
 *   Module for activation keys related functionality.
 */
angular.module('RedhatAccess.search', [
	'ui.router'
]);

angular.module('RedhatAccess.search').config(['$stateProvider',
	function($stateProvider) {
		$stateProvider.state('search', {
			url: "/redhat_access/search",
			controller: 'SearchController',
			templateUrl: '/assets/redhat_access/search/views/search.html'
		});
	}
]);