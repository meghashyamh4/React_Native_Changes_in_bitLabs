import apiClient from './login/ApiClient';

export const FeedbackFormsService = {
    getAllForms: async (applicantId: number) => {
        try {
            const response = await apiClient.get(
                `api/feedbackforms/getallfeedbackforms`,
            );
            return { success: true, data: response.data };
        } catch (error: any) {
            console.error('Error fetching feedback forms:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch feedback forms',
            };
        }
    },

    getFormById: async (applicantId: number, formId: number) => {
        const url = `api/feedbackforms/getfeedbackFormById/${formId}`;
        console.log('FeedbackFormsService [getFormById] Calling API with:', { applicantId, formId, url });
        try {
            const response = await apiClient.get(url);
            console.log('FeedbackFormsService [getFormById] Success:', response.data);
            return { success: true, data: response.data };
        } catch (error: any) {
            console.log('Error fetching feedback form details:', error);
            console.log('Error fetching feedback form details:', error.response?.data?.message);
            console.error('Error fetching feedback form details:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch form details',
            };
        }
    },

    submitFeedback: async (
        applicantId: number,
        formId: number,
        answers: Array<{ questionKey: string; answer: any; questionNumber: number }>,
    ) => {
        try {
            const response = await apiClient.post(
                `api/feedbackform/${formId}/saveApplicantResponse/${applicantId}`,
                answers,
            );
            return { success: true, data: response.data };
        } catch (error: any) {
            console.error('Error submitting feedback:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to submit feedback',
            };
        }
    },
};
