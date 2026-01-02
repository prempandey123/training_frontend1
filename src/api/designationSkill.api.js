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

/* REMOVE SKILL FROM DESIGNATION */
export const removeSkillFromDesignation = (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};
