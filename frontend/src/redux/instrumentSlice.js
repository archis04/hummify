import { createSlice } from '@reduxjs/toolkit';

const instrumentSlice = createSlice({
  name: 'instrument',
  initialState: {
    selectedInstrument: 'Acoustic Grand Piano',
    instruments: [
      'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano',
      'Honky-tonk Piano', 'Electric Piano 1', 'Electric Piano 2', 
      'Harpsichord', 'Clavinet', 'Celesta', 'Glockenspiel', 'Music Box',
      'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
      'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ',
      'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion'
    ]
  },
  reducers: {
    setInstrument: (state, action) => {
      state.selectedInstrument = action.payload;
    }
  }
});

export const { setInstrument } = instrumentSlice.actions;
export default instrumentSlice.reducer;