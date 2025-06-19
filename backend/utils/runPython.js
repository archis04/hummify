// runPython.js
const { spawn } = require('child_process');

module.exports = function runPython(scriptPath, args, inputData) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, ...args]);
    
    if (inputData !== undefined) {
      pythonProcess.stdin.write(JSON.stringify(inputData));
    }
    pythonProcess.stdin.end();
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
      
      try {
        // Return parsed JSON instead of raw string
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Invalid JSON from Python: ${stdout}\n${stderr}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      reject(err);
    });
  });
};