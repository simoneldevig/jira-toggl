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
          <md-datepicker v-on:md-closed="reInit" v-model="startDate" md-immediately />
        </div>
        <div class="md-layout-item">
          <span class="datepicker-label md-caption">End date</span>
          <md-datepicker v-on:md-closed="reInit" v-model="endDate" md-immediately />
        </div>
      </div>
      <div class="md-layout">
        <div class="md-layout-item">
          <md-table>
            <md-table-row>
              <md-table-head>
                <md-checkbox class="custom-checkbox" v-model="syncAllLogs" @change="doSyncAllLogs"></md-checkbox>
              </md-table-head>
              <md-table-head>Issue</md-table-head>
              <md-table-head>Description</md-table-head>
              <md-table-head>Date</md-table-head>
              <md-table-head>Duration</md-table-head>
              <md-table-head>Logged</md-table-head>
            </md-table-row>

            <md-table-row v-for="log in logs" :key="log.id">
              <md-table-cell class="no-wrap">
                <md-checkbox v-if="log.issue === 'NO ID' || log.isSynced" disabled :value="log" v-model="checkedLogs"></md-checkbox>
                <md-checkbox v-else :value="log" v-model="checkedLogs"></md-checkbox>
              </md-table-cell>
              <md-table-cell class="no-wrap">{{log.issue}}</md-table-cell>
              <md-table-cell>{{log.description}}</md-table-cell>
              <md-table-cell class="no-wrap">{{$moment(log.start).format("l")}}</md-table-cell>
              <md-table-cell class="no-wrap">{{formatDuration(log.duration)}}</md-table-cell>
              <md-table-cell class="no-wrap">
                <md-icon v-show="log.isSynced" class="md-accent">check_circle</md-icon>
              </md-table-cell>
            </md-table-row>

            <md-table-row>
              <md-table-cell class="no-wrap"></md-table-cell>
              <md-table-cell class="no-wrap"></md-table-cell>
              <md-table-cell></md-table-cell>
              <md-table-cell class="no-wrap"><b>TOTAL</b></md-table-cell>
              <md-table-cell class="no-wrap">{{formatDuration(totalDuration)}}</md-table-cell>
              <md-table-cell class="no-wrap"></md-table-cell>
            </md-table-row>
          </md-table>
        </div>

      </div>
      <div class="button__container">
        <md-button v-if="checkedLogs.length" @click="syncToJira" class="md-raised md-accent">
          <span v-show="!isSaving">Log work</span>
          <span v-show="isSaving">Logging...</span>
        </md-button>
        <md-button v-else disabled @click="syncToJira" class="md-raised md-accent">
          <span>Log work</span>
        </md-button>
      </div>
      <md-snackbar :md-active.sync="showSnackbar" md-persistent>
        <span>Yay! Your entries has been logged to Jira✌️</span>
      </md-snackbar>
    </div>
    <md-toolbar v-if="errorMessage" class="md-accent error-message md-layout md-alignment-center-center">
      <p>{{errorMessage}}</p>
    </md-toolbar>
  </div>
</template>

