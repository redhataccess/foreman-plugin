/**
 * Copyright 2013-2014 Red Hat, Inc.
 *
 * This software is licensed to you under the GNU General Public
 * License as published by the Free Software Foundation; either version
 * 2 of the License (GPLv2) or (at your option) any later version.
 * There is NO WARRANTY for this software, express or implied,
 * including the implied warranties of MERCHANTABILITY,
 * NON-INFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. You should
 * have received a copy of GPLv2 along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 */

/**
 *
 * @description
 *
 */
angular.module('RedhatAccess.search').controller('SearchController', ['$scope',
    function($scope) {
        $scope.results = [];
        $scope.selectedSolution = '';

        onFailure = function() {
            //alert("Failed");
        };

        addResult = function(result) {
            $scope.$apply(function() {
                $scope.results.push(result);
            });

        };

        $scope.solutionSelected = function(index) {

            var response = $scope.results[index];
            //yikes, view logic in controller!
            var panel = "<div class='panel' style='border:0'>";
            var environment_html = response.environment.html;
            var issue_html = response.issue.html;
            var resolution_html = '';
            if (response.resolution !== undefined) {
                resolution_html = response.resolution.html;
            }
            var solution_html = "<h3>Environment</h3>" + environment_html + "<h3>Issue</h3>" + issue_html + "<h3>Resolution</h3>" + resolution_html;
            panel = panel + solution_html;
            panel = panel + "</div></div>"

            $scope.selectedSolution = panel;

        };

        $scope.search = function(searchStr) {
            strata.diagnose($scope.searchStr,
                function(response) {
                    addResult(response);
                },
                onFailure,
                11
            );

        }


    }


]);