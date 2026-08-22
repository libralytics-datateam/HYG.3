const http = require('http');

const biometrics = {
  gender: "Male",
  age: 35,
  height: 180,
  weight: 75,
  heartRate: 80,
  sleepDuration: 6,
  steps: 10000,
  caloriesBurned: 2500,
  waterIntake: 2,
  stressLevel: 6,
  sunExposure: 1
};

const data = JSON.stringify(biometrics);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/v1/ai/predict',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  let output = '';
  res.on('data', d => {
    output += d;
  });
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(output), null, 2));
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
