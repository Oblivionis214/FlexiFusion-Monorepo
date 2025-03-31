/*
 * @Description: 
 * @Date: 2025-03-30 18:43:18
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-30 19:51:40
 */
export default {
  state: {
    poolsList: {
      isCreated: false,
      data: []
    }
  },
  mutations: {
    setPoolsList(state, payload) {
      state.poolsList = {
        isCreated: true,
        data: payload
      };
    }
  },
  getters: {
    getPoolsList: state => state.poolsList
  }
}; 