import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { resetProcess, analyzeAudio } from './redux/audioSlice';
import { Container, CssBaseline, Box } from '@mui/material';
import InstrumentSelector from './components/InstrumentSelector';
import AudioRecorder from './components/AudioRecorder';
import ConversionProgress from './components/ConversionProgress';
import AnalysisResult from './components/AnalysisResult';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { audioUrl, status, analysis } = useSelector(state => state.audio);

  useEffect(() => {
    if (status === 'uploaded' && audioUrl) {
      dispatch(analyzeAudio(audioUrl));
      navigate('/processing');
    }
  }, [status, audioUrl, dispatch, navigate]);

  useEffect(() => {
    if (status === 'analyzed' && analysis) {
      navigate('/analysis');
    }
  }, [status, analysis, navigate]);

  const handleReset = () => {
    dispatch(resetProcess());
    navigate('/');
  };

  return (
    <>
      <CssBaseline />
      <Header onReset={handleReset} />
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <InstrumentSelector />
              <AudioRecorder />
            </Box>
          } />
          
          <Route path="/processing" element={<ConversionProgress />} />
          
          <Route path="/analysis" element={
            <>
              <ConversionProgress />
              <AnalysisResult />
            </>
          } />
        </Routes>
      </Container>
      
      <Footer />
    </>
  );
}

export default App;