import { createStore } from "vuex";

import connectProvider from "@/store/modules/connectProvider";
import networks from "@/store/modules/networks";
import notifications from "@/store/modules/notifications";
import popups from "@/store/modules/popups";
import pools from "@/store/modules/pools";
// import stake from "@/store/modules/stake";
// import borrowPools from "@/store/modules/borrowPools";
// import farms from "@/store/modules/farms";
// import notifi from "@/store/modules/notifi";
// import data from "@/store/modules/data";

export default createStore({
  state: {
    routeData: [],
  },
  mutations: {
    updateRouteData(state, payload) {
      state.routeData = [...payload];
    },
  },
  getters: {
    getRouteData: (state) => state.routeData,
  },
  modules: {
    connectProvider,
    networks,
    notifications,
    popups,
    pools,
    // stake,
    // borrowPools,
    // farms,
    // notifi,
    // data,
  },
});
