<template>
  <div class="container">
    <div class="md-layout">
      <div class="md-layout-item">
        <md-toolbar md-elevation="0">
          <div class="md-layout md-alignment-center-left">
            <img src="/icons/jira-toggl_48.png" alt="Avatar">
            <h3 class="md-title">Toggl2Jira - Xoia</h3>
          </div>
          <div class="md-toolbar-section-end">
            <a href="../options/options.html" target="_blank">
              <md-button class="md-icon-button">
                <md-icon>settings</md-icon>
              </md-button>
            </a>
          </div>
        </md-toolbar>
      </div>
    </div>
    <div class="inner-container">
      <div class="md-layout md-gutter">
        <div class="md-layout-item">
          <span class="datepicker-label md-caption">Start date</span>
          <md-datepicker v-model="startDate" md-immediately />
        </div>
        <div class="md-layout-item">
          <span class="datepicker-label md-caption">End date</span>
          <md-datepicker v-model="endDate" md-immediately />
        </div>
      </div>
      <div class="md-layout">
        <div class="md-layout-item">
          <md-table>
            <md-table-row>
              <md-table-head>
                <md-checkbox v-model="syncAllLogs" class="custom-checkbox" @change="doSyncAllLogs" />
              </md-table-head>
              <md-table-head>Issue</md-table-head>
              <md-table-head>Description</md-table-head>
              <md-table-head>Date</md-table-head>
              <md-table-head>Duration</md-table-head>
              <md-table-head>Logged</md-table-head>
            </md-table-row>

            <md-table-row v-for="log in logs" :key="log.id">
              <md-table-cell class="no-wrap">
                <md-checkbox v-if="log.issue === 'NO ID' || log.isSynced || log.duration < 60" v-model="checkedLogs" disabled :value="log" />
                <md-checkbox v-else v-model="checkedLogs" :value="log" />
              </md-table-cell>
              <md-table-cell class="no-wrap"><a v-if="log.issue != 'NO ID'" v-bind:href="jiraUrl+'/browse/'+ log.issue" target="_blank">{{ log.issue }}</a><a v-else>{{ log.issue }}</a></md-table-cell>
              <md-table-cell>{{ log.description }}</md-table-cell>
              <md-table-cell class="no-wrap">{{ $moment(log.start).format("l") }}</md-table-cell>
              <md-table-cell class="no-wrap">{{ formatDuration(log.duration) }}</md-table-cell>
              <md-table-cell class="no-wrap">
                <md-icon v-show="log.isSynced" class="md-accent">check_circle</md-icon>
              </md-table-cell>
            </md-table-row>

            <md-table-row>
              <md-table-cell class="no-wrap" />
              <md-table-cell class="no-wrap" />
              <md-table-cell />
              <md-table-cell class="no-wrap"><b>TOTAL</b></md-table-cell>
              <md-table-cell class="no-wrap">{{ totalDuration() }}</md-table-cell>
              <md-table-cell class="no-wrap" />
            </md-table-row>
          </md-table>
        </div>
      </div>
      <div class="button__container">
        <md-button v-if="checkedLogs.length" class="md-raised md-accent" @click="syncToJira">
          <span v-show="!isSaving">Log work</span>
          <span v-show="isSaving">Logging...</span>
        </md-button>
        <md-button v-else disabled class="md-raised md-accent" @click="syncToJira">
          <span>Log work</span>
        </md-button>
      </div>
      <md-snackbar v-if="!errorMessage" :md-active.sync="showSnackbar" md-persistent>
        <span>Yay! Your entries has been logged to Jira✌️</span>
      </md-snackbar>
    </div>
    <md-toolbar v-if="errorMessage" class="md-accent error-message md-layout md-alignment-center-center">
      <p>{{ errorMessage }}</p>
    </md-toolbar>
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';

const initalStartDate = new Date(moment().startOf('day'));
const initalEndDate = new Date(moment().endOf('day'));

