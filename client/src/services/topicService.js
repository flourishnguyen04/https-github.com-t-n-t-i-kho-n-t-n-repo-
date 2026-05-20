import api from "./api";

export const getTopics = async () => {
  const { data } = await api.get("/topics");
  return data;
};

export const getTopic = async (topicId) => {
  const { data } = await api.get(`/topics/${topicId}`);
  return data;
};

export const getMiniTopics = async (topicId) => {
  const { data } = await api.get(`/topics/${topicId}/mini-topics`);
  return data;
};
