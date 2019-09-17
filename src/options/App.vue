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
            <md-input v-model="jiraUrl"></md-input>
          </md-field>
          <md-field>
            <label>Jira username</label>
            <md-input v-model="jiraUsername"></md-input>
          </md-field>
          <md-checkbox v-model="jiraMerge">Merge time entries with same comment</md-checkbox>

          <div class="button__container">

          <md-button @click="saveSettings" class="md-raised md-accent">
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
    data() {
      return {
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
    },
    methods: {
      saveSettings() {
        const _self = this;

        _self.isSaving = true;
        chrome.storage.sync.set({
          jiraUrl: _self.jiraUrl,
          jiraUsername: _self.jiraUsername,
          jiraMerge: _self.jiraMerge
        }, function () {
          _self.isSaving = false;
          _self.showSnackbar = true;
        });
      }
    }
  }
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