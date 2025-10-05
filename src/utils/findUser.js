import { childrenAPI } from '../services/api';

export const getChildByChildId = async (childId) => {
  try {
    const response = await childrenAPI.getById(childId);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error searching child:', error);
    
    // If child not found (404), return null instead of throwing
    if (error.response?.status === 404) {
      return null;
    }
    
    throw error;
  }
};
