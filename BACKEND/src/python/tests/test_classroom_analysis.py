import unittest
import numpy as np
from classroom_analysis import ClassroomAnalyzer
import cv2

class TestClassroomAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = ClassroomAnalyzer()
        self.sample_image = np.zeros((300, 300, 3), dtype=np.uint8)

    def test_face_detection(self):
        # Create a sample image with a face-like pattern
        cv2.circle(self.sample_image, (150, 150), 60, (255, 255, 255), -1)
        
        result = self.analyzer.process_image(self.sample_image)
        self.assertTrue(result) 