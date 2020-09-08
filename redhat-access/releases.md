Release contents

- v2.2.17
  * [PR #51](https://github.com/redhataccess/foreman-plugin/pull/51) - Fixes css import build issue
  
- v2.2.16
  * [BZ1611621](https://bugzilla.redhat.com/show_bug.cgi?id=1611621) - Improve disconnected mode support
  
- v2.2.15
  * [PR #40](https://github.com/redhataccess/foreman-plugin/pull/40) - Handle host lookup for uppercase hostnames
  
- v2.2.14
  * Added x_rh_insights_request_id to copied proxy response header
  
- v2.2.13
  * Fixed a CGI.escape issue with proxy passwords in v2.2.12
  
- v2.2.12
  * [BZ1825930](https://bugzilla.redhat.com/show_bug.cgi?id=1825930) - RedHat Insights client proxying stopped working due to missing proxy

- v2.2.11
  * [BZ1803846](https://bugzilla.redhat.com/show_bug.cgi?id=1803846)
  * Add tags to branch_info metadata for location, organization, Host Groups, Host Collections, and parameters (optional)
  
- v2.2.10 
  * [BZ1719175](https://bugzilla.redhat.com/show_bug.cgi?id=1719175) - Round 2: fixed satellite 6.6 issues

- v2.2.9
  * [BZ1719175](https://bugzilla.redhat.com/show_bug.cgi?id=1719175) - Proxy password with special character "?" fails for insights communication

- v2.2.8
  * [BZ1642194](https://bugzilla.redhat.com/show_bug.cgi?id=1642194) - Proxied upload timeout
  * Use branch_id instead of creating subsets
  
- v2.2.7
  * [BZ1712554](https://bugzilla.redhat.com/show_bug.cgi?id=1712554) - Red Hat Insights inventory broken for large environments

- v2.2.6
  * [BZ1708295](https://bugzilla.redhat.com/show_bug.cgi?id=1708295) - PATCH payload being converted to json

- v2.2.5
  * [PR #37](https://github.com/redhataccess/foreman-plugin/pull/37) - Add support for proxying HTTP PATCH requests

- v2.2.4
  * [BZ1672426](https://bugzilla.redhat.com/show_bug.cgi?id=1672426) - Remove Red Hat Access Case Management Plugin

- v2.2.3
  * [BZ1674165](https://bugzilla.redhat.com/show_bug.cgi?id=1674165) - When using Insights tab and sub components Default Organization getting change to [object object]
  * [PR #34](https://github.com/redhataccess/foreman-plugin/pull/34) - Update homepage in gemspec to point to GitHub

- v2.2.2
  * [PR #33](https://github.com/redhataccess/foreman-plugin/pull/33) - Playbook run PG error
  
- v2.2.1
  * [BZ1656478](https://bugzilla.redhat.com/show_bug.cgi?id=1656478) - Add support for multipart proxy upload for new platform services
  
- v2.2.0
  * [PR #30](https://github.com/redhataccess/foreman-plugin/pull/30) - handle nil condition in search_by_plan_id
  * [BZ1638435](https://bugzilla.redhat.com/show_bug.cgi?id=1638435) - update for rails 5
  * [BZ1638263](https://bugzilla.redhat.com/show_bug.cgi?id=1638263) - use vertical menu