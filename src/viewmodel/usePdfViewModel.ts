import React, {useState} from 'react';
import {useAuth} from '@context/Authcontext';
import {usePdf} from '@context/ResumeContext';
import resumeCall from '@services/profile/Resume';
import {useFocusEffect} from '@react-navigation/native';
import {Buffer} from 'buffer';

export const usePdfViewModel = () => {
  const {pdfUri, setPdfUri} = usePdf();
  const {userId} = useAuth();
  const [error, setError] = useState<string | null>(null);

  const fetchPdf = async () => {
    try {
      if (!userId) throw new Error('User ID is null');

      console.log('🔍 usePdfViewModel: Fetching PDF for userId:', userId);
      const response = await resumeCall(userId);

      console.log('📥 usePdfViewModel: Received response:', {
        hasResponse: !!response,
        status: response?.status,
        statusText: response?.statusText,
        dataSize: response?.data ? `${(response.data.byteLength / 1024).toFixed(2)} KB` : 'no data',
      });

      if (!response || response.status !== 200) {
        console.warn('⚠️ usePdfViewModel: Invalid response status:', response?.status);
        throw new Error('Failed to fetch PDF');
      }

      const arrayBuffer = response.data; // Axios already returns ArrayBuffer
      console.log('📄 usePdfViewModel: Converting ArrayBuffer to base64...');
      const base64Pdf = arrayBufferToBase64(arrayBuffer);
      console.log('✅ usePdfViewModel: Base64 conversion complete, length:', base64Pdf.length);
      setPdfUri(`data:application/pdf;base64,${base64Pdf}`);
    } catch (error) {
      console.error('❌ usePdfViewModel: Error fetching PDF:', {
        error,
        message: error instanceof Error ? error.message : String(error),
      });
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (userId) fetchPdf();
    }, [userId]),
  );

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    return Buffer.from(new Uint8Array(buffer)).toString('base64');
  };
  return {pdfUri, error, fetchPdf};
};
