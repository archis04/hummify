// frontend/src/App.jsx
import React, { useEffect } from 'react';
import {Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
// CORRECTED: Import resetAudioState instead of resetProcess
import { analyzeAudio, convertAudio, resetAudioState } from './redux/audioSlice'; 
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Link as MuiLink,
} from '@mui/material';

// Import Layout Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Import Core App Features Components (now part of AppContentInner)
import InstrumentSelector from './components/InstrumentSelector';
import AudioRecorder from './components/AudioRecorder';
import ConversionProgress from './components/ConversionProgress';
import AnalysisResult from './components/AnalysisResult';
import AudioPlayer from './components/AudioPlayer';

// Import Auth Pages
import Register from './pages/Register';
import Login from './pages/Login';

// --- Inner Component for Authenticated User Content ---
function AppContentInner() {
  const dispatch = useDispatch();
  const { audioUrl, status, analysis, convertedAudio } = useSelector(state => state.audio);
  const { selectedInstrument } = useSelector(state => state.instrument);

  // Effect to trigger analyzeAudio after upload
  useEffect(() => {
    if (status === 'uploaded' && audioUrl) {
      dispatch(analyzeAudio(audioUrl));
    }
  }, [status, audioUrl, dispatch]);

  // Effect to trigger convertAudio after analysis is complete
  useEffect(() => {
    if (status === 'analyzed' && analysis && selectedInstrument) {
      console.log('App useEffect: Conditions met for initial conversion. Dispatching convertAudio.');
      dispatch(convertAudio({
        instrument: selectedInstrument,
        notes: analysis
      }));
    }
  }, [status, analysis, selectedInstrument, dispatch]);

  const isProcessing = status === 'uploading' || status === 'analyzing' || status === 'converting';
  const isAnalyzedOrConverted = status === 'analyzed' || status === 'converted';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Hummify Your Melodies
      </Typography>
      <InstrumentSelector />
      <AudioRecorder />

      {audioUrl && status !== 'idle' && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Your Recorded Audio:</Typography>
          <AudioPlayer src={audioUrl} title="Recorded Hum" />
        </Box>
      )}

      {isProcessing && (
        <ConversionProgress />
      )}

      {isAnalyzedOrConverted && analysis && (
        <>
          {status === 'converted' && <ConversionProgress />}
          <AnalysisResult />
        </>
      )}

      {status === 'failed' && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 2 }}>
          <Typography variant="h6">Error during processing!</Typography>
          <Typography variant="body1">Please try again. Check console for details.</Typography>
        </Box>
      )}
    </Box>
  );
}

// --- Root App Component ---
function App() {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log('App: Initial user state check. User:', user);
  }, [user]);

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />

        <Container maxWidth="md" sx={{ py: 4, flexGrow: 1 }}>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/" replace /> : <Register />}
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppContentInner />} />
            </Route>

            <Route
                path="*"
                element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </Container>

        <Footer />
      </Box>
    </>
  );
}

export default App;