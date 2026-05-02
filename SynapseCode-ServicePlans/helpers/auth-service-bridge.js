import axios from 'axios';
import config from '../configs/config.js';

export const getUserFromAuthService = async (userId, token) => {
  try {
    const response = await axios.get(`${config.auth_service.url}/api/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-token': token,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching user from auth service:', error.message);
    throw error;
  }
};

export const updateUserPlan = async (userId, planName, token) => {
  try {
    const response = await axios.put(
      `${config.auth_service.url}/api/v1/users/${userId}/plan`,
      { planName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-token': token,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating user plan:', error.message);
    throw error;
  }
};

export const updateUserRole = async (userId, role, token) => {
  try {
    const response = await axios.put(
      `${config.auth_service.url}/api/v1/users/${userId}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-token': token,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error.message);
    throw error;
  }
};

export default {
  getUserFromAuthService,
  updateUserPlan,
  updateUserRole,
};
