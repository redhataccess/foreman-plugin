/**
 * @ngdoc module
 * @name  Bastion.activation-keys
 *
 * @description
 *   Module for activation keys related functionality.
 */


angular.module('RedhatAccess.search')
	.directive('accordionSearchResults', function() {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: '/assets/redhat_access/search/views/accordion_search_results.html'
		};
	})
	.directive('listSearchResults', function() {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: '/assets/redhat_access/search/views/list_search_results.html'
		};
	})
	.directive('searchForm', function() {
		return {
			restrict: 'AE',
			scope: false ,
			templateUrl: '/assets/redhat_access/search/views/search_form.html'
		};
	})
	.directive('standardSearch', function() {
		return {
			restrict: 'AE',
			scope: false ,
			templateUrl: '/assets/redhat_access/search/views/search3.html'
		};
	})
	;