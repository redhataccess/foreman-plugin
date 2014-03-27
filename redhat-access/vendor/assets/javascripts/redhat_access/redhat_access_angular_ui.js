/*! redhat_access_angular_ui - v0.0.0 - 2014-03-27
 * Copyright (c) 2014 ;
 * Licensed 
 */
angular.module('RedhatAccess.security', ['ui.bootstrap'])
    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    })
    .directive('loginStatus', function () {
        return {
            restrict: 'AE',
            scope: false,
            templateUrl: 'security/login_status.html'
        };
    })
    .controller('SecurityController', ['$scope', '$rootScope', 'securityService', 'AUTH_EVENTS',
        function ($scope, $rootScope, securityService, AUTH_EVENTS) {

            $scope.isLoggedIn = false;
            $scope.loggedInUser = '';

            strata.checkLogin(loginHandler);

            function loginHandler(result, authedUser) {

                if (result) {
                    console.log("Authorized!");
                    $scope.$apply(function () {
                        $scope.isLoggedIn = true;
                        //$scope.loggedInUser = securityService.getLoggedInUserName();
                        $scope.loggedInUser = authedUser.name
                    });
                } else {
                    $scope.$apply(function () {
                        $scope.isLoggedIn = false;
                        $scope.loggedInUser = '';
                    });
                }
            };

            $scope.login = function () {
                securityService.login().then(function (authedUser) {
                    if (authedUser) {
                        $scope.isLoggedIn = true;
                        $scope.loggedInUser = authedUser.name;
                    }
                });

            };

            $scope.logout = function () {
                strata.clearCredentials();
                $scope.isLoggedIn = false;
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            };


        }
    ])
    .service('securityService', ['$modal',
        function ($modal) {

            //bool isAuthed = false;

            var modalDefaults = {
                backdrop: true,
                keyboard: true,
                modalFade: true,
                templateUrl: 'security/login_form.html'
            };

            var modalOptions = {
                closeButtonText: 'Close',
                actionButtonText: 'OK',
                headerText: 'Proceed?',
                bodyText: 'Perform this action?',
                backdrop: 'static'
            };

            this.login = function () {
                return this.showLogin(modalDefaults, modalOptions);
            };

            this.getLoggedInUserName = function () {
                return strata.getAuthInfo().name;
            };

            this.showLogin = function (customModalDefaults, customModalOptions) {
                //Create temp objects to work with since we're in a singleton service
                var tempModalDefaults = {};
                var tempModalOptions = {};
                //Map angular-ui modal custom defaults to modal defaults defined in service
                angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);
                //Map modal.html $scope custom properties to defaults defined in service
                angular.extend(tempModalOptions, modalOptions, customModalOptions);
                if (!tempModalDefaults.controller) {
                    tempModalDefaults.controller = ['$scope', '$modalInstance',
                        function ($scope, $modalInstance) {
                            $scope.user = {
                                user: null,
                                password: null
                            };
                            $scope.modalOptions = tempModalOptions;
                            $scope.modalOptions.ok = function (result) {
                                //console.log($scope.user);
                                strata.setCredentials($scope.user.user, $scope.user.password,
                                    function (passed, authedUser) {
                                        if (passed) {
                                            $scope.user.password = '';
                                            $modalInstance.close(authedUser);
                                        } else {
                                            alert("Login failed!");
                                        }
                                    });

                            };
                            $scope.modalOptions.close = function () {
                                $modalInstance.dismiss();
                            };
                        }
                    ];
                }

                return $modal.open(tempModalDefaults).result;
            };

        }
    ]);
/**
 * @ngdoc module
 * @name
 *
 * @description
 *
 */
angular.module('RedhatAccess.search', [
	'ui.router',
	'RedhatAccess.security',
	'ui.bootstrap',
	'ngSanitize'
])
	.constant('RESOURCE_TYPES', {
		article: 'Article',
		solution: 'Solution',

	})
	.config(['$stateProvider',
		function ($stateProvider) {
			$stateProvider.state('search', {
				url: "/search",
				controller: 'SearchController',
				templateUrl: 'search/views/search.html'
			}).state('search_accordion', { //TEMPORARY
				url: "/search2",
				controller: 'SearchController',
				templateUrl: 'search/views/accordion_search.html'

			});
		}
	])
	.controller('SearchController', ['$scope',
		'SearchResultsService',
		function ($scope, SearchResultsService) {
			$scope.results = SearchResultsService.results;
			$scope.selectedSolution = SearchResultsService.currentSelection;
			//////////////////////
			$scope.totalItems = $scope.results.length;
			$scope.currentPage = 1;
			$scope.maxSize = 5;

			$scope.setPage = function (pageNo) {
				$scope.currentPage = pageNo;
			};

			//$scope.bigTotalItems = 175;
			//$scope.bigCurrentPage = 1;
			$scope.pageChanged = function (page) {
				$scope.currentPage = page;
				console.log("selected page is " + page);
				console.log("currentpage is " + $scope.currentPage);

				//$scope.watchPage = newPage;
			};
			///////////////////////////////////////////
			clearResults = function () {
				//SearchResultsService.setSelected({});
				SearchResultsService.clear();
			};


			// addResult = function(result) {
			// 	$scope.$apply(function() {
			// 		SearchResultsService.add(result);
			// 	});

			// };

			$scope.solutionSelected = function (index) {
				var response = $scope.results[index];
				SearchResultsService.setSelected(response);

			};

			$scope.search = function (searchStr, limit) {
				SearchResultsService.search(searchStr, limit);
				/*clearResults();
				strata.search($scope.searchStr,
					function(resourceType, response) {
						//console.log(response);
						response.resource_type = resourceType; //do this only for chained
						addResult(response);
					},
					onFailure,
					10,
					true
				);*/

			};

			$scope.$watch(function () {
					return SearchResultsService.currentSelection
				},
				function (newVal) {
					$scope.selectedSolution = newVal;
				}
			);
			// $scope.$watch(function () {
			// 		return SearchResultsService.results
			// 	},
			// 	function (newVal) {
			// 		console.log("set new result");
			// 		$scope.results = newVal;
			// 		$scope.totalItems = SearchResultsService.results.length;
			// 	}
			// );


		}
	])
	.directive('accordionSearchResults', function () {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: 'search/views/accordion_search_results.html'
		};
	})
	.directive('listSearchResults', function () {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: 'search/views/list_search_results.html'
		};
	})
	.directive('searchForm', function () {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: 'search/views/search_form.html'
		};
	})
	.directive('standardSearch', function () {
		return {
			restrict: 'AE',
			scope: false,
			templateUrl: 'search/views/standard_search.html'
		};
	})
	.directive('resultDetailDisplay', ['RESOURCE_TYPES',
		function (RESOURCE_TYPES) {
			return {
				restrict: 'AE',
				scope: {
					result: '='
				},
				link: function (scope, element, attr) {
					scope.isSolution = function () {
						if (scope.result !== undefined && scope.result.resource_type !== undefined) {
							if (scope.result.resource_type === RESOURCE_TYPES.solution) {
								return true;
							} else {
								return false;
							}
						}
						return false;
					};
					scope.isArticle = function () {
						if (scope.result !== undefined && scope.result.resource_type !== undefined) {
							if (scope.result.resource_type === RESOURCE_TYPES.article) {
								return true;
							} else {
								return false;
							}
						}
						return false;
					};
					scope.getSolutionResolution = function () {
						var resolution_html = '';
						if (scope.result.resolution !== undefined) {
							resolution_html = scope.result.resolution.html;
						}
						return resolution_html;
					};

					scope.getArticleHtml = function () {
						if (scope.result === undefined) {
							return '';
						}
						if (scope.result.body !== undefined) {
							return scope.result.body;
						} else {
							return '';
						}
					};

				},
				templateUrl: 'search/views/resultDetail.html'
			};
		}
	])
	.factory('SearchResultsService', ['$rootScope', 'AUTH_EVENTS', 'RESOURCE_TYPES',

		function ($rootScope, AUTH_EVENTS, RESOURCE_TYPES) {
			var service = {
				results: [],
				currentSelection: {},
				add: function (result) {
					this.results.push(result);
				},
				clear: function () {
					this.results.length = 0;
					this.setSelected({});
				},
				setSelected: function (selection) {
					this.currentSelection = selection;
				},
				search: function (searchString, limit) {
					var that = this;
					if ((limit === undefined) || (limit < 1)) limit = 5;
					this.clear();
					strata.search(
						searchString,
						function (resourceType, response) {
							response.resource_type = resourceType;
							$rootScope.$apply(function () {
								that.add(response);
							});
						},
						function (error) {
							console.log("search failed");
						},
						limit,
						true
					);
				},
				searchSolutions: function (searchString, limit) {
					var that = this;
					if ((limit === undefined) || (limit < 1)) limit = 5;
					this.clear();
					strata.solutions.search(
						searchString,
						function (response) {
							//console.log(angular.toJson(response));
							$rootScope.$apply(function () {
								//console.log(angular.toJson(response));
								response.forEach(function (entry) {
									entry.resource_type = RESOURCE_TYPES.solution;
									that.add(entry);
									//console.log(angular.toJson(entry, true));
								});
							});
						},
						function (error) {
							console.log("search failed");
						},
						limit,
						false
					);
				},
				searchArticles: function (searchString, limit) {
					var that = this;
					if ((limit === undefined) || (limit < 1)) limit = 5;
					this.clear();
					strata.articles.search(
						searchString,
						function (response) {
							response.resource_type = RESOURCE_TYPES.article;
							$rootScope.$apply(function () {
								that.add(response);
							});
						},
						function (error) {
							console.log("search failed");
						},
						limit,
						true
					);
				},
				diagnose: function (searchString, limit) {
					var that = this;
					if ((limit === undefined) || (limit < 1)) limit = 5;
					this.clear();
					strata.diagnose(
						searchString,
						function (response) {
							//response.resource_type = resourceType;
							response.resource_type = RESOURCE_TYPES.solution;
							$rootScope.$apply(function () {
								that.add(response);
							});
						},
						function (error) {
							console.log("search failed");
						},
						limit,
						true
					);
				}



			};

			$rootScope.$on(AUTH_EVENTS.logoutSuccess, function () {
				service.clear.apply(service);
			});
			return service;
		}
	]);
