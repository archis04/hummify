const { default: fetch } = require("node-fetch");
const { PitchDetector } = require("pitchfinder");

const detectPitchFromURL = async (audioUrl) => {
  const res = await fetch(audioUrl);
  const audioBuffer = await res.buffer(); // Might need decoding to PCM

  // Real pitch detection needs PCM (WAV) format
  // You’ll likely need ffmpeg or decode to raw PCM here
  // Use pitchfinder on PCM array

  return ["A4", "C5", "E4"]; // dummy return for now
};

module.exports = detectPitchFromURL;
