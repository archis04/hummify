import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRecording, uploadAudio } from '../redux/audioSlice';
import { Button, Box, Typography, LinearProgress, Card, CardContent } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const AudioRecorder = () => {
  const dispatch = useDispatch();
  const { recording } = useSelector(state => state.audio);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        dispatch(setRecording(audioUrl));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordedTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordedTime(time => {
          if (time >= 60) stopRecording();
          return time + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const handleUpload = () => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    dispatch(uploadAudio(blob));
  };

  const togglePlayback = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);

  return (
    <Card sx={{ 
    p: 3, 
    boxShadow: 3,
    background: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
    borderRadius: '12px'
  }}>
    <CardContent>
      <Typography variant="h5" gutterBottom align="center" color="secondary">
        Record Your Audio
      </Typography>
      
      <Typography variant="body1" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
        Click below to record up to 60 seconds of audio
      </Typography>
      
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color={isRecording ? 'error' : 'primary'}
            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={recording && !isRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          
          {recording && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PlayArrowIcon />}
              onClick={togglePlayback}
            >
              {isPlaying ? 'Pause' : 'Play'} Preview
            </Button>
          )}
        </Box>

        {isRecording && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={(recordedTime / 60) * 100} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body1" align="center" sx={{ mt: 1 }}>
              {recordedTime}s / 60s
            </Typography>
          </Box>
        )}

        {recording && !isRecording && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleUpload}
            >
              Process Recording
            </Button>
          </Box>
        )}

        {recording && (
          <audio 
            ref={audioRef} 
            src={recording} 
            hidden 
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;