// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// const fs = require('fs');
// const path = require('path');
// const ffmpeg = require('fluent-ffmpeg');
// const Pitchfinder = require('pitchfinder');
// const WavDecoder = require('wav-decoder');
// const os = require('os');

// const detectPitch = async (req, res) => {
//   const { url } = req.body;
//   console.log('[detectPitch] Starting pitch detection process');
//   try {
//     console.log(`[detectPitch] Fetching audio file from URL: ${url}`);
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`Failed to download audio, status: ${response.status}`);
//     }
//     const arrayBuffer = await response.arrayBuffer();
//     const inputPath = path.join(os.tmpdir(), 'input.webm');
//     console.log(`[detectPitch] Writing downloaded .webm file to temp path: ${inputPath}`);
//     fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

//     const outputPath = path.join(os.tmpdir(), 'output.wav');
//     console.log(`[detectPitch] Starting conversion from .webm to .wav (output path: ${outputPath})`);

//     await new Promise((resolve, reject) => {
//       ffmpeg(inputPath)
//         .toFormat('wav')
//         .on('error', (err) => {
//           console.error('[detectPitch] ffmpeg conversion error:', err);
//           reject(err);
//         })
//         .on('end', () => {
//           console.log('[detectPitch] ffmpeg conversion completed successfully');
//           resolve();
//         })
//         .save(outputPath);
//     });

//     console.log(`[detectPitch] Reading converted wav file from: ${outputPath}`);
//     const wavBuffer = fs.readFileSync(outputPath);
//     console.log('[detectPitch] Decoding wav audio data');
//     const audioData = await WavDecoder.decode(wavBuffer);

//     const samples = audioData.channelData[0];
//     const sampleRate = audioData.sampleRate;
//     console.log(`[detectPitch] Audio decoded. Sample rate: ${sampleRate}, Samples length: ${samples.length}`);

//     console.log('[detectPitch] Starting pitch detection using Pitchfinder YIN algorithm');
//     const detectPitch = Pitchfinder.YIN();
//     const frameSize = 1024;
//     const pitches = [];

//     for (let i = 0; i < samples.length; i += frameSize) {
//       const frame = samples.slice(i, i + frameSize);
//       const pitch = detectPitch(frame, sampleRate);
//       if (pitch) pitches.push(pitch);
//     }
//     console.log(`[detectPitch] Pitch detection completed. Number of pitches detected: ${pitches.length}`);

//     // Clean up temp files
//     try {
//       fs.unlinkSync(inputPath);
//       console.log(`[detectPitch] Deleted temp input file: ${inputPath}`);
//     } catch (e) {
//       console.warn(`[detectPitch] Could not delete temp input file: ${inputPath}`, e);
//     }
//     try {
//       fs.unlinkSync(outputPath);
//       console.log(`[detectPitch] Deleted temp output file: ${outputPath}`);
//     } catch (e) {
//       console.warn(`[detectPitch] Could not delete temp output file: ${outputPath}`, e);
//     }

//     console.log('[detectPitch] Sending response with detected pitches');
//     const notes = pitches.map(frequencyToNoteName);
//     console.log(notes);
//     return res.json({ pitches,notes });

//   } catch (error) {
//     console.error('[detectPitch] Error decoding audio or detecting pitches:', error);
//     return res.status(500).json({ error: error.message });
//   }
// };

// function frequencyToNoteName(frequency) {
//   if (frequency === 0 || frequency == null) return null;

//   const noteNumber = Math.round(12 * (Math.log2(frequency / 440)) + 69);

//   // Filter out unrealistic pitches
//   if (noteNumber < 40 || noteNumber > 84) return null;

//   const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
//   const noteIndex = noteNumber % 12;
//   const octave = Math.floor(noteNumber / 12) - 1;

//   return noteNames[noteIndex] + octave;
// }






// // function frequencyToNote(freq) {
// //   const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// //   const A4 = 440;
// //   const semitone = 69 + 12 * Math.log2(freq / A4);
// //   const rounded = Math.round(semitone);
// //   const note = noteNames[((rounded % 12) + 12) % 12]; // handle negatives
// //   const octave = Math.floor(rounded / 12) - 1;
// //   return `${note}${octave}`;
// // }

// module.exports = { detectPitch };