<script>
  import axios from 'axios';
  export default {
    data() {
      return {
        checkedLogs: [],
        syncAllLogs: false,
        startDate: '',
        endDate: '',
        logs: [],
        errorMessage: null,
        jiraUrl: '',
        jiraUsername: '',
        jiraMerge: true,
        isSaving: false,
        showSnackbar: false
      }
    },
    created () {
      const _self = this;

      chrome.storage.sync.get({
        jiraUrl: '',
        jiraUsername: '',
        jiraMerge: true
      }, function (setting) {
        _self.jiraUrl = setting.jiraUrl;
        _self.jiraUsername = setting.jiraUsername;
        _self.jiraMerge = setting.jiraMerge;
      });

      const utcDate = new Date();
      this.startDate = new Date(this.$moment().startOf('day'));
      this.endDate = new Date(this.$moment().add(1,'days').endOf('day'));
      this.fetchEntries();
    },
    computed: {
      totalDuration () {
        let totalDuration = 0
          this.logs.forEach(function (log) {
            totalDuration += log.duration;
          });
        return totalDuration;
      }
    },
    methods: {
      reInit () {
        this.checkedLogs = [];
        this.logs = [];
        this.fetchEntries();
      },
      syncToJira () {
        const _self = this;
        this.checkedLogs.forEach(function (log) {
          axios.post(_self.jiraUrl + '/rest/api/latest/issue/' + log.issue + '/worklog', {
            timeSpentSeconds: log.duration,
            comment: log.description,
            started: _self.toJiraDateTime(log.start)
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
      toJiraDateTime(date) {
        let parsedDate = Date.parse(date);
        let jiraDate = Date.now();
        if (parsedDate) {
          jiraDate = new Date(parsedDate + 2 * 3600 * 1000);
        }
        let dateString = jiraDate.toISOString();
        let timeZone = jiraDate.getTimezoneOffset() / (-60);
        let absTimeZone = Math.abs(timeZone);
        let timeZoneString;
        let sign = timeZone > 0 ? '+' : '-';
        if (absTimeZone < 10) {
          timeZoneString = sign + '0' + absTimeZone + '00'
        } else {
          timeZoneString = sign + absTimeZone + '00'
        }
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
        let h = Math.floor(duration / 3600);
        let m = Math.floor(duration % 3600 / 60);
        let hDisplay = h > 0 ? h + 'h' : '';
        let mDisplay = m > 0 ? m + 'm' : '';
        return hDisplay + ' ' + mDisplay;
      },
      checkIfAlreadyLogged (log) {
        const _self = this;
        axios.get(_self.jiraUrl + '/rest/api/latest/issue/' + log.issue + '/worklog')
          .then(function (response) {
            let worklogs = response.data.worklogs;
            worklogs.forEach(function (worklog) {
              let diff = Math.floor(worklog.timeSpentSeconds / 60) - Math.floor(log.duration / 60);
              if (_self.$moment(worklog.started).format() === _self.$moment(log.start).format() && diff < 4 && diff > -4 && worklog.author.name === _self.jiraUsername) {
                let logIndex = _self.logs.findIndex(i => i.id === log.id);
                if (typeof(_self.logs[logIndex] !== 'undefined')) {
                  _self.logs[logIndex].isSynced = true;
              }
            }
          })
        });
      },
      fetchEntries() {
        let _self = this;
        let startDate = this.$moment(this.startDate).toISOString(true).replace('+02:00', 'Z');
        let endDate = this.$moment(this.endDate).toISOString(true).replace('+02:00', 'Z');
        let dateQuery = '?start_date=' + startDate + '&end_date=' + endDate;
        axios.get('https://www.toggl.com/api/v8/time_entries', {
            params: {
              start_date: startDate,
              end_date: endDate
            }
          })
          .then(function (entries) {
            entries.data.reverse();
            entries.data.forEach(function (log, index) {
              if ((typeof log.pid !== 'undefined')) {
                axios.get('https://www.toggl.com/api/v8/projects/' + log.pid)
                  .then(function (issue) {
                    let logObject = log;
                    logObject.isSynced = false;
                    logObject.issue = issue.data.data.name;
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
                });
              } else {
                let logObject = log;
                logObject.isSynced = false;
                logObject.issue = 'NO ID';
                logObject.checked = '';
                _self.logs.push(logObject);
              }
            });
          })
          .catch(function (error) {
            if (typeof(error.response) !== 'undefined' && error.response.status === 403) {
              _self.errorMessage = 'Please login to Toggl';
            } else {
              _self.errorMessage = typeof(error.response) !== 'undefined' ? error.response.statusText : error.response;
            }
          });
      }
    }
  }
</script>

<style>
  .container {
    position: relative;
    background: #fff;
    overflow: hidden;
    width: 700px;
    height: 600px;
  }
  .md-layout-item { position: relative; }
  .inner-container { padding: 20px; }
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