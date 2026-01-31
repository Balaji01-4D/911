import { Audio } from 'expo-av';
import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Camera as CameraIcon, Check, MapPin, Mic, Send, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { submitReport } from '../lib/api';
import { useReportStore } from '../store/useReportStore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    location,
    audioUri,
    imageUri,
    description,
    isRecording,
    reporterId,
    setLocation,
    setAudioUri,
    setImageUri,
    setDescription,
    setReporterId,
    toggleRecording,
    resetReport,
  } = useReportStore();

  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestPermissions = async () => {
      try {
        const [locationPermission, cameraPermission, audioPermission] =
          await Promise.all([
            Location.requestForegroundPermissionsAsync(),
            Camera.requestCameraPermissionsAsync(),
            Audio.requestPermissionsAsync(),
          ]);

        if (!isMounted) {
          return;
        }

        const denied: string[] = [];
        if (locationPermission.status !== 'granted') denied.push('Location');
        if (cameraPermission.status !== 'granted') denied.push('Camera');
        if (audioPermission.status !== 'granted') denied.push('Microphone');

        setPermissionWarning(
          denied.length > 0
            ? `${denied.join(', ')} permission${denied.length > 1 ? 's' : ''} denied.`
            : null,
        );

        if (locationPermission.status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          if (isMounted) {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setPermissionWarning('Failed to request permissions.');
        }
      } finally {
        if (isMounted) {
          setIsLocating(false);
        }
      }
    };

    requestPermissions();

    return () => {
      isMounted = false;
    };
  }, [setLocation]);

  useEffect(() => {
    if (isRecording) {
      pulseAnim.setValue(1);
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      setPermissionWarning('Microphone permission denied.');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );

    recordingRef.current = recording;
    toggleRecording(true);
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri ?? null);
    recordingRef.current = null;
    toggleRecording(false);

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSnap = async () => {
    const camera = cameraRef.current;
    if (!camera) return;

    const photo = await camera.takePictureAsync({
      quality: 0.8,
      skipProcessing: true,
    });

    if (photo?.uri) {
      setImageUri(photo.uri);
    }
    setIsCameraOpen(false);
  };

  const handleSubmit = async () => {
    if (!description && !audioUri && !imageUri) {
       Alert.alert("Missing Information", "Please provide a description, audio recording, or a photo.");
       return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        description: description || "No description provided",
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        reporter_id: reporterId || "anonymous",
        audioUri,
        imageUri,
      };

      await submitReport(payload);
      
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to send report. Please try again.");
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    resetReport();
  };

  const locationLabel = location
    ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
    : 'Locating...';

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-primary font-bold tracking-widest uppercase text-xs mb-1">
              Safety First
            </Text>
            <Text className="text-text text-3xl font-bold">Emergency</Text>
            <Text className="text-text text-3xl font-bold opacity-70">Reporter</Text>
          </View>
          
          <Pressable className="h-10 w-10 bg-surface rounded-full items-center justify-center">
            <Text className="text-text text-lg">?</Text>
          </Pressable>
        </View>

        {/* Location Badge */}
        <View className="mt-6 flex-row items-center bg-surface self-start px-4 py-3 rounded-full border border-white/5">
          <MapPin color="#cba6f7" size={16} />
          <Text className="text-text ml-2 font-medium">
            {isLocating && !location ? 'Locating...' : locationLabel}
          </Text>
          {isLocating && !location && (
            <ActivityIndicator className="ml-3" color="#cba6f7" size="small" />
          )}
        </View>

        {permissionWarning && (
          <View className="mt-4 bg-primary/10 p-3 rounded-xl border border-primary/20">
            <Text className="text-primary text-center font-medium">{permissionWarning}</Text>
          </View>
        )}

        {/* Recording Section */}
        <View className="my-10 items-center justify-center">
          <View className="relative">
            {/* Pulsing Effect */}
            <Animated.View 
              style={{ 
                transform: [{ scale: pulseAnim }],
                opacity: 0.3,
              }}
              className="absolute -inset-4 rounded-full bg-primary"
            />
            
            <Pressable
              onPress={handleRecordPress}
              className={`h-32 w-32 items-center justify-center rounded-full border-4 shadow-lg ${
                isRecording ? 'bg-primary border-white/20' : audioUri ? 'bg-surface border-success' : 'bg-surface border-primary'
              }`}
            >
              {audioUri && !isRecording ? (
                <Check color="#a6e3a1" size={48} />
              ) : (
                <Mic color={isRecording ? "#1e1e2e" : "#f38ba8"} size={48} />
              )}
            </Pressable>
          </View>
          
          <Text className="text-text mt-6 font-semibold text-lg">
            {isRecording ? 'Recording Audio...' : audioUri ? 'Audio Secured' : 'Tap to Record Evidence'}
          </Text>
          {audioUri && !isRecording && (
             <Pressable onPress={() => setAudioUri(null)} className="mt-2 py-1 px-3 bg-surface rounded-full">
                <Text className="text-text/50 text-xs">Retake Audio</Text>
             </Pressable>
          )}
        </View>

        {/* Description Input */}
        <View className="space-y-4">
          <Text className="text-text/70 uppercase text-xs font-bold tracking-wider ml-1">Incident Details</Text>
          <TextInput
            className="min-h-[140px] rounded-3xl bg-surface px-5 py-4 text-text text-base leading-6 border border-white/5"
            placeholder="Describe the situation clearly..."
            placeholderTextColor="#6c7086"
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Media Support */}
        <View className="mt-6 flex-row gap-4">
          <Pressable
            onPress={() => setIsCameraOpen(true)}
            className="flex-1 bg-surface border border-white/5 h-16 rounded-2xl flex-row items-center justify-center active:opacity-80"
          >
            <CameraIcon color="#cba6f7" size={24} />
            <Text className="ml-2 text-text font-semibold">Add Photo</Text>
          </Pressable>

          {imageUri ? (
            <View className="h-16 w-16 relative">
              <Image
                source={{ uri: imageUri }}
                className="h-full w-full rounded-2xl border border-white/10"
              />
              <Pressable 
                className="absolute -top-2 -right-2 bg-primary h-6 w-6 rounded-full items-center justify-center border border-background"
                onPress={() => setImageUri(null)}
              >
                  <Trash2 size={12} color="#1e1e2e" />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`mt-10 h-16 rounded-2xl flex-row items-center justify-center shadow-lg active:scale-95 transition-transform ${isSubmitting ? 'bg-surface opacity-50' : 'bg-success'}`}
        >
          {isSubmitting ? (
             <ActivityIndicator color="#1e1e2e" />
          ) : (
            <>
              <Text className="text-[#1e1e2e] text-lg font-bold mr-2">
                SEND REPORT
              </Text>
              <Send color="#1e1e2e" size={20} strokeWidth={2.5} />
            </>
          )}
        </Pressable>

        <Text className="text-center text-text/30 text-xs mt-6 mb-4">
          Location: {location?.latitude || 0}, {location?.longitude || 0}
        </Text>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={isCameraOpen} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background relative">
            <CameraView ref={cameraRef} className="flex-1" facing="back" />
            
            <View className="absolute top-0 left-0 right-0 p-4 pt-10 flex-row justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
               <Pressable 
                 onPress={() => setIsCameraOpen(false)}
                 className="h-10 w-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
               >
                 <X color="white" size={24} />
               </Pressable>
            </View>

            <View className="absolute bottom-0 w-full px-8 pb-12 pt-8 bg-black/40 backdrop-blur-md items-center">
                <Pressable
                onPress={handleSnap}
                className="h-20 w-20 rounded-full bg-white border-4 border-white/30 items-center justify-center"
                >
                  <View className="h-16 w-16 rounded-full bg-white border-2 border-black/10" />
                </Pressable>
                <Text className="text-white mt-4 font-medium opacity-80">Tap to capture</Text>
            </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={isSuccess} animationType="fade" transparent>
        <View className="flex-1 bg-background justify-center items-center px-6">
            <Animated.View 
              className="bg-surface w-full rounded-3xl p-8 items-center border border-white/5 shadow-2xl"
            >
                <View className="h-24 w-24 bg-success/20 rounded-full items-center justify-center mb-6">
                  <View className="h-16 w-16 bg-success rounded-full items-center justify-center shadow-lg shadow-success/50">
                    <Check color="#1e1e2e" size={40} strokeWidth={4} />
                  </View>
                </View>

                <Text className="text-text text-2xl font-bold mb-2 text-center">Report Sent!</Text>
                <Text className="text-text/60 text-center mb-8 text-base">
                  Emergency services have been notified of your location and incident details.
                </Text>

                <View className="w-full space-y-3">
                   <Pressable 
                     onPress={handleReset}
                     className="w-full bg-primary h-14 rounded-xl items-center justify-center active:opacity-90"
                   >
                      <Text className="text-[#1e1e2e] font-bold text-lg">Return Home</Text>
                   </Pressable>
                </View>
            </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
