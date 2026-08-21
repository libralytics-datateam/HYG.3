import { spawn } from 'child_process';
import path from 'path';

export interface PatientBiometrics {
  gender: 'Male' | 'Female';
  age: number;
  height: number;
  weight: number;
  heartRate: number;
  sleepDuration: number;
  steps: number;
  caloriesBurned: number;
  waterIntake: number;
  stressLevel: number;
  sunExposure: number;
}

export interface PredictionResult {
  prediction: string;
  confidence: number;
  mapped_features: Record<string, number>;
}

export async function runPrediction(biometrics: PatientBiometrics): Promise<PredictionResult> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml/predict.py'),
      JSON.stringify(biometrics)
    ]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', errorData);
        reject(new Error(`Python process exited with code ${code}`));
        return;
      }

      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (e) {
        console.error('Failed to parse Python output:', outputData);
        reject(new Error('Invalid output format from ML script'));
      }
    });

    // pythonProcess.stdin.write(JSON.stringify(biometrics));
    // pythonProcess.stdin.end();
  });
}
