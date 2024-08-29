const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cv = require('opencv4nodejs');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let model;

async function loadModel() {
  model = await cocoSsd.load();
}

loadModel();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('videoFrame', async (data) => {
    const frameBuffer = Buffer.from(data.split(',')[1], 'base64');
    const frame = cv.imdecode(frameBuffer);
    const predictions = await model.detect(frame);
    const description = predictions.map(pred => `${pred.class} detected`).join(', ');
    socket.emit('description', { description });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.use(express.static('build')); // Serve static files from the React build

server.listen(8080, () => {
  console.log('Server is running on port 8080');
});
