import axios from 'axios';

const API_URL = 'http://localhost:3000/skills';

export const getSkills = () => axios.get(API_URL);
