import { api } from '@/lib/utils';

export interface JobCreateData {
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  files?: File[];
}

export const jobService = {
  createJob: async (data: JobCreateData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('budget', data.budget.toString());
    formData.append('deadline', data.deadline.toISOString());
    
    if (data.files) {
      data.files.forEach(file => {
        formData.append('files', file);
      });
    }
    
    return api.uploadForm('/jobs', formData);
  },

  getAllJobs: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/jobs${query}`);
  },

  getJobById: async (jobId: string) => {
    return api.get(`/jobs/${jobId}`);
  },

  applyForJob: async (jobId: string, message: string) => {
    return api.post(`/jobs/${jobId}/apply`, { message });
  },

  getJobApplications: async (jobId: string) => {
    return api.get(`/jobs/${jobId}/applications`);
  },

  assignEditor: async (jobId: string, editorId: string) => {
    return api.put(`/jobs/${jobId}/assign`, { editorId });
  }
};