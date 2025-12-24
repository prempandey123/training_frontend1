import api from './api';
const BASE_URL = '/designation-skills';
/* MAP SKILL TO DESIGNATION */
export const mapSkillToDesignation = (data) => {
  return api.post(BASE_URL, data);
};

/* GET SKILLS FOR A DESIGNATION */
export const getSkillsByDesignation = (designationId) => {
  return api.get(`${BASE_URL}/designation/${designationId}`);
};

/* UPDATE REQUIRED LEVEL */
export const updateRequiredLevel = (id, data) => {
  return api.put(`${BASE_URL}/${id}`, data);
};

/* REMOVE SKILL FROM DESIGNATION */
export const removeSkillFromDesignation = (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};
