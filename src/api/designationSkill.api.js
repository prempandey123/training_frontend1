import axios from 'axios';

const BASE_URL = 'http://localhost:3000/designation-skills';

/* MAP SKILL TO DESIGNATION */
export const mapSkillToDesignation = (data) => {
  return axios.post(BASE_URL, data);
};

/* GET SKILLS FOR A DESIGNATION */
export const getSkillsByDesignation = (designationId) => {
  return axios.get(`${BASE_URL}/designation/${designationId}`);
};

/* UPDATE REQUIRED LEVEL */
export const updateRequiredLevel = (id, data) => {
  return axios.put(`${BASE_URL}/${id}`, data);
};

/* REMOVE SKILL FROM DESIGNATION */
export const removeSkillFromDesignation = (id) => {
  return axios.delete(`${BASE_URL}/${id}`);
};
