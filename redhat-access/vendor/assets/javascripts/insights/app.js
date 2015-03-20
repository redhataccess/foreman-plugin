"use strict";

angular.module("telemetryConfig", []).value("CONFIG", {
    preloadData: true,
    authenticate: true,
    allowExport: false,
    doPaf: false,
    API_ROOT: "/rs/telemetry/api/",
    ACCT_KEY: "telemetry:account_number"
}).run([ "CONFIG", function(CONFIG) {
    if (window.localStorage.getItem("tapi:dev")) {
        CONFIG.API_ROOT = "v1/";
    }
} ]);

(function() {
    "use strict";
    angular.module("telemetryApp", [ "telemetryConfig", "telemetryTemplates", "telemetryApi", "telemetryWidgets", "oitozero.ngSweetAlert", "ui.router", "yaru22.angular-timeago", "localytics.directives", "ui.bootstrap", "ngTable", "angular-loading-bar" ]).config([ "$stateProvider", "$urlRouterProvider", "$locationProvider", "$httpProvider", function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
        $urlRouterProvider.otherwise("/");
        $urlRouterProvider.when("/error_infos", "/rules/admin");
        $locationProvider.html5Mode(true);
        // Prevents Basic Auth Popup
        $httpProvider.interceptors.push("xomitInterceptor");
        $httpProvider.interceptors.push("authInterceptor");
    } ]).factory("xomitInterceptor", [ "$rootScope", "$q", function($rootScope, $q) {
        return {
            request: function(config) {
                // stomp on basic auth requests
                if (config && config.headers) {
                    config.headers["X-Omit"] = "WWW-Authenticate";
                }
                return config;
            }
        };
    } ]).factory("authInterceptor", [ "$rootScope", "$q", "Bounce", function($rootScope, $q, Bounce) {
        return {
            responseError: function(response) {
                if (response.status === 401) {
                    Bounce.bounce();
                    return $q.reject(response);
                } else {
                    return $q.reject(response);
                }
            }
        };
    } ]).run([ "$rootScope", "Analytics", function($rootScope, Analytics) {
        $rootScope.$on("$stateChangeSuccess", function() {
            Analytics.pageLoad();
        });
    } ]);
})();

(function() {
    "use strict";
    angular.module("telemetryApi", [ "telemetryConfig" ]).factory("Account", [ "$rootScope", "User", "CONFIG", function($rootScope, User, CONFIG) {
        var user = User.current;
        var account = user.account_number;
        var storage_account = window.sessionStorage.getItem(CONFIG.ACCT_KEY);
        if (user.internal && storage_account) {
            account = storage_account;
        }
        $rootScope.$on("account:change", function(evt, acct) {
            // Double equal on purpose
            if (account != acct) {
                account = acct;
                $rootScope.$broadcast("reload:data");
            }
        });
        return {
            current: function(separator) {
                if (account) {
                    var accountStr = separator ? separator : "?";
                    accountStr += "account_number=" + account;
                    return accountStr;
                }
                return "";
            }
        };
    } ]);
})();

"use strict";

angular.module("telemetryWidgets", [ "telemetryApi", "telemetryConfig", "telemetryTemplates", "yaru22.angular-timeago", "ui.bootstrap", "ngTable", "ui.router" ]);

"use strict";

angular.module("telemetryApi").factory("Ack", [ "$http", "$q", "$rootScope", "Account", "CONFIG", function($http, $q, $rootScope, Account, CONFIG) {
    var _acks = [], _ackMap = {};
    function getData() {
        var promise = $http.get(CONFIG.API_ROOT + "acks" + "?include=rule" + Account.current("&")).success(function(acks) {
            _acks.length = 0;
            Array.prototype.push.apply(_acks, acks);
            angular.extend(_ackMap, _.indexBy(_acks, "rule_id"));
        });
        return promise;
    }
    if (CONFIG.preloadData) {
        getData();
    }
    $rootScope.$on("reload:data", getData);
    return {
        acks: _acks,
        ackMap: _ackMap,
        createAck: function(rule) {
            var dfd = $q.defer();
            $http.post(CONFIG.API_ROOT + "acks" + Account.current(), {
                rule_id: rule.id
            }).success(function(ack) {
                _acks.push(ack);
                _ackMap[ack.rule_id] = ack;
                dfd.resolve();
            });
            return dfd.promise;
        },
        deleteAck: function(ack) {
            return $http.delete(CONFIG.API_ROOT + "acks/" + ack.id + Account.current()).success(function(acks) {
                var i, len = _acks.length;
                for (i = 0; i < len; i++) {
                    if (_acks[i].id === ack.id) {
                        _acks.splice(i, 1);
                        delete _ackMap[ack.rule_id];
                        return;
                    }
                }
            });
        },
        reload: getData
    };
} ]);

"use strict";

angular.module("telemetryApi").factory("Announcement", [ "$http", "Account", "CONFIG", function($http, Account, CONFIG) {
    var _unseen = {
        count: 0
    }, _announcements = [];
    function getData() {
        return $http.get(CONFIG.API_ROOT + "announcements").success(function(announcements) {
            _announcements.length = 0;
            _unseen.count = 0;
            angular.forEach(announcements, function(a) {
                if (a.seen === false) {
                    _unseen.count++;
                }
            });
            Array.prototype.push.apply(_announcements, announcements);
        });
    }
    if (CONFIG.preloadData) {
        getData();
    }
    return {
        announcements: _announcements,
        unseen: _unseen,
        createAnnouncement: function(announcement) {
            return $http.post(CONFIG.API_ROOT + "announcements?internal=true", announcement).success(function(announcement) {
                if (!announcement.hidden) {
                    _announcements.push(announcement);
                }
            });
        },
        acknowledge: function(a) {
            return $http.post(CONFIG.API_ROOT + "announcements/" + a.id + "/ack").success(function(announcement) {
                var i, len = _announcements.length;
                for (i = 0; i < len; i++) {
                    if (_announcements[i].id === announcement.id) {
                        _announcements[i] = announcement;
                        _unseen.count--;
                        return;
                    }
                }
            });
        },
        reload: getData
    };
} ]);

"use strict";

angular.module("telemetryApi").factory("Blacklist", [ "$http", "$rootScope", "Account", "RhaTelemetryOverviewService", "CONFIG", function($http, $rootScope, Account, RhaTelemetryOverviewService, CONFIG) {
    var _blacklists = [];
    function getData() {
        $http.get(CONFIG.API_ROOT + "blacklists" + Account.current()).success(function(blacklists) {
            _blacklists.length = 0;
            Array.prototype.push.apply(_blacklists, blacklists);
        });
    }
    if (CONFIG.preloadData) {
        getData();
    }
    $rootScope.$on("reload:data", getData);
    return {
        blacklists: _blacklists,
        createBlacklist: function(system) {
            var blacklist = {
                machine_id: system.machine_id,
                account_number: system.account_number
            };
            return $http.post(CONFIG.API_ROOT + "blacklists" + Account.current(), blacklist).success(function(blacklist) {
                blacklist.system = system;
                _blacklists.push(blacklist);
                RhaTelemetryOverviewService.reload();
            });
        },
        deleteBlacklist: function(blacklist) {
            return $http.delete(CONFIG.API_ROOT + "blacklists/" + blacklist.id + Account.current()).success(function(blacklists) {
                var i, len = _blacklists.length;
                for (i = 0; i < len; i++) {
                    if (_blacklists[i].id === blacklist.id) {
                        _blacklists.splice(i, 1);
                        RhaTelemetryOverviewService.reload();
                        return;
                    }
                }
            });
        },
        reload: getData
    };
} ]);

"use strict";

angular.module("telemetryApi").factory("Group", [ "$http", "$rootScope", "CONFIG", "Account", function($http, $rootScope, CONFIG, Account) {
    var _groups = [], _currentGroup = {};
    function getData() {
        $http.get(CONFIG.API_ROOT + "groups" + "?include=systems" + Account.current("&")).success(function(groups) {
            _groups.length = 0;
            Array.prototype.push.apply(_groups, groups);
        });
    }
    function _removeSystem(group, system) {
        var i, j, len = _groups.length;
        for (i = 0; i < len; i++) {
            if (_groups[i].id === group.id) {
                var sysLen = _groups[i].systems.length;
                for (j = 0; j < sysLen; j++) {
                    if (_groups[i].systems[j].machine_id === system.machine_id) {
                        _groups[i].systems.splice(j, 1);
                        return;
                    }
                }
            }
        }
    }
    function _removeGroup(group) {
        var i, len = _groups.length;
        for (i = 0; i < len; i++) {
            if (_groups[i].id === group.id) {
                _groups.splice(i, 1);
                return;
            }
        }
    }
    if (CONFIG.preloadData) {
        getData();
    }
    $rootScope.$on("reload:data", getData);
    return {
        groups: _groups,
        current: function() {
            return _currentGroup;
        },
        setCurrent: function(group) {
            if (group) {
                _currentGroup = group;
            } else {
                _currentGroup = {};
            }
        },
        removeSystem: function(group, system) {
            _removeSystem(group, system);
            return $http.delete(CONFIG.API_ROOT + "groups/" + group.id + "/systems/" + system.machine_id + Account.current());
        },
        addSystems: function(group, systems) {
            if (!group.systems) {
                group.systems = [];
            }
            Array.prototype.push.apply(group.systems, systems);
            return $http.put(CONFIG.API_ROOT + "groups/" + group.id + "/systems" + Account.current(), systems);
        },
        createGroup: function(newGroup) {
            return $http.post(CONFIG.API_ROOT + "groups" + Account.current(), newGroup).success(function(group) {
                newGroup.display_name = "";
                _groups.push(group);
            });
        },
        deleteGroup: function(group) {
            _removeGroup(group);
            return $http.delete(CONFIG.API_ROOT + "groups/" + group.id + Account.current());
        },
        reload: getData
    };
} ]);

"use strict";

angular.module("telemetryApi").factory("Report", [ "$http", "$rootScope", "CONFIG", "Account", "Group", function($http, $rootScope, CONFIG, Account, Group) {
    var _countDfd, _countMapDfd;
    $rootScope.$on("reload:data", function() {
        _countMapDfd = null;
        _countDfd = null;
    });
    return {
        groupByHost: function() {
            return $http.get(CONFIG.API_ROOT + "reports?accept=host" + Account.current("&"));
        },
        exportReports: function() {
            return $http.get(CONFIG.API_ROOT + "reports" + Account.current(), {
                headers: {
                    accept: "text/csv"
                }
            });
        },
        countMap: function(force) {
            if (_countMapDfd && !force) {
                return _countMapDfd;
            }
            var url = CONFIG.API_ROOT + "reports?accept=countMap" + Account.current("&");
            var group = Group.current();
            if (group && group.id) {
                url += "&group=" + group.id;
            }
            _countMapDfd = $http.get(url);
            return _countMapDfd;
        },
        ruleReports: function(rule_id) {
            // hack for strata
            rule_id = rule_id.replace("|", "!$");
            var url = CONFIG.API_ROOT + "reports?rule_id=" + rule_id + Account.current("&");
            var group = Group.current();
            if (group && group.id) {
                url += "&group=" + group.id;
            }
            return $http.get(url);
        },
        groupByCount: function() {
            if (_countDfd) {
                return _countDfd;
            }
            _countDfd = $http.get(CONFIG.API_ROOT + "reports?accept=count" + Account.current("&"));
            return _countDfd;
        }
    };
} ]);

"use strict";