angular.module('RedhatAccessCases', [
  'ui.router',
  'ui.bootstrap'
])
.config([
  '$stateProvider',
  function($stateProvider) {
    $stateProvider.state('case', {
      url: '/case/{id:[0-9]{1,8}}',
      templateUrl: 'cases/views/details.html',
      controller: 'Details',
      resolve: {
        caseJSON: function($q, $stateParams) {
          var deferred = $q.defer();
          var id = $stateParams.id;

          strata.cases.get(
              id,
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        attachmentsJSON: function($q, $stateParams) {
          var deferred = $q.defer();
          var id = $stateParams.id;

          strata.cases.attachments.list(
              id,
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        commentsJSON: function($q, $stateParams) {
          var deferred = $q.defer();
          var id = $stateParams.id;

          strata.cases.comments.get(
              id,
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        caseTypesJSON: function($q) {
          var deferred = $q.defer();

          strata.values.cases.types(
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        severitiesJSON: function($q) {
          var deferred = $q.defer();

          strata.values.cases.severity  (
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        groupsJSON: function($q) {
          var deferred = $q.defer();

          strata.groups.list (
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        productsJSON: function($q) {
          var deferred = $q.defer();

          strata.products.list(
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        statusesJSON: function($q) {
          var deferred = $q.defer();

          strata.values.cases.status(
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        }
      }
    });

    $stateProvider.state('new', {
      url: '/case/new',
      templateUrl: 'cases/views/new.html',
      controller: 'New',
      resolve: {
        productsJSON: function($q) {
          var deferred = $q.defer();

          strata.products.list(
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        severityJSON: function($q) {
          var deferred = $q.defer();

          strata.values.cases.severity  (
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        },
        groupsJSON: function($q) {
          var deferred = $q.defer();

          strata.groups.list (
              function(response) {
                deferred.resolve(response);
              },
              function(error) {
                deferred.reject(error);
              }
          );

          return deferred.promise;
        }
      }
    });
  }]);

'use strict';

angular.module('RedhatAccessCases')
.controller('AttachLocalFile', [
  '$scope',
  'attachments',
  function ($scope, attachments) {
    $scope.NO_FILE_CHOSEN = 'No file chosen';
    $scope.fileDescription = '';

//    $scope.attachments = [
//      {
//        uri: "https://access.redhat.com/",
//        file_name: "first.log",
//        description: "The first log",
//        length: 20,
//        created_by: "Chris Kyrouac",
//        created_date: 1393611517000
//      },
//      {
//        uri: "https://access.redhat.com/",
//        file_name: "second.log",
//        description: "The second log",
//        length: 25,
//        created_by: "Chris Kyrouac",
//        created_date: 1393611517000
//      }
//    ];
    $scope.clearSelectedFile = function() {
      $scope.fileName = $scope.NO_FILE_CHOSEN;
      $scope.fileDescription = '';
    };

    $scope.addFile = function() {
      var data = new FormData();
      data.append('file', $scope.fileObj);
      data.append('description', $scope.fileDescription);

      attachments.items.push({
        file_name: $scope.fileName,
        description: $scope.fileDescription,
        length: $scope.fileSize,
        created_by: "Chris Kyrouac", //TODO: use Lindani's login service to get username
        created_date: new Date().getTime(),
        file: data
      });

      $scope.clearSelectedFile();
    };

    $scope.getFile = function() {
      $('#fileUploader').click();
    };

    $scope.selectFile = function() {
      $scope.fileObj = $('#fileUploader')[0].files[0];
      $scope.fileSize = $scope.fileObj.size;
      $scope.fileName = $scope.fileObj.name;
    };

    $scope.clearSelectedFile();
  }
]);

'use strict';

angular.module('RedhatAccessCases')
.controller('Details', [
  '$scope',
  '$stateParams',
  'attachments',
  'caseJSON',
  'attachmentsJSON',
  'commentsJSON',
  'caseTypesJSON',
  'severitiesJSON',
  'groupsJSON',
  'productsJSON',
  'statusesJSON',
  function(
      $scope,
      $stateParams,
      attachments,
      caseJSON,
      attachmentsJSON,
      commentsJSON,
      caseTypesJSON,
      severitiesJSON,
      groupsJSON,
      productsJSON,
      statusesJSON) {

    var originalDetails;

    if (caseJSON) {
      $scope.details = {};
      $scope.details.caseId = $stateParams.id;
      $scope.details.summary = caseJSON.summary;
      $scope.details.description = caseJSON.description;
      $scope.details.type = {'name': caseJSON.type};
      $scope.details.severity = {'name': caseJSON.severity};
      $scope.details.status = {'name': caseJSON.status};
      $scope.details.alternate_id = caseJSON.alternate_id;
      $scope.details.product = {'name': caseJSON.product};
      $scope.details.sla = caseJSON.entitlement.sla;
      $scope.details.contact_name = caseJSON.contact_name;
      $scope.details.owner = caseJSON.owner;
      $scope.details.created_date = caseJSON.created_date;
      $scope.details.created_by = caseJSON.created_by;
      $scope.details.last_modified_date = caseJSON.last_modified_date;
      $scope.details.last_modified_by = caseJSON.last_modified_by;
      $scope.details.account_number = caseJSON.account_number;
      $scope.details.group = {'number': caseJSON.folder_number};

      originalDetails = angular.copy($scope.details);

      $scope.bugzillas = caseJSON.bugzillas;
      $scope.hasBugzillas = Object.getOwnPropertyNames($scope.bugzillas).length != 0;

      if (caseJSON.recommendations) {
        if (Object.getOwnPropertyNames(caseJSON.recommendations).length != 0) {
          $scope.recommendations = caseJSON.recommendations.recommendation;
        }
      }
    }

    if (attachmentsJSON) {
      attachments.items = attachmentsJSON;
      $scope.attachments = attachmentsJSON;
    }

    if (commentsJSON) {
      $scope.comments = commentsJSON;
    }

    if (caseTypesJSON) {
      $scope.caseTypes = caseTypesJSON;
    }

    if (severitiesJSON) {
      $scope.severities = severitiesJSON;
    }

    if (groupsJSON) {
      $scope.groups = groupsJSON;
    }

    if (productsJSON) {
      $scope.products = productsJSON;
    }

    if (statusesJSON) {
      $scope.statuses = statusesJSON;
    }

    $scope.updatingDetails = false;

    $scope.updateCase = function() {
      $scope.updatingDetails = true;

      var caseJSON = {
        'type': $scope.details.type.name,
        'severity': $scope.details.severity.name,
        'status': $scope.details.status.name,
        'alternateId': $scope.details.alternate_id,
//        'notes': $scope.details.notes,
        'product': $scope.details.product.name,
        'version': $scope.details.version,
        'summary': $scope.details.summary,
        'folderNumber': $scope.details.group.number
      };

      strata.cases.put(
          $scope.details.caseId,
          caseJSON,
          function() {
            $scope.caseDetails.$setPristine();
            $scope.updatingDetails = false;
            $scope.$apply();
          },
          function(error) {
            console.log(error);
            $scope.updatingDetails = false;
            $scope.$apply();
          }
      );

    };

    $scope.getProductVersions = function(product) {
      $scope.version = "";

      strata.products.versions(
          product.name,
          function(response){
            $scope.versions = response;
            $scope.$apply();
          },
          function(error){
            console.log(error);
          });
    };

    $scope.getProductVersions($scope.details.product);
    $scope.details.version = caseJSON.version;

  }]);


'use strict';

angular.module('RedhatAccessCases')
.controller('ListAttachments', [
  '$scope',
  'attachments',
  function ($scope, attachments) {

    $scope.attachments = attachments.items;

    $scope.removeAttachment = function() {
      attachments.items.splice(this.$index, 1);
    };
  }
]);

'use strict';

angular.module('RedhatAccessCases')
.controller('New', [
  '$scope',
  '$state',
  '$q',
  'attachments',
  'productsJSON',
  'severityJSON',
  'groupsJSON',
  function ($scope, $state, $q, attachments, productsJSON, severityJSON, groupsJSON) {
    $scope.products = productsJSON;
    $scope.versions = [];
    $scope.versionDisabled = true;
    $scope.versionLoading = false;
    $scope.incomplete = true;
    $scope.severities = severityJSON;
    $scope.severity = severityJSON[severityJSON.length - 1];
    $scope.groups = groupsJSON;
    $scope.submitProgress = 0;
    $scope.attachments = attachments;

    $scope.validateForm = function() {
      if ($scope.product == null || $scope.product == "" ||
          $scope.version == null || $scope.version == "" ||
          $scope.summary == null || $scope.summary == "" ||
          $scope.description == null || $scope.description == "") {
        $scope.incomplete = true;
      } else {
        $scope.incomplete = false;
      }
    };

    /**
     * Retrieve product's versions from strata
     *
     * @param product
     */
    $scope.getProductVersions = function(product) {
      $scope.version = "";
      $scope.versionDisabled = true;
      $scope.versionLoading = true;

      strata.products.versions(
          product.code,
          function(response){
            $scope.versions = response;
            $scope.validateForm();
            $scope.versionDisabled = false;
            $scope.versionLoading = false;
            $scope.$apply();
          },
          function(error){
            console.log(error);
          });
    };

    /**
     * Go to a page in the wizard
     *
     * @param page
     */
    $scope.setPage = function(page) {
      $scope.isPage1 = page == 1 ? true : false;
      $scope.isPage2 = page == 2 ? true : false;
    };

    /**
     * Navigate forward in the wizard
     */
    $scope.doNext = function() {
      $scope.setPage(2);
    };

    /**
     * Navigate back in the wizard
     */
    $scope.doPrevious = function() {
      $scope.setPage(1);
    };

    /**
     * Return promise for a single attachment
     */
    var postAttachment = function(caseNumber, attachment, progressIncrement) {

      var singleAttachmentSuccess = function(response) {
        $scope.submitProgress = $scope.submitProgress + progressIncrement;
      };

      var deferred = $q.defer();
      deferred.promise.then(singleAttachmentSuccess);

      strata.cases.attachments.post(
          attachment,
          caseNumber,
          function(response) {
            deferred.resolve(response);
          },
          function(error, error2, error3, error4) {
            console.log(error);
            deferred.reject(error);
          }
      );

      return deferred.promise;
    };

    /**
     * Create the case with attachments
     */
    $scope.doSubmit = function() {

      $scope.submitProgress = 10;

      var caseJSON = {
        'product': $scope.product.code,
        'version': $scope.version,
        'summary': $scope.summary,
        'description': $scope.description,
        'severity': $scope.severity.name,
        'folderNumber': $scope.caseGroup == null ? '' : $scope.caseGroup.number
      };

      strata.cases.post(
          caseJSON,
          function(caseNumber) {
            if ($scope.attachments.length > 0) {
              var progressIncrement = 90 / $scope.attachments.length;

              var promises = [];
              for (var i in $scope.attachments) {
                promises.push(
                    postAttachment(
                        caseNumber,
                        $scope.attachments[i].file,
                        progressIncrement));
              }

              var parentPromise = $q.all(promises);
              parentPromise.then(
                function(results) {
                  $scope.submitProgress = '100';
                  $state.go('case', {id: caseNumber});
                },
                function(error, error2, error3, error4) {
                  console.log("Problem creating attachment: " + error);
                }
              );
            } else {
              $scope.submitProgress = '100';
              $state.go('case', {id: caseNumber});
            }
          },
          function(error) {
            console.log(error);
          }
      );

    };

    $scope.setPage(1);
  }]);


'use strict';
/**
 * Child of Details controller
 **/

angular.module('RedhatAccessCases')
.controller('Recommendations', [
  '$scope',
  function ($scope) {
    $scope.itemsPerPage = 4;
    $scope.maxSize = 10;

    $scope.selectPage = function(pageNum) {
      var start = $scope.itemsPerPage * (pageNum - 1);
      var end = start + $scope.itemsPerPage;
      end = end > $scope.recommendations.length ?
              $scope.recommendations.length : end;

      $scope.recommendationsOnScreen =
        $scope.recommendations.slice(start, end);

      console.log($scope.recommendations);
      console.log($scope.recommendationsOnScreen);
    };

    if ($scope.recommendations != null) {
      $scope.selectPage(1);
    }
  }]);


'use strict';

angular.module('RedhatAccessCases')
.directive('rhaAttachLocalFile', function () {
  return {
    templateUrl: 'cases/views/attachLocalFile.html',
    restrict: 'EA',
    controller: 'AttachLocalFile',
    link: function postLink(scope, element, attrs) {
    }
  };
});

'use strict';

angular.module('RedhatAccessCases')
.directive('rhaAttachProductLogs', function () {
  return {
    templateUrl: 'cases/views/attachProductLogs.html',
    restrict: 'EA',
    link: function postLink(scope, element, attrs) {
    }
  };
});

'use strict';

angular.module('RedhatAccessCases')
.directive('rhaListAttachments', function () {
  return {
    templateUrl: 'cases/views/listAttachments.html',
    restrict: 'EA',
    controller: 'ListAttachments',
    link: function postLink(scope, element, attrs) {
    }
  };
});

angular.module('RedhatAccessCases')
.filter('bytes', function() {
  return function(bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 1;
    var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
  }
});
'use strict';

angular.module('RedhatAccessCases')
.factory('attachments', function () {
  return {items: []};
});

// angular module
var logViewer = angular.module('logViewer', ['angularTreeview',
	'ui.bootstrap', 'RedhatAccess.search'
]);

logViewer.factory('files', function () {
	var fileList = '';
	var selectedFile = '';
	var selectedHost = '';
	var file = '';
	return {
		getFileList: function () {
			return fileList;
		},

		setFileList: function (fileList) {
			this.fileList = fileList;
		},
		getSelectedFile: function () {
			return selectedFile;
		},

		setSelectedFile: function (selectedFile) {
			this.selectedFile = selectedFile;
		},
		getFile: function () {
			return file;
		},

		setFile: function (file) {
			this.file = file;
		}
	};
});

logViewer.service('accordian', function () {
	var groups = new Array();
	return {
		getGroups: function () {
			return groups;
		},
		addGroup: function (group) {
			groups.push(group);
		},
		clearGroups: function () {
			groups = '';
		}
	};
});


angular.element(document).ready(function () {

	c = angular.element(document.querySelector('#controller-demo')).scope();
});

logViewer.controller('fileController', function ($scope, files) {
	$scope.roleList = '';
	$scope.updateSelected = function () {
		if ($scope.mytree.currentNode != null) {
			//files.setSelectedFile('/Users/Spense/Desktop/server.log');
			files.setSelectedFile($scope.mytree.currentNode.roleName);
		}
	};
	$scope.$watch(function () {
		return files.fileList;
	}, function () {
		$scope.roleList = files.fileList;
	});
});

logViewer.controller('DropdownCtrl', function ($scope, $http, files) {
	$scope.blah = "Please Select the Machine";
	$scope.items = [];
	$scope.init = function () {
		$http({
			method: 'GET',
			url: 'log_viewer/GetMachineList'
		}).success(function (data, status, headers, config) {
			$scope.items = data;
		}).error(function (data, status, headers, config) {
			var i = 0;
			// called asynchronously if an error occurs
			// or server returns response with an error status.
		});
	};
	$scope.machineSelected = function () {
		files.selectedHost = this.choice;
		$scope.blah = this.choice;
		$http({
			method: 'GET',
			url: 'log_viewer/GetFileList'
		}).success(function (data, status, headers, config) {
			files.setFileList(data);
		}).error(function (data, status, headers, config) {
			// called asynchronously if an error occurs
			// or server returns response with an error status.
		});
	};
});

logViewer.controller('selectFileButton', function ($scope, $http, files) {
	$scope.fileSelected = function () {
		$http({
			method: 'GET',
			url: 'log_viewer/GetLogFile?filePath=' + files.selectedFile + '&hostName=localhost'
		}).success(function (data, status, headers, config) {
			files.file = data;
		}).error(function (data, status, headers, config) {
			// called asynchronously if an error occurs
			// or server returns response with an error status.
		});
	};
});

logViewer.controller('TabsDemoCtrl', ['$scope', 'files', 'accordian', 'SearchResultsService',
	function ($scope, files, accordian, SearchResultsService) {
		$scope.tabs = [{
			shortTitle: "Short Sample Log File",
			longTitle: "Long Log File",
			content: "Sample Log Text"
		}];

		$scope.$watch(function () {
			return files.file;
		}, function () {
			if (files.file != null && files.selectedFile != null) {
				file = new Object();
				file.longTitle = files.selectedHost + " : " + files.selectedFile;
				var splitFileName = files.selectedFile.split("/");
				var fileName = splitFileName[splitFileName.length - 1];
				file.shortTitle = files.selectedHost + ":" + fileName;
				file.content = files.file;
				files.file = null;
				$scope.tabs.push(file);
			}
		});
		$scope.removeTab = function (index) {
			$scope.tabs.splice(index, 1);
		};

		$scope.checked = false; // This will be binded using the ps-open attribute

		$scope.diagnoseText = function () {

			var text = "";
			if (window.getSelection) {
				text = window.getSelection().toString();
			} else if (document.selection && document.selection.type != "Control") {
				text = document.selection.createRange().text;
			}
			if (text != "") {
				$scope.checked = !$scope.checked;
				SearchResultsService.diagnose(text, 5);
				// strata.diagnose(text, onSuccess = function (response) {
				// 	var group = new Object();
				// 	group.title = response.title;
				// 	group.content = response.issue.text;
				// 	accordian.addGroup(group);
				// 	$scope.$apply();
				// }, onFailure = function (response) {
				// 	// Iterate over the response array
				// 	// response.forEach(someHandler);
				// 	console.log(response);
				// }, 5);
			}
		};
	}
]);

logViewer.controller('AccordionDemoCtrl', function ($scope, accordian) {
	$scope.oneAtATime = true;
	$scope.groups = accordian.getGroups();
});
angular.module('templates.app', ['security/login_form.html', 'security/login_status.html', 'search/views/accordion_search.html', 'search/views/accordion_search_results.html', 'search/views/list_search_results.html', 'search/views/resultDetail.html', 'search/views/search.html', 'search/views/search_form.html', 'search/views/standard_search.html', 'cases/views/attachLocalFile.html', 'cases/views/attachProductLogs.html', 'cases/views/details.html', 'cases/views/listAttachments.html', 'cases/views/new.html', 'log_viewer/views/log_viewer-lindani.html', 'log_viewer/views/log_viewer.html']);

angular.module("security/login_form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login_form.html",
    "    <div class=\"modal-header\">\n" +
    "        <h4>Sign into the Red Hat Customer Portal</h4>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"alert alert-warning\" ng-show=\"authReason\">\n" +
    "            {{authReason}}\n" +
    "        </div>\n" +
    "        <div class=\"alert alert-error\" ng-show=\"authError\">\n" +
    "            {{authError}}\n" +
    "        </div>\n" +
    "        <div class=\"alert alert-info\">Please enter your login details</div>\n" +
    "        <label>User ID</label>\n" +
    "        <input name=\"login\" type=\"text\" ng-model=\"user.user\" required autofocus>\n" +
    "        <label>Password</label>\n" +
    "        <input name=\"pass\" type=\"password\" ng-model=\"user.password\" required>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button class=\"btn btn-primary login\" ng-click=\"modalOptions.ok()\" >Sign in</button>\n" +
    "        <button class=\"btn clear\" ng-click=\"clearForm()\">Clear</button>\n" +
    "        <button class=\"btn btn-warning cancel\" ng-click=\"modalOptions.close()\">Cancel</button>\n" +
    "    </div>\n" +
    "\n" +
    "");
}]);

angular.module("security/login_status.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login_status.html",
    "<div ng-controller = 'SecurityController'>\n" +
    "<span ng-show=\"isLoggedIn\" class=\"pull-right\"> Logged into the customer portal as {{loggedInUser}} &nbsp;|&nbsp;\n" +
    "  <a href=\"\" ng-click=\"logout()\"> Log out</a>\n" +
    "</span>\n" +
    "<span ng-show=\"!isLoggedIn\" class=\"pull-right\"> Not Logged in &nbsp;|&nbsp;\n" +
    "	<a href=\"\" ng-click=\"login()\"> Log In</a>\n" +
    "</span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("search/views/accordion_search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("search/views/accordion_search.html",
    "<div class ='row ' x-login-status/>\n" +
    "<div class=\"row panel panel-default\">\n" +
    "   <div class=\"panel-body\" x-search-form ng-controller='SearchController'>\n" +
    "   </div>\n" +
    "</div>\n" +
    "<div class='row' x-accordion-search-results='' ng-controller='SearchController'/>\n" +
    "");
}]);

angular.module("search/views/accordion_search_results.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("search/views/accordion_search_results.html",
    "<div class=\"row \" >\n" +
    "    <accordion > \n" +
    "      <accordion-group is-open=\"isopen\" ng-repeat=\"result in results\">\n" +
    "        <accordion-heading>\n" +
    "            {{result.title}}<i class=\"pull-right glyphicon\" ng-class=\"{'glyphicon-chevron-down': isopen, 'glyphicon-chevron-right': !isopen}\"></i>\n" +
    "        </accordion-heading>\n" +
    "        <x-result-detail-display result='result'/>\n" +
    "      </accordion-group>\n" +
    "    </accordion>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("search/views/list_search_results.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("search/views/list_search_results.html",
    "<div class=\"col-lg-4\">  \n" +
    "  <div class=\"panel panel-default\" ng-show='results.length > 0'>\n" +
    "    <!--pagination on-select-page=\"pageChanged(page)\" total-items=\"totalItems\" page=\"currentPage\" max-size=\"maxSize\"></pagination-->\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <h3 class=\"panel-title\">\n" +
    "       Recommendations\n" +
    "     </h3>\n" +
    "   </div>\n" +
    "   <div id='solutions' class=\"panel-body list-group\">\n" +
    "    <div class='list-group-item '  ng-repeat=\"result in results\">\n" +
    "      <a href=\"\" ng-click=\"solutionSelected($index)\"> {{ result.title }}</a>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "</div>\n" +
    "<div class=\"col-lg-8\">\n" +
    "  <x-result-detail-display result='selectedSolution'/>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("search/views/resultDetail.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("search/views/resultDetail.html",
    "<div class='panel' style='border:0' ng-model=\"result\" >\n" +
    "	<div ng-if=\"isSolution()\">\n" +
    "		<h3>Environment</h3>\n" +
    "		<div ng-bind-html='result.environment.html'></div>\n" +
    "		<h3>Issue</h3>\n" +
    "		<div ng-bind-html='result.issue.html'></div>\n" +
    "		<h3 ng-if=\"getSolutionResolution() !== ''\" >Resolution</h3>\n" +
    "		<div ng-bind-html='getSolutionResolution()'></div>\n" +
    "	</div>\n" +
    "	<div ng-if=\"isArticle()\">\n" +
    "		<div ng-bind-html='getArticleHtml()'></div>\n" +
    "	</div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("search/views/search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("search/views/search.html",
    "<x-standard-search/>\n" +
    "");
}]);

angular.module("search/views/search_form.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("search/views/search_form.html",
    "<div class='container col-lg-4 pull-left'>\n" +
    "    <form role=\"form\" id= \"rh-search\">\n" +
    "    <div class=\"input-group\" >\n" +
    "      <input type=\"text\" class=\"form-control\" id=\"rhSearchStr\" name=\"searchString\" ng-model=\"searchStr\" class=\"input-xxlarge\" placeholder=\"Search Articles and Solutions\">\n" +
    "      <span class=\"input-group-btn\">\n" +
    "        <button class=\"btn btn-default\"  type='submit' ng-click=\"search(searchStr)\">Search</button>\n" +
    "      </span>\n" +
    "    </div>\n" +
    "  </form>\n" +
    "</div>\n" +
    "  ");
}]);

angular.module("search/views/standard_search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("search/views/standard_search.html",
    "<div class=\"container-fluid side-padding\">\n" +
    "	<div class=\"row\">\n" +
    "		<div class=\"col-xs-12\">\n" +
    "			<h3>Red Hat Access: Search</h3>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "	<div x-login-status style=\"padding: 10px;\"/>\n" +
    "	<div class=\"bottom-border\" style=\"padding-top: 10px;\"></div>\n" +
    "	<div class=\"row\" x-search-form ng-controller='SearchController'></div>\n" +
    "	<div style=\"padding-top: 10px;\"></div>\n" +
    "	<div class='row' x-list-search-results='' ng-controller='SearchController'/>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("cases/views/attachLocalFile.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("cases/views/attachLocalFile.html",
    "<div class=\"container-fluid\"><div class=\"row create-field\"><div class=\"col-xs-4\"><button style=\"float: left;\" ng-click=\"getFile()\" class=\"btn\">Attach local file</button><div style=\"height: 0px; width:0px; overflow:hidden;\"><form name=\"fileUploaderForm\" id=\"fileUploaderForm\" enctype=\"multipart/form-data\"><input id=\"fileUploader\" type=\"file\" value=\"upload\" ng-change=\"selectFile(this)\" ng-model=\"file\"/></form></div></div><div class=\"col-xs-8\"><div style=\"float: left; word-wrap: break-word; width: 100%;\">{{fileName}}</div></div></div><div class=\"row create-field\"><div style=\"font-size: 80%;\" class=\"col-xs-12\"><span>File names must be less than 80 characters. Maximum file size for web-uploaded attachments is 250 MB. Please FTP larger files to dropbox.redhat.com.&nbsp;</span><span><a href=\"https://access.devgssci.devlab.phx1.redhat.com/knowledge/solutions/2112\">(More info)</a></span></div></div><div class=\"row create-field\"><div class=\"col-xs-12\"><input style=\"float: left;\" placeholder=\"File description\" ng-model=\"fileDescription\" class=\"form-control\"/></div></div><div class=\"row create-field\"><div class=\"col-xs-12\"><button ng-disabled=\"fileName == NO_FILE_CHOSEN\" style=\"float: right;\" ng-click=\"addFile(fileUploaderForm)\" class=\"btn\">Add</button></div></div><!--div.row.create-field--><!--  div.col-xs-12--><!--    form(enctype='multipart/form-data', name='attachLocalFileForm', ng-submit='addFile(this)', id='formId')--><!--      input(id='fileUploader', type='file', value='upload', ng-change='selectFile(this)', ng-model='file')--><!--      input(type='submit', value='submit', id='fileUploaderSubmitBtn')--></div>");
}]);

angular.module("cases/views/attachProductLogs.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("cases/views/attachProductLogs.html",
    "<div class=\"container-fluid\"><div class=\"row create-field\"><div class=\"col-xs-12\"><div style=\"padding-bottom: 4px;\">Attach Foreman logs:</div><select multiple=\"multiple\" class=\"form-control\"><option>Log1</option><option>Log2</option><option>Log3</option><option>Log4</option><option>Log5</option><option>Log6</option></select></div></div><div class=\"row create-field\"><div class=\"col-xs-12\"><button ng-disabled=\"true\" style=\"float: right;\" class=\"btn\">Add</button></div></div></div>");
}]);

angular.module("cases/views/details.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("cases/views/details.html",
    "<!DOCTYPE html><div id=\"redhat-access-case\"><div><h1 style=\"font-weight: bold\">Red Hat Access: Case {{caseId}}</h1></div><div x-login-status></div><div style=\"padding-top: 20px;\" class=\"bottom-border\"></div><div class=\"container-fluid\"><div class=\"row\"><div class=\"col-xs-12 col-no-padding\"><form name=\"caseDetails\"><div style=\"padding-bottom: 10px;\" class=\"has-feedback\"><span ng-show=\"caseDetails.summary.$dirty\" style=\"right: 50%; top: 0px;\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><input style=\"width: 50%;\" ng-model=\"details.summary\" name=\"summary\" class=\"form-control\"></div><div class=\"container-fluid side-padding\"><div class=\"row\"><h4 class=\"col-xs-12 section-header\">Case Details</h4><div class=\"container-fluid side-padding\"><div class=\"row\"><div class=\"col-xs-4\"><table class=\"table details-table\"><tr><th class=\"details-table-header\"><div style=\"vertical-align: 50%\">Case Type:</div></th><td><div class=\"form-group has-feedback\"><span ng-show=\"caseDetails.type.$dirty\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><select name=\"type\" style=\"width: 100%;\" ng-model=\"details.type\" ng-options=\"c.name for c in caseTypes track by c.name\" class=\"form-control\"></select></div></td></tr><tr><th class=\"details-table-header\">Severity:</th><td><div class=\"form-group has-feedback\"><span ng-show=\"caseDetails.severity.$dirty\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><select name=\"severity\" style=\"width: 100%;\" ng-model=\"details.severity\" ng-options=\"s.name for s in severities track by s.name\" class=\"form-control\"></select></div></td></tr><tr><th class=\"details-table-header\">Status:</th><td><div class=\"form-group has-feedback\"><span ng-show=\"caseDetails.status.$dirty\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><select name=\"status\" style=\"width: 100%;\" ng-model=\"details.status\" ng-options=\"s.name for s in statuses track by s.name\" class=\"form-control\"></select></div></td></tr><tr><th class=\"details-table-header\">Alternate ID:</th><td><div class=\"form-group has-feedback\"><span ng-show=\"caseDetails.alternate_id.$dirty\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><input style=\"width: 100%\" ng-model=\"details.alternate_id\" name=\"alternate_id\" class=\"form-control\"></div></td></tr></table></div><div class=\"col-xs-4\"><table class=\"table details-table\"><tr><th>Product:</th><td><div class=\"form-group has-feedback\"><span ng-show=\"caseDetails.product.$dirty\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><select name=\"product\" style=\"width: 100%;\" ng-model=\"details.product\" ng-change=\"getProductVersions(details.product)\" ng-options=\"s.name for s in products track by s.name\" required class=\"form-control\"></select></div></td></tr><tr><th class=\"details-table-header\">Product Version:</th><td><div class=\"form-group has-feedback\"><span ng-show=\"caseDetails.version.$dirty\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><select name=\"version\" style=\"width: 100%;\" ng-options=\"v for v in versions track by v\" ng-model=\"details.version\" required class=\"form-control\"></select></div></td></tr><tr><th class=\"details-table-header\">Support Level:</th><td>{{details.sla}}</td></tr><tr><th class=\"details-table-header\">Owner:</th><td>{{details.contact_name}}</td></tr><tr><th class=\"details-table-header\">Red Hat Owner:</th><td>{{details.owner}}</td></tr></table></div><div class=\"col-xs-4\"><table class=\"table details-table\"><tr><th class=\"details-table-header\">Group:</th><td><div class=\"form-group has-feedback\"><span ng-show=\"caseDetails.group.$dirty\" class=\"glyphicon glyphicon-asterisk form-control-feedback\"></span><select name=\"group\" style=\"width: 100%;\" ng-options=\"g.name for g in groups track by g.number\" ng-model=\"details.group\" class=\"form-control\"></select></div></td></tr><tr><th class=\"details-table-header\">Opened:</th><td><div>{{details.created_date | date:'medium'}}</div><div>{{details.created_by}}</div></td></tr><tr><th class=\"details-table-header\">Last Updated:</th><td><div>{{details.last_modified_date | date:'medium'}}</div><div>{{details.last_modified_by}}</div></td></tr><tr><th class=\"details-table-header\">Account Number:</th><td>{{details.account_number}}</td></tr><tr><th class=\"details-table-header\">Account Name:</th><td>{{details.account_name}}</td></tr></table></div></div><div class=\"row\"><div class=\"col-xs-12\"><div style=\"float: right;\"><button name=\"updateButton\" ng-disabled=\"!caseDetails.$dirty\" ng-hide=\"updatingDetails\" ng-click=\"updateCase()\" class=\"btn btn-primary\">Update</button><div ng-show=\"updatingDetails\">Updating Case...</div></div></div></div></div></div></div></form></div></div><div class=\"row\"><h4 class=\"col-xs-12 section-header\">Description</h4><div class=\"container-fluid side-padding\"><div class=\"row\"><div class=\"col-xs-3\"><strong>{{details.created_by}}</strong></div><div class=\"col-xs-9\">{{details.description}}</div></div></div></div><div class=\"row\"><h4 class=\"col-xs-12 section-header\">Bugzilla Tickets</h4><div class=\"container-fluid side-padding\"><div class=\"row\"><div ng-if=\"!hasBugzillas\"><div class=\"col-xs-12\">No Bugzillas linked to case.</div></div><div ng-if=\"hasBugzillas\"><div class=\"col-xs-12\">Yes Bugzillas</div></div></div></div></div><div class=\"row\"><h4 class=\"col-xs-12 section-header\">Attachments</h4><div class=\"container-fluid side-padding\"><div class=\"row side-padding\"><div class=\"col-xs-12 bottom-border col-no-padding\"><rha-list-attachments></rha-list-attachments></div></div><div class=\"row\"><div class=\"col-xs-6\"><rha-attach-product-logs></rha-attach-product-logs></div><div class=\"col-xs-6\"><rha-attach-local-file></rha-attach-local-file></div></div></div></div><div ng-controller=\"Recommendations\" class=\"row\"><h4 class=\"col-xs-12 section-header\">Recommendations</h4><div class=\"container-fluid side-padding\"><div class=\"row\"><div ng-repeat=\"recommendation in recommendationsOnScreen\"><div class=\"col-xs-3\"><div class=\"bold\">{{recommendation.title}}</div><div style=\"padding: 8px 0;\">{{recommendation.solution_abstract}}</div><a href=\"{{recommendation.resource_view_uri}}\" target=\"_blank\">View full article in new window</a></div></div></div><div class=\"row\"><div class=\"col-xs-12\"><pagination boundary-links=\"true\" total-items=\"recommendations.length\" on-select-page=\"selectPage(page)\" items-per-page=\"itemsPerPage\" page=\"currentPage\" max-size=\"maxSize\" previous-text=\"&lt;\" next-text=\"&gt;\" first-text=\"&lt;&lt;\" last-text=\"&gt;&gt;\" class=\"pagination-sm\"></pagination></div></div></div></div><div class=\"row\"><h4 class=\"col-xs-12 section-header\">Case Discussion</h4><div class=\"container-fluid side-padding\"><div class=\"row create-field\"><div class=\"col-xs-12\"><textarea rows=\"5\" class=\"form-control\"></textarea></div></div><div style=\"margin-left: 0px; margin-right: 0px;\" class=\"row create-field bottom-border\"><div class=\"col-xs-12 col-no-padding\"><button ng-disabled=\"true\" style=\"float: right;\" class=\"btn\">Add comment</button></div></div><div class=\"row\"><div ng-repeat=\"comment in comments\"><div class=\"col-xs-2\"><div class=\"bold\">{{comment.created_by}}</div><div>{{comment.created_date | date:'mediumDate'}}</div><div>{{comment.created_date | date:'mediumTime'}}</div></div><div class=\"col-xs-10\"><pre>{{comment.text}}</pre></div></div></div></div></div></div></div>");
}]);

angular.module("cases/views/listAttachments.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("cases/views/listAttachments.html",
    "<div ng-show=\"attachments.length == 0\">No attachments added</div><table ng-show=\"attachments.length &gt; 0\" class=\"table table-hover table-bordered\"><thead><th>Filename</th><th>Description</th><th>Size</th><th>Attached</th><th>Attached By</th><th></th></thead><tbody><tr ng-repeat=\"attachment in attachments\"><td><a ng-hide=\"attachment.uri == null\" href=\"{{attachment.uri}}\">{{attachment.file_name}}</a><div ng-show=\"attachment.uri == null\">{{attachment.file_name}}</div></td><td>{{attachment.description}}</td><td>{{attachment.length | bytes}}</td><td>{{attachment.created_date | date:'medium'}}</td><td>{{attachment.created_by}}</td><td><a ng-click=\"removeAttachment()\"><span popover=\"Remove\" popover-trigger=\"mouseenter\" popover-placement=\"right\" ng-click=\"removeAttachment\" style=\"width: 100%; height: 100%;\" class=\"glyphicon glyphicon-remove-circle\"></span></a></td></tr></tbody></table>");
}]);

