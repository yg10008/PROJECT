import sys
import cv2
import mediapipe as mp
import json
import requests
from PIL import Image
from io import BytesIO
import numpy as np  # Ensure numpy is imported

def analyze_image(image_url):
    try:
        # Download Image
        response = requests.get(image_url)
        response.raise_for_status()  # Ensure the request was successful
        image_data = Image.open(BytesIO(response.content))

        # Convert Image for OpenCV Processing
        image_rgb = cv2.cvtColor(np.array(image_data), cv2.COLOR_RGB2BGR)

        # Initialize MediaPipe Pose Estimation
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(static_image_mode=True)

        # Pose Detection
        results = pose.process(image_rgb)
        people_count = 1 if results.pose_landmarks else 0
        engagement_score = people_count * 50
        flagged = people_count == 0
        reason = "No individuals detected" if flagged else "Analysis successful"

        return {
            "peopleCount": people_count,
            "engagementScore": engagement_score,
            "flagged": flagged,
            "reason": reason
        }
    
    except Exception as e:
        return {
            "peopleCount": 0,
            "engagementScore": 0,
            "flagged": True,
            "reason": f"Analysis failed: {str(e)}"
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image URL provided"}))
        sys.exit(1)

    image_url = sys.argv[1]
    result = analyze_image(image_url)
    print(json.dumps(result))