angular.module("telemetryApi").factory("Rule", [ "$http", "CONFIG", function($http, CONFIG) {
    function strataHack(rule_id) {
        // hack for strata
        return rule_id.replace("|", "!$");
    }
    return {
        plugins: function() {
            return $http.get(CONFIG.API_ROOT + "rules?plugins=true");
        },
        active: function() {
            return $http.get(CONFIG.API_ROOT + "rules?active=true");
        },
        summary: function() {
            return $http.get(CONFIG.API_ROOT + "rules?summary=true");
        },
        admin: function() {
            return $http.get(CONFIG.API_ROOT + "rules?admin=true");
        },
        create: function(info) {
            return $http.post(CONFIG.API_ROOT + "rules?internal=true", info);
        },
        update: function(info) {
            var rule_id = strataHack(info.rule_id);
            return $http.put(CONFIG.API_ROOT + "rules/" + rule_id + "?internal=true", info);
        },
        preview: function(info) {
            return $http.post(CONFIG.API_ROOT + "rules/preview", info);
        },
        byId: function(rule_id) {
            rule_id = strataHack(rule_id);
            return $http.get(CONFIG.API_ROOT + "rules/" + rule_id);
        }
    };
} ]);

"use strict";

angular.module("telemetryApi").factory("System", [ "$http", "$rootScope", "CONFIG", "Account", "Group", function($http, $rootScope, CONFIG, Account, Group) {
    var _systemDfd, _systems = [];
    $rootScope.$on("reload:data", function() {
        _systemDfd = null;
    });
    return {
        getSystems: function() {
            if (_systemDfd) {
                return _systemDfd;
            }
            _systemDfd = $http.get(CONFIG.API_ROOT + "systems" + Account.current());
            return _systemDfd;
        },
        getSystemSummary: function() {
            var url = CONFIG.API_ROOT + "systems?summary=true" + Account.current("&");
            var group = Group.current();
            if (group && group.id) {
                url += "&group=" + group.id;
            }
            return $http.get(url);
        },
        getSystemReports: function(machine_id) {
            return $http.get(CONFIG.API_ROOT + "systems/" + machine_id + "/reports" + Account.current());
        }
    };
} ]);

"use strict";

angular.module("telemetryApp").controller("AnnouncementCtrl", [ "$scope", "Announcement", "User", function($scope, Announcement, User) {
    $scope.announcements = Announcement.announcements;
    $scope.user = User.current;
} ]).controller("NewAnnouncementCtrl", [ "$scope", "$state", "Announcement", function($scope, $state, Announcement) {
    $scope.announcement = {
        hidden: false
    };
    $scope.create = function() {
        Announcement.createAnnouncement($scope.announcement).success(function() {
            $state.go("announcements");
        });
    };
} ]);

"use strict";

angular.module("telemetryApp").config([ "$stateProvider", function($stateProvider) {
    $stateProvider.state("announcements", {
        url: "/announcements",
        templateUrl: "app/announcements/announcements.html",
        controller: "AnnouncementCtrl"
    }).state("new-announcement", {
        url: "/announcements/new",
        templateUrl: "app/announcements/new-announcement.html",
        controller: "NewAnnouncementCtrl"
    });
} ]);

"use strict";

angular.module("telemetryApp").controller("ConfigCtrl", [ "$scope", "$state", "$stateParams", function($scope, $state, $stateParams) {
    $scope.current = {};
    if ($stateParams.tab) {
        $scope.current[$stateParams.tab] = true;
    } else {
        $scope.current.acknowledged = true;
    }
    $scope.tabClick = function(tab) {
        $state.go("config", {
            tab: tab
        }, {
            notify: false
        });
    };
} ]);

"use strict";

angular.module("telemetryApp").config([ "$stateProvider", function($stateProvider) {
    $stateProvider.state("config", {
        url: "/config/:tab",
        templateUrl: "app/config/views/config.html",
        controller: "ConfigCtrl",
        params: {
            tab: null
        },
        hideGroup: true
    });
} ]);

(function() {
    "use strict";
    angular.module("telemetryWidgets").controller("OverviewCtrl", [ "$scope", "$stateParams", "RhaTelemetryOverviewService", "Ack", function($scope, $stateParams, RhaTelemetryOverviewService, Ack) {
        $scope.loading = RhaTelemetryOverviewService.loading;
        RhaTelemetryOverviewService.setReportDetails(null);
        RhaTelemetryOverviewService.setCategory($stateParams.category);
        RhaTelemetryOverviewService.setRule($stateParams.rule);
        RhaTelemetryOverviewService.populateData(true);
        if ($stateParams.rule) {
            RhaTelemetryOverviewService.populateDetails();
        }
    } ]);
})();

"use strict";

angular.module("telemetryWidgets").config([ "$stateProvider", function($stateProvider) {
    $stateProvider.state("overview", {
        url: "/?category?rule",
        templateUrl: "app/overview/overview.html",
        controller: "OverviewCtrl",
        params: {
            category: null,
            rule: null
        }
    });
} ]);

"use strict";

angular.module("telemetryApp").controller("OverviewRuleCtrl", [ "$scope", "$state", "$filter", "$document", "Rule", function($scope, $state, $filter, $document, Rule) {
    $scope.predicate = "count";
    $scope.reverse = true;
    $scope.toggled = null;
    $scope.newRule = {
        plugin: "",
        error_key: ""
    };
    Rule.admin().success(function(rules) {
        $scope._rules = rules;
    });
    var filters = {
        active: function() {
            $scope.records = $filter("filter")($scope._rules, function(rule) {
                return rule.active;
            });
        },
        retired: function() {
            $scope.records = $filter("filter")($scope._rules, function(rule) {
                return rule.retired && !rule.needs_content;
            });
        },
        inactive: function() {
            $scope.records = $filter("filter")($scope._rules, function(rule) {
                return !rule.active && !rule.retired && !rule.needs_content;
            });
        },
        needs_content: function() {
            $scope.records = $filter("filter")($scope._rules, function(rule) {
                return rule.needs_content === true;
            });
        }
    };
    function filter() {
        var filterFn = filters[$scope.tab];
        if (filterFn) {
            filterFn();
        }
    }
    $scope.activateTab = function(tabName) {
        $scope.tab = tabName;
        filter();
    };
    $scope.tab = "active";
    $scope.toggleTray = function(record) {
        if ($scope.toggled === record) {
            $scope.toggled = null;
            return;
        }
        $scope.toggled = record;
    };
    $scope.isToggled = function(record) {
        return $scope.toggled === record;
    };
    $scope.isTabActive = function(tabs) {
        return _.includes(tabs, $scope.tab);
    };
    function createAndGo(info) {
        Rule.create(info).success(function(info) {
            $state.go("edit-rule", {
                id: info.rule_id
            });
        });
    }
    $scope.createRule = function() {
        createAndGo($scope.newRule);
    };
    $scope.createRecord = function(r) {
        createAndGo(r.rule);
    };
    $scope.deactivateRecord = function(r) {
        var record = r.rule;
        record.active = r.active = false;
        Rule.update(record);
    };
    $scope.activateRecord = function(r) {
        var record = r.rule;
        record.active = r.active = true;
        Rule.update(record);
    };
    $scope.unretireRecord = function(r) {
        var record = r.rule;
        record.retired = r.retired = false;
        Rule.update(record);
    };
    $scope.retireRecord = function(r) {
        var record = r.rule;
        record.retired = r.retired = true;
        Rule.update(record);
    };
    var clickListener = $document.on("click", function(e) {
        if (!angular.element(e.target).closest(".utilities-tray").length) {
            $scope.$apply($scope.toggleTray.bind($scope, null));
        }
    });
    $scope.$watch("_rules", filter, true);
    $scope.$on("$destroy", function() {
        clickListener.off("click");
    });
} ]);

"use strict";

angular.module("telemetryApp").controller("EditRuleCtrl", [ "$scope", "$stateParams", "$state", "Rule", function($scope, $stateParams, $state, Rule) {
    Rule.byId($stateParams.id).success(function(rule) {
        $scope.rule = rule;
    });
    $scope.saveFn = function() {
        Rule.update($scope.rule).success(function(rule) {
            $state.go("show-rule", {
                id: rule.rule_id
            });
        });
    };
} ]);

"use strict";

angular.module("telemetryApp").controller("ListRuleCtrl", [ "$scope", "$filter", "Rule", function($scope, $filter, Rule) {
    $scope.tab = "all";
    Rule.summary().success(function(rules) {
        $scope._rules = rules;
    });
    var filters = {
        all: function() {
            $scope.rules = $scope._rules;
        },
        performance: function() {
            $scope.rules = $filter("filter")($scope._rules, function(rule) {
                return rule.category === "Performance";
            });
        },
        stability: function() {
            $scope.rules = $filter("filter")($scope._rules, function(rule) {
                return rule.category === "Stability";
            });
        },
        security: function() {
            $scope.rules = $filter("filter")($scope._rules, function(rule) {
                return rule.category === "Security";
            });
        }
    };
    function filter() {
        var filterFn = filters[$scope.tab];
        if (filterFn) {
            filterFn();
        }
    }
    $scope.activateTab = function(tabName) {
        $scope.tab = tabName;
        filter();
    };
    $scope.$watch("_rules", filter, true);
} ]);

"use strict";

angular.module("telemetryApp").controller("NewRuleCtrl", [ "$scope", "Rule", function($scope, Rule) {
    $scope.rule = {
        severity: "INFO",
        category: "Stability"
    };
    $scope.saveFn = function() {
        Rule.create($scope.rule).success(function(rule) {
            console.log("created rule", rule);
        });
    };
} ]);

"use strict";

angular.module("telemetryApp").controller("ShowRuleCtrl", [ "$scope", "$state", "$stateParams", "Rule", "RulePreview", function($scope, $state, $stateParams, Rule, RulePreview) {
    Rule.byId($stateParams.id).success(function(rule) {
        $scope.rule = rule;
    });
    $scope.preview = RulePreview.preview;
    $scope.editInfo = function(info) {
        $state.go("edit-rule", {
            id: info.rule_id
        });
    };
} ]);

"use strict";

angular.module("telemetryApp").config([ "$stateProvider", function($stateProvider) {
    $stateProvider.state("rules", {
        url: "/rules",
        templateUrl: "app/rules/views/list-rules.html",
        controller: "ListRuleCtrl"
    }).state("admin-rules", {
        url: "/rules/admin",
        templateUrl: "app/rules/views/admin-rules.html",
        controller: "OverviewRuleCtrl"
    }).state("create-rule", {
        url: "/rules/new",
        templateUrl: "app/rules/views/create-rules.html",
        controller: "NewRuleCtrl"
    }).state("show-rule", {
        url: "/rules/:id",
        templateUrl: "app/rules/views/show-rules.html",
        controller: "ShowRuleCtrl"
    }).state("edit-rule", {
        url: "/rules/:id/edit",
        templateUrl: "app/rules/views/edit-rules.html",
        controller: "EditRuleCtrl"
    });
} ]);

"use strict";

angular.module("telemetryApp").controller("SystemCtrl", [ "$scope", "$modal", "System", function($scope, $modal, System) {
    $scope.loading = true;
    function getData(force) {
        return System.getSystemSummary(force).success(function(result) {
            $scope.systems = result.systems;
            $scope.summary = result.summary;
            $scope.loading = false;
        });
    }
    $scope.$on("reload:data", getData);
    $scope.$on("group:change", getData);
    getData();
} ]);

"use strict";

angular.module("telemetryApp").config([ "$stateProvider", function($stateProvider) {
    $stateProvider.state("systems", {
        url: "/systems",
        templateUrl: "app/systems/systems.html",
        controller: "SystemCtrl"
    });
} ]);

"use strict";

angular.module("telemetryTemplates", []);

(function() {
    "use strict";
    angular.module("telemetryApp").directive("accountSelect", [ "CONFIG", function(CONFIG) {
        return {
            templateUrl: "components/accountSelect/accountSelect.html",
            restrict: "E",
            controller: [ "$scope", "User", function($scope, User) {
                $scope.user = User.current;
                $scope.accountChange = function(acct) {
                    if (acct) {
                        window.sessionStorage.setItem(CONFIG.ACCT_KEY, acct);
                        $scope.$emit("account:change", acct);
                    }
                };
                $scope.reset = function(acct) {
                    if (!$scope.user) {
                        return;
                    }
                    $scope.account_number = $scope.user.account_number;
                    if ($scope.user.internal) {
                        $scope.account_number = acct || "" + $scope.user.account_number;
                    }
                    $scope.accountChange($scope.account_number);
                };
                var initialAcct = window.sessionStorage.getItem(CONFIG.ACCT_KEY);
                $scope.reset(initialAcct);
            } ]
        };
    } ]);
})();

