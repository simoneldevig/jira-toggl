<template>
  <div class="container">
    <div class="md-layout">
      <div class="md-layout-item">
        <md-toolbar md-elevation="0">
          <div class="md-layout md-alignment-center-left">
            <img src="/icons/jira-toggl_48.png" alt="Avatar">
            <h3 class="md-title">Jira Toggl</h3>
          </div>
          <div class="md-toolbar-section-end">
            <a v-if="clockworkEnabled" :href="clockworkUrl()" target="_blank">
              <md-button class="md-icon-button">
                <md-icon>timer</md-icon>
              </md-button>
            </a>
            <md-button class="md-icon-button" @click="refreshEntries">
              <md-icon>autorenew</md-icon>
            </md-button>
            <a href="../options/options.html" target="_blank">
              <md-button class="md-icon-button">
                <md-icon>settings</md-icon>
              </md-button>
            </a>
          </div>
        </md-toolbar>
      </div>
    </div>
    <div class="button-reset-float">
      <u @click="moveToday">Reset dates</u>
    </div>

    <div class="inner-container">
      <div class="md-layout md-gutter">
        <md-button :disabled="blockFetch" class="md-icon-button material-icons button-navigation-calendar" @click="dayMinus">
          <md-icon>navigate_before</md-icon>
        </md-button>

        <div class="md-layout-item">
          <span class="datepicker-label md-caption">Start date</span>
          <md-datepicker v-model="startDate" :readonly="blockFetch" md-immediately />
        </div>
        <div class="md-layout-item">
          <span class="datepicker-label md-caption">End date</span>
          <md-datepicker v-model="endDate" :readonly="blockFetch" md-immediately />
        </div>
        <md-button :disabled="blockFetch" class="md-icon-button material-icons button-navigation-calendar" @click="dayPlus">
          <md-icon>navigate_next</md-icon>
        </md-button>
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
                <md-checkbox v-if=" log.issue === 'NO ID' || log.isSynced || log.duration < 60" v-model="checkedLogs" disabled :value="log" />
                <md-checkbox v-else v-model="checkedLogs" :value="log" />
              </md-table-cell>
              <md-table-cell class="no-wrap">
                <a v-if="log.issue != 'NO ID'" :href="jiraUrl + '/browse/' + log.issue" target="_blank">{{ log.issue }}</a><a v-else>{{ log.issue }}</a>
              </md-table-cell>
              <md-table-cell>{{ log.description }}</md-table-cell>
              <md-table-cell class="no-wrap">
                {{
                  $moment(log.start).format("l")
                }}
              </md-table-cell>
              <md-table-cell class="no-wrap" :class="log.duration > 60 ? 'timeBlack' : 'timeRed'">
                {{ formatDuration(log.duration) }}
              </md-table-cell>
              <md-table-cell class="no-wrap">
                <md-icon v-show="log.isSynced" class="md-accent">check_circle</md-icon>
              </md-table-cell>
            </md-table-row>

            <md-table-row>
              <md-table-cell class="no-wrap" />
              <md-table-cell />
              <md-table-cell class="no-wrap"><b>TOTAL</b></md-table-cell>
              <md-table-cell class="no-wrap">
                <div class="tooltip">
                  <i>{{ totalDuration(true) }}</i>
                  <span class="tooltiptext">Time in Jira</span>
                </div>
              </md-table-cell>
              <md-table-cell class="no-wrap">
                <div class="tooltip">
                  <n>{{ totalDuration() }}</n>
                  <span class="tooltiptext">Time in Toggl</span>
                </div>
              </md-table-cell>
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
      jiraUrl: '',
      jiraEmail: '',
      jiraMerge: true,
      jiraIssueInDescription: true,
      worklogWihtoutDescription: true,
      worklogDescriptionSplit: true,
      allowNumbersInId: true,
      clockworkEnabled: false,
      stringSplit: ':',
      togglApiToken: '',
      isSaving: false,
      showSnackbar: false,
      blockFetch: false,
      weekdayMonday: true,
      saveDates: false,
      theme: ''
    };
  },
  watch: {
    startDate: function (newVal, oldVal) {
      if (newVal.toString() !== oldVal.toString()) {
        this.refreshEntries();
      }
    },
    endDate: function (newVal, oldVal) {
      if (newVal.toString() !== oldVal.toString()) {
        this.refreshEntries();
      }
    }
  },
  created () {
    const _self = this;

    browser.storage.sync
      .get({
        jiraUrl: '',
        jiraEmail: '',
        jiraMerge: false,
        jiraIssueInDescription: false,
        worklogWihtoutDescription: false,
        worklogDescriptionSplit: false,
        allowNumbersInId: true,
        clockworkEnabled: false,
        stringSplit: ':',
        togglApiToken: '',
        jiraPlugin: '',
        weekdayMonday: false,
        startDate: initalStartDate,
        endDate: initalEndDate,
        saveDates: false
      })
      .then((setting) => {
        _self.jiraUrl = setting.jiraUrl;
        _self.jiraEmail = setting.jiraEmail;
        _self.jiraMerge = setting.jiraMerge;
        _self.jiraIssueInDescription = setting.jiraIssueInDescription;
        _self.worklogWihtoutDescription = setting.worklogWihtoutDescription;
        _self.worklogDescriptionSplit = setting.worklogDescriptionSplit;
        _self.allowNumbersInId = setting.allowNumbersInId;
        _self.clockworkEnabled = setting.clockworkEnabled;
        _self.stringSplit = setting.stringSplit;
        _self.togglApiToken = setting.togglApiToken;
        _self.jiraPlugin = setting.jiraPlugin;
        _self.weekdayMonday = setting.weekdayMonday;
        _self.saveDates = setting.saveDates;
        if (_self.saveDates) {
          _self.startDate = setting.startDate;
          _self.endDate = setting.endDate;
        }
        _self.$material.locale.firstDayOfAWeek = _self.weekdayMonday;
      });
  },
  methods: {
    refreshEntries () {
      if (this.saveDates) {
        this.saveActualDates();
      }
      this.checkedLogs = [];
      this.logs = [];
      this.fetchEntries();
    },
    processJiraDescription (description) {
      const _self = this;
      if (_self.worklogDescriptionSplit && _self.stringSplit) {
        if (description.includes(_self.stringSplit)) {
          return description
            .split(_self.stringSplit)
            .slice(1)
            .join(_self.stringSplit);
        }
      }

      return description;
    },
    async syncToJira () {
      const _self = this;
      const headers = {
        'X-Atlassian-Token': 'no-check', 'User-Agent': ''
      };
      const awaitingIssues = {};
      for (let log of this.checkedLogs) {
        if (log.issue in awaitingIssues) {
          await awaitingIssues[log.issue];
        }
        const promise = axios({
          method: 'post',
          url:
            _self.jiraUrl + '/rest/api/latest/issue/' + log.issue + '/worklog',
          data: {
            timeSpentSeconds: log.duration,
            comment: _self.processJiraDescription(
              _self.worklogWihtoutDescription
                ? log.description.replace(log.issue, '')
                : log.description
            ),
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
          })
          .finally(function () {
            delete awaitingIssues[log.issue];
          });
        awaitingIssues[log.issue] = promise;
      }
    },
    toJiraDateTime (date) {
      let parsedDate = Date.parse(date);
      let jiraDate = Date.now();
      if (parsedDate) {
        const offset = new Date().getTimezoneOffset();
        jiraDate = new Date(parsedDate - offset * 60 * 1000);
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

      if (duration < 0) {
        return 'WIP';
      }

      if (duration < 60) {
        return 'Too short';
      }

      let h = Math.floor(duration / 3600);
      let m = Math.floor((duration % 3600) / 60);
      let hDisplay = h > 0 ? h + 'h' : '';
      let mDisplay = m > 0 ? m + 'm' : '';
      return hDisplay + ' ' + mDisplay;
    },
    isSameStart (worklog, log) {
      const _self = this;
      if (_self.jiraMerge) {
        const format = 'DD/MM/YYYY';
        return (
          _self.$moment(worklog.started).format(format) ===
          _self.$moment(log.start).format(format)
        );
      } else {
        return worklog.started === _self.toJiraDateTime(log.start);
      }
    },
    checkIfAlreadyLogged (log) {
      const _self = this;
      axios
        .get(_self.jiraUrl + '/rest/api/latest/issue/' + log.issue + '/worklog')
        .then(function (response) {
          let worklogs = response.data.worklogs;
          worklogs.forEach(function (worklog) {
            if (
              _self.isSameStart(worklog, log) &&
              worklog.author.emailAddress?.toLowerCase() ===
                _self.jiraEmail?.toLowerCase()
            ) {
              let logIndex = _self.logs.findIndex((i) => i.id === log.id);
              if (typeof _self.logs[logIndex] !== 'undefined') {
                _self.logs[logIndex].isSynced = true;
              }
            }
          });
        });
    },
    matchIssueId (name) {
      if (this.allowNumbersInId) {
        return name.match(/^[A-Z][A-Z,0-9]*-[0-9]*/);
      } else {
        return name.match(/^[A-Z]*-[0-9]*/);
      }
    },
    getIssue (log) {
      let _self = this;
      return new Promise(function (resolve, reject) {
        if (_self.jiraIssueInDescription && log.description != null) {
          const parsedIssue = _self.matchIssueId(log.description);
          if (parsedIssue) {
            resolve(parsedIssue[0]);
          }
        } else if (log.description == null) {
          log.description = ''; // Set empty string (not null), to avoid reference null problems
        }
        if (typeof log.pid !== 'undefined') {
          axios
            .get('https://api.track.toggl.com/api/v8/projects/' + log.pid, {
              headers: {
                Authorization:
                  'Basic ' + btoa(_self.togglApiToken + ':api_token')
              }
            })
            .then(function (issue) {
              const parsedIssue = _self.matchIssueId(issue.data.data.name);
              if (parsedIssue) {
                resolve(parsedIssue[0]);
              } else {
                reject(log);
              }
            });
        } else {
          reject(log);
        }
      });
    },
    fetchEntries () {
      let _self = this;
      const offset = new Date().getTimezoneOffset();
      const sign = offset <= 0 ? '+' : '-';
      function abspad (num) { return ('0' + Math.abs(num)).slice(-2); }
      const timezone = `${sign}${abspad(offset / 60)}:${abspad(offset % 60)}`;

      let startDate = moment(this.startDate)
        .utc(true)
        .toISOString(true)
        .replace('+00:00', timezone);
      let endDate = moment(this.endDate)
        .add(1, 'days')
        .utc(true)
        .toISOString(true)
        .replace('+00:00', timezone);

      if (_self.blockFetch) {
        return;
      }

      _self.blockFetch = true;
      axios
        .get('https://api.track.toggl.com/api/v8/time_entries', {
          headers: {
            Authorization: 'Basic ' + btoa(_self.togglApiToken + ':api_token')
          },
          params: {
            start_date: startDate,
            end_date: endDate
          }
        })
        .then(function (entries) {
          _self.blockFetch = false;
          entries.data.reverse();
          entries.data.forEach(function (log) {
            _self
              .getIssue(log)
              .then(function (issueName) {
                let logObject = log;
                logObject.isSynced = false;
                logObject.issue = issueName;
                logObject.checked = '';

                if (_self.jiraMerge) {
                  let logIndex = _self.logs.findIndex(
                    (i) => i.description === log.description && i.issue === issueName
                  );
                  if (logIndex !== -1) {
                    _self.logs[logIndex].duration =
                      _self.logs[logIndex].duration + logObject.duration;
                  } else {
                    _self.logs.push(logObject);
                  }
                } else {
                  _self.logs.push(logObject);
                }
                _self.checkIfAlreadyLogged(log);
              })
              .catch(function (log) {
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
          _self.blockFetch = false;
          if (
            typeof error.response !== 'undefined' &&
            error.response.status === 403
          ) {
            _self.errorMessage = 'Please add your Toggl API token';
          } else {
            _self.errorMessage =
              typeof error.response !== 'undefined'
                ? error.response.statusText
                : error.response;
          }
        });
    },
    totalDuration (synced = false) {
      let _self = this;
      if (!_self.logs.length) {
        return _self.blockFetch ? 'Loading...' : 'No entries!';
      }

      let totalDuration = 0;
      _self.logs.forEach(function (log) {
        if (log.duration && log.duration > 0) {
          if (!synced || log.isSynced) {
            totalDuration += log.duration;
          }
        }
      });
      if (totalDuration) {
        return _self.formatDuration(totalDuration);
      }
    },
    dayMinus () {
      if (this.blockFetch) {
        return;
      }
      this.moveDays(-1);
    },
    dayPlus () {
      if (this.blockFetch) {
        return;
      }
      this.moveDays(1);
    },
    moveDays (ndays) {
      let newStartDate = moment(this.startDate).add(ndays, 'days');
      let newEndDate = moment(this.endDate).add(ndays, 'days');
      this.startDate = new Date(newStartDate.startOf('day'));
      this.endDate = new Date(newEndDate.startOf('day'));
      this.refreshEntries();
    },
    moveToday () {
      this.startDate = new Date(moment().startOf('day'));
      this.endDate = this.startDate;
      this.refreshEntries();
    },
    clockworkUrl () {
      let startDate = moment(this.startDate)
        .utc(true)
        .toISOString(true)
        .slice(0, 10);
      let endDate = moment(this.endDate)
        .utc(true)
        .toISOString(true)
        .slice(0, 10);
      return (
        this.jiraPlugin.replace('{jiraUrl}', this.jiraUrl).replace('{startDate}', startDate).replace('{endDate}', endDate)
      );
    },
    formatDateToPicker (date) {
      const y = new Date(date).getFullYear();
      const m = new Date(date).getMonth() + 1;
      const d = new Date(date).getDate();
      return y.toString() + '-' + m.toString() + '-' + d.toString();
    },
    saveActualDates () {
      const _self = this;
      _self.isSaving = true;
      browser.storage.sync.set({
        startDate: this.formatDateToPicker(_self.startDate),
        endDate: this.formatDateToPicker(_self.endDate)
      }).then(() => {
        _self.isSaving = false;
      });
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
.md-layout-item {
  position: relative;
}

.inner-container {
  padding: 20px;
  background: #fff;
}

.md-table-cell-container,
.md-table-head-label {
  padding: 0 5px;
}

.md-checkbox {
  margin: 0;
}

.datepicker-label {
  position: absolute;
  margin-left: 35.7px;
  font-size: 12px;
}

.md-table-head-container {
  padding: 4px 0;
  height: auto;
  text-align: left;
}

.md-table-row:hover:not(.md-header-row) .md-table-cell {
  background: unset !important;
}

.no-wrap {
  white-space: nowrap;
}

.button__container {
  display: flex;
  justify-content: flex-end;
}

.md-button {
  margin-left: 0;
}

.error-message {
  text-align: center;
  font-size: 16px;
  position: absolute;
  bottom: 0;
}

.md-field.md-focused .md-input,
.md-field.md-focused .md-textarea,
.md-field.md-has-value .md-input,
.md-field.md-has-value .md-textarea {
  font-size: 14px;
}
.custom-checkbox {
  margin-top: 4px;
}

img {
  width: 32px;
}

.timeRed {
  color: var(--md-theme-default-accent, rgb(255, 0, 0));
  font-weight: bold;
}

.timeBlack {
  color: black;
}

.button-navigation-calendar {
  min-width: 20px;
  margin-top: 15px;
}

.button-reset-float{
  position: absolute;
  float: right;
  display: inline;
  overflow: hidden;
  right: 5px;
  margin-top: 5px;
}

/* ToolTip */
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 150px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -75px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #555 transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
</style>