angular.module("cases/views/new.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("cases/views/new.html",
    "<!DOCTYPE html><div class=\"container-fluid side-padding\"><div class=\"row\"><div class=\"col-xs-12\"><h3>Red Hat Access: Open a New Support Case</h3></div></div><div style=\"padding: 10px;\" x-login-status></div><div style=\"padding-top: 10px;\" class=\"bottom-border\"></div><div ng-hide=\"submitProgress == 0\" class=\"row\"><div class=\"col-xs-12\"><progressbar animate=\"true\" type=\"success\" value=\"submitProgress\" max=\"100\"></progressbar></div></div><div class=\"row\"><div style=\"border-right: 1px solid; border-color: #cccccc;\" class=\"col-xs-6\"><div class=\"container-fluid side-padding\"><div ng-class=\"{&quot;hidden&quot;: isPage2}\" id=\"rha-case-wizard-page-1\" class=\"create-case-section\"><div class=\"row create-field\"><div class=\"col-xs-4\"><div>Product:</div></div><div class=\"col-xs-8\"><select style=\"width: 100%;\" ng-model=\"product\" ng-change=\"getProductVersions(product)\" ng-options=\"p.name for p in products track by p.code\" class=\"form-control\"></select></div></div><div class=\"row create-field\"><div class=\"col-xs-4\"><div>Product Version:</div></div><div class=\"col-xs-8\"><div><progressbar ng-hide=\"!versionLoading\" max=\"1\" value=\"1\" style=\"height: 34px; margin-bottom: 0px;\" class=\"progress-striped active\"></progressbar><select style=\"width: 100%;\" ng-model=\"version\" ng-options=\"v for v in versions\" ng-change=\"validateForm()\" ng-disabled=\"versionDisabled\" ng-hide=\"versionLoading\" class=\"form-control\"></select></div></div></div><div class=\"row create-field\"><div class=\"col-xs-4\"><div>Summary:</div></div><div class=\"col-xs-8\"><input id=\"rha-case-summary\" style=\"width: 100%;\" ng-change=\"validateForm()\" ng-model=\"summary\" class=\"form-control\"></div></div><div class=\"row create-field\"><div class=\"col-xs-4\"><div>Description:</div></div><div class=\"col-xs-8\"><textarea style=\"width: 100%; height: 200px;\" ng-model=\"description\" ng-change=\"validateForm()\" class=\"form-control\"></textarea></div></div><div class=\"row\"><div ng-class=\"{&quot;hidden&quot;: isPage2}\" class=\"col-xs-12\"><button style=\"float: right\" ng-click=\"doNext()\" ng-disabled=\"incomplete\" class=\"btn btn-primary\">Next</button></div></div></div><div ng-class=\"{&quot;hidden&quot;: isPage1}\" id=\"rha-case-wizard-page-1\" class=\"create-case-section\"><div class=\"bottom-border\"><div class=\"row\"><div class=\"col-xs-12\"><div style=\"margin-bottom: 10px;\" class=\"bold\">{{product.name}} {{version}}</div></div></div><div class=\"row\"><div class=\"col-xs-12\"><div style=\"font-size: 90%; margin-bottom: 4px;\" class=\"bold\">{{summary}}</div></div></div><div class=\"row\"><div class=\"col-xs-12\"><div style=\"font-size: 85%\">{{description}}</div></div></div></div><div class=\"row create-field\"><div class=\"col-xs-4\">Severity:</div><div class=\"col-xs-8\"><select style=\"width: 100%;\" ng-model=\"severity\" ng-change=\"validatePage2()\" ng-options=\"s.name for s in severities track by s.name\" class=\"form-control\"></select></div></div><div class=\"row create-field\"><div class=\"col-xs-4\">Case Group:</div><div class=\"col-xs-8\"><select style=\"width: 100%;\" ng-model=\"caseGroup\" ng-change=\"validatePage2()\" ng-options=\"g.name for g in groups track by g.number\" class=\"form-control\"></select></div></div><div class=\"row create-field\"><div class=\"col-xs-12\"><div>Attachments:</div></div></div><div class=\"bottom-border\"><div class=\"row create-field\"><div class=\"col-xs-12\"><rha-list-attachments></rha-list-attachments></div></div></div><div class=\"bottom-border\"><div class=\"row create-field\"><div class=\"col-xs-12\"><rha-attach-product-logs></rha-attach-product-logs></div></div></div><div class=\"bottom-border\"><div class=\"row create-field\"><div class=\"col-xs-12\"><rha-attach-local-file></rha-attach-local-file></div></div></div><div style=\"margin-top: 20px;\" class=\"row\"><div class=\"col-xs-6\"><button style=\"float: left\" ng-click=\"doPrevious()\" class=\"btn btn-primary\">Previous</button></div><div class=\"col-xs-6\"><button style=\"float: right\" //ng-disabled=\"submitProgress &gt; 0\" ng-click=\"doSubmit()\" class=\"btn btn-primary\">Submit</button></div></div></div></div></div><div class=\"col-xs-6\"><div class=\"container-fluid side-padding\"><div class=\"row\"><div class=\"col-xs-12\"><h4 style=\"padding-left: 10px;\" class=\"bottom-border\">Recommendations</h4><div x-accordion-search-results ng-controller=\"SearchController\"></div></div></div></div></div></div></div>");
}]);

