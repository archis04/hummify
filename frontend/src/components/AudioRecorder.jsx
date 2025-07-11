import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRecording, uploadAudio, resetAudioState } from '../redux/audioSlice'; 
import { Button, Box, Typography, Card, CardContent } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const AudioRecorder = () => {
  const dispatch = useDispatch();
  const { recording: recordedBlobUrlFromRedux, status } = useSelector(state => state.audio); 
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const actualAudioBlobRef = useRef(null); 

  useEffect(() => {
    return () => {
      if (recordedBlobUrlFromRedux) {
        URL.revokeObjectURL(recordedBlobUrlFromRedux);
      }
    };
  }, [recordedBlobUrlFromRedux]);

  const startRecording = async () => {
    try {
      dispatch(resetAudioState());
      audioChunksRef.current = [];
      actualAudioBlobRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Configure for Opus codec in WebM
      let options = { mimeType: 'audio/webm; codecs=opus' };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'audio/*' };
        }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current.mimeType 
        });
        
        actualAudioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        dispatch(setRecording(url));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("Recording error:", event.error);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = () => {
    if (actualAudioBlobRef.current) {
      dispatch(uploadAudio(actualAudioBlobRef.current));
    }
  };

  const isProcessing = status === 'uploading' || status === 'analyzing';

  return (
    <Card sx={{ p: 3, boxShadow: 3, borderRadius: '12px' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Record Your Audio
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<MicIcon />}
            onClick={startRecording}
            disabled={isRecording || isProcessing}
          >
            {isRecording ? 'Recording...' : 'Start'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop
          </Button>
        </Box>

        {actualAudioBlobRef.current && (
          <Button
            variant="contained"
            color="success"
            startIcon={<UploadFileIcon />}
            onClick={handleUpload}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upload'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;