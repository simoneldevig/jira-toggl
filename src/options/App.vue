<template>
  <div class="container">
    <div class="md-layout">
      <div class="md-layout-item">
        <md-toolbar md-elevation="0">
          <div class="md-layout md-alignment-center-left">
            <img src="/icons/jira-toggl_48.png" alt="Avatar">
            <h3 class="md-title">Jira Toggl Settings</h3>
          </div>
        </md-toolbar>
      </div>
    </div>
    <div class="inner-container">
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-100">
          <md-field>
            <label>Jira Server url (https://jira.atlassian.net)</label>
            <md-input v-model="jiraUrl" />
          </md-field>
          <md-field>
            <label>Jira email</label>
            <md-input v-model="jiraEmail" />
          </md-field>
          <h3>Options</h3>
          <md-checkbox v-model="jiraMerge">Merge time entries with same comment</md-checkbox>
          <!-- <md-checkbox v-model="allowNumbersInId">Allow numbers in Project ID</md-checkbox> -->
          <md-checkbox v-model="jiraIssueInDescription">Parse Jira issue from description</md-checkbox>
          <md-checkbox v-model="worklogWihtoutDescription">Don't include Issue ID in worklog</md-checkbox><br>
          <md-checkbox v-model="worklogDescriptionSplit">Split worklog description from first occurrence of:</md-checkbox>
          <input v-model="stringSplit" placeholder="Searched string to split" style="contain: content;">
          <md-field>
            <label>Toggl API token</label>
            <md-input v-model="togglApiToken" />
          </md-field>
          <div class="button__container">
            <md-button class="md-raised md-accent button__item" @click="saveSettings">
              <span v-show="!isSaving">Save settings</span>
              <span v-show="isSaving">Saving...</span>
            </md-button>
          </div>
          <br>
          <h3>Extra Options</h3>
          <md-checkbox v-model="saveDates">Save dates (Persistent start and end dates)</md-checkbox><br>
          <md-checkbox v-model="clockworkEnabled">Button to Jira Plugin (Usually Clockwork Free)</md-checkbox>
          <md-field>
            <label>URL Jira Plugin</label>
            <md-input v-model="jiraPlugin" />
          </md-field>
          <!-- <br><label>Start weekday:</label>
          <b-form-select v-model="weekday" :options="weekdays"></b-form-select>
          <select v-model="weekday">
            <option v-for="option in weekdays" :value="option.text">
              {{ option.text }}
            </option>
          </select> -->
          <md-snackbar :md-active.sync="showSnackbar" md-persistent>
            <span>Your settings have now been saved ✌️</span>
          </md-snackbar>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'App',
  data () {
    return {
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
      jiraPlugin: '{jiraUrl}/plugins/servlet/ac/clockwork-free-cloud/clockwork-mywork#!reportName=Toggle2Jira&scope%5BstartingAt%5D={startDate}&scope%5BendingAt%5D={endDate}&selectedBreakdowns%5B%5D=projects&selectedBreakdowns%5B%5D=issues&period=PERIOD_DAY',
      weekday: 0,
      saveDates: false,
      weekdays: [
        { value: 0, text: 'Sunday' },
        { value: 1, text: 'Monday' },
        { value: 6, text: 'Saturday' }
      ]
    };
  },
  created () {
    const _self = this;

    browser.storage.sync.get({
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
      jiraPlugin: '{jiraUrl}/plugins/servlet/ac/clockwork-free-cloud/clockwork-mywork#!reportName=Toggle2Jira&scope%5BstartingAt%5D={startDate}&scope%5BendingAt%5D={endDate}&selectedBreakdowns%5B%5D=projects&selectedBreakdowns%5B%5D=issues&period=PERIOD_DAY',
      weekday: 0,
      saveDates: false
    }).then((setting) => {
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
      _self.weekday = setting.weekday;
      _self.saveDates = setting.saveDates;
    });
  },
  methods: {
    saveSettings () {
      const _self = this;

      _self.isSaving = true;
      browser.storage.sync.set({
        jiraUrl: _self.jiraUrl,
        jiraEmail: _self.jiraEmail,
        jiraMerge: _self.jiraMerge,
        jiraIssueInDescription: _self.jiraIssueInDescription,
        worklogWihtoutDescription: _self.worklogWihtoutDescription,
        worklogDescriptionSplit: _self.worklogDescriptionSplit,
        allowNumbersInId: _self.allowNumbersInId,
        clockworkEnabled: _self.clockworkEnabled,
        stringSplit: _self.stringSplit,
        togglApiToken: _self.togglApiToken,
        jiraPlugin: _self.jiraPlugin,
        weekday: _self.weekday,
        saveDates: _self.saveDates
      }).then(() => {
        _self.isSaving = false;
        _self.showSnackbar = true;
      });
    }
  }
};
</script>

<style scoped>
  .inner-container {
    padding: 20px;
  }

  .button__container {
    display: flex;
    justify-content: flex-end;
  }

  .button__item {
    background: var(--md-theme-default-accent) !important;
    background-color: var(--md-theme-default-accent)!important;
  }

  img { width: 32px; }
</style>
