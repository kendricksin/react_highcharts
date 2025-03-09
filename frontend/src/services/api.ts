// src/services/api.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from './config';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: config.getConfig().apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add a request interceptor for logging
apiClient.interceptors.request.use(
  (axiosConfig) => {
    if (process.env.NODE_ENV === 'development' || config.getConfig().enableDebug) {
      console.log(`API Request: ${axiosConfig.method?.toUpperCase()} ${axiosConfig.url}`);
    }
    return axiosConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

// API methods
const api = {
  // Project data
  async getMonthlyData(year?: number): Promise<any> {
    const params: any = {};
    if (year) params.year = year;
    return apiClient.get('/api/data', { params });
  },

  async getCompanyProjects(limit: number = 20): Promise<any> {
    return apiClient.get('/api/company-projects', { params: { limit } });
  },

  // Search
  async searchCompanies(query: string): Promise<any> {
    return apiClient.get('/api/search-companies', { params: { query } });
  },

  async getCompanyProjectsByTin(tin: string): Promise<any> {
    return apiClient.get(`/api/company-projects/${tin}`);
  },

  async getAdjacentCompanies(tin: string): Promise<any> {
    return apiClient.get(`/api/adjacent-companies/${tin}`);
  },

  async getCompetitorProjects(companyTin: string, competitorTin: string): Promise<any> {
    return apiClient.get('/api/competitor-projects', {
      params: { company_tin: companyTin, competitor_tin: competitorTin }
    });
  },

  // Win rates
  async getHeadToHead(companyTin: string, topN: number = 5): Promise<any> {
    return apiClient.get('/api/head-to-head', {
      params: { company_tin: companyTin, top_n: topN }
    });
  },

  async getBidStrategy(companyTin: string): Promise<any> {
    return apiClient.get('/api/bid-strategy', {
      params: { company_tin: companyTin }
    });
  },

  // Add this to the api object in api.ts
  async analyzeCompanyBids(companyTins: string[]): Promise<any> {
    return apiClient.post('/api/company-bids-analysis', {
      company_tins: companyTins
    });
  },

  // Diagnostic
  async checkDbStatus(): Promise<any> {
    return apiClient.get('/api/db-status');
  },
};

export default api;