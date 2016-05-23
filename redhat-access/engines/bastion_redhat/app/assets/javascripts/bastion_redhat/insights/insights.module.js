/**
 * @ngdoc module
 * @name  Bastion.insights
 *
 * @description
 *   Module for Red Hat Insights
 */
angular.module('Bastion.insights', [
    'ngResource',
    'ui.router',
    'ui.bootstrap',
    //'insights',
    'templates',
    'Bastion',
    'Bastion.organizations'
]);

angular.module('Bastion.insights').config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('manage', {
        url: '/insights/manage',
        templateUrl: 'insights/views/configuration.html',
        controller: 'ConfigurationCtrl',
        permission: 'view_activation_keys'

    });
    $stateProvider.state('help', {
        url: '/insights/help',
        templateUrl: 'insights/views/help.html',
        permission: 'view_activation_keys'

    });
}]);


angular.module('Bastion.insights').run(['FencedPages', function (FencedPages) {

    var fencedPages = [
        'manage'
    ];
    FencedPages.addPages(fencedPages);
    console.log("We are the fenced pages" + FencedPages.list());


}]);
