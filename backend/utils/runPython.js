const { spawn } = require("child_process");

module.exports = function runPython(scriptPath, args = [], input = null) {
  return new Promise((resolve, reject) => {
    // Try python3 first, fall back to python
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    console.log(`Attempting to run Python script with command: ${pythonCommand}`);
    
    const py = spawn(pythonCommand, [scriptPath, ...args]);

    let stdout = "";
    let stderr = "";

    // Set a timeout for the entire process
    const timeout = setTimeout(() => {
      py.kill();
      reject({ message: "Python process timed out after 60 seconds" });
    }, 60000);

    if (input !== null) {
      py.stdin.write(JSON.stringify(input));
      py.stdin.end();
    }

    py.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log("Python stdout:", data.toString());
    });
    
    py.stderr.on("data", (data) => {
      stderr += data.toString();
      console.error("Python stderr:", data.toString());
    });

    py.on("error", (err) => {
      clearTimeout(timeout);
      console.error("Failed to start Python process:", err);
      reject({ message: "Failed to start Python process", error: err });
    });

    py.on("close", (code) => {
      clearTimeout(timeout);
      console.log(`Python process exited with code ${code}`);
      if (code !== 0) {
        return reject({ message: "Python script error", stderr, stdout });
      }

      const jsonMatch = stdout.match(/(\[.*?\]|\{.*\})/s);
      if (jsonMatch) {
        try {
          return resolve(JSON.parse(jsonMatch[1]));
        } catch (e) {
          return reject({ message: "Invalid JSON from Python", stdout, stderr });
        }
      }
      resolve(stdout);
    });
  });
};
