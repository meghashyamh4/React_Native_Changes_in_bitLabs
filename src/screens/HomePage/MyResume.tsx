import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@context/Authcontext';
import { requestStoragePermission } from './permissions';
import { showToast } from '@services/login/ToastService';
import RNFS from 'react-native-fs';
import { usePdf } from '../../context/ResumeContext';
import PDFExam from '../../components/progessBar/Resume';
import AntDesign from 'react-native-vector-icons/AntDesign';

const { height } = Dimensions.get('window');
const PDFExample = () => {
  const userid = useAuth();
  const { pdfUri, refreshPdf } = usePdf();
  useEffect(() => {
    if (userid.userId) {
      refreshPdf(); // Fetch PDF when component mounts
    }
  }, [userid.userId]);

  const downloadFile = async () => {
    if (!pdfUri) {
      showToast('error', 'No PDF available to download.');
      return;
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      showToast('error', 'Allow storage permission to download.');
      return;
    }

    const fileName = `Resume_${new Date().getTime()}.pdf`;
    const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    try {
      await RNFS.writeFile(
        downloadPath,
        pdfUri.replace('data:application/pdf;base64,', ''),
        'base64',
      );
      showToast('success', `File saved successfully!`);
    } catch (error) {
      console.error('Download Error:', error);
      showToast('error', 'Failed to save PDF file.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Resume</Text>
      </View>
      <View style={styles.container}>
        <View style={styles.pdf}>
          <PDFExam />

          <View>
            {pdfUri && (
              <TouchableOpacity onPress={downloadFile} style={styles.downloadButton}>
                {/* <Image source={require('../../assests/Images/download.png')} style={styles.downloadIcon} /> */}
                <AntDesign name="download" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
    padding: 10,
  },
  banner: {
    position: 'relative',
  },
  header: {
    marginBottom: 10,
  },
  headerText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: 'grey',
    textAlign: 'left',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    marginTop: 10,
    flex: 1,
    width: '100%',
    height: Dimensions.get('window').height,
  },
  gradientContainer: {
    width: '98%',
    height: height * 0.21,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flexDirection: 'column',
    width: 200,
    justifyContent: 'center',
    marginLeft: 20,
  },
  resumeText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  button: {
    backgroundColor: '#fff',
    width: 93,
    height: 28,
    flexShrink: 0,
    justifyContent: 'center',
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 12,
    color: '#F97517',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  headerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#FFF',
  },
  headerImage: {
    width: 20, // Adjust size as needed
    height: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#495057',
    lineHeight: 25,
    marginLeft: 15,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 10, // Adjust as needed
    right: 10, // Adjust as needed
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 50,
    marginRight: 1,
  },
  downloadIcon: {
    width: 30,
    height: 30,
  },
});

export default PDFExample;