export default {
  data () {
    return {
      checkedLogs: [],
      syncAllLogs: false,
      startDate: initalStartDate,
      endDate: initalEndDate,
      logs: [],
      errorMessage: null,
      jiraUrl: 'https://xoiasoftware.atlassian.net',
      jiraEmail: '',
      jiraMerge: false,
      jiraIssueInDescription: true,
      worklogWihtoutDescription: true,
      togglApiToken: '',
      isSaving: false,
      showSnackbar: false
    };
  },
  watch: {
    startDate: function (newVal, oldVal) {
      if (newVal.toString() !== oldVal.toString()) {
        this.checkedLogs = [];
        this.logs = [];
        this.fetchEntries();
      }
    },
    endDate: function (newVal, oldVal) {
      if (newVal.toString() !== oldVal.toString()) {
        this.checkedLogs = [];
        this.logs = [];
        this.fetchEntries();
      }
    }
  },
  created () {
    const _self = this;

    browser.storage.sync.get({
      jiraUrl: 'https://xoiasoftware.atlassian.net',
      jiraEmail: '',
      jiraMerge: false,
      jiraIssueInDescription: true,
      worklogWihtoutDescription: true,
      togglApiToken: ''
    }).then((setting) => {
      _self.jiraUrl = setting.jiraUrl;
      _self.jiraEmail = setting.jiraEmail;
      _self.jiraMerge = setting.jiraMerge;
      _self.jiraIssueInDescription = setting.jiraIssueInDescription;
      _self.worklogWihtoutDescription = setting.worklogWihtoutDescription;
      _self.togglApiToken = setting.togglApiToken;
    });
  },
  methods: {
    syncToJira () {
      const _self = this;
      const headers = {
        'X-Atlassian-Token': 'no-check',
        'User-Agent': ''
      };
      this.checkedLogs.forEach(function (log) {
        axios({
          method: 'post',
          url: _self.jiraUrl + '/rest/api/latest/issue/' + log.issue + '/worklog',
          data: {
            timeSpentSeconds: log.duration,
            comment: _self.worklogWihtoutDescription ? log.description.replace(log.issue,"") : log.description,
            started: _self.toJiraDateTime(log.start)
          },
          headers: headers
        })
          .then(function (response) {
            _self.isSaving = false;
            _self.showSnackbar = true;
            _self.checkIfAlreadyLogged(log);
            _self.checkedLogs = [];
            _self.syncAllLogs = false;
          })
          .catch(function (error) {
            _self.errorMessage = error;
          });
      });
    },
    toJiraDateTime  (date) {
      let parsedDate = Date.parse(date);
      let jiraDate = Date.now();
      if (parsedDate) {
        jiraDate = new Date(parsedDate + 2 * 3600 * 1000);
      }
      let dateString = jiraDate.toISOString();
      let timeZoneString;
      timeZoneString = new Date().toString().match(/([-+][0-9]+)\s/)[1];
      dateString = dateString.replace('Z', timeZoneString);
      return dateString;
    },
    doSyncAllLogs () {
      let _self = this;
      if (this.syncAllLogs) {
        _self.logs.forEach(function (log) {
          if (log.issue !== 'NO ID' && !log.isSynced) {
            _self.checkedLogs.push(log);
          }
        });
      } else {
        this.checkedLogs = [];
      }
    },
    formatDuration (duration) {
      duration = Number(duration);
      if (duration < 60) {
        return 'Too short';
      }
      let h = Math.floor(duration / 3600);
      let m = Math.floor(duration % 3600 / 60);
      let hDisplay = h > 0 ? h + 'h' : '';
      let mDisplay = m > 0 ? m + 'm' : '';
      return hDisplay + ' ' + mDisplay;
    },
    isSameStart (worklog, log) {
      const _self = this;
      if (_self.jiraMerge) {
        const format = 'DD/MM/YYYY';
        return _self.$moment(worklog.started).format(format) === _self.$moment(log.start).format(format);
      } else {
        return worklog.started === _self.toJiraDateTime(log.start);
      }
    },
    checkIfAlreadyLogged (log) {
      const _self = this;
      axios.get(_self.jiraUrl + '/rest/api/latest/issue/' + log.issue + '/worklog')
        .then(function (response) {
          let worklogs = response.data.worklogs;
          worklogs.forEach(function (worklog) {
            if (_self.isSameStart(worklog, log) && worklog.author.emailAddress?.toLowerCase() === _self.jiraEmail?.toLowerCase()) {
              let logIndex = _self.logs.findIndex(i => i.id === log.id);
              if (typeof (_self.logs[logIndex]) !== 'undefined') {
                _self.logs[logIndex].isSynced = true;
              }
            }
          });
        });
    },
    getIssue (log) {
      let _self = this;
      return new Promise(function (resolve, reject) {
        if (_self.jiraIssueInDescription) {
          const parsedIssue = log.description.match(/^[A-Z]*-[0-9]*/);
          if (parsedIssue) {
            resolve(parsedIssue[0]);
          }
          reject(log);
        }
        if ((typeof log.pid !== 'undefined')) {
          axios.get('https://www.toggl.com/api/v8/projects/' + log.pid, {
            headers: { Authorization: 'Basic ' + btoa(_self.togglApiToken + ':api_token') }
          })
            .then(function (issue) {
              resolve(issue.data.data.name);
            });
        } else {
          reject(log);
        }
      });
    },
    fetchEntries () {
      let _self = this;
      let startDate = moment(this.startDate).utc(true).toISOString(true).replace('+00:00', 'Z');
      let endDate = moment(this.endDate).add(1, 'days').utc(true).toISOString(true).replace('+00:00', 'Z');

      axios.get('https://www.toggl.com/api/v8/time_entries', {
        headers: { Authorization: 'Basic ' + btoa(_self.togglApiToken + ':api_token') },
        params: {
          start_date: startDate,
          end_date: endDate
        }
      })
        .then(function (entries) {
          entries.data.reverse();
          entries.data.forEach(function (log) {
            _self.getIssue(log).then(function (issueName) {
              let logObject = log;
              logObject.isSynced = false;
              logObject.issue = issueName;
              logObject.checked = '';

              if (_self.jiraMerge) {
                let logIndex = _self.logs.findIndex(i => i.description === log.description);
                if (logIndex !== -1) {
                  _self.logs[logIndex].duration = _self.logs[logIndex].duration + logObject.duration;
                } else {
                  _self.logs.push(logObject);
                }
              } else {
                _self.logs.push(logObject);
              }
              _self.checkIfAlreadyLogged(log);
            }).catch(function (log) {
              // There is no ID for the entry but we still need to print it out to the user
              let logObject = log;
              logObject.isSynced = false;
              logObject.issue = 'NO ID';
              logObject.checked = '';
              _self.logs.push(logObject);
            });
          });
        })
        .catch(function (error) {
          if (typeof (error.response) !== 'undefined' && error.response.status === 403) {
            _self.errorMessage = 'Please add your Toggl API token';
          } else {
            _self.errorMessage = typeof (error.response) !== 'undefined' ? error.response.statusText : error.response;
          }
        });
    },
    totalDuration () {
      let _self = this;
      if (!_self.logs.length) {
        return 'Loading...';
      }
      let totalDuration = 0;
      _self.logs.forEach(function (log) {
        if (log.duration) {
          totalDuration += log.duration;
        }
      });
      if (totalDuration) {
        return _self.formatDuration(totalDuration);
      }
    }
  }
};
</script>

<style>
  .container {
    position: relative;
    background: #fff;
    width: 700px;
    height: 600px;
    overflow: auto;
  }
  .md-layout-item { position: relative; }

  .inner-container {
    padding: 20px;
    background: #fff;
  }

  .md-table-cell-container,
  .md-table-head-label { padding: 0 5px; }

  .md-checkbox { margin: 0; }

  .datepicker-label {
    position: absolute;
    left: 44px;
    font-size: 12px;
  }

  .md-table-head-container {
    padding: 4px 0;
    height: auto;
    text-align: left;
  }

  .md-table-row:hover:not(.md-header-row) .md-table-cell { background: unset !important; }

  .no-wrap { white-space: nowrap; }

  .button__container {
    display: flex;
    justify-content: flex-end;
  }

  .md-button { margin-left: 0; }

  .error-message {
    text-align: center;
    font-size: 16px;
    position: absolute;
      bottom: 0;
  }

  .md-field.md-focused .md-input,
  .md-field.md-focused .md-textarea,
  .md-field.md-has-value .md-input,
  .md-field.md-has-value .md-textarea { font-size: 14px; }
  .custom-checkbox { margin-top: 4px; }

  img { width: 32px; }
</style>
