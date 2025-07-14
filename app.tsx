
import React, { useState, useCallback } from 'react';
import UploadScreen from './components/UploadScreen';
import EditorScreen from './components/EditorScreen';
import { Track } from './types';
import { INITIAL_TRACKS } from './constants';

type AppState = 'upload' | 'processing' | 'editor';

function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  const handleFileProcess = useCallback((file: File) => {
    setAudioFile(file);
    setAppState('processing');
    setProcessingProgress(0);
    setProcessingStatus('');

    const processingSteps = [
      "شروع پردازش...",
      "تحلیل فرکانس‌های صوتی...",
      "جداسازی وکال...",
      "استخراج درامز...",
      "ایزوله کردن بیس...",
      "پردازش نهایی سازها...",
      "آماده‌سازی ویرایشگر..."
    ];
    const totalDuration = 4000; // 4 seconds for a more realistic feel
    const stepDuration = totalDuration / processingSteps.length;

    processingSteps.forEach((step, index) => {
        setTimeout(() => {
            setProcessingStatus(step);
            const progress = ((index + 1) / processingSteps.length) * 100;
            setProcessingProgress(progress);
        }, index * stepDuration);
    });

    // Simulate AI processing delay
    setTimeout(() => {
      setAppState('editor');
    }, totalDuration);
  }, []);

  const handleReset = useCallback(() => {
    setAppState('upload');
    setAudioFile(null);
    setTracks(INITIAL_TRACKS);
    setProcessingProgress(0);
    setProcessingStatus('');
  }, []);

  const renderContent = () => {
    switch (appState) {
      case 'upload':
        return <UploadScreen onFileProcess={handleFileProcess} />;
      case 'processing':
        return <UploadScreen 
          onFileProcess={handleFileProcess} 
          isLoading={true}
          processingStatus={processingStatus}
          processingProgress={processingProgress}
        />;
      case 'editor':
        if (audioFile) {
            return <EditorScreen tracks={tracks} setTracks={setTracks} audioFile={audioFile} onReset={handleReset} />;
        }
        // Fallback if file is somehow null
        return <UploadScreen onFileProcess={handleFileProcess} />;
      default:
        return <UploadScreen onFileProcess={handleFileProcess} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
