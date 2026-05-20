import api from "./api";

export const getMyProgress = async () => {
  const { data } = await api.get("/progress/me");
  return data;
};

export const completeActivity = async (payload) => {
  const { data } = await api.post("/progress/complete-activity", payload);
  return data;
};

export const completeMiniTopic = async (payload) => {
  const { data } = await api.post("/progress/complete-mini-topic", payload);
  return data;
};
