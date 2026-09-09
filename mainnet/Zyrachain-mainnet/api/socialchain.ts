import axios from 'axios';

const BASE_URL_SOCIALCHAIN = 'https://api.zyrachain.org/';

const api = axios.create({
  baseURL: BASE_URL_SOCIALCHAIN,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const socialchain = {
  // 🔍 Get account details by ID
  getSupply: async () => {
    try {
      const response = await api.get(`/data/mainnet-supply`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account details:', error);
      return {
        "total_circulating_supply": 10600000000,
        "total_locked": 6170000000,
        "total_supply": 100000000000,
      }
    }
  },
};
