// backend/controllers/analyzeController.js
const runPython = require("../utils/runPython");
const path = require("path"); // <--- Make sure to import 'path'

exports.analyzeAudio = async (req, res) => {
  console.log("[analyzeAudio] Incoming request body:", req.body);
  const { audioUrl } = req.body;

  if (!audioUrl) {
    console.log("[analyzeAudio] audioUrl missing in request body");
    return res.status(400).json({ error: "audioUrl is required" });
  }

  try {
    // Construct the correct absolute path to the Python script inside the container
    const scriptPath = path.join(__dirname, "..", "python", "audiotonotes.py");
    console.log("[analyzeAudio] Using scriptPath:", scriptPath);
    // Now pass the correct path to runPython
    const result = await runPython(scriptPath, [audioUrl]);
    console.log("[analyzeAudio] Python script result:", result);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[analyzeAudio] [Python Script Error]", err.stderr || err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Unexpected error",
      stderr: err.stderr,
      stdout: err.stdout,
    });
  }
};