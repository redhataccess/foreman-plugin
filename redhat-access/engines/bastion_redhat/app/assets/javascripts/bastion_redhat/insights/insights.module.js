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
    'insights',
    'templates',
    'Bastion',
    'Bastion.organizations'
]);

angular.module('Bastion.insights').config(['$stateProvider','InsightsConfigProvider', function ($stateProvider, InsightsConfigProvider) {
    $stateProvider.state('manage', {
        url: '/insights/manage/',
        templateUrl: 'insights/views/configuration.html',
        controller: 'ConfigurationCtrl',
        permission: 'rh_telemetry_view'
    });
    $stateProvider.state('help', {
        url: '/insights/help/',
        templateUrl: 'insights/views/help.html',
        permission: 'rh_telemetry_view'
    });
    $stateProvider.state('insights_inventory', {
            url: '/insights/inventory?sort&dir&offline',
            templateUrl: 'js/states/systems/systems.html',
            controller: 'SystemCtrl',
            title: 'Systems',
            permission: 'rh_telemetry_view',
            reloadOnSearch: false
    });
    $stateProvider.state('insights_actions', {
        url: '/insights/actions/{category}?initialSeverity',
        templateUrl: 'js/states/actions/actions.html',
        controller: 'ActionsCtrl',
        params: {
            category: {
                value: null,
                squash: true
            }
        },
        permission: 'rh_telemetry_view',
        title: 'Actions',
        actions: true
    });
    $stateProvider.state('insights_rules', {
            url: '/insights/rules/',
            templateUrl: 'js/states/rules/views/list-rules.html',
            controller: 'ListRuleCtrl',
            title: 'Rules',
            permission: 'rh_telemetry_view',
            hideGroup: true
    });


    InsightsConfigProvider.setApiRoot('/redhat_access/r/insights/view/api/');
    //InsightsConfigProvider.setCanUnregisterSystems(REDHAT_ACCESS_SETTINGS.Insights.canUnregisterSystems);
    //InsightsConfigProvider.setCanIgnoreRules(REDHAT_ACCESS_SETTINGS.Insights.canIgnoreRules);
    InsightsConfigProvider.setGettingStartedLink('https://access.redhat.com/insights/getting-started/satellite/6/');
    InsightsConfigProvider.setAllowExport(true);

}]);


angular.module('Bastion.insights').run(['FencedPages', function (FencedPages) {
    //List of pages (states) that require that an organization be selected
    var fencedPages = [
        'manage',
        'insights-inventory'
    ];
    FencedPages.addPages(fencedPages);
}]);
