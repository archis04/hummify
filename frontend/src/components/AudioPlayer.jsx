import React from 'react';
import { Box, Typography, IconButton, Slider, styled } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const RootBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'light' ? '#e0f2f7' : '#37474f', // Light blue/grey background
  boxShadow: theme.shadows[3],
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}));

const CustomSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
  },
  '& .MuiSlider-rail': {
    opacity: 0.5,
    backgroundColor: 'currentColor',
  },
}));

const AudioPlayer = ({ src, title = "Audio Playback" }) => {
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);
  const [isMuted, setIsMuted] = React.useState(false);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const togglePlay = () => setIsPlaying(!audio.paused);
    const handleEnd = () => setIsPlaying(false);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', togglePlay);
    audio.addEventListener('pause', togglePlay);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', togglePlay);
      audio.removeEventListener('pause', togglePlay);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [src]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    }
  };

  const handleSeek = (event, newValue) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <RootBox>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <IconButton onClick={handlePlayPause} color="primary" size="large">
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>

      <Box sx={{ flexGrow: 1, minWidth: 150 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          {title}
        </Typography>
        <CustomSlider
          value={currentTime}
          min={0}
          max={duration}
          onChange={handleSeek}
          aria-labelledby="continuous-slider"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
        <IconButton onClick={() => setIsMuted(!isMuted)} size="small">
          {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e, val) => {
            setVolume(val);
            if (val > 0) setIsMuted(false);
          }}
          aria-labelledby="volume-slider"
          sx={{ ml: 1 }}
        />
      </Box>
    </RootBox>
  );
};

export default AudioPlayer;