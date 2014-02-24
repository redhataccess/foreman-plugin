/**
 * @ngdoc module
 * @name  Bastion.activation-keys
 *
 * @description
 *   Module for activation keys related functionality.
 */
angular.module('RedhatAccess.support', [
	'ui.router'
]);

angular.module('RedhatAccess.support').config(['$stateProvider',
	function($stateProvider) {
		$stateProvider.state('support_new_case', {
			url: "/redhat_access/new_case",
			controller: 'SupportController',
			templateUrl: '/assets/redhat_access/support/views/new_case.html'
		});
	}
]);