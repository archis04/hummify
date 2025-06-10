const { spawn } = require("child_process");

const runPython = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    const process = spawn("python", [scriptPath, ...args]);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        return reject({ message: "Python script error", stderr });
      }

      // Extract first valid JSON array or object from stdout
      const jsonMatch = stdout.match(/(\[.*?\]|\{.*\})/s);
      if (!jsonMatch) {
        return reject({
          message: "Failed to extract JSON from Python output",
          stdout,
          stderr,
        });
      }

      try {
        const result = JSON.parse(jsonMatch[1]);
        resolve(result);
      } catch (err) {
        reject({
          message: "Failed to parse extracted JSON",
          stdout,
          stderr,
        });
      }
    });
  });
};

module.exports = runPython;
