const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let model;

(async () => {
  model = await cocoSsd.load();
  console.log('COCO-SSD model loaded');
})();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('videoFrame', async (frame) => {
    const imgBuffer = Buffer.from(frame.split(',')[1], 'base64');
    const imgTensor = tf.node.decodeImage(imgBuffer);
    const predictions = await model.detect(imgTensor);
    socket.emit('description', { description: JSON.stringify(predictions) });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(8080, () => {
  console.log('Server is running on port 8080');
});
