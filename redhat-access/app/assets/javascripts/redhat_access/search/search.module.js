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
			//controller: 'SearchController',
			views: {
				"searchForm": {
					//controller: 'SearchController',
					templateUrl: '/assets/redhat_access/search/views/search1.html'
				}
				
			}
		}).state('search2', {
			url: "/redhat_access/search2",
			views: {
				"searchForm": {
					//controller: 'SearchController',
					templateUrl: '/assets/redhat_access/search/views/search2.html'
				}
			}
		}).state('search3', {
			url: "/redhat_access/search3",
			views: {
				"searchForm": {
					//controller: 'SearchController',
					templateUrl: '/assets/redhat_access/search/views/search.html'
				}
			}
		});
	}
]);