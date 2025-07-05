import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRecording, uploadAudio } from '../redux/audioSlice';
import { Button, Box, Typography, Card, CardContent } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const AudioRecorder = () => {
  const dispatch = useDispatch();
  const { recording, status } = useSelector(state => state.audio);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        dispatch(setRecording(audioBlob));
        // No immediate upload here, just set the recording in state
        // Upload will be triggered by a button click
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = () => {
    if (recording) {
      dispatch(uploadAudio(recording));
    } else {
      alert('No audio recorded to upload!');
    }
  };

  return (
    <Card sx={{
      p: 3,
      boxShadow: 3,
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      borderRadius: '12px'
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Record Your Hum:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<MicIcon />}
            onClick={startRecording}
            disabled={isRecording || status === 'uploading' || status === 'analyzing' || status === 'converting'}
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<StopIcon />}
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop Recording
          </Button>
        </Box>

        {recording && ( // Show upload button only if recording exists
          <Button
            variant="contained"
            color="success"
            startIcon={<UploadFileIcon />}
            onClick={handleUpload}
            disabled={status === 'uploading' || status === 'analyzing' || status === 'converting'}
          >
            Process Audio
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;