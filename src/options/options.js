import Vue from 'vue';
import App from './App';
import { MdButton, MdCheckbox, MdField, MdToolbar, MdSnackbar } from 'vue-material/dist/components';

Vue.use(MdField);
Vue.use(MdButton);
Vue.use(MdCheckbox);
Vue.use(MdToolbar);
Vue.use(MdSnackbar);

global.browser = require('webextension-polyfill');

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App)
});
