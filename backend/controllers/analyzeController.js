const fetch = require("node-fetch");

exports.analyzeAudio = async (req, res) => {
  const { audioUrl } = req.body;
  console.log("[analyzeAudio] Incoming request body:", req.body);

  if (!audioUrl) {
    console.log("[analyzeAudio] audioUrl missing in request body");
    return res.status(400).json({ error: "audioUrl is required" });
  }

  try {
    const response = await fetch("https://arcriser-audiotonotes.hf.space/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[analyzeAudio] Hugging Face Error:", result);
      return res.status(response.status).json(result);
    }

    console.log("[analyzeAudio] Received result from Hugging Face:", result);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[analyzeAudio] Error while calling Hugging Face:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

































// // backend/controllers/analyzeController.js
// const runPython = require("../utils/runPython");
// const path = require("path"); // <--- Make sure to import 'path'

// exports.analyzeAudio = async (req, res) => {
//   console.log("[analyzeAudio] Incoming request body:", req.body);
//   const { audioUrl } = req.body;

//   if (!audioUrl) {
//     console.log("[analyzeAudio] audioUrl missing in request body");
//     return res.status(400).json({ error: "audioUrl is required" });
//   }

//   try {
//     // Construct the correct absolute path to the Python script inside the container
//     const scriptPath = path.join(__dirname, "..", "python", "audiotonotes.py");
//     console.log("[analyzeAudio] Using scriptPath:", scriptPath);
//     // Now pass the correct path to runPython
//     const result = await runPython(scriptPath, [audioUrl]);
//     console.log("[analyzeAudio] Python script result:", result);
//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     console.error("[analyzeAudio] [Python Script Error]", err.stderr || err.message);
//     return res.status(500).json({
//       success: false,
//       error: err.message || "Unexpected error",
//       stderr: err.stderr,
//       stdout: err.stdout,
//     });
//   }
// };