import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './styles.css';

const socket = io('http://localhost:8080'); // Update with your server URL

function App() {
  const [description, setDescription] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    socket.on('description', (data) => {
      setDescription(data.description);
    });
  }, []);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      videoRef.current.src = videoUrl;
      videoRef.current.play();
      sendFrames(file);
    }
  };

  const sendFrames = (file) => {
    const videoElement = videoRef.current;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    videoElement.addEventListener('play', () => {
      const interval = setInterval(() => {
        if (!videoElement.paused && !videoElement.ended) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL('image/jpeg');
          socket.emit('videoFrame', frame);
        }
      }, 100); // Adjust the interval as needed
    });
  };

  return (
    <div className="App">
      <h1>VidDescriber</h1>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      <video ref={videoRef} controls />
      <div>
        <h3>Live Description:</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default App;
