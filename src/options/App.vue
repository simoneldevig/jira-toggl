<template>
  <div class="container">
    <div class="md-layout">
      <div class="md-layout-item">
        <md-toolbar md-elevation="0">
          <div class="md-layout md-alignment-center-left">
            <img src="/icons/jira-toggl_48.png" alt="Avatar">
            <h3 class="md-title">Jira Toggl settings</h3>
          </div>
        </md-toolbar>
      </div>
    </div>
    <div class="inner-container">
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-50">
          <md-field>
            <label>Jira Server url (https://jira.atlassian.net)</label>
            <md-input v-model="jiraUrl" />
          </md-field>
          <md-field>
            <label>Jira email</label>
            <md-input v-model="jiraEmail" />
          </md-field>
          <md-checkbox v-model="jiraMerge">Merge time entries with same comment</md-checkbox>
          <md-field>
            <label>Toggl API token</label>
            <md-input v-model="togglApiToken" />
          </md-field>
          <div class="button__container">
            <md-button class="md-raised md-accent" @click="saveSettings">
              <span v-show="!isSaving">Save settings</span>
              <span v-show="isSaving">Saving...</span>
            </md-button>
          </div>
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
      togglApiToken: '',
      isSaving: false,
      showSnackbar: false
    };
  },
  created () {
    const _self = this;

    chrome.storage.sync.get({
      jiraUrl: '',
      jiraEmail: '',
      jiraMerge: true,
      togglApiToken: ''
    }, function (setting) {
      _self.jiraUrl = setting.jiraUrl;
      _self.jiraEmail = setting.jiraEmail;
      _self.jiraMerge = setting.jiraMerge;
      _self.togglApiToken = setting.togglApiToken;
    });
  },
  methods: {
    saveSettings () {
      const _self = this;

      _self.isSaving = true;
      chrome.storage.sync.set({
        jiraUrl: _self.jiraUrl,
        jiraEmail: _self.jiraEmail,
        jiraMerge: _self.jiraMerge,
        togglApiToken: _self.togglApiToken
      }, function () {
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

  img { width: 32px; }
</style>
