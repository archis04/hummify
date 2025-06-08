const detectPitchFromURL = require("../helpers/pitchDetector.js");

exports.analyzeAudio = async (req, res) => {
  try {
    const { url } = req.body;
    const notes = await detectPitchFromURL(url);
    res.status(200).json({ success: true, notes });
  } catch (error) {
    console.error("Error analyzing audio:", error);
    res.status(500).json({ success: false, message: "Analysis failed" });
  }
};