angular.module("log_viewer/views/log_viewer-lindani.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("log_viewer/views/log_viewer-lindani.html",
    "<div id=\"main\" >\n" +
    "	<div class=\"row\">\n" +
    "		<div class=\"col-xs-12\">\n" +
    "			<h3>Red Hat Access: Diagnose</h3>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "	<div x-login-status style=\"padding: 10px;\"/>\n" +
    "	<div class=\"bottom-border\" style=\"padding-top: 10px;\"></div>\n" +
    "	<div class=\"row\">\n" +
    "		<div id=\"log-viewer-left\" class=\"col-lg-4\"> \n" +
    "			<div class=\"btn-group\" ng-controller=\"DropdownCtrl\" ng-init=\"init()\">\n" +
    "				<button type=\"button\" class=\"btn btn-default dropdown-toggle\"\n" +
    "				data-toggle=\"dropdown\">\n" +
    "				{{blah}} <span class=\"caret\"></span>\n" +
    "			</button>\n" +
    "			<ul class=\"dropdown-menu\">\n" +
    "				<li ng-repeat=\"choice in items\" ng-click=\"machineSelected()\"><a>{{choice}}</a></li>\n" +
    "			</ul>\n" +
    "		</div>\n" +
    "		<div ng-controller=\"fileController\" ng-click=\"updateSelected()\">\n" +
    "			<div data-angular-treeview=\"true\" data-tree-id=\"mytree\"\n" +
    "			data-tree-model=\"roleList\" data-node-id=\"roleId\"\n" +
    "			data-node-label=\"roleName\" data-node-children=\"children\"></div>\n" +
    "		</div>\n" +
    "		<button type=\"button\" class=\"btn btn-primary\"\n" +
    "		ng-controller=\"selectFileButton\" ng-click=\"fileSelected()\">\n" +
    "		Select File</button>\n" +
    "	</div>\n" +
    "	<div id=\"log-viewer-right\"class=\"col-lg-8\"> \n" +
    "		<div class= \"row\" ng-show=>\n" +
    "			<div ng-controller=\"TabsDemoCtrl\">\n" +
    "			<tabset > \n" +
    "				<tab ng-repeat=\"tab in tabs\"\n" +
    "				> <tab-heading>{{tab.shortTitle}}\n" +
    "				<a ng-click=\"removeTab($index)\" href=''> <span\n" +
    "					class=\"glyphicon glyphicon-remove\"></span>\n" +
    "				</a> </tab-heading>\n" +
    "				<div active=\"tab.active\" disabled=\"tab.disabled\" >\n" +
    "					<div class=\"panel panel-default\">\n" +
    "						<div class=\"panel-heading\">\n" +
    "							<h3 class=\"panel-title\" style=\"display: inline\">{{tab.longTitle}}</h3>\n" +
    "							<button id=\"diagnoseButton\" type=\"button\" class=\"btn btn-primary\"\n" +
    "							ng-click=\"diagnoseText()\">Red Hat Diagnose</button>\n" +
    "							<br> <br>\n" +
    "						</div>\n" +
    "						<div class=\"panel-body\">\n" +
    "							<pre>{{tab.content}}</pre>\n" +
    "						</div>\n" +
    "					</div>\n" +
    "\n" +
    "				</div>\n" +
    "			</tab> \n" +
    "		</tabset>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "	<div class= \"row\">\n" +
    "     <div class=\"panel panel-default\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <h4 class=\"panel-title\">\n" +
    "        <a data-toggle=\"collapse\"  data-target=\"#collapseTwo\">\n" +
    "          Suggested Solutions\n" +
    "        </a>\n" +
    "      </h4>\n" +
    "    </div>\n" +
    "    <div id=\"collapseTwo\" class=\"panel-collapse collapse\">\n" +
    "      <div class=\"panel-body\">\n" +
    "        <div  x-accordion-search-results='' ng-controller='SearchController'/>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "</div>			\n" +
    "</div>\n" +
    "</div>");
}]);

