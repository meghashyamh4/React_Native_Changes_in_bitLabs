import {API_BASE_URL} from '@env';
import axios, {AxiosResponse} from 'axios';
import apiClient from '@services/login/ApiClient';

const resumeCall = async (id: number | null): Promise<AxiosResponse | null> => {
  if (!id) return null;

  try {
    console.log('📄 Fetching PDF for userId:', id);
    const result = await apiClient.get(`/applicant-pdf/getresume/${id}`, {
      responseType: 'arraybuffer', // Ensures binary data handling
    });
    
    console.log('✅ PDF API Response:', {
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
      dataSize: result.data ? `${(result.data.byteLength / 1024).toFixed(2)} KB` : 'No data',
      url: result.config.url,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error fetching resume PDF:', {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    return null;
  }
};

export default resumeCall;
