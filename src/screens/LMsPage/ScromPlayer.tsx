import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';

const ScormPlayer = () => {
  const route = useRoute();
  const [isInteracted, setIsInteracted] = React.useState(false);
  const webViewRef = useRef<WebView>(null);
  const { url } = route.params as { url: string };

  const injectedJS = `
    (function() {
      var scormData = {};
      var isInitialized = false;
      var hasUserInteracted = false;
      window.parent = window;
      window.top = window;
      
      // User interaction tracking
      document.addEventListener('click', function() {
        hasUserInteracted = true;
        console.log('User interaction detected');
      }, { once: false });
      
      document.addEventListener('touchstart', function() {
        hasUserInteracted = true;
        console.log('Touch interaction detected');
      }, { once: false });
      
      // Simple audio enable function
      function enableAudio() {
        console.log('Enabling audio playback');
        var audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(function(element) {
          element.muted = false;
          element.volume = 1.0;
          element.play().then(function() {
            console.log('Audio playing successfully:', element.src);
          }).catch(function(error) {
            console.log('Audio play failed:', error);
          });
        });
      }
      
      // Auto-unmute and play after user interaction
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          var audioElements = document.querySelectorAll('audio, video');
          audioElements.forEach(function(element) {
            element.muted = false;
            element.volume = 1.0;
            console.log('Audio element found and unmuted:', element.src || element);
          });
          
          if (hasUserInteracted) {
            enableAudio();
          } else {
            console.log('Waiting for user interaction to enable audio');
            // Enable audio on first interaction
            var enableAudioOnce = function() {
              hasUserInteracted = true;
              enableAudio();
              document.removeEventListener('click', enableAudioOnce);
              document.removeEventListener('touchstart', enableAudioOnce);
            };
            document.addEventListener('click', enableAudioOnce, { once: true });
            document.addEventListener('touchstart', enableAudioOnce, { once: true });
          }
        }, 2000);
      });
      
      // Enhanced SCORM API implementation
      window.API = {
        LMSInitialize: function() {
          isInitialized = true;
          console.log('SCORM API Initialized');
          return "true";
        },

        LMSSetValue: function(key, value) {
          if (!isInitialized) return "false";
          
          scormData[key] = value;
          console.log('SCORM SetValue:', key, value);
          
          // Send data to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'setValue', key, value })
            );
          }
          
          return "true";
        },

        LMSGetValue: function(key) {
          if (!isInitialized) return "";
          const value = scormData[key] || "";
          console.log('SCORM GetValue:', key, value);
          return value;
        },

        LMSCommit: function() {
          if (!isInitialized) return "false";
          console.log('SCORM Commit');
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'commit', data: scormData })
            );
          }
          
          return "true";
        },

        LMSFinish: function() {
          if (!isInitialized) return "false";
          console.log('SCORM Finish');
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'finish', data: scormData })
            );
          }
          
          return "true";
        },

        LMSGetLastError: function() {
          return isInitialized ? "0" : "101"; // 101 = Not initialized
        },

        LMSGetDiagnostic: function(errorCode) {
          return errorCode === "101" ? "API not initialized" : "No error";
        }
      };

      // Also provide API_1484_11 for older SCORM versions
      window.API_1484_11 = window.API;
      
      console.log('SCORM API injected successfully');
    })();
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('SCORM Message:', data);
      
      // Handle different types of SCORM messages
      switch (data.type) {
        case 'setValue':
          console.log('SCORM Data Set:', data.key, data.value);
          break;
        case 'commit':
          console.log('SCORM Data Committed:', data.data);
          break;
        case 'finish':
          console.log('SCORM Session Finished:', data.data);
          break;
        default:
          console.log('SCORM Unknown Message:', data);
      }
    } catch (error) {
      console.error('SCORM Message Error:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{
          uri: url || 'https://your-aws-url/index.html'
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode={'compatibility'}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsAirPlayForMediaPlayback={true}
        allowsPictureInPictureMediaPlayback={true}
        startInLoadingState={true}
        userAgent={'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        onMessage={handleMessage}
        onTouchStart={() => {
          setIsInteracted(true);
          console.log('WebView touched');
        }}
        onLoad={() => {
          console.log('SCORM Loaded - triggering audio enable');
          // Try to enable audio after load
          setTimeout(() => {
            const script = `
              var audioElements = document.querySelectorAll('audio, video');
              audioElements.forEach(function(element) {
                element.muted = false;
                element.volume = 1.0;
                console.log('Post-load audio enable:', element.src || element);
                element.play().then(function() {
                  console.log('Post-load audio playing:', element.src || element);
                }).catch(function(error) {
                  console.log('Post-load audio failed:', error);
                });
              });
            `;
            webViewRef.current?.injectJavaScript(script);
          }, 3000);
        }}
        onLoadStart={() => console.log('SCORM Loading started')}
        onError={(error) => console.error('SCORM WebView Error:', error)}
        onHttpError={(error) => console.error('SCORM HTTP Error:', error)}
      />
    </View>
  );
};

export default ScormPlayer;