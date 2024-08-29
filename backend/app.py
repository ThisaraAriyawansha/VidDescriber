from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import cv2
from clarifai.rest import ClarifaiApp # type: ignore

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize Clarifai app
app_clarifai = ClarifaiApp(api_key='7bbd48d702514d3e9cb2129b44c4b6a9')
model = app_clarifai.public_models.general_model

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file found'}), 400

    video = request.files['video']
    if video.filename == '':
        return jsonify({'error': 'No selected video'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, video.filename)
    video.save(filepath)

    # Initialize video capture
    cap = cv2.VideoCapture(filepath)
    description = "Objects detected in video:"

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Save frame as temporary image
        temp_file = 'temp_frame.jpg'
        cv2.imwrite(temp_file, frame)

        # Perform object detection
        with open(temp_file, 'rb') as image_file:
            response = model.predict_by_bytes(image_file.read())

        # Process response
        regions = response['outputs'][0]['data']['regions']
        for region in regions:
            top_row = round(region['region_info']['bounding_box']['top_row'], 3)
            left_col = round(region['region_info']['bounding_box']['left_col'], 3)
            bottom_row = round(region['region_info']['bounding_box']['bottom_row'], 3)
            right_col = round(region['region_info']['bounding_box']['right_col'], 3)
            for concept in region['data']['concepts']:
                name = concept['name']
                value = round(concept['value'], 4)
                description += f"\n{name}: {value} BBox: {top_row}, {left_col}, {bottom_row}, {right_col}"

        os.remove(temp_file)
    
    cap.release()

    return jsonify({'description': description})

if __name__ == '__main__':
    app.run(debug=True)
