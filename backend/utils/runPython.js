const { spawn } = require('child_process');

module.exports = function runPython(scriptPath, args, inputData) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting Python script: ${scriptPath}`);
    console.log(`➡️ Arguments:`, args);
    if (inputData !== undefined) {
      console.log(`📨 Sending input data to Python:`, inputData);
    }

    const pythonProcess = spawn('python3', [scriptPath, ...args]);

    if (inputData !== undefined) {
      pythonProcess.stdin.write(JSON.stringify(inputData));
    }
    pythonProcess.stdin.end();

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      console.log(`📤 Python stdout chunk:`, data.toString());
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`❌ Python stderr chunk:`, data.toString());
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log(`✅ Python process exited with code ${code}`);
      if (code !== 0) {
        console.error(`❗ Error: Python exited with non-zero code`);
        return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }

      try {
        const parsed = JSON.parse(stdout);
        console.log(`✅ Successfully parsed Python output`);
        resolve(parsed);
      } catch (e) {
        console.error(`⚠️ Failed to parse Python output as JSON`);
        reject(new Error(`Invalid JSON from Python: ${stdout}\n${stderr}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error(`🔥 Failed to spawn Python process:`, err);
      reject(err);
    });
  });
};
