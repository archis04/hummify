//backend/controllers/analyzeController.js
const runPython = require("../utils/runPython");

exports.analyzeAudio = async (req, res) => {
  const { audioUrl } = req.body;

  if (!audioUrl) {
    return res.status(400).json({ error: "audioUrl is required" });
  }

  try {
    const result = await runPython("./python/audiotonotes.py", [audioUrl]);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[Python Script Error]", err.stderr || err.message);
    return res.status(500).json({
      error: err.message || "Unexpected error",
      stderr: err.stderr,
      stdout: err.stdout,
    });
  }
};
