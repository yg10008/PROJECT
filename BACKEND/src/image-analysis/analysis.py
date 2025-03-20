import cv2
import mediapipe as mp
import requests
import sys
import json

def analyze_image(image_url):
    try:
        response = requests.get(image_url)
        image_array = np.frombuffer(response.content, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        mp_face_detection = mp.solutions.face_detection
        with mp_face_detection.FaceDetection(min_detection_confidence=0.5) as face_detection:
            results = face_detection.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        people_count = len(results.detections) if results.detections else 0
        engagement_score = people_count * 10  
        flagged = people_count == 0  
        reason = "No people detected" if flagged else "Normal"

        result = {
            "peopleCount": people_count,
            "engagementScore": engagement_score,
            "flagged": flagged,
            "reason": reason
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    image_url = sys.argv[1]  
    analyze_image(image_url)
