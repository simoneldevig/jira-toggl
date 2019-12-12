import Vue from 'vue';
import App from './App';
import Moment from 'moment';
import { MdDatepicker, MdButton, MdDialog, MdContent, MdCheckbox, MdIcon, MdToolbar, MdTable, MdSnackbar } from 'vue-material/dist/components';

Vue.use(MdDatepicker);
Vue.use(MdButton);
Vue.use(MdCheckbox);
Vue.use(MdIcon);
Vue.use(MdToolbar);
Vue.use(MdTable);
Vue.use(MdSnackbar);
Vue.use(MdContent);
Vue.use(MdDialog);

Vue.prototype.$moment = Moment;

global.browser = require('webextension-polyfill');
Vue.prototype.$browser = global.browser;

/* eslint-disable no-new */
let popup = new Vue({
  el: '#app',

  render: h => h(App)
});
