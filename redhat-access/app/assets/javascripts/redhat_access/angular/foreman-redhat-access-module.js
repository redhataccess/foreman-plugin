define([
  "angular", 
  "angular-route",
  "controllers/controllers",
  "services/services", 
  "filters/filters",
  "directives/directives"], function (angular) {

    return angular.module(
      "ForemanRedhatAccess", 
      ["ngRoute",
       "controllers", 
       "services",
       "filters", 
       "directives"]);
});
