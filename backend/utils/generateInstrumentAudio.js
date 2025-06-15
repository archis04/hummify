// const { spawn } = require("child_process");

// function generateInstrumentAudio(noteArray) {
//   return new Promise((resolve, reject) => {
//     const py = spawn("python3", ["./python/synth.py"]);
//     let stderr = "";

//     py.stdin.write(JSON.stringify(noteArray));
//     py.stdin.end();

//     py.stderr.on("data", (data) => (stderr += data.toString()));

//     py.on("close", (code) => {
//       if (code === 0) {
//         resolve("output.wav"); // Or upload this to Cloudinary and return the URL
//       } else {
//         reject(new Error(`Python script failed: ${stderr}`));
//       }
//     });
//   });
// }
