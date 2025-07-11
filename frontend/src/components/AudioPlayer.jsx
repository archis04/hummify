import React, { useState, useRef, useEffect } from 'react';
import { Box, Slider, Typography, IconButton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const CustomSlider = styled(Slider)(({ theme }) => ({
  height: 4,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
    '&:hover, &.Mui-active': {
      width: 20,
      height: 20,
    },
  },
}));

const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const fetchAudioDuration = async (url) => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
  } catch (error) {
    console.error('Duration calculation failed:', error);
    return 0;
  }
};

const AudioPlayer = ({ src, title = "Audio Playback" }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const lastLoadedSrc = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = async () => {
      if (!isFinite(audio.duration) || audio.duration === Infinity) {
        const calculatedDuration = await fetchAudioDuration(src);
        setDuration(calculatedDuration);
      } else {
        setDuration(audio.duration);
      }
      setCurrentTime(audio.currentTime);
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    if (src !== lastLoadedSrc.current) {
      audio.src = src;
      audio.load();
      lastLoadedSrc.current = src;
      setIsPlaying(false);
      setCurrentTime(0);
    }

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (error) {
        console.error("Playback failed:", error);
      }
    }
  };

  const handleSeek = (_, value) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (_, value) => {
    const audio = audioRef.current;
    if (audio) {
      setVolume(value);
      audio.volume = value;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audio.muted = newMuted;
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title}
      </Typography>
      
      <audio ref={audioRef} preload="metadata" />
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={handlePlayPause} disabled={!src}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Slider
            value={currentTime}
            min={0}
            max={duration || 0}
            onChange={handleSeek}
            disabled={!src}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', width: 120 }}>
          <IconButton onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
          </IconButton>
          <Slider
            value={isMuted ? 0 : volume}
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolumeChange}
            sx={{ ml: 1 }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AudioPlayer;