angular.module("log_viewer/views/log_viewer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("log_viewer/views/log_viewer.html",
    "<div id=\"log_view_main\" class=\"container\" style=\"max-height: 500px;\" >\n" +
    "	<div class=\"row\">\n" +
    "		<div class=\"col-xs-12\">\n" +
    "			<h3>Red Hat Access: Diagnose</h3>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "	<div x-login-status style=\"padding: 10px;\"/>\n" +
    "	<div class=\"bottom-border\" style=\"padding-top: 10px;\"></div>\n" +
    "	<div ng-class=\"{ showMe: opens }\" class=\"left\" >\n" +
    "			<div id=\"controller-demo\">\n" +
    "				<div id=\"blah\">\n" +
    "					<a ng-click=\"opens = !opens\"><span ng-class=\"{ showMe: opens }\"\n" +
    "						class=\"glyphicon glyphicon-chevron-right\"></span></a>\n" +
    "				</div>\n" +
    "			</div>\n" +
    "		</div>\n" +
    "		<div style=\"padding: 5px\" ng-class=\"{ showMe: opens }\" class=\"demo-left\" >\n" +
    "			<div class=\"btn-group\" ng-controller=\"DropdownCtrl\" ng-init=\"init()\">\n" +
    "				<button type=\"button\" class=\"btn btn-default dropdown-toggle\"\n" +
    "					data-toggle=\"dropdown\">\n" +
    "					{{blah}} <span class=\"caret\"></span>\n" +
    "				</button>\n" +
    "				<ul class=\"dropdown-menu\">\n" +
    "					<li ng-repeat=\"choice in items\" ng-click=\"machineSelected()\"><a>{{choice}}</a></li>\n" +
    "				</ul>\n" +
    "			</div>\n" +
    "			<div ng-controller=\"fileController\" ng-click=\"updateSelected()\">\n" +
    "				<div data-angular-treeview=\"true\" data-tree-id=\"mytree\"\n" +
    "					data-tree-model=\"roleList\" data-node-id=\"roleId\"\n" +
    "					data-node-label=\"roleName\" data-node-children=\"children\"></div>\n" +
    "			</div>\n" +
    "\n" +
    "			<button type=\"button\" class=\"btn btn-primary\"\n" +
    "				ng-controller=\"selectFileButton\" ng-click=\"fileSelected()\">\n" +
    "				Select File</button>\n" +
    "			<a ng-click=\"opens = !opens\"><span ng-class=\"{ showMe: opens }\"\n" +
    "						class=\"glyphicon glyphicon-chevron-left\"></span></a>\n" +
    "		</div>\n" +
    "\n" +
    "\n" +
    "		<div id=\"right\">\n" +
    "			<div ng-controller=\"TabsDemoCtrl\" ng-class=\"{ showMe: open }\"\n" +
    "				class=\"main-right height\">\n" +
    "				<tabset class=\"height\"> <tab ng-repeat=\"tab in tabs\"\n" +
    "					class=\"height\"> <tab-heading>{{tab.shortTitle}}\n" +
    "				<a ng-click=\"removeTab($index)\" href=''> <span\n" +
    "					class=\"glyphicon glyphicon-remove\"></span>\n" +
    "				</a> </tab-heading>\n" +
    "				<div active=\"tab.active\" disabled=\"tab.disabled\" class=\"height\">\n" +
    "					<div class=\"panel panel-default height\">\n" +
    "						<div class=\"panel-heading\">\n" +
    "							<h3 class=\"panel-title\" style=\"display: inline\">{{tab.longTitle}}</h3>\n" +
    "							<button id=\"diagnoseButton\" type=\"button\" class=\"btn btn-primary\"\n" +
    "								ng-click=\"diagnoseText()\">Red Hat Diagnose</button>\n" +
    "							<br> <br>\n" +
    "						</div>\n" +
    "						<div class=\"panel-body height\" id=\"right-side\">\n" +
    "							<pre>{{tab.content}}</pre>\n" +
    "						</div>\n" +
    "					</div>\n" +
    "				</div>\n" +
    "				</tab> </tabset>\n" +
    "			</div>\n" +
    "\n" +
    "			<div id=\"controller-demo\" ng-class=\"{ showMe: open }\"\n" +
    "				class=\"controller-demo\">\n" +
    "				<div class=\"collapsable\">\n" +
    "					<a ng-click=\"open = !open\"><span ng-class=\"{ showMe: open }\"\n" +
    "						class=\"glyphicon glyphicon-remove bigger-button\"></span></a>\n" +
    "					<div ng-class=\"{ showMe: open }\" class=\"demo-right\">\n" +
    "						<div  x-accordion-search-results='' ng-controller='SearchController'/>\n" +
    "					</div>\n" +
    "				</div>\n" +
    "			</div>\n" +
    "          </div>\n" +
    "</div>");
}]);
