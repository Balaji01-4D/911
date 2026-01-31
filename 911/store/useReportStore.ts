import { create } from 'zustand';

type ReportLocation = {
  latitude: number;
  longitude: number;
} | null;

type ReportState = {
  location: ReportLocation;
  audioUri: string | null;
  imageUri: string | null;
  description: string;
  isRecording: boolean;
  reporterId: string | null;
  setLocation: (location: ReportLocation) => void;
  setAudioUri: (uri: string | null) => void;
  setImageUri: (uri: string | null) => void;
  setDescription: (text: string) => void;
  setReporterId: (id: string | null) => void;
  toggleRecording: (value?: boolean) => void;
  resetReport: () => void;
};

const initialState = {
  location: null,
  audioUri: null,
  imageUri: null,
  description: '',
  isRecording: false,
  reporterId: null,
};

export const useReportStore = create<ReportState>((set) => ({
  ...initialState,
  setLocation: (location) => set({ location }),
  setAudioUri: (audioUri) => set({ audioUri }),
  setImageUri: (imageUri) => set({ imageUri }),
  setDescription: (description) => set({ description }),
  setReporterId: (reporterId) => set({ reporterId }),
  toggleRecording: (value) =>
    set((state) => ({
      isRecording: typeof value === 'boolean' ? value : !state.isRecording,
    })),
  resetReport: () => set({ ...initialState }),
}));