"use strict";

angular.module("telemetryApp").factory("Analytics", [ "$http", "CONFIG", function($http, CONFIG) {
    return {
        pageLoad: function() {
            if (CONFIG.doPaf && window.chrometwo_require) {
                window.chrometwo_require([ "analytics/main" ], function(analytics) {});
            }
        },
        clickEvent: function(ev) {
            if (CONFIG.doPaf && window.chrometwo_require) {
                window.chrometwo_require([ "analytics/main" ], function(analytics) {});
            }
        }
    };
} ]);

"use strict";

angular.module("telemetryApp").directive("bullhorn", function() {
    return {
        templateUrl: "components/bullhorn/bullhorn.html",
        restrict: "E",
        replace: true,
        controller: [ "$scope", "$document", "Announcement", function($scope, $document, Announcement) {
            $scope.unseenFilter = {
                seen: false
            };
            $scope.announcements = Announcement.announcements;
            $scope.unseen = Announcement.unseen;
            $scope.showAnnouncements = false;
            $scope.toggle = function() {
                $scope.showAnnouncements = !$scope.showAnnouncements;
            };
            $scope.ack = Announcement.acknowledge;
            $document.on("keydown", function(evt) {
                if ($scope.showAnnouncements && evt.keyCode === 27) {
                    $scope.$evalAsync(function() {
                        $scope.toggle();
                    });
                }
            });
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("configBlacklist", function() {
    return {
        templateUrl: "components/config/blacklist/blacklist.html",
        restrict: "EA",
        scope: {},
        controller: [ "$scope", "Blacklist", function($scope, Blacklist) {
            $scope.blacklists = Blacklist.blacklists;
            $scope.reload = Blacklist.reload;
            $scope.delete = Blacklist.deleteBlacklist;
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("configGroups", function() {
    return {
        templateUrl: "components/config/groups/groups.html",
        restrict: "EA",
        scope: false,
        controller: [ "$scope", function($scope) {
            $scope.isCreating = false;
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("configHidden", function() {
    return {
        templateUrl: "components/config/hidden/hidden.html",
        restrict: "EA",
        scope: {},
        controller: [ "$scope", "Ack", function($scope, Ack) {
            $scope.acks = Ack.acks;
            $scope.reload = Ack.reload;
            $scope.delete = Ack.deleteAck;
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("configMessaging", function() {
    return {
        templateUrl: "components/config/messaging/messaging.html",
        restrict: "EA",
        scope: {},
        controller: [ "$scope", function($scope) {} ]
    };
});

"use strict";

angular.module("telemetryWidgets").filter("trust_html", [ "$sce", function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
} ]).filter("titlecase", function() {
    return function(s) {
        s = s === undefined || s === null ? "" : s;
        return s.toString().toLowerCase().replace(/\b([a-z])/g, function(ch) {
            return ch.toUpperCase();
        });
    };
}).filter("sortClass", function() {
    return function(predicate, match, reverse) {
        if (!predicate) {
            return "";
        }
        if (predicate === match && !reverse) {
            return "sort-asc";
        }
        if (predicate === match && reverse) {
            return "sort-desc";
        }
        return "";
    };
}).filter("orderObjectBy", function() {
    return function(items, field, reverse) {
        var sorted = _.sortBy(items, field);
        if (reverse) {
            return sorted.reverse();
        }
        return sorted;
    };
});

"use strict";

angular.module("telemetryApp").directive("groupForm", function() {
    return {
        templateUrl: "components/group/views/form.html",
        restrict: "EC",
        controller: [ "$scope", "Group", function($scope, Group) {
            $scope.create = function(group) {
                $scope.isCreating = true;
                Group.createGroup(group).success(function() {
                    $scope.isCreating = false;
                });
                $scope.newGroup = {
                    display_name: ""
                };
            };
            $scope.removeSystem = Group.removeSystem;
            $scope.newGroup = {
                display_name: ""
            };
        } ]
    };
}).directive("group", function() {
    return {
        templateUrl: "components/group/views/group.html",
        restrict: "EC",
        controller: [ "$scope", "SweetAlert", "Group", function($scope, SweetAlert, Group) {
            $scope.isCollapsed = false;
            $scope.deleteGroup = function(group) {
                SweetAlert.swal({
                    title: "Are you sure?",
                    text: "Your will not be able to recover this group!",
                    type: "warning",
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes",
                    showCancelButton: true
                }, function(isConfirm) {
                    if (isConfirm) {
                        Group.deleteGroup(group);
                    }
                });
            };
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("groupSelect", function() {
    return {
        templateUrl: "components/groupSelect/groupSelect.html",
        restrict: "E",
        replace: true,
        controller: [ "$scope", "$rootScope", "Group", function($scope, $rootScope, Group) {
            $scope.groups = Group.groups;
            $scope.group = -1;
            $rootScope.$on("$stateChangeSuccess", function(event, toState) {
                $scope.hideGroup = toState.hideGroup;
            });
            function triggerChange(group) {
                Group.setCurrent(group);
                $scope.$broadcast("group:change", group);
            }
            $scope.groupChange = function() {
                var group = $scope.groups[$scope.group];
                triggerChange(group);
            };
            $scope.$on("account:change", function() {
                triggerChange(null);
            });
        } ]
    };
});

"use strict";

angular.module("telemetryWidgets").directive("rhaTelemetryOverview", function() {
    return {
        templateUrl: "components/overview/overview.html",
        restrict: "E",
        replace: true,
        controller: [ "$scope", "$state", "Ack", "Report", "RhaTelemetryOverviewService", function($scope, $state, Ack, Report, RhaTelemetryOverviewService) {
            $scope.loading = RhaTelemetryOverviewService.loading;
            $scope.getData = RhaTelemetryOverviewService.getData;
            $scope.getTotal = RhaTelemetryOverviewService.getTotal;
            $scope.getRule = RhaTelemetryOverviewService.getRule;
            $scope.ackAction = RhaTelemetryOverviewService.ackAction;
            $scope.arcClick = RhaTelemetryOverviewService.arcClick;
            $scope.reload = RhaTelemetryOverviewService.reload;
            $scope.export = Report.exportReports;
        } ]
    };
});

"use strict";

angular.module("telemetryWidgets").factory("RhaTelemetryOverviewService", [ "$state", "$q", "$rootScope", "Report", "Ack", function($state, $q, $rootScope, Report, Ack) {
    var counts = {};
    var data = {};
    var oldCols = [];
    var total = 0;
    var rule = null;
    var reports = [];
    var loading = false;
    var severityNames = [ "INFO", "WARN", "ERROR" ];
    var severities = {};
    var donutChart = null;
    var category = null;
    var dataLoaded = false;
    var reportDetails = null;
    var ruleDetails = null;
    var loadingDetails = false;
    var categories = [ "performance", "stability", "security" ];
    angular.forEach(severityNames, function(s) {
        severities[s] = true;
    });
    var severityFilter = function(report) {
        return severities[report.rule.severity];
    };
    var isOverview = function() {
        if (category) {
            return false;
        }
        return true;
    };
    var ackFilter = function(report) {
        return Ack.ackMap[report.rule.rule_id];
    };
    var processReports = function() {
        var filteredReports = _.reject(reports, ackFilter);
        updateCounts(filteredReports);
        filteredReports = _.filter(filteredReports, severityFilter);
        if (isOverview()) {
            data = _(filteredReports).groupBy(function(r) {
                return r.rule.category;
            }).map(function(g, category) {
                var groupTotal = _.reduce(g, function(sum, n) {
                    return sum + n.count;
                }, 0);
                return {
                    id: category,
                    name: category,
                    value: groupTotal,
                    category: true
                };
            }).indexBy("id").value();
            setData(data);
        } else {
            data = _(filteredReports).filter(function(r) {
                return r.rule.category.toLowerCase() === category.toLowerCase();
            }).map(function(r) {
                return {
                    id: r.rule.rule_id,
                    name: r.rule.description,
                    severityNum: _.indexOf(severityNames, r.rule.severity),
                    severity: r.rule.severity,
                    category: r.rule.category,
                    value: r.count,
                    color: ""
                };
            }).indexBy("id").value();
            setData(data);
        }
        total = _.reduce(data, function(sum, n) {
            return sum + n.value;
        }, 0);
        setTotal(total);
        $rootScope.$broadcast("rha-telemetry-refreshdonut");
        $rootScope.$on("group:change", reload);
    };
    var populateData = function(force) {
        if (!dataLoaded) {
            loading = true;
            var reportDeferred = Report.countMap(force);
            var ackDeferred = Ack.reload();
            ackDeferred.then(reportDeferred);
            reportDeferred.success(function(reports) {
                setReports(reports);
                processReports();
                loading = false;
                dataLoaded = true;
            });
            return reportDeferred;
        } else {
            var deferred = $q(function(resolve, reject) {
                resolve("norefresh");
            });
            deferred.then(function(response) {
                processReports();
            });
            return deferred;
        }
    };
    var updateCounts = function(reports) {
        var tempCounts = {
            security: 0,
            stability: 0,
            performance: 0
        };
        _(reports).groupBy(function(r) {
            return r.rule.category;
        }).reduce(function(result, n, key) {
            result[key.toLowerCase()] = _.reduce(n, function(sum, n) {
                return sum + n.count;
            }, 0);
            return result;
        }, tempCounts);
        setCounts(tempCounts);
    };
    var arcClick = function(arc) {
        if (arc.category === true) {
            return $state.go("overview", {
                category: arc.id.toLowerCase()
            });
        }
        $state.go("overview", {
            category: arc.category.toLowerCase(),
            rule: arc.id
        });
    };
    var ackAction = function(rule) {
        Ack.createAck(rule).then(processReports);
    };
    //overview details
    var populateDetails = function() {
        setLoadingDetails(true);
        Report.ruleReports(getRule()).success(function(reports) {
            if (!reports || !reports.length) {
                reportDetails = null;
                ruleDetails = null;
                return;
            }
            var first = reports[0];
            ruleDetails = first.error_info;
            reportDetails = reports;
            setLoadingDetails(false);
        });
    };
    var reload = function() {
        if (!dataLoaded) {
            // we don't even have data yet - no need to reload
            return;
        }
        setDataLoaded(false);
        populateData(true).then(function() {
            $state.reload();
        });
    };
    //accessors
    var getTotal = function() {
        return total;
    };
    var getData = function() {
        return data;
    };
    var setData = function(dataIn) {
        data = dataIn;
    };
    var getDonutChart = function() {
        return donutChart;
    };
    var setDonutChart = function(chart) {
        donutChart = chart;
    };
    var setReports = function(reportsIn) {
        reports = reportsIn;
    };
    var setTotal = function(totalIn) {
        total = totalIn;
    };
    var getCategory = function() {
        return category;
    };
    var setCategory = function(categoryIn) {
        category = categoryIn;
    };
    var setRule = function(ruleIn) {
        rule = ruleIn;
    };
    var getRule = function() {
        return rule;
    };
    var setRuleDetails = function(ruleDetailsIn) {
        ruleDetails = ruleDetailsIn;
    };
    var getRuleDetails = function() {
        return ruleDetails;
    };
    var setReportDetails = function(reportDetailsIn) {
        reportDetails = reportDetailsIn;
    };
    var getReportDetails = function() {
        return reportDetails;
    };
    var setDataLoaded = function(dataLoadedIn) {
        dataLoaded = dataLoadedIn;
    };
    var setLoadingDetails = function(loadingDetailsIn) {
        loadingDetails = loadingDetailsIn;
    };
    var getLoadingDetails = function() {
        return loadingDetails;
    };
    var getCategories = function() {
        return categories;
    };
    var getCounts = function() {
        return counts;
    };
    var setCounts = function(countsIn) {
        counts = countsIn;
    };
    var getOldCols = function() {
        return oldCols;
    };
    var setOldCols = function(oldColsIn) {
        oldCols = oldColsIn;
    };
    return {
        isOverview: isOverview,
        ackFilter: ackFilter,
        severityFilter: severityFilter,
        getTotal: getTotal,
        getData: getData,
        processReports: processReports,
        populateData: populateData,
        updateCounts: updateCounts,
        arcClick: arcClick,
        ackAction: ackAction,
        getCounts: getCounts,
        setCounts: setCounts,
        data: data,
        total: total,
        rule: rule,
        reports: reports,
        loading: loading,
        severityNames: severityNames,
        severities: severities,
        donutChart: donutChart,
        category: category,
        dataLoaded: dataLoaded,
        setDonutChart: setDonutChart,
        setCategory: setCategory,
        getDonutChart: getDonutChart,
        getRule: getRule,
        setRule: setRule,
        getCategory: getCategory,
        reportDetails: reportDetails,
        setReportDetails: setReportDetails,
        getReportDetails: getReportDetails,
        setRuleDetails: setRuleDetails,
        getRuleDetails: getRuleDetails,
        populateDetails: populateDetails,
        setLoadingDetails: setLoadingDetails,
        getLoadingDetails: getLoadingDetails,
        reload: reload,
        setDataLoaded: setDataLoaded,
        getCategories: getCategories,
        getOldCols: getOldCols,
        setOldCols: setOldCols
    };
} ]);

"use strict";

angular.module("telemetryWidgets").directive("rhaTelemetryOverviewDetails", function() {
    return {
        templateUrl: "components/overview/overviewDetails/overviewDetails.html",
        restrict: "E",
        controller: [ "$scope", "$location", "$modal", "Report", "RhaTelemetryOverviewService", function($scope, $location, $modal, Report, RhaTelemetryOverviewService) {
            var search = $location.search();
            $scope.getTotal = RhaTelemetryOverviewService.getTotal;
            $scope.isOverview = RhaTelemetryOverviewService.isOverview;
            $scope.getReportDetails = RhaTelemetryOverviewService.getReportDetails;
            $scope.getRuleDetails = RhaTelemetryOverviewService.getRuleDetails;
            $scope.getLoadingDetails = RhaTelemetryOverviewService.getLoadingDetails;
            $scope.getTitle = function() {
                var response = RhaTelemetryOverviewService.isOverview() ? "Overview" : RhaTelemetryOverviewService.getCategory();
                return response;
            };
            $scope.showSystem = function(system) {
                $modal.open({
                    templateUrl: "components/system/systemModal/systemModal.html",
                    windowClass: "system-modal",
                    backdropClass: "system-backdrop",
                    controller: "SystemModalCtrl",
                    resolve: {
                        system: function() {
                            return system;
                        },
                        rule: function() {
                            return false;
                        }
                    }
                });
            };
        } ]
    };
});

(function() {
    "use strict";
    var solutionCache = {};
    angular.module("telemetryWidgets").directive("recommendedKbase", function() {
        return {
            scope: {
                node: "="
            },
            templateUrl: "components/recommendedKbase/recommendedKbase.html",
            restrict: "EC",
            controller: [ "$scope", "$http", function($scope, $http) {
                $scope.loading = false;
                if ($scope.node) {
                    if (solutionCache[$scope.node]) {
                        $scope.solution = solutionCache[$scope.node];
                    } else {
                        $scope.loading = true;
                        $http.get("/rs/search?keyword=id:" + $scope.node, {
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                "X-Omit": "WWW-Authenticate"
                            }
                        }).success(function(data) {
                            $scope.loading = false;
                            if (data && data.searchResult && data.searchResult.length) {
                                $scope.solution = data.searchResult[0];
                                solutionCache[$scope.node] = {
                                    title: $scope.solution.title,
                                    viewUri: $scope.solution.viewUri
                                };
                            }
                        }).catch(function() {
                            $scope.loading = false;
                        });
                    }
                }
            } ]
        };
    });
})();

"use strict";

(function() {
    function generateChart(nameMapper) {
        return c3.generate({
            bindto: ".rha-telemetry-donut",
            size: {
                width: 260,
                height: 260
            },
            pie: {
                label: {
                    threshold: .07
                }
            },
            data: {
                columns: [],
                colors: {
                    Performance: "#2c96cb",
                    Security: "#6d868d",
                    Stability: "#46b631"
                },
                type: "pie"
            },
            legend: {
                show: false
            },
            tooltip: {
                format: {
                    name: nameMapper,
                    value: function(value, ratio) {
                        if (ratio >= .07) {
                            return value;
                        }
                        var format = d3.format("0.3p");
                        return value + " (" + format(ratio) + ")";
                    }
                }
            }
        });
    }
    angular.module("telemetryWidgets").directive("rhaTelemetryDonut", [ "$state", "$timeout", "RhaTelemetryOverviewService", function($state, $timeout, RhaTelemetryOverviewService) {
        return {
            restrict: "C",
            replace: true,
            link: function($rootScope, scope) {
                RhaTelemetryOverviewService.setDonutChart(generateChart(RhaTelemetryOverviewService.mapName));
                var refreshDonut = function() {
                    function arcSelector(arcTitle) {
                        var classyTitle = arcTitle.replace(/[|._]/g, "-");
                        return ".c3-arc-" + classyTitle;
                    }
                    function isArcVisible(arc) {
                        return !arc.hasOwnProperty("visible") || arc.visible;
                    }
                    function toCols(arcMap) {
                        return _.values(arcMap).filter(isArcVisible).map(function(arc) {
                            return [ arc.id, arc.value ];
                        });
                    }
                    var donutChart = RhaTelemetryOverviewService.getDonutChart();
                    var getData = RhaTelemetryOverviewService.getData;
                    var cols = toCols(getData());
                    var oldData = RhaTelemetryOverviewService.getOldCols();
                    RhaTelemetryOverviewService.setOldCols(getData());
                    var unloadCols = _.keys(oldData).filter(function(key) {
                        return !getData().hasOwnProperty(key) || !isArcVisible(getData()[key]);
                    });
                    donutChart.load({
                        columns: cols,
                        unload: unloadCols,
                        done: function() {
                            angular.forEach(donutChart.data(), function(a) {
                                var arc = getData()[a.id];
                                var selector = arcSelector(arc.id), ele = angular.element(selector), color = ele.css("fill");
                                arc.color = color;
                                ele.on("click", function() {
                                    RhaTelemetryOverviewService.arcClick(arc);
                                });
                            });
                        }
                    });
                };
                $rootScope.$on("rha-telemetry-refreshdonut", refreshDonut);
                $rootScope.$watch(RhaTelemetryOverviewService.getData(), refreshDonut);
            }
        };
    } ]);
})();

"use strict";

angular.module("telemetryApp").directive("ruleForm", function() {
    return {
        templateUrl: "components/rule/ruleForm/ruleForm.html",
        restrict: "E",
        controller: [ "$scope", "RulePreview", function($scope, RulePreview) {
            $scope.locked = true;
            $scope.severities = [ "INFO", "WARN", "ERROR" ];
            $scope.categories = [ "Stability", "Security", "Performance" ];
            $scope.preview = RulePreview.preview;
            $scope.toggleLock = function() {
                $scope.locked = !$scope.locked;
            };
            function updateRuleID() {
                if (!$scope.rule) {
                    return;
                }
                $scope.rule.rule_id = ($scope.rule.plugin || "") + "|" + ($scope.rule.error_key || "");
            }
            $scope.$watch("rule.plugin", updateRuleID);
            $scope.$watch("rule.error_key", updateRuleID);
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("rulePlugin", function() {
    return {
        templateUrl: "components/rule/rulePlugin/rulePlugin.html",
        restrict: "E",
        controller: [ "$scope", "Rule", function($scope, Rule) {
            $scope.plugins = [];
            Rule.plugins().success(function(plugins) {
                $scope.plugins = plugins;
            });
        } ]
    };
});

"use strict";

angular.module("telemetryApp").factory("RulePreview", [ "$http", "$modal", function($http, $modal) {
    return {
        preview: function(rule) {
            $modal.open({
                templateUrl: "components/system/systemModal/systemModal.html",
                windowClass: "system-modal",
                backdropClass: "system-backdrop",
                controller: "SystemModalCtrl",
                resolve: {
                    rule: function() {
                        return rule;
                    },
                    system: function() {
                        return false;
                    }
                }
            });
        }
    };
} ]);

"use strict";

angular.module("telemetryWidgets").directive("ruleReason", function() {
    return {
        templateUrl: "components/rule/ruleReason/ruleReason.html",
        restrict: "E"
    };
});

"use strict";

angular.module("telemetryWidgets").directive("ruleResolution", function() {
    return {
        templateUrl: "components/rule/ruleResolution/ruleResolution.html",
        restrict: "E"
    };
});

(function() {
    "use strict";
    angular.module("telemetryWidgets").directive("ruleSummary", function() {
        return {
            controller: "RuleSummaryCtrl",
            templateUrl: "components/rule/ruleSummary/ruleSummary.html",
            restrict: "E",
            scope: {
                system: "=",
                machineId: "=",
                rule: "=",
                ruleFilter: "="
            }
        };
    }).controller("RuleSummaryCtrl", [ "$scope", "$location", "System", "Rule", function($scope, $location, System, Rule) {
        $scope.loading = true;
        var search = $location.search();
        $scope.debug = false;
        if ($scope.machineId) {
            if (search.rule) {
                $scope.ruleFilter = true;
            }
            System.getSystemReports($scope.machineId).success(function(system) {
                angular.extend($scope.system, system);
                if (search.rule) {
                    $scope.system._reports = $scope.system.reports;
                    $scope.system.reports = _.filter($scope.system.reports, function(r) {
                        return r.rule_id === search.rule;
                    });
                }
                $scope.loading = false;
            });
        }
        if ($scope.rule) {
            $scope.debug = true;
            Rule.preview($scope.rule).success(function(system) {
                $scope.system = system;
                $scope.loading = false;
            });
        }
        function setMachine(id) {
            $location.replace();
            $location.search("machine", id);
        }
        setMachine($scope.machineId);
    } ]);
})();

"use strict";

angular.module("telemetryWidgets").directive("severityBar", function() {
    return {
        templateUrl: "components/severityBar/severityBar.html",
        restrict: "EC",
        controller: [ "$scope", "RhaTelemetryOverviewService", function($scope, RhaTelemetryOverviewService) {
            $scope.severityNames = RhaTelemetryOverviewService.severityNames;
            $scope.severities = RhaTelemetryOverviewService.severities;
            $scope.toggle = function(s) {
                $scope.severities[s] = !$scope.severities[s];
                RhaTelemetryOverviewService.processReports();
            };
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("severityIcon", function() {
    return {
        scope: {
            severity: "="
        },
        templateUrl: "components/severityIcon/severityIcon.html",
        restrict: "EC",
        replace: true,
        controller: [ "$scope", function($scope) {
            $scope.severityClass = "";
            if ($scope.severity === "INFO") {
                $scope.severityClass = "i-info fa-info-circle";
            } else if ($scope.severity === "WARN") {
                $scope.severityClass = "i-warning fa-warning";
            } else if ($scope.severity === "ERROR") {
                $scope.severityClass = "i-error fa-times-circle";
            }
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("sideNav", function() {
    return {
        templateUrl: "components/sideNav/sideNav.html",
        restrict: "E",
        replace: true,
        controller: [ "$scope", "$stateParams", "RhaTelemetryOverviewService", function($scope, $stateParams, RhaTelemetryOverviewService) {
            $scope.getCategories = RhaTelemetryOverviewService.getCategories;
            $scope.getCounts = RhaTelemetryOverviewService.getCounts;
            $scope.isActive = function(category) {
                return category === $stateParams.category;
            };
        } ]
    };
});

(function() {
    "use strict";
    angular.module("telemetryWidgets").controller("SystemModalCtrl", [ "$scope", "$location", "$modalInstance", "System", "Rule", "system", "rule", function($scope, $location, $modalInstance, System, Rule, system, rule) {
        $scope.system = system;
        $scope.rule = rule;
        $scope.ruleFilter = false;
        $scope.close = function() {
            $modalInstance.dismiss("close");
        };
        $scope.viewAll = function() {
            $scope.system.reports = $scope.system._reports;
            $scope.ruleFilter = false;
        };
        function setMachine(id) {
            $location.replace();
            $location.search("machine", id);
        }
        $modalInstance.result.then(angular.noop, function() {
            setMachine(null);
        });
        setMachine($scope.system.machine_id);
    } ]);
})();

"use strict";

angular.module("telemetryApp").directive("systemSelect", function() {
    return {
        templateUrl: "components/system/systemSelect/systemSelect.html",
        restrict: "E",
        scope: {
            group: "="
        },
        controller: [ "$scope", "System", "Group", "$filter", function($scope, System, Group, $filter) {
            var _systems;
            $scope.newSystems = [];
            function filterSystems() {
                if (!_systems || !_systems.length) {
                    return;
                }
                var groupMachines = _.indexBy($scope.group.systems, "machine_id");
                $scope.systems = _.reject(_systems, function(s) {
                    return !!groupMachines[s.machine_id];
                });
            }
            System.getSystems().success(function(systems) {
                _systems = systems;
                filterSystems();
            });
            function resetSystem() {
                $scope.newSystems = [];
            }
            $scope.$watch("group.systems", filterSystems, true);
            $scope.addSystem = function() {
                Group.addSystems($scope.group, $scope.newSystems).then(resetSystem, resetSystem);
            };
        } ]
    };
});

"use strict";

angular.module("telemetryWidgets").directive("systemSummaryTable", function() {
    return {
        templateUrl: "components/system/systemSummaryTable/systemSummaryTable.html",
        restrict: "EC",
        scope: {
            systems: "=",
            doFetch: "="
        },
        controller: [ "$scope", "$filter", "$modal", "$location", "Blacklist", "System", "NgTableParams", function($scope, $filter, $modal, $location, Blacklist, System, NgTableParams) {
            var staleDate = new Date();
            staleDate.setDate(staleDate.getDate() - 8);
            var data = $scope.systems || [];
            $scope.filters = {
                hostname: ""
            };
            $scope.tableParams = new NgTableParams({
                page: 1,
                count: 25,
                filter: $scope.filters,
                sorting: {
                    last_check_in: "desc"
                }
            }, {
                total: data.length,
                getData: function($defer, params) {
                    var filtered_data = params.filter() ? $filter("filter")(data, params.filter().hostname) : data;
                    filtered_data = params.sorting() ? $filter("orderBy")(filtered_data, params.orderBy()) : filtered_data;
                    $defer.resolve(filtered_data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                }
            });
            $scope.isStale = function(date) {
                return new Date(date) < staleDate;
            };
            function initialDisplay() {
                var search = $location.search();
                var machine_id = search.machine;
                if (!machine_id) {
                    return;
                }
                var system = _.findWhere(data, {
                    machine_id: machine_id
                });
                if (system) {
                    return $scope.showSystem(system);
                }
                $location.replace();
                $location.search("machine", null);
            }
            $scope.$watch("systems", function(systems) {
                if (systems && systems.length) {
                    data = systems;
                    $scope.tableParams.total(data.length);
                    $scope.tableParams.reload();
                    initialDisplay();
                }
            });
            if ($scope.doFetch) {
                $scope.loading = true;
                System.getSystemSummary().success(function(result) {
                    $scope.systems = result.systems;
                    $scope.summary = result.summary;
                    $scope.loading = false;
                });
            }
            $scope.blacklistFilter = function(system) {
                return system.blacklist === null;
            };
            $scope.showSystem = function(system) {
                $modal.open({
                    templateUrl: "components/system/systemModal/systemModal.html",
                    windowClass: "system-modal",
                    backdropClass: "system-backdrop",
                    controller: "SystemModalCtrl",
                    resolve: {
                        system: function() {
                            return system;
                        },
                        rule: function() {
                            return false;
                        }
                    }
                });
            };
            $scope.blacklist = function(system) {
                Blacklist.createBlacklist(system).success(function(blacklist) {
                    system.blacklist = blacklist;
                });
            };
        } ]
    };
});

"use strict";

angular.module("telemetryApp").directive("topbar", function() {
    return {
        templateUrl: "components/topbar/topbar.html",
        restrict: "E",
        replace: true,
        controller: [ "$scope", "$state", function($scope, $state) {} ]
    };
});

"use strict";

angular.module("telemetryApi").factory("User", [ "$http", "Bounce", "CONFIG", function($http, Bounce, CONFIG) {
    var _user = window.portal && window.portal.user_info || {};
    if (CONFIG.authenticate) {
        $http.jsonp("/services/user/status?jsoncallback=JSON_CALLBACK").success(function(user) {
            angular.extend(_user, user);
        });
    }
    return {
        current: _user
    };
} ]).factory("Bounce", [ "CONFIG", function(CONFIG) {
    return {
        bounce: function() {
            if (CONFIG.authenticate) {
                window.location = "/login?redirectTo=" + window.location;
            }
        }
    };
} ]);

angular.module("telemetryTemplates").run([ "$templateCache", function($templateCache) {
    "use strict";
    $templateCache.put("app/announcements/announcements.html", "\n" + '<section class="page-announcements">\n' + '  <section class="section-announcements">\n' + '    <h1 class="page-title">Announcements</h1>\n' + '    <table class="table table-striped">\n' + "      <thead>\n" + "        <tr>\n" + "          <th>Message</th>\n" + "          <th>Date</th>\n" + "        </tr>\n" + "      </thead>\n" + "      <tbody>\n" + '        <tr ng-repeat="a in announcements">\n' + "          <td>{{a.message}}</td>\n" + "          <td>{{a.created_at | date}}</td>\n" + "        </tr>\n" + "      </tbody>\n" + "    </table>\n" + "  </section>\n" + '</section><a ui-sref="new-announcement" ng-show="user.internal" class="create-announcement btn btn-primary">Create Announcement</a>');
    $templateCache.put("app/announcements/new-announcement.html", "\n" + '<section class="page-announcements">\n' + '  <section class="section-announcements">\n' + '    <form ng-submit="create()" name="form" class="form-horizontal">\n' + "      <fieldset>\n" + "        <legend>New Announcement</legend>\n" + '        <div class="form-group">\n' + '          <label for="message" class="col-md-4 control-label">Message</label>\n' + '          <div class="col-md-6">\n' + '            <input id="message" ng-model="announcement.message" type="text" placeholder="Announcement Message" required="required" class="form-control input-md"/>\n' + "          </div>\n" + "        </div>\n" + '        <div class="form-group">\n' + '          <label for="hidden" class="col-md-4 control-label">Hidden</label>\n' + '          <div class="col-md-4">\n' + '            <label class="checkbox-inline">\n' + '              <input type="checkbox" name="hidden" value="true" ng-model="announcement.hidden"/>&nbsp;\n' + "            </label>\n" + "          </div>\n" + "        </div>\n" + '        <div class="form-group">\n' + '          <label for="submit" class="col-md-4 control-label"></label>\n' + '          <div class="col-md-4">\n' + '            <button id="submit" name="submit" ng-disabled="form.$error.required" class="btn btn-success">Create Announcement</button>\n' + "          </div>\n" + "        </div>\n" + "      </fieldset>\n" + "    </form>\n" + "  </section>\n" + "</section>");
    $templateCache.put("app/config/views/config.html", "\n" + "<tabset>\n" + '  <tab heading="Hidden Rules" active="current.hidden" ng-click="tabClick(\'hidden\')">\n' + "    <config-hidden></config-hidden>\n" + "  </tab>\n" + '  <tab heading="Blacklist" active="current.blacklist" ng-click="tabClick(\'blacklist\')">\n' + "    <config-blacklist></config-blacklist>\n" + "  </tab>\n" + '  <tab heading="Groups" active="current.groups" ng-click="tabClick(\'groups\')">\n' + "    <config-groups></config-groups>\n" + "  </tab>\n" + '  <tab heading="Messaging" active="current.messaging" ng-click="tabClick(\'messaging\')" class="hidden">\n' + "    <config-messaging></config-messaging>\n" + "  </tab>\n" + "</tabset>");
    $templateCache.put("app/overview/overview.html", "\n" + '<div class="row">\n' + '  <div class="col-md-6 col-lg-5 chart-col">\n' + "    <rha-telemetry-overview></rha-telemetry-overview>\n" + "  </div>\n" + '  <div ng-hide="loading" class="col-md-6 col-lg-7">\n' + "    <rha-telemetry-overview-details></rha-telemetry-overview-details>\n" + "  </div>\n" + "</div>");
    $templateCache.put("app/rules/views/admin-rules.html", "\n" + '<div class="page">\n' + '  <div class="section">\n' + '    <div class="row">\n' + '      <div class="col-sm-6">\n' + '        <h1 class="page-title">Rules</h1>\n' + '        <div class="ng-cloak btn-group btn-group-filter">\n' + '          <button ng-class="{active:tab==\'active\'}" ng-click="activateTab(\'active\')" type="button" class="btn btn-default">Active</button>\n' + '          <button ng-class="{active:tab==\'needs_content\'}" ng-click="activateTab(\'needs_content\')" type="button" class="btn btn-default">Needs Content</button>\n' + '          <button ng-class="{active:tab==\'inactive\'}" ng-click="activateTab(\'inactive\')" type="button" class="btn btn-default">Inactive</button>\n' + '          <button ng-class="{active:tab==\'retired\'}" ng-click="activateTab(\'retired\')" type="button" class="btn btn-default">Retired</button>\n' + "        </div>\n" + "      </div>\n" + '      <div ng-if="!loading" style="margin-bottom: 10px" class="col-sm-6 ng-cloak">\n' + '        <div class="create-error">\n' + "          <h3>Create Rule</h3>\n" + '          <div class="field-group">\n' + "            <label>Plugin</label>\n" + '            <input ng-model="newRule.plugin"/>\n' + "          </div>\n" + '          <div class="field-group">\n' + "            <label>Rule Key</label>\n" + '            <input ng-model="newRule.error_key"/>\n' + '            <button ng-click="createRule(newRule)" ng-disabled="!newRule.plugin || !newRule.error_key" class="btn btn-link pull-right">+ Add Rule</button>\n' + "          </div>\n" + "        </div>\n" + "      </div>\n" + "    </div>\n" + "  </div>\n" + '  <table ng-if="!loading" class="table table-striped table-bordered ng-table error-infos">\n' + "    <thead>\n" + "      <tr>\n" + '        <th ng-class="predicate | sortClass:\'rule.error_key\':reverse" ng-click="predicate = \'rule.error_key\'; reverse=!reverse" class="sortable key">\n' + "          <div>Rule key</div>\n" + "        </th>\n" + '        <th ng-class="predicate | sortClass:\'rule.plugin\':reverse" ng-click="predicate = \'rule.plugin\'; reverse=!reverse" class="sortable plugin">\n' + "          <div>Plugin</div>\n" + "        </th>\n" + '        <th ng-class="predicate | sortClass:\'rule.category\':reverse" ng-click="predicate = \'rule.category\'; reverse=!reverse" class="sortable cat">\n' + "          <div>Category</div>\n" + "        </th>\n" + '        <th ng-class="predicate | sortClass:\'rule.severity\':reverse" ng-click="predicate = \'rule.severity\'; reverse=!reverse" class="sortable sev">\n' + "          <div>Severity</div>\n" + "        </th>\n" + '        <th ng-class="predicate | sortClass:\'count\':reverse" ng-click="predicate = \'count\'; reverse=!reverse" class="sortable count">\n' + "          <div>Count</div>\n" + "        </th>\n" + '        <th ng-class="predicate | sortClass:\'rule.description\':reverse" ng-click="predicate = \'rule.description\'; reverse=!reverse" class="sortable desc">\n' + "          <div>Description</div>\n" + "        </th>\n" + "        <th></th>\n" + "      </tr>\n" + "    </thead>\n" + "    <tbody>\n" + '      <tr ng-repeat="record in records | orderBy:predicate:reverse" class="ng-cloak">\n' + '        <td class="key">{{record.rule.error_key}}</td>\n' + '        <td class="plugin">{{record.rule.plugin}}</td>\n' + '        <td class="cat">{{record.rule.category}}</td>\n' + '        <td class="sev">{{record.rule.severity}}</td>\n' + '        <td class="count">{{record.count}}</td>\n' + '        <td class="desc">{{record.rule.description}}</td>\n' + '        <td class="util">\n' + '          <div class="td-wrap">\n' + '            <div class="utilities-tray"><i ng-click="toggleTray(record)" class="fa fa-cogs"></i>\n' + '              <div ng-show="isToggled(record)" class="tray"><a ui-sref="show-rule({id: record.rule_id})" ng-if="isTabActive([\'active\', \'inactive\', \'retired\'])">Show</a><a ui-sref="edit-rule({id: record.rule_id})" ng-if="isTabActive([\'active\', \'inactive\', \'retired\'])">Edit</a><a ng-click="createRecord(record)" ng-if="isTabActive([\'needs_content\'])">Add Content</a><a ng-click="deactivateRecord(record)" ng-if="isTabActive([\'active\'])">Deactivate</a><a ng-click="activateRecord(record)" ng-if="isTabActive([\'inactive\'])">Activate</a><a ng-click="retireRecord(record)" ng-if="isTabActive([\'inactive\'])">Retire</a><a ng-click="unretireRecord(record)" ng-if="isTabActive([\'retired\'])">Unretire</a></div>\n' + "            </div>\n" + "          </div>\n" + "        </td>\n" + "      </tr>\n" + "    </tbody>\n" + "  </table><br/>\n" + "</div>");
    $templateCache.put("app/rules/views/create-rules.html", "\n" + '<section class="page-announcements">\n' + '  <section class="section-announcements">\n' + "    <h2>New Rule</h2>\n" + "    <rule-form></rule-form>\n" + "  </section>\n" + "</section>");
    $templateCache.put("app/rules/views/edit-rules.html", "\n" + '<section class="page-announcements">\n' + '  <section class="section-announcements">\n' + "    <h2>Edit Rule</h2>\n" + "    <rule-form></rule-form>\n" + "  </section>\n" + "</section>");
    $templateCache.put("app/rules/views/list-rules.html", "\n" + '<div class="page">\n' + '  <div class="section">\n' + '    <div class="row"><a ui-sref="admin-rules" ng-show="user.internal" class="admin-rules btn btn-primary">Rules Admin</a>\n' + '      <div class="col-sm-6">\n' + '        <h1 class="page-title">Rules</h1>\n' + '        <div class="btn-group btn-group-filter">\n' + '          <button ng-class="{active:tab==\'all\'}" ng-click="activateTab(\'all\')" type="button" class="btn btn-default">All</button>\n' + '          <button ng-class="{active:tab==\'performance\'}" ng-click="activateTab(\'performance\')" type="button" class="btn btn-default">Performance</button>\n' + '          <button ng-class="{active:tab==\'stability\'}" ng-click="activateTab(\'stability\')" type="button" class="btn btn-default">Stability</button>\n' + '          <button ng-class="{active:tab==\'security\'}" ng-click="activateTab(\'security\')" type="button" class="btn btn-default">Security</button>\n' + "        </div>\n" + "      </div>\n" + "    </div>\n" + '    <div class="row">\n' + '      <div class="col-sm-12">\n' + '        <ul class="list list-striped with-icons">\n' + '          <li ng-repeat="rule in rules">\n' + '            <severity-icon severity="rule.severity"></severity-icon>\n' + '            <div class="subheading issue">{{ rule.category }} &gt; {{ rule.description }}</div>\n' + "            <p>{{rule.summary}}</p>\n" + "          </li>\n" + "        </ul>\n" + "      </div>\n" + "    </div>\n" + "  </div>\n" + "</div>");
    $templateCache.put("app/rules/views/show-rules.html", "\n" + '<section class="page-announcements">\n' + '  <section class="section-announcements">\n' + '    <h2>Rule <small ng-show="rule.plugin &amp;&amp; rule.error_key">- {{ rule.plugin }}|{{ rule.error_key }}</small></h2>\n' + '    <form ng-submit="saveFn()" name="form" ng-show="rule">\n' + "      <fieldset>\n" + "        <legend></legend>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Plugin</label>\n' + '          <p class="form-control-static">{{ rule.plugin }}</p>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Error key </label>\n' + '          <p class="form-control-static">{{ rule.error_key }}</p>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Category </label>\n' + '          <p class="form-control-static">{{ rule.category }}</p>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Severity </label>\n' + '          <p class="form-control-static">{{ rule.severity }}</p>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Display Name</label>\n' + '          <p class="form-control-static">{{ rule.description }}</p>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Summary</label>\n' + "          <pre>{{ rule.summary }}</pre>\n" + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Reason</label>\n' + "          <pre>{{ rule.reason }}</pre>\n" + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Resolution</label>\n' + "          <pre>{{ rule.resolution }}</pre>\n" + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Node ID </label>\n' + '          <p class="form-control-static">{{ rule.node_id }}</p>\n' + "        </div>\n" + '        <div class="checkbox">\n' + "          <label>\n" + '            <input type="checkbox" ng-model="rule.active" disabled="disabled"/>Active\n' + "          </label>\n" + "        </div>\n" + '        <div class="checkbox">\n' + "          <label>\n" + '            <input type="checkbox" ng-model="rule.retired" disabled="disabled"/>Retired\n' + "          </label>\n" + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label"></label>\n' + '          <button name="preview" ng-click="preview(rule)" class="btn btn-block btn-primary">Preview</button>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label"></label>\n' + '          <button ng-click="editInfo(rule)" class="btn btn-block btn-info">Edit</button>\n' + "        </div>\n" + "      </fieldset>\n" + "    </form>\n" + "  </section>\n" + "</section>");
    $templateCache.put("app/systems/systems.html", "\n" + '<section class="page-systems">\n' + '  <section class="section-system actions">\n' + '    <div class="complete ng-cloak">\n' + '      <div class="row section-title">\n' + '        <div class="col-sm-3 col-md-2">\n' + '          <h1 class="page-title">Systems</h1>\n' + "        </div>\n" + '        <div ng-hide="loading" class="col-sm-9 col-md-10 system-summary">\n' + '          <div class="block">\n' + '            <h3><span class="num success"><i class="fa fa-check-circle fa-1-5x"></i> {{summary.green}}</span>\n' + "              <ng-pluralize count=\"summary.green\" when=\"{'one': ' System ', 'other': ' Systems '}\"></ng-pluralize>with no actions\n" + "            </h3>\n" + "          </div>\n" + '          <div class="block">\n' + '            <h3><span class="num fail"><i class="fa fa-exclamation-circle fa-1-5x"></i> {{summary.red}} </span>\n' + "              <ng-pluralize count=\"summary.red\" when=\"{'one': ' System ', 'other': ' Systems '}\"></ng-pluralize>with actions\n" + "            </h3>\n" + "          </div>\n" + "        </div>\n" + "      </div>\n" + '      <div ng-show="loading" class="load text-center">\n' + '        <div class="spinner spinner-lg"></div>Loading system information…\n' + "      </div>\n" + '      <system-summary-table ng-hide="loading" systems="systems"></system-summary-table>\n' + "    </div>\n" + "  </section>\n" + "</section>");
    $templateCache.put("components/accountSelect/accountSelect.html", "\n" + '<div ng-show="user.internal" class="tam">\n' + "  <label>Account Number</label>\n" + '  <div ng-click="reset()" class="fa fa-refresh pull-right tam-icon pointer"></div>\n' + '  <input ng-model="account_number" ng-model-options="{ debounce: 750 }" ng-change="accountChange(account_number)" class="accNumbInput"/>\n' + "</div>");
    $templateCache.put("components/bullhorn/bullhorn.html", "\n" + '<div><i ng-click="toggle()" class="announcements-icon">\n' + '    <div ng-show="unseen.count" class="has-announcement"><span class="count">{{unseen.count}}</span></div>\n' + '    <div ng-show="unseen.count" class="fa fa-bullhorn"></div><a ui-sref="announcements" ng-hide="unseen.count" class="fa fa-bullhorn"></a></i>\n' + '  <div id="announcements" ng-show="unseen.count &amp;&amp; showAnnouncements" class="announcements fade-out">\n' + "    <ul>\n" + '      <li ng-repeat="a in announcements | filter:unseenFilter">{{a.message}}\n' + '        <div ng-click="ack(a)" class="fa fa-close btn pull-right"></div>\n' + "      </li>\n" + "    </ul>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/config/blacklist/blacklist.html", "\n" + '<div class="row tab-pane">\n' + '  <div class="col-md-8">\n' + "    <h3>Blacklisted Hosts</h3>\n" + "    <p>You currently have \n" + "      <ng-pluralize count=\"blacklists.length\" when=\"{'one': '1 host that is ', 'other': '{} hosts that are '}\"></ng-pluralize>being blacklisted.\n" + "    </p>\n" + "    <p><strong>Note: </strong>Hosts listed here will have their records removed <strong>after </strong>the next batch process run. Entries will not immediately disappear.</p>\n" + "  </div>\n" + '  <div class="col-md-4"><a ng-click="reload()" class="fa fa-refresh"> Reload data</a></div>\n' + '  <section ng-show="loading">\n' + '    <div class="spinner spinner-lg"></div>Loading blacklist info …\n' + "  </section>\n" + '  <section ng-hide="loading">\n' + '    <table ng-show="blacklists &amp;&amp; blacklists.length" class="table table-striped">\n' + "      <thead>\n" + "        <tr>\n" + "          <th>Hostname</th>\n" + "          <th></th>\n" + "        </tr>\n" + "      </thead>\n" + "      <tbody>\n" + '        <tr ng-repeat="b in blacklists">\n' + "          <td>{{b.system.hostname}}</td>\n" + "          <td>\n" + '            <div ng-click="delete(b)" class="fa fa-times pull-right pointer"></div>\n' + "          </td>\n" + "        </tr>\n" + "      </tbody>\n" + "    </table>\n" + "  </section>\n" + "</div>");
    $templateCache.put("components/config/groups/groups.html", "\n" + '<div class="groups tab-pane">\n' + "  <section>\n" + '    <div ng-bind="message" ng-show="message.length &gt; 0" role="alert" class="alert alert-danger"></div>\n' + "    <h3>Create a new group</h3>\n" + "    <group-form></group-form>\n" + "  </section>\n" + '  <section ng-show="loading">\n' + '    <div class="spinner spinner-lg"></div>Loading group list info …\n' + "  </section>\n" + "  <section>\n" + '    <h3 ng-show="!loading">Groups List</h3>\n' + '    <section ng-show="isCreating" class="text-center">\n' + '      <div class="spinner spinner-lg"></div>Creating group …\n' + "    </section>\n" + '    <div class="group-list">\n' + '      <div ng-repeat="group in groups | orderBy:\'display_name\'" class="group"></div>\n' + "    </div>\n" + "  </section>\n" + "</div>");
    $templateCache.put("components/config/hidden/hidden.html", "\n" + '<div class="acks row tab-pane active">\n' + '  <div class="col-md-8">\n' + "    <h3>Hidden Rules</h3>\n" + "    <p>You currently have\n" + "      <ng-pluralize count=\"acks.length\" when=\"{'one': '1 hidden rule.', 'other': '{} hidden rules.'}\"></ng-pluralize>\n" + "    </p>\n" + "    <p><strong>Note:</strong>These are account wide.</p>\n" + "  </div>\n" + '  <div class="col-md-4"><a ng-click="reload()" class="fa fa-refresh"> Reload data</a></div>\n' + '  <div class="col-md-12">\n' + '    <section ng-show="loading">\n' + '      <div class="spinner spinner-lg"></div>Loading hidden rules…\n' + "    </section>\n" + "  </div>\n" + '  <div class="col-md-12">\n' + '    <section ng-hide="loading">\n' + '      <table ng-show="acks.length" class="table table-striped">\n' + "        <thead>\n" + "          <tr>\n" + "            <th>Category</th>\n" + "            <th>Rule</th>\n" + "            <th></th>\n" + "          </tr>\n" + "        </thead>\n" + "        <tbody>\n" + '          <tr ng-repeat="ack in acks">\n' + "            <td>{{ack.rule.category}}</td>\n" + "            <td>{{ack.rule.description}}</td>\n" + "            <td>\n" + '              <div ng-click="delete(ack)" class="fa fa-times pointer pull-right"></div>\n' + "            </td>\n" + "          </tr>\n" + "        </tbody>\n" + "      </table>\n" + "    </section>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/config/messaging/messaging.html", "\n" + '<div class="acks row tab-pane active">\n' + '  <div class="col-md-8">\n' + "    <h3>Messaging</h3>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/group/views/form.html", "\n" + '<div class="row">\n' + '  <form ng-submit="create(newGroup)">\n' + '    <div class="col-xs-12 col-md-3">\n' + "      <label>Display Name</label>\n" + "    </div>\n" + '    <div class="col-xs-12 col-sm-8 col-md-7">\n' + '      <input ng-model="newGroup.display_name" placeholder="Enter a name here" class="full-width"/>\n' + "    </div>\n" + '    <div class="col-xs-12 col-sm-4 col-md-2">\n' + '      <button ng-disabled="!newGroup.display_name" class="btn btn-link"><span class="fa fa-plus">  Add Group</span></button>\n' + "    </div>\n" + "  </form>\n" + "</div>");
    $templateCache.put("components/group/views/group.html", "\n" + '<div ng-click="isCollapsed = !isCollapsed" class="header pointer">\n' + '  <div class="row">\n' + '    <div class="col-xs-12 col-sm-8">\n' + '      <div class="host-info">\n' + '        <h4 class="host">{{group.display_name}}</h4>\n' + "      </div>\n" + "    </div>\n" + '    <div class="col-xs-12 col-sm-4">\n' + '      <div class="options pull-right">\n' + "        <div ng-class=\"{'fa-minus-square-o':!isCollapsed, 'fa-plus-square-o':isCollapsed}\" class=\"fa\"></div>\n" + "      </div>\n" + "    </div>\n" + "  </div>\n" + "</div>\n" + '<div collapse="isCollapsed" class="content">\n' + '  <label class="full-width">Hosts</label>\n' + '  <div class="row">\n' + '    <div class="col-xs-12">\n' + '      <system-select group="group"></system-select>\n' + "    </div>\n" + "  </div>\n" + '  <div ng-hide="group.systems.length" role="alert" class="alert alert-info">No hosts in this group</div>\n' + '  <div ng-show="group.systems.length" class="row">\n' + '    <div class="col-xs-12">\n' + '      <table class="table table-striped no-header">\n' + "        <tbody>\n" + "          <tr ng-repeat=\"system in group.systems | orderBy:'toString()'\">\n" + "            <td>\n" + '              <div class="hostname">{{system.hostname}}</div>\n' + "            </td>\n" + "            <td>\n" + '              <div ng-click="removeSystem(group, system)" class="fa fa-times pull-right pointer"></div>\n' + "            </td>\n" + "          </tr>\n" + "        </tbody>\n" + "      </table>\n" + "    </div>\n" + "  </div>\n" + "</div>\n" + '<div class="footer">\n' + '  <div class="row">\n' + '    <div class="col-xs-12"><a ng-click="deleteGroup(group)" class="pull-right pointer">Delete Group</a></div>\n' + "  </div>\n" + "</div>");
    $templateCache.put("components/groupSelect/groupSelect.html", "\n" + '<div ng-hide="hideGroup || !groups.length" class="filter group-select fade-out">\n' + '  <label>Group</label><a ui-sref="config({tab:\'groups\'})" class="edit-icon pull-right fa fa-edit"></a>\n' + '  <div class="dropdown-select">\n' + '    <select ng-model="group" ng-change="groupChange()">\n' + '      <option value="-1">All</option>\n' + '      <option ng-repeat="g in groups" ng-value="$index">{{g.display_name}}</option>\n' + "    </select>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/overview/overview.html", "\n" + '<div class="chart-container">\n' + '  <div class="donut-hole"><span ng-show="loading" class="preloader"></span>\n' + '    <div class="content"><span class="num">{{getTotal()}}</span>\n' + "      <ng-pluralize count=\"getTotal()\" when=\"{'one': 'Action', 'other': 'Actions'}\" class=\"text\"></ng-pluralize>\n" + "    </div>\n" + "  </div>\n" + '  <div class="rha-telemetry-donut"></div>\n' + "  <div ng-class=\"loading ? 'inactive' : ''\" class=\"reset\">\n" + '    <button ng-click="reload()" ng-disabled="loading" class="chart-back simple"><span class="fa fa-refresh"></span><span class="hidden">Reset Chart</span></button>\n' + "  </div>\n" + '  <div ng-show="isOverview() &amp;&amp; allowExport" class="export">\n' + '    <button ng-click="export()" ng-disabled="loading" class="chart-back simple"><span class="fa fa-download"></span><span class="hidden">Export</span></button>\n' + "  </div>\n" + "  <severity-bar></severity-bar>\n" + '  <div id="legend" class="legend">\n' + '    <table class="table table-striped table-bordered ng-table">\n' + "      <thead>\n" + "        <tr>\n" + "          <th></th>\n" + '          <th ng-class="predicate | sortClass:\'name\':reverse" ng-click="predicate = \'name\'; reverse=!reverse" class="sortable">\n' + "            <div>Section</div>\n" + "          </th>\n" + '          <th ng-class="predicate | sortClass:\'severityNum\':reverse" ng-click="predicate = \'severityNum\'; reverse=!reverse" ng-hide="isOverview()" class="sortable">\n' + "            <div>Sev</div>\n" + "          </th>\n" + '          <th ng-class="predicate | sortClass:\'value\':reverse" ng-click="predicate = \'value\'; reverse=!reverse" class="sortable">\n' + "            <div>Count</div>\n" + "          </th>\n" + '          <th ng-hide="isOverview()"></th>\n' + "        </tr>\n" + "      </thead>\n" + "      <tbody>\n" + '        <tr ng-repeat="group in getData() | orderObjectBy:predicate:reverse" ng-class="{active: group.id === getRule()}" class="legend-item">\n' + '          <td ng-click="arcClick(group)">\n' + '            <div ng-style="{backgroundColor: group.color || \'inherit\'}" class="color-block"></div>\n' + "          </td>\n" + '          <td ng-click="arcClick(group)">{{group.name}}</td>\n' + '          <td ng-click="arcClick(group)" ng-hide="isOverview()" class="filter-on">\n' + '            <severity-icon severity="group.severity"></severity-icon>\n' + "          </td>\n" + '          <td ng-click="arcClick(group)">{{ group.value }}</td>\n' + '          <td ng-click="toggleRule(group)" ng-hide="isOverview()" class="view-toggle"><span ng-click="ackAction(group)" class="link">Hide</span></td>\n' + "        </tr>\n" + "      </tbody>\n" + "    </table>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/overview/overviewDetails/overviewDetails.html", "\n" + '<div ng-show="getLoadingDetails()" class="row chart-header">\n' + '  <div class="col-xs-12">\n' + '    <div class="loader text-center">\n' + '      <div class="spinner"></div>Loading Reports…\n' + "    </div>\n" + "  </div>\n" + "</div>\n" + '<div ng-hide="getReportDetails() || getLoadingDetails()" class="row chart-header">\n' + '  <div class="col-xs-12">\n' + '    <h1 class="page-title">{{getTitle() | titlecase}}</h1>\n' + '    <div class="overview landing">\n' + '      <div class="intro">Please use the <em>chart on the left </em>to drill down and discover problems within your organization.</div>\n' + '      <p>There are {{getTotal()}} <span ng-hide="isOverview()">{{category}} </span>action(s) detected from systems in your organization.</p>\n' + "    </div>\n" + "  </div>\n" + "</div>\n" + '<div ng-show="getReportDetails()">\n' + '  <div class="row chart-header">\n' + '    <div class="col-xs-12">\n' + '      <div ng-hide="getLoadingDetails()">\n' + '        <h1 class="page-title">{{getRuleDetails().description}}</h1>\n' + "      </div>\n" + "    </div>\n" + "  </div>\n" + '  <div ng-show="!getLoadingDetails() &amp;&amp; getReportDetails()" class="row">\n' + '    <div class="col-sm-12">\n' + '      <table class="table table-striped table-bordered chart-details ng-table">\n' + "        <thead>\n" + "          <tr>\n" + '            <th ng-class="predicate | sortClass:\'system.hostname\':reverse" ng-click="predicate = \'system.hostname\'; reverse=!reverse" class="sortable">\n' + "              <div>Hostname</div>\n" + "            </th>\n" + '            <th ng-class="predicate | sortClass:\'date\':reverse" ng-click="predicate = \'date\'; reverse=!reverse" class="sortable">\n' + "              <div>Reported</div>\n" + "            </th>\n" + "            <th></th>\n" + "          </tr>\n" + "        </thead>\n" + "        <tbody>\n" + '          <tr ng-click="showSystem(report.system)" ng-repeat="report in getReportDetails() | orderBy:predicate:reverse">\n' + "            <td>{{ report.system.hostname }}</td>\n" + "            <td>{{report.date | timeAgo}}</td>\n" + "            <td><a>View</a></td>\n" + "          </tr>\n" + "        </tbody>\n" + "      </table>\n" + "    </div>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/recommendedKbase/recommendedKbase.html", "\n" + '<div ng-show="solution &amp;&amp; !loading" class="matched-solution"><a target="_blank" href="{{solution.viewUri}}">For more info see: {{solution.title}}</a></div>\n' + '<div ng-show="loading" class="spinner spinner-sm spinner-inline"></div>');
    $templateCache.put("components/rule/ruleForm/ruleForm.html", "\n" + '<form ng-submit="saveFn()" name="form">\n' + "  <fieldset>\n" + "    <legend></legend>\n" + '    <div class="form-group">\n' + '      <label class="control-label">Rule ID</label>\n' + '      <p class="form-control-static">{{rule.rule_id}}</p>\n' + "    </div>\n" + '    <div class="panel panel-default">\n' + '      <div class="panel-heading"><small ng-show="!locked" class="pull-left">Note: changing plugin and/or error key will change the rule id and can have detrimental effects.</small>\n' + '        <div class="pull-right"><i ng-click="toggleLock()" ng-class="{\'fa-lock\': locked, \'fa-unlock\': !locked}" class="pointer fa"></i></div>\n' + '        <div class="clearfix"></div>\n' + "      </div>\n" + '      <div class="panel-body">\n' + '        <div class="form-group">\n' + '          <label class="control-label">Plugin</label>\n' + '          <rule-plugin ng-hide="locked"></rule-plugin>\n' + '          <p ng-show="locked" class="form-control-static">{{rule.plugin}}</p>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Error key </label>\n' + '          <input ng-hide="locked" ng-model="rule.error_key" type="text" required="required" class="form-control"/>\n' + '          <p ng-show="locked" class="form-control-static">{{rule.error_key}}</p>\n' + "        </div>\n" + "      </div>\n" + "    </div>\n" + '    <div class="form-group">\n' + '      <label class="control-label">Category </label>\n' + '      <select ng-model="rule.category" type="text" ng-options="c as c for c in categories" required="required" class="form-control"></select>\n' + "    </div>\n" + '    <div class="form-group">\n' + '      <label class="control-label">Severity </label>\n' + '      <select ng-model="rule.severity" type="text" ng-options="s as s for s in severities" required="required" class="form-control"></select>\n' + "    </div>\n" + '    <div class="form-group">\n' + '      <label class="control-label">Display Name</label>\n' + '      <input ng-model="rule.description" type="text" required="required" class="form-control"/>\n' + "    </div>\n" + '    <div class="panel panel-default">\n' + '      <div class="panel-heading">Summary is an overview of the error info. <strong>There is no report data accessible here.</strong></div>\n' + '      <div class="panel-body">\n' + '        <div class="form-group">\n' + '          <label class="control-label">Summary</label>\n' + '          <textarea ng-model="rule.summary" type="text" rows="5" class="form-control"></textarea>\n' + "        </div>\n" + "      </div>\n" + "    </div>\n" + '    <div class="panel panel-default">\n' + '      <div class="panel-heading">Reason and Resolution are displayed when looking at one specific report. <strong>Report data is accessible and will be compiled with <a href="http://olado.github.io/doT/" target="_blank">doT.</a></strong></div>\n' + '      <div class="panel-body">\n' + '        <div class="form-group">\n' + '          <label class="control-label">Reason</label>\n' + '          <textarea ng-model="rule.reason" type="text" rows="5" class="form-control"></textarea>\n' + "        </div>\n" + '        <div class="form-group">\n' + '          <label class="control-label">Resolution</label>\n' + '          <textarea ng-model="rule.resolution" type="text" rows="5" class="form-control"></textarea>\n' + "        </div>\n" + "      </div>\n" + "    </div>\n" + '    <div class="form-group">\n' + '      <label class="control-label">Node ID </label>\n' + '      <input ng-model="rule.node_id" type="text" class="form-control"/>\n' + "    </div>\n" + '    <div class="checkbox">\n' + "      <label>\n" + '        <input type="checkbox" ng-model="rule.active"/>Active\n' + "      </label>\n" + "    </div>\n" + '    <div class="checkbox">\n' + "      <label>\n" + '        <input type="checkbox" ng-model="rule.retired"/>Retired\n' + "      </label>\n" + "    </div>\n" + '    <div class="form-group">\n' + '      <label class="control-label"></label>\n' + '      <button name="preview" type="button" ng-click="preview(rule)" class="btn btn-block btn-primary">Preview</button>\n' + "    </div>\n" + '    <div class="form-group">\n' + '      <label class="control-label"></label>\n' + '      <button name="submit" ng-disabled="form.$error.required" class="btn btn-block btn-success">Save</button>\n' + "    </div>\n" + "  </fieldset>\n" + "</form>");
    $templateCache.put("components/rule/rulePlugin/rulePlugin.html", "\n" + '<select chosen="" ng-model="rule.plugin" type="text" ng-options="p for p in plugins track by p" required="required" class="form-control"></select>');
    $templateCache.put("components/rule/ruleReason/ruleReason.html", "\n" + '<div class="category">\n' + '  <severity-icon severity="report.rule.severity"></severity-icon>{{ report.rule.category }} &gt; {{ report.rule.description }}\n' + "</div>\n" + '<div class="reason detail-part">\n' + '  <div ng-bind-html="report.rule.reason | trust_html" class="detail-content"></div>\n' + "</div>");
    $templateCache.put("components/rule/ruleResolution/ruleResolution.html", "\n" + '<div class="detail-part"><span class="icon"><span class="fa fa-check"></span></span>\n' + '  <div class="detail-content answer"><span ng-bind-html="report.rule.resolution | trust_html"></span></div>\n' + "</div>");
    $templateCache.put("components/rule/ruleSummary/ruleSummary.html", "\n" + '<div ng-if="loading" class="row detail">\n' + '  <div class="col-xs-12">\n' + '    <div class="loading-block text-center">\n' + '      <div class="detail-part">\n' + '        <div class="spinner spinner-lg"></div>Loading report(s) for {{system.hostname}}…\n' + "      </div>\n" + "    </div>\n" + "  </div>\n" + "</div>\n" + '<div ng-hide="loading" ng-repeat="report in system.reports" class="row detail">\n' + '  <div class="col-sm-4 issue">\n' + "    <rule-reason></rule-reason>\n" + "  </div>\n" + '  <div class="col-sm-7 col-sm-offset-1 resolution">\n' + "    <rule-resolution></rule-resolution>\n" + '    <recommended-kbase ng-show="report.rule.node_id" node="report.rule.node_id"></recommended-kbase>\n' + "  </div>\n" + '  <div ng-show="debug" class="col-sm-12">\n' + "    <hr/>\n" + "    <h5>Debug Info:</h5>\n" + "    <dl>\n" + "      <dt>Details</dt>\n" + "      <dd>{{report.details | json}}</dd>\n" + "      <dt>Machine ID</dt>\n" + "      <dd>{{report.machine_id}}</dd>\n" + "      <dt>UUID</dt>\n" + "      <dd>{{report.uuid}}</dd>\n" + "    </dl>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/severityBar/severityBar.html", "\n" + '<div class="severity-select">\n' + '  <label for="sev-toggles">Toggle Severities:</label>\n' + '  <div name="sev-toggles" role="group" class="severity-filter-toggle">\n' + '    <button ng-class="severities[sevName] ? \'filter-on\' : \'filter-off\'" ng-click="toggle(sevName)" ng-repeat="sevName in severityNames" class="btn btn-default">\n' + '      <severity-icon severity="sevName"></severity-icon><span class="sev">{{ sevName }}</span>\n' + "    </button>\n" + "  </div>\n" + "</div>");
    $templateCache.put("components/severityIcon/severityIcon.html", '<i ng-class="severityClass" class="fa"></i>');
    $templateCache.put("components/sideNav/sideNav.html", "\n" + '<div class="dashboard-navigation-container">\n' + '  <aside class="dashboard-navigation">\n' + '    <div class="user-profile">\n' + "      <account-select></account-select>\n" + "      <group-select></group-select>\n" + '      <menu class="nav">\n' + "        <ul>\n" + '          <li><a ui-sref="overview({category: null, rule: null})" ng-class="{current: isActive(null)}">Overview</a>\n' + "            <ul>\n" + '              <li><a ui-sref="overview({category: c, rule: null})" ng-class="{current: isActive(c)}" ng-repeat="c in getCategories()" ng-show="getCounts()[c]">{{c|titlecase}} <small ng-show="getCounts()[c]">({{getCounts()[c]}})</small></a></li>\n' + "            </ul>\n" + "          </li>\n" + '          <li><a ui-sref="systems" ui-sref-active="current">Systems</a></li>\n' + '          <li><a ui-sref="config" ui-sref-active="current">Configuration</a></li>\n' + '          <li class="hidden"><a ui-sref="rules" ui-sref-active="current">Rules</a></li>\n' + "        </ul>\n" + "      </menu>\n" + "    </div>\n" + "  </aside>\n" + "</div>");
    $templateCache.put("components/system/systemModal/systemModal.html", "\n" + '<div class="details-overlay chart-overlay">\n' + '  <div class="content">\n' + '    <div class="modal-actions">\n' + '      <div ng-click="close()" class="fa fa-close pull-right"></div>\n' + "    </div>\n" + '    <div class="title">\n' + '      <div class="icon"><span class="fa fa-globe"></span></div>\n' + '      <h2><b>hostname: </b><span tooltip="machine id: {{system.machine_id}}" tooltip-trigger="mouseenter" tooltip-append-to-body="true" tooltip-placement="bottom">{{ system.hostname }}</span></h2><a ng-click="viewAll()" ng-show="ruleFilter &amp;&amp; system.reports.length !== system._reports.length" class="view-all">View all for this host</a>\n' + "    </div>\n" + '    <rule-summary system="system" machine-id="system.machine_id" rule="rule" rule-filter="ruleFilter"></rule-summary>\n' + "  </div>\n" + "</div>");
    $templateCache.put("components/system/systemSelect/systemSelect.html", "\n" + '<div ng-show="systems.length" class="row row-short">\n' + '  <div class="col-xs-12 col-sm-9">\n' + '    <input type="text" ng-model="systemFilter" class="full-width"/>\n' + "  </div>\n" + '  <div class="col-xs-12 col-sm-3">\n' + '    <button ng-click="addSystem()" ng-disabled="!newSystems.length" class="btn btn-link"><span class="fa fa-plus">  Add Systems</span></button>\n' + "  </div>\n" + "</div>\n" + '<div class="row">\n' + '  <div class="col-xs-12 col-sm-9 system-select-container">\n' + '    <select id="system-select" multiple="" ng-model="newSystems" ng-options="s.hostname for s in systems | filter:systemFilter track by s.machine_id" ng-class="{\'expand\': systems.length &gt; 40}" ng-disabled="!systems.length" class="full-width system-select"></select>\n' + "  </div>\n" + "</div>");
    $templateCache.put("components/system/systemSummaryTable/systemSummaryTable.html", "\n" + '<table ng-table="tableParams" class="table table-striped table-hover table-bordered">\n' + "  <thead>\n" + "    <tr>\n" + "      <th ng-class=\"{'sort-asc': tableParams.isSortBy('hostname', 'asc'), 'sort-desc': tableParams.isSortBy('hostname', 'desc')}\" ng-click=\"tableParams.sorting({'hostname' : tableParams.isSortBy('hostname', 'asc') ? 'desc' : 'asc'})\" class=\"sortable col-md-9\">\n" + "        <div>Hostname</div>\n" + "      </th>\n" + "      <th ng-class=\"{'sort-asc': tableParams.isSortBy('last_check_in', 'asc'), 'sort-desc': tableParams.isSortBy('last_check_in', 'desc')}\" ng-click=\"tableParams.sorting({'last_check_in' : tableParams.isSortBy('last_check_in', 'asc') ? 'desc' : 'asc'})\" class=\"sortable col-md-2\">\n" + "        <div>Last Check In</div>\n" + "      </th>\n" + "      <th ng-class=\"{'sort-asc': tableParams.isSortBy('reports.length', 'asc'), 'sort-desc': tableParams.isSortBy('reports.length', 'desc')}\" ng-click=\"tableParams.sorting({'reports.length' : tableParams.isSortBy('reports.length', 'asc') ? 'desc' : 'asc'})\" class=\"sortable col-md-1\">\n" + "        <div>Status</div>\n" + "      </th>\n" + "      <th></th>\n" + "    </tr>\n" + "    <tr>\n" + '      <th colspan="4">\n' + '        <input type="text" ng-model="filters.hostname" placeholder="Filter" class="form-control"/>\n' + "      </th>\n" + "    </tr>\n" + "  </thead>\n" + '  <tr ng-repeat="system in $data | filter:blacklistFilter track by system.machine_id" ng-class="::{\'stale-system\': isStale(system.last_check_in)}">\n' + '    <td ng-hide="::system.reports.length">{{::system.hostname}}</td>\n' + '    <td ng-show="::system.reports.length"><a ng-click="showSystem(system)">{{::system.hostname}}</a></td>\n' + '    <td class="text-center"><span ng-show="::system.last_check_in">{{::system.last_check_in | timeAgo}}</span><span ng-hide="::system.last_check_in">--</span></td>\n' + '    <td class="text-center"><span ng-hide="::system.reports.length" class="icon success"><i class="fa fa-check-circle fa-1-5x text-success"></i></span><span ng-show="::system.reports.length" class="icon failure"><i class="fa fa-exclamation-circle fa-1-5x text-danger fail"></i></span></td>\n' + '    <td class="text-center"><a ng-click="blacklist(system)" title="Blacklist" class="fa fa-close blacklist"></a></td>\n' + "  </tr>\n" + "</table>");
    $templateCache.put("components/topbar/topbar.html", "\n" + '<div class="top-bar">\n' + '  <div style="margin-bottom: 2em;" class="case-switch"></div>\n' + '  <div class="top-wrapper">\n' + "    <bullhorn></bullhorn>\n" + "  </div>\n" + "</div>");
} ]);