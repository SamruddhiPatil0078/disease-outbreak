import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import Header from '../components/Header';
import * as DocumentPicker from 'expo-document-picker';
import { CONFIG } from '../config/config';
import { OutbreakContext } from '../context/OutbreakContext';

const { width } = Dimensions.get('window');

const UploadScreen = () => {
  const { refreshData } = useContext(OutbreakContext);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the upload zone
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Helper: send upload via fetch with timeout (handles Render cold starts)
  const sendUpload = async (formData, timeoutMs = 120000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
  };

  const handleUpload = async () => {
    try {
      setError(null);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      
      // Check if we are on Web or Mobile
      if (typeof window !== 'undefined' && window.document) {
        // WEB: Fetch the blob from the uri and append as a real file
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name);
      } else {
        // MOBILE: Use the React Native bridge object structure
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'text/csv',
        });
      }

      setProgress(30); // Show progress while uploading

      // Auto-retry: if first attempt fails (cold start), retry once
      let uploadResult;
      try {
        uploadResult = await sendUpload(formData);
      } catch (firstErr) {
        console.log('⏳ First upload attempt failed, retrying...', firstErr.message);
        setProgress(10);
        // Wait 3 seconds for server to finish waking up
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Rebuild FormData for retry (previous one may be consumed)
        const retryFormData = new FormData();
        if (typeof window !== 'undefined' && window.document) {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          retryFormData.append('file', blob, file.name);
        } else {
          retryFormData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'text/csv',
          });
        }
        setProgress(30);
        uploadResult = await sendUpload(retryFormData);
      }

      setProgress(80);

      if (uploadResult.success) {
        setProgress(100);

        // Wait 2 seconds for data to fully commit before refreshing dashboard
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Trigger system-wide refresh (this fetches risk data from the ML engine)
        refreshData();

        setIsUploading(false);
        setUploadComplete(true);
        setTimeout(() => {
          setUploadComplete(false);
          setProgress(0);
        }, 4000);
      } else {
        setIsUploading(false);
        setError(uploadResult.error || 'Upload failed');
      }

    } catch (err) {
      console.error('Upload Error:', err);
      setIsUploading(false);
      if (err.name === 'AbortError') {
        setError('Server is starting up. Please wait a moment and try again.');
      } else {
        setError('Upload failed. Please check your connection and try again.');
      }
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#0B1120', '#121A2F', '#0B1120']} style={styles.gradient}>
        <Header />
        
        <View style={styles.content}>
          <Text style={styles.title}>Upload Dataset</Text>
          <Text style={styles.subtitle}>Upload CSV files containing region weather and case data to update predictions.</Text>

          {!uploadComplete ? (
            <Animated.View style={[styles.uploadBox, { transform: [{ scale: pulseAnim }], ...(isUploading ? SHADOWS.glowSm(COLORS.primary) : {}) }]}>
              <LinearGradient
                colors={['rgba(0,212,255,0.05)', 'rgba(0,212,255,0.01)']}
                style={styles.uploadInner}
              >
                {!isUploading ? (
                  <>
                    <Ionicons name="cloud-upload-outline" size={60} color={COLORS.primary} style={styles.uploadIcon} />
                    <Text style={styles.uploadMainText}>Tap to Select File</Text>
                    <Text style={styles.uploadSubText}>Supports .csv, .xlsx (Max 50MB)</Text>
                    
                    <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
                      <Text style={styles.uploadBtnText}>Browse Files</Text>
                    </TouchableOpacity>

                    {error && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={COLORS.high} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.progressContainer}>
                     <Ionicons name="sync" size={40} color={COLORS.primary} />
                     <Text style={styles.uploadingText}>Uploading... {Math.round(progress)}%</Text>
                     <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.primaryDark]}
                          style={[styles.progressBarFill, { width: `${progress}%` }]}
                        />
                     </View>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          ) : (
            <View style={styles.successBox}>
               <View style={styles.successIconWrap}>
                 <Ionicons name="checkmark-circle" size={80} color={COLORS.low} />
               </View>
               <Text style={styles.successTitle}>Upload Complete!</Text>
               <Text style={styles.successSub}>Data has been sent to the AI engine for processing. Predictions will be updated shortly.</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: SIZES.padding,
    flex: 1,
    justifyContent: 'center'
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.xl,
    ...FONTS.bold,
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.sm,
    ...FONTS.regular,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: 'dashed', // React Native only allows dashed/dotted on direct borders
    borderStyle: 'dashed',
    borderColor: 'rgba(0,212,255,0.3)',
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    height: 300,
    marginHorizontal: 10,
    backgroundColor: COLORS.bgCard
  },
  uploadInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  uploadIcon: {
    marginBottom: 16
  },
  uploadMainText: {
    color: COLORS.textPrimary,
    fontSize: SIZES.lg,
    ...FONTS.bold,
    marginBottom: 8
  },
  uploadSubText: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
    ...FONTS.medium,
    marginBottom: 24
  },
  uploadBtn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.primarySoft
  },
  uploadBtnText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    ...FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  uploadingText: {
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 12,
    fontSize: SIZES.md,
    ...FONTS.bold
  },
  progressBarBg: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  successBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 200, 83, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 83, 0.2)',
    borderRadius: SIZES.radiusLg,
    marginHorizontal: 10,
    ...SHADOWS.glowSm(COLORS.low)
  },
  successIconWrap: {
    marginBottom: 16,
  },
  successTitle: {
    color: COLORS.low,
    fontSize: SIZES.xl,
    ...FONTS.bold,
    marginBottom: 12
  },
  successSub: {
    color: COLORS.textSecondary,
    fontSize: SIZES.sm,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 22
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusXs,
  },
  errorText: {
    color: COLORS.high,
    fontSize: SIZES.xs,
    ...FONTS.medium,
  }
});

export default UploadScreen;
