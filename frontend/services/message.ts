import { api } from '@/lib/utils';

export interface MessageData {
  jobId: string;
  content: string;
  file?: File;
}

export const messageService = {
  getMessages: async (jobId: string) => {
    return api.get(`/messages/${jobId}`);
  },

  sendMessage: async (data: MessageData) => {
    if (data.file) {
      const formData = new FormData();
      formData.append('jobId', data.jobId);
      formData.append('content', data.content);
      formData.append('file', data.file);
      
      return api.uploadForm('/messages', formData);
    }
    
    return api.post('/messages', data);
  }
};