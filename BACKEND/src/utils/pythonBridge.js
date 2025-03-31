const { spawn } = require('child_process');
const path = require('path');

const runPythonAnalysis = async (imageBuffer) => {
    try {
        const pythonProcess = spawn('python', [
            path.join(__dirname, '../python/image_analysis.py')
        ]);

        return new Promise((resolve, reject) => {
            let result = '';
            
            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Python Error: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error('Python process failed'));
                } else {
                    resolve(JSON.parse(result));
                }
            });

            pythonProcess.stdin.write(imageBuffer);
            pythonProcess.stdin.end();
        });
    } catch (error) {
        logError('Python analysis failed', error);
        throw new Error('Image analysis failed');
    }
}; 