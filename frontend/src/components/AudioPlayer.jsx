// frontend/src/components/AudioPlayer.jsx

import React from 'react';
import { Box, Slider, Typography, IconButton } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Custom styled Slider component for visual styling
const CustomSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#1976d2',
  height: 4,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
    transition: '0.3s cubic-bezier(.47,1.64,.43,.86)',
    '&::before': {
      boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
    },
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px ${
        theme.palette.mode === 'dark'
          ? 'rgb(255 255 255 / 16%)'
          : 'rgb(0 0 0 / 16%)'
      }`,
    },
    '&.Mui-active': {
      width: 20,
      height: 20,
    },
  },
  '& .MuiSlider-rail': {
    opacity: 0.28,
  },
}));

// Function to format time for display (e.g., 0:00)
const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds)) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const AudioPlayer = ({ src, title = "Audio Playback" }) => {
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);
  const [isMuted, setIsMuted] = React.useState(false);
  const [wasPlayingBeforeSeek, setWasPlayingBeforeSeek] = React.useState(false);
  const [userInitiatedPause, setUserInitiatedPause] = React.useState(false);
  
  // NEW: To track the URL that was actually loaded into the audio element
  const lastLoadedSrcRef = React.useRef(null); 
  console.log(`AudioPlayer (${title}) Render: src=${src}, duration=${duration}, currentTime=${currentTime}, isPlaying=${isPlaying}`);

  // Effect to set up and clean up audio event listeners
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log(`AudioPlayer (${title}): audioRef.current is null on mount.`);
      return;
    }

    // --- CRITICAL CHANGE HERE ---
    // Only update audio.src and call audio.load() if the src prop has actually changed
    // compared to what's currently loaded in the audio element.
    if (src && src !== lastLoadedSrcRef.current) {
        console.log(`AudioPlayer (${title}): Loading NEW src:`, src);
        audio.src = src;
        audio.load(); // Load the new audio source
        lastLoadedSrcRef.current = src; // Update the ref to the currently loaded src
        
        // Reset playback state for any new audio loaded
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setUserInitiatedPause(false);
    } else if (!src) {
        // If src is undefined or null, clear the audio source and reset all state
        console.warn(`AudioPlayer (${title}): src is missing or invalid. Clearing audio element.`);
        audio.src = '';
        lastLoadedSrcRef.current = null; // Clear the ref as no src is loaded
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setUserInitiatedPause(false);
    }
    // --- END CRITICAL CHANGE ---

    // Log for debugging (this will run on every src/title prop change, but load() only when src differs)
    console.log(`AudioPlayer (${title}): Effect re-ran. Current src prop:`, src);
    console.log(`AudioPlayer (${title}): Audio element status: readyState=${audio.readyState}, paused=${audio.paused}, duration=${audio.duration}`);
    
    const setAudioData = () => {
      console.log(`AudioPlayer (${title}): loadeddata event fired! Duration:`, audio.duration);
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      audio.volume = volume; // Ensure volume is set on load
      audio.muted = isMuted; // Ensure mute is set on load
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const togglePlayState = () => {
      console.log(`AudioPlayer (${title}): play/pause toggled. Is playing?`, !audio.paused);
      setIsPlaying(!audio.paused);
      if (audio.paused && !userInitiatedPause) {
        setUserInitiatedPause(false); // If audio paused itself (e.g., ended or buffering), it's not a user initiated pause
      }
    };

    const handleEnd = () => {
      console.log(`AudioPlayer (${title}): ended event fired.`);
      setIsPlaying(false);
      setCurrentTime(0); // Reset current time to start at the end
      setUserInitiatedPause(false); // Audio ended naturally, not user-paused
    };

    const handleError = (e) => {
        console.error(`AudioPlayer (${title}): Audio Error!`, e);
        if (e.target && e.target.error) {
            console.error(`Error code: ${e.target.error.code}`);
            console.error(`Error message: ${e.target.error.message}`);
        }
        setIsPlaying(false);
        setDuration(0);
        setCurrentTime(0);
        setUserInitiatedPause(false);
    };

    // Add event listeners
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', togglePlayState);
    audio.addEventListener('pause', togglePlayState);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('error', handleError);

    // Cleanup function for event listeners
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', togglePlayState);
      audio.removeEventListener('pause', togglePlayState);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [src, title]); // Dependencies remain [src, title]


  // Play/Pause button handler
  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !src || duration === 0) return;

    if (isPlaying) {
      audio.pause();
      setUserInitiatedPause(true); // User explicitly clicked pause
    } else {
      try {
        await audio.play();
        setUserInitiatedPause(false); // User explicitly clicked play
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          console.error("Autoplay was prevented by the browser. User must interact to play.");
        } else if (error.name === 'AbortError') {
          console.warn("Play request was aborted (e.g., by a subsequent pause or rapid state changes). This is expected due to browser autoplay policies or rapid UI updates.");
        } else {
          console.error("An unexpected error occurred while trying to play audio:", error);
        }
        setIsPlaying(false);
        setUserInitiatedPause(true); // Mark as effectively paused if play failed
      }
    }
  };

  // Handler for volume slider change
  const handleVolumeChange = (event, newValue) => {
    const audio = audioRef.current;
    if (audio) {
      setVolume(newValue);
      audio.volume = newValue;
      setIsMuted(newValue === 0);
    }
  };

  // Handler for mute/unmute button
  const handleMuteToggle = () => {
    const audio = audioRef.current;
    if (audio) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      audio.muted = newMutedState;
      if (newMutedState) {
        setVolume(0);
        audio.volume = 0;
      } else {
        if (volume === 0) {
            setVolume(0.8);
            audio.volume = 0.8;
        } else {
            audio.volume = volume;
        }
      }
    }
  };

  // Fixed: Removed duplicate if condition
  const handleSeeking = (event, newValue) => {
    const audio = audioRef.current;
    if (audio) {
      console.log(`AudioPlayer (${title}): handleSeeking - newValue (visual update): ${newValue}`);
      if (isPlaying && !wasPlayingBeforeSeek) {
        setWasPlayingBeforeSeek(true);
        audio.pause();
      }
      setCurrentTime(newValue);
    }
  };

  // This runs when the user *releases* the slider thumb
  const handleSeekCommitted = (event, newValue) => {
    const audio = audioRef.current;
    if (audio) {
      console.log(`AudioPlayer (${title}): handleSeekCommitted - newValue (audio seek): ${newValue}`);
      audio.currentTime = newValue;
      if (wasPlayingBeforeSeek && !userInitiatedPause) {
        audio.play();
      }
      setWasPlayingBeforeSeek(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2, border: '1px solid #ccc', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle1" component="div" sx={{ mb: 1, color: 'text.primary' }}>
        {title}
      </Typography>

      <audio ref={audioRef} preload="metadata" />

      <IconButton onClick={handlePlayPause} disabled={!src || duration === 0} sx={{ p: 0.5, mb: 1 }}>
        {isPlaying ? (
          <Pause sx={{ fontSize: 40, color: 'primary.main' }} />
        ) : (
          <PlayArrow sx={{ fontSize: 40, color: 'primary.main' }} />
        )}
      </IconButton>

      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
        <Typography variant="body2" sx={{ width: '40px', flexShrink: 0 }}>
          {formatTime(currentTime)}
        </Typography>
        <CustomSlider
          value={currentTime}
          min={0}
          max={isNaN(duration) || !isFinite(duration) ? 0 : duration}
          onChange={handleSeeking}
          onChangeCommitted={handleSeekCommitted}
          aria-label="time-slider"
          step={0.01}
          disabled={!src || duration === 0}
        />
        <Typography variant="body2" sx={{ width: '40px', flexShrink: 0, textAlign: 'right' }}>
          {formatTime(duration)}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mt: 1, px: 2 }}>
        <IconButton onClick={handleMuteToggle} sx={{ p: 0.5 }} disabled={!src || duration === 0}>
          {isMuted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
        </IconButton>
        <CustomSlider
          value={isMuted ? 0 : volume}
          min={0}
          max={1}
          step={0.01}
          onChange={handleVolumeChange}
          aria-labelledby="volume-slider"
          sx={{ flexGrow: 1 }}
          disabled={!src || duration === 0}
        />
      </Box>
    </Box>
  );
};

export default AudioPlayer;