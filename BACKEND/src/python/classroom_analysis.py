import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
import json
import sys
import io

class ClassroomAnalyzer:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.model = self.load_model()

    def load_model(self):
        try:
            return tf.keras.models.load_model('models/classroom_analysis_model.h5')
        except Exception as e:
            print(json.dumps({
                'error': f'Failed to load model: {str(e)}'
            }))
            sys.exit(1)

    def process_image(self, image_bytes):
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
            
            # Detect faces (for student count)
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5
            )
            
            # Analyze engagement
            engagement_score = self.analyze_engagement(image_np)
            
            # Detect activity
            activity_type = self.detect_activity(image_np)
            
            result = {
                'student_count': len(faces),
                'engagement_score': float(engagement_score),
                'activity_type': activity_type,
                'timestamp': datetime.now().isoformat()
            }
            
            print(json.dumps(result))
            return 0
            
        except Exception as e:
            print(json.dumps({
                'error': f'Analysis failed: {str(e)}'
            }))
            return 1

    def analyze_engagement(self, image):
        # Preprocess image for the model
        processed_image = self.preprocess_image(image)
        
        # Get model prediction
        prediction = self.model.predict(processed_image)
        
        return prediction[0][0]  # Engagement score between 0 and 1

    def detect_activity(self, image):
        # Activity detection logic
        # Returns one of: 'lecture', 'group_work', 'individual_work'
        pass

if __name__ == '__main__':
    analyzer = ClassroomAnalyzer()
    image_bytes = sys.stdin.buffer.read()
    sys.exit(analyzer.process_image(image_bytes)) 