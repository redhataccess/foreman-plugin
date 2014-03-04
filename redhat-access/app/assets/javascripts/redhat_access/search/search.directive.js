/**
 * @ngdoc module
 * @name  Bastion.activation-keys
 *
 * @description
 *   Module for activation keys related functionality.
 */


angular.module('RedhatAccess.search')
	.directive('accordionSearch', function() {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: '/assets/redhat_access/search/views/search_accordion.html'
		};
	})
	.directive('listPanelSearch', function() {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: '/assets/redhat_access/search/views/search_list_detail.html'
		};
	})
	.directive('searchForm', function() {
		return {
			restrict: 'AE',
			scope: false ,
			templateUrl: '/assets/redhat_access/search/views/search_form.html'
		};
	});