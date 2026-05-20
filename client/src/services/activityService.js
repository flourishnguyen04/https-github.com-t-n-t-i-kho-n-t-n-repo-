import api from "./api";

export const getMiniTopicActivities = async (miniTopicId) => {
  const { data } = await api.get(`/mini-topics/${miniTopicId}/activities`);
  return data;
};

export const submitActivity = async (activityId, answers, evaluatedResults = {}) => {
  const { data } = await api.post(`/activities/${activityId}/submit`, { answers, evaluatedResults });
  return data;
};
