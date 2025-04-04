import { BigNumber } from "ethers";

export const LS_FARMS_LIST_KEY = "abracadabraFarmList";
export const LS_USER_POSITION_KEY = "abracadabraUserPositions";
export const LS_BENTOBOX_DATA_KEY = "abracadabraBentoBoxData";
export const LS_POOLS_LIST_KEY = "abracadabraPoolsList";
export const LS_POOL_FARMS_LIST_KEY = "abracadabraPoolFarmsList";
export const LS_SPELL_STAKE_KEY = "abracadabraSpellStakeData";
export const LS_MAGIC_GLP_STAKE_KEY = "abracadabraMagicGlpStakeData";
export const LS_MAGIC_GLP_STAKE_CHART_KEY = "abracadabraMagicGlpChartData";
export const LS_MAGIC_APE_STAKE_KEY = "abracadabraMagicApeStakeData";
export const LS_MAGIC_APE_STAKE_CHART_KEY = "abracadabraMagicApeChartData";
export const LS_POOL_CREATION_CUSTOM_TOKENS_KEY =
  "abracadabraPoolCreationCustomTokens";
export const LS_ELIXIR_RARE_KEY = "abracadabraElixirRate";
export const LS_BSPELL_DATA = "abracadabraBSpellData";

export const bigintStringify = (payload: any) =>
  JSON.stringify(payload, (key, value) =>
    typeof value === "bigint"
      ? { type: "bigint", value: value.toString() }
      : value
  );

export const jsonBigNumberTransform = (item: any) => {
  Object.keys(item).forEach((key) => {
    if (typeof item[key] === "object" && item[key] !== null) {
      if (item[key].type === "BigNumber") {
        item[key] = BigNumber.from(item[key]);
      } else {
        jsonBigNumberTransform(item[key]);
      }
    }
  });

  return item;
};

export const jsonBigIntTransform = (item: any) => {
  Object.keys(item).forEach((key) => {
    if (typeof item[key] === "object" && item[key] !== null) {
      if (item[key].type === "bigint") {
        item[key] = BigInt(item[key].value);
      } else {
        jsonBigIntTransform(item[key]);
      }
    }
  });

  return item;
};

export const getAndParseUserPositions = () => {
  const lsUserPositions = localStorage.getItem(LS_USER_POSITION_KEY);

  if (!lsUserPositions) {
    return { data: [], isCreated: false };
  }

  const userPositions = JSON.parse(lsUserPositions);
  const data = userPositions.map((item: any) => jsonBigNumberTransform(item));

  return { data, isCreated: true };
};

export const getAndParseFarmsList = () => {
  const lsFarmList = localStorage.getItem(LS_FARMS_LIST_KEY);

  if (!lsFarmList) {
    return { data: [], isCreated: false };
  }

  const farmList = JSON.parse(lsFarmList);
  const data = farmList.map((item: any) => jsonBigNumberTransform(item));

  return { data, isCreated: true };
};

export const getAndParsePoolsList = () => {
  try {
    const lsPoolsList = localStorage.getItem(LS_POOLS_LIST_KEY);

    if (!lsPoolsList) {
      return { data: [], isCreated: false };
    }

    const poolsList = JSON.parse(lsPoolsList);
    const data = poolsList.map((item: any) =>
      jsonBigIntTransform(jsonBigNumberTransform(item))
    );

    return { data, isCreated: true };
  } catch (error) {
    console.log("getAndParsePoolsList -> error", error);
    return { data: [], isCreated: false };
  }
};

export const getAndParsePoolFarmsList = () => {
  try {
    const lsPoolFarmsList = localStorage.getItem(LS_POOL_FARMS_LIST_KEY);

    if (!lsPoolFarmsList) {
      return { data: [], isCreated: false };
    }

    const poolFarmsList = JSON.parse(lsPoolFarmsList);
    const data = poolFarmsList.map((item: any) =>
      jsonBigIntTransform(jsonBigNumberTransform(item))
    );

    return { data, isCreated: true };
  } catch (error) {
    console.log("getAndParsePoolFarmsList -> error", error);
    return { data: [], isCreated: false };
  }
};

export const getAndParseBentoBoxData = () => {
  const lsBentoBoxData = localStorage.getItem(LS_BENTOBOX_DATA_KEY);

  if (!lsBentoBoxData) {
    return { data: [], isCreated: false };
  }

  const bentoBoxData = JSON.parse(lsBentoBoxData);

  const data = bentoBoxData.map((item: any) => jsonBigIntTransform(item));

  return { data, isCreated: true };
};

export const getAndParseSpellStakeData = () => {
  const lsSpellStakeData = localStorage.getItem(LS_SPELL_STAKE_KEY);

  if (!lsSpellStakeData) {
    return { data: [], isCreated: false };
  }

  const spellStakeData = JSON.parse(lsSpellStakeData);
  const data = spellStakeData.map((item: any) => jsonBigIntTransform(item));

  return { data, isCreated: true };
};

export const getAndParseMagicGlpStakeData = () => {
  const lsMagicGlpStakeData = localStorage.getItem(LS_MAGIC_GLP_STAKE_KEY);
  const lsMagicGlpChartData = localStorage.getItem(
    LS_MAGIC_GLP_STAKE_CHART_KEY
  );

  if (!lsMagicGlpStakeData) {
    return {
      data: [],
      isCreated: false,
      chartData: null,
    };
  }

  const magicGlpStakeData = JSON.parse(lsMagicGlpStakeData);
  const chartData = JSON.parse(lsMagicGlpChartData || "null");
  const data = magicGlpStakeData.map((item: any) => jsonBigIntTransform(item));

  return {
    data,
    chartData,
    isCreated: true,
  };
};

export const getAndParseMagicApeStakeData = () => {
  const lsMagicApeStakeData = localStorage.getItem(LS_MAGIC_APE_STAKE_KEY);
  const lsMagicApeChartData = localStorage.getItem(
    LS_MAGIC_APE_STAKE_CHART_KEY
  );

  if (!lsMagicApeStakeData) {
    return {
      data: [],
      isCreated: false,
      chartData: null,
    };
  }

  const magicGlpStakeData = JSON.parse(lsMagicApeStakeData);
  const chartData = JSON.parse(lsMagicApeChartData || "null");
  const data = magicGlpStakeData.map((item: any) => jsonBigIntTransform(item));

  return {
    data,
    chartData,
    isCreated: true,
  };
};

export const getAndParsePoolCreationCustomTokens = () => {
  const storedItem = localStorage.getItem(LS_POOL_CREATION_CUSTOM_TOKENS_KEY);
  return storedItem
    ? { data: JSON.parse(storedItem), isCreated: true }
    : { data: [], isCreated: false };
};

export const getAndParseBSpellData = () => {
  const lsBSpellData = localStorage.getItem(LS_BSPELL_DATA);

  if (!lsBSpellData) {
    return { data: [], isCreated: false };
  }

  const bSpellData = JSON.parse(lsBSpellData);

  const data = bSpellData.map((item: any) => jsonBigIntTransform(item));

  return {
    data,
    isCreated: true,
  };
};
