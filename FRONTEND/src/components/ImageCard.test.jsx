import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageCard from './ImageCard';

const mockImage = {
    _id: '1',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: '2024-03-20T10:00:00Z',
    analysisResult: {
        basicMetrics: {
            engagementScore: 85,
            flagged: false
        },
        detailedAnalysis: {
            studentCount: 25,
            activityType: 'lecture',
            detectedObjects: ['desk', 'chair', 'whiteboard']
        }
    }
};

describe('ImageCard', () => {
    it('renders image and analysis results correctly', () => {
        render(<ImageCard image={mockImage} />);

        // Check if image is rendered
        const image = screen.getByAltText('Classroom');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', mockImage.imageUrl);

        // Check if analysis results are displayed
        expect(screen.getByText('Analysis Results')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('25 students')).toBeInTheDocument();
        expect(screen.getByText('LECTURE')).toBeInTheDocument();

        // Check if detected objects are displayed
        expect(screen.getByText('desk')).toBeInTheDocument();
        expect(screen.getByText('chair')).toBeInTheDocument();
        expect(screen.getByText('whiteboard')).toBeInTheDocument();
    });

    it('expands image when clicked', () => {
        render(<ImageCard image={mockImage} />);

        const image = screen.getByAltText('Classroom');
        fireEvent.click(image);

        // Check if expanded view is shown
        const expandedImage = screen.getAllByAltText('Classroom')[1];
        expect(expandedImage).toHaveClass('max-w-full', 'max-h-[80vh]');
    });

    it('shows flagged warning when image is flagged', () => {
        const flaggedImage = {
            ...mockImage,
            analysisResult: {
                ...mockImage.analysisResult,
                basicMetrics: {
                    ...mockImage.analysisResult.basicMetrics,
                    flagged: true
                }
            }
        };

        render(<ImageCard image={flaggedImage} />);
        expect(screen.getByText('This image has been flagged for review')).toBeInTheDocument();
    });

    it('applies correct color classes based on engagement score', () => {
        const { rerender } = render(<ImageCard image={mockImage} />);
        expect(screen.getByText('85%')).toHaveClass('text-green-600');

        const lowEngagementImage = {
            ...mockImage,
            analysisResult: {
                ...mockImage.analysisResult,
                basicMetrics: {
                    ...mockImage.analysisResult.basicMetrics,
                    engagementScore: 35
                }
            }
        };

        rerender(<ImageCard image={lowEngagementImage} />);
        expect(screen.getByText('35%')).toHaveClass('text-red-600');
    });

    it('closes expanded view when close button is clicked', () => {
        render(<ImageCard image={mockImage} />);

        // Open expanded view
        const image = screen.getByAltText('Classroom');
        fireEvent.click(image);

        // Check if expanded view is shown
        expect(screen.getAllByAltText('Classroom')[1]).toBeInTheDocument();

        // Click close button
        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        // Check if expanded view is closed
        expect(screen.queryAllByAltText('Classroom')).toHaveLength(1);
    });
}); 