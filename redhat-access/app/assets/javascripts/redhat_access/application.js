// This is a manifest file that"ll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It"s not advisable to add code directly here, but if you do, it"ll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
var BASE_URL = "redhat_access/angular/";
var SCRIPTS = BASE_URL + "scripts/";
var VENDOR = BASE_URL + "vendor/";
var STRATAJS = VENDOR + "stratajs/src/js/";

//requirejs-rails doesn"t support baseurl
requirejs.config({
  paths: {
    angular: VENDOR + "angular",
    "angular-route": VENDOR + "angular-route",
    domReady: VENDOR + "domReady",
    mainApp: BASE_URL + "foreman-redhat-access-module",
    strata: STRATAJS + "strata",
    jsUri: STRATAJS + "Uri",
    controllers: SCRIPTS + "controllers",
    directives: SCRIPTS + "directives",
    filters: SCRIPTS + "filters",
    services: SCRIPTS + "services",
    jquery: "jquery",
    bootstrap: "bootstrap"
  },
  shim: {
    angular: {
      exports: "angular"
    }
  }
});

require(
  [
    "mainApp",
    "angular",
    "strata",
    "domReady",
    // Any individual controller, service, directive or filter file
    // that you add will need to be pulled in here.
    "controllers/rootController"
  ],
  function(
      mainApp,
      angular,
      strata,
      domReady) {
      
    //mainApp.config(["$locationProvider", function($locationProvider){
      //$locationProvider.html5Mode(true);
    //}]);

    mainApp.config(["$routeProvider",
      function($routeProvider) {
        $routeProvider.when("/", {
          templateUrl: "/assets/redhat_access/angular/views/root.html",
          controller: "RootController"
        });
      }
    ]);
    domReady(function() {
      angular.bootstrap(document, ["ForemanRedhatAccess"]);
    });
  }
);
