/*
 * @Description: 
 * @Date: 2025-03-18 01:34:11
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-30 17:57:04
 */
import store from "./store";
import App from "./App.vue";
import router from "./router";
import { ethers } from "ethers";
import { createApp } from "vue";
import connectWallet from "./plugins/walletConnect";
import clickOutside from "./directives/clickOutside";
import VueTippy from "vue-tippy";
import { useImage } from "./helpers/useImage";
import "@notifi-network/notifi-react-card/dist/index.css";

const app = createApp(App);

app.use(store);
app.use(router);
app.use(connectWallet);
app.directive("click-outside", clickOutside);
app.use(VueTippy, {
  directive: "tooltip",
  defaultProps: {
    placement: "auto",
    allowHTML: true,
    duration: 0,
  },
});
app.mount("#app");

app.config.globalProperties.$ethers = ethers;
app.config.globalProperties.$image = useImage;
