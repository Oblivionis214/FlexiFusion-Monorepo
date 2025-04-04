import {
  bigintStringify,
  getAndParseUserPositions,
  LS_USER_POSITION_KEY,
  getAndParseFarmsList,
  LS_FARMS_LIST_KEY,
  getAndParsePoolsList,
  LS_POOLS_LIST_KEY,
  getAndParsePoolFarmsList,
  LS_POOL_FARMS_LIST_KEY,
  getAndParseBentoBoxData,
  LS_BENTOBOX_DATA_KEY,
  getAndParseSpellStakeData,
  LS_SPELL_STAKE_KEY,
  getAndParseMagicGlpStakeData,
  LS_MAGIC_GLP_STAKE_KEY,
  LS_MAGIC_GLP_STAKE_CHART_KEY,
  getAndParseMagicApeStakeData,
  LS_MAGIC_APE_STAKE_KEY,
  LS_MAGIC_APE_STAKE_CHART_KEY,
  getAndParsePoolCreationCustomTokens,
  LS_POOL_CREATION_CUSTOM_TOKENS_KEY,
  getAndParseBSpellData,
  LS_BSPELL_DATA,
} from "@/helpers/dataStore";

export default {
  state: {
    userPositions: getAndParseUserPositions(),
    farmList: getAndParseFarmsList(),
    poolsList: getAndParsePoolsList(),
    poolFarmsList: getAndParsePoolFarmsList(),
    bentoBoxData: getAndParseBentoBoxData(),
    userTotalAssets: {
      data: {},
      isCreated: false,
    },
    spellStakeData: getAndParseSpellStakeData(),
    magicGlpStakeData: getAndParseMagicGlpStakeData(),
    magicApeStakeData: getAndParseMagicApeStakeData(),
    poolCreationCustomTokens: getAndParsePoolCreationCustomTokens(),
    bSpellData: getAndParseBSpellData(),
  },

  mutations: {
    setUserPositions(state, payload) {
      state.userPositions.isCreated = true;
      state.userPositions.data = payload;
      localStorage.setItem(LS_USER_POSITION_KEY, bigintStringify(payload));
    },
    setFarmList(state, payload) {
      state.farmList.isCreated = true;
      state.farmList.data = payload;
      localStorage.setItem(LS_FARMS_LIST_KEY, bigintStringify(payload));
    },
    setPoolsList(state, payload) {
      state.poolsList.isCreated = true;
      state.poolsList.data = payload;
      localStorage.setItem(LS_POOLS_LIST_KEY, bigintStringify(payload));
    },
    setPoolFarmsList(state, payload) {
      state.poolFarmsList.isCreated = true;
      state.poolFarmsList.data = payload;
      localStorage.setItem(LS_POOL_FARMS_LIST_KEY, bigintStringify(payload));
    },
    setBentoBoxData(state, payload) {
      state.bentoBoxData.isCreated = true;
      state.bentoBoxData.data = payload;
      localStorage.setItem(LS_BENTOBOX_DATA_KEY, bigintStringify(payload));
    },
    setUserTotalAssets(state, payload) {
      state.userTotalAssets.isCreated = true;
      state.userTotalAssets.data = payload;
    },
    setSpellStakeData(state, payload) {
      state.spellStakeData.isCreated = true;
      state.spellStakeData.data = payload;
      localStorage.setItem(LS_SPELL_STAKE_KEY, bigintStringify(payload));
    },
    setMagicGlpStakeData(state, payload) {
      state.magicGlpStakeData.isCreated = true;
      state.magicGlpStakeData.data = payload;
      localStorage.setItem(LS_MAGIC_GLP_STAKE_KEY, bigintStringify(payload));
    },
    setMagicGlpChartData(state, payload) {
      state.magicGlpStakeData.chartData = payload;
      localStorage.setItem(
        LS_MAGIC_GLP_STAKE_CHART_KEY,
        bigintStringify(payload)
      );
    },
    setMagicApeStakeData(state, payload) {
      state.magicApeStakeData.isCreated = true;
      state.magicApeStakeData.data = payload;
      localStorage.setItem(LS_MAGIC_APE_STAKE_KEY, bigintStringify(payload));
    },
    setMagicApeChartData(state, payload) {
      state.magicApeStakeData.chartData = payload;
      localStorage.setItem(
        LS_MAGIC_APE_STAKE_CHART_KEY,
        bigintStringify(payload)
      );
    },
    setPoolCreationCustomTokensData(state, payload) {
      state.poolCreationCustomTokens.data = payload;
      localStorage.setItem(
        LS_POOL_CREATION_CUSTOM_TOKENS_KEY,
        JSON.stringify(payload)
      );
    },
    setBSpellStakeData(state, payload) {
      state.bSpellData.isCreated = true;
      state.bSpellData.data = payload;
      localStorage.setItem(LS_BSPELL_DATA, bigintStringify(payload));
    },
  },

  getters: {
    getUserPositions: (state) => state.userPositions,
    getFarmList: (state) => state.farmList,
    getPoolsList: (state) => state.poolsList,
    getPoolFarmsList: (state) => state.poolFarmsList,
    getBentoBoxData: (state) => state.bentoBoxData,
    getUserTotalAssets: (state) => state.userTotalAssets,
    getSpellStakeData: (state) => state.spellStakeData,
    getMagicGlpStakeData: (state) => state.magicGlpStakeData,
    getMagicApeStakeData: (state) => state.magicApeStakeData,
    getPoolCreationCustomTokens: (state) => state.poolCreationCustomTokens,
    getBSpellData: (state) => state.bSpellData,
  },
};
