/**
 * @ngdoc module
 * @name  Bastion.activation-keys
 *
 * @description
 *   Module for activation keys related functionality.
 */

angular.module('RedhatAccess.search').service('SearchResultsService', [

	function() {
		return {
			results: [],
			add: function(result) {
				this.results.push(result);
			},
			clear: function() {
				this.results.length = 0;
			},
		};
	}
]);