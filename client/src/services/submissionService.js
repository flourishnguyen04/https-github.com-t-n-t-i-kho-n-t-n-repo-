import api from "./api";

export const evaluateWriting = async (payload) => {
  const { data } = await api.post("/ai/evaluate-writing", payload);
  return data;
};

export const evaluateSentence = async (payload) => {
  const { data } = await api.post("/ai/evaluate-sentence", payload);
  return data;
};

export const sendWritingChatMessage = async (payload) => {
  const { data } = await api.post("/ai/writing-chat", payload);
  return data;
};

export const getMySubmissions = async () => {
  const { data } = await api.get("/submissions/me");
  return data;
};

export const getSubmission = async (submissionId) => {
  const { data } = await api.get(`/submissions/${submissionId}`);
  return data;
};

export const createSubmission = async (payload) => {
  const { data } = await api.post("/submissions", payload);
  return data;
};
