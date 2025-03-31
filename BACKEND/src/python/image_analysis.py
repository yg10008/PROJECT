import cv2
import numpy as np
from tensorflow import keras
from PIL import Image
import io

def analyze_classroom_image(image_bytes):
    try:
        # Convert bytes to image
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image)
        
        # Perform analysis
        results = {
            'student_count': detect_students(image_np),
            'engagement'
        }
        return results
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return None 