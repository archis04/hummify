// frontend/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { analyzeAudio, convertAudio, resetAudioState } from './redux/audioSlice';
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Link as MuiLink,
  Button
} from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import InstrumentSelector from './components/InstrumentSelector';
import AudioRecorder from './components/AudioRecorder';
import ConversionProgress from './components/ConversionProgress';
import AnalysisResult from './components/AnalysisResult';
import AudioPlayer from './components/AudioPlayer';

import Register from './pages/Register';
import Login from './pages/Login';
import SavedAudiosPage from './pages/SavedAudiosPage';

function AppContentInner() {
  const dispatch = useDispatch();
  const { audioUrl, status, analysis, convertedAudio } = useSelector(state => state.audio);
  const { selectedInstrument } = useSelector(state => state.instrument);

  // REMOVED: The useEffect that previously triggered analyzeAudio automatically after upload.
  // Analysis will now be triggered explicitly by the "Convert to Instrument" button.
  // Original code removed:
  // useEffect(() => {
  //   if (status === 'uploaded' && audioUrl) {
  //     dispatch(analyzeAudio(audioUrl));
  //   }
  // }, [status, audioUrl, dispatch]);

  // MODIFIED EFFECT: This useEffect now chains convertAudio after analyzeAudio completes.
  // It will run when status becomes 'analyzed' (which is after the manual button click).
  useEffect(() => {
    // This effect should ONLY run for the *initial* conversion after a new analysis.
    // It should NOT re-trigger when `convertAudio` is dispatched from `AnalysisResult.jsx`
    // with user-edited notes.
    if (status === 'analyzed' && analysis && selectedInstrument && !convertedAudio) {
      console.log('App useEffect: Analysis complete. Conditions met for conversion. Dispatching convertAudio.');
      dispatch(convertAudio({
        instrument: selectedInstrument,
        notes: analysis // This is correct for the initial conversion
      }));
    }
  }, [status, analysis, selectedInstrument, convertedAudio, dispatch]);

  const isProcessing = status === 'uploading' || status === 'analyzing' || status === 'converting';
  // FIX: Ensure AnalysisResult stays mounted during 'converting' status
  // This condition keeps AnalysisResult mounted from 'analyzed' state through 'converting' and 'converted'
  const isAnalyzedOrConverted = status === 'analyzed' || status === 'converted' || status === 'converting';
  const showStartNewHumButton = !isProcessing && status !== 'idle';

  const handleStartNewHum = () => {
    dispatch(resetAudioState());
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Hummify Your Melodies
      </Typography>

      {showStartNewHumButton && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartNewHum}
            sx={{ px: 4, py: 1.5 }}
          >
            Start New Hum
          </Button>
        </Box>
      )}

      <InstrumentSelector />
      <AudioRecorder />

      {audioUrl && status !== 'idle' && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Your Recorded Audio:</Typography>

          {/* Re-record / Upload New button: Comes immediately after "Your Recorded Audio:" */}
          {!isProcessing && (
            <Button
              variant="outlined"
              color="info"
              onClick={handleStartNewHum}
              sx={{ mt: 1, mb: 2 }}
            >
              Re-record / Upload New
            </Button>
          )}

          <AudioPlayer src={audioUrl} title="Recorded Hum" />
        </Box>
      )}

      {/* NEW: "Convert to {Instrument}" Button */}
      {/* It appears when status is 'uploaded' and an instrument is selected, and not currently processing. */}
      {/* Clicking it triggers the analysis, which then chains to conversion. */}
      {status === 'uploaded' && audioUrl && selectedInstrument && !isProcessing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              console.log('App: "Convert" button clicked. Dispatching analyzeAudio.');
              // This explicitly starts the analysis process.
              // The subsequent conversion will be chained via the useEffect above,
              // once analysis (status: 'analyzed') is complete.
              dispatch(analyzeAudio(audioUrl));
            }}
            sx={{ px: 4, py: 1.5 }}
          >
            Convert to {selectedInstrument.charAt(0).toUpperCase() + selectedInstrument.slice(1)}
          </Button>
        </Box>
      )}

      {isProcessing && (
        <ConversionProgress />
      )}

      {isAnalyzedOrConverted && (
        <>
          {/* AnalysisResult will now remain mounted during 'analyzed', 'converting', and 'converted' status */}
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
              <Route path="/my-audios" element={<SavedAudiosPage />} />
            </Route>

            <Route
                path="*"
                element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </Container>

        <Footer />
      </Box>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
}

export default App;