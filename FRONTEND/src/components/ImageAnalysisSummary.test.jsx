import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImageAnalysisSummary from './ImageAnalysisSummary';

const mockSummaryData = {
    totalImages: 100,
    averageEngagement: 75.5,
    activityBreakdown: {
        lecture: 40,
        group_work: 30,
        individual_work: 20,
        other: 10
    },
    flaggedImages: 5,
    averageStudentCount: 23.5,
    commonObjects: [
        { object: 'desk', count: 95 },
        { object: 'chair', count: 90 },
        { object: 'whiteboard', count: 85 },
        { object: 'projector', count: 60 }
    ],
    timeOfDayAnalysis: {
        morning: { count: 40, avgEngagement: 80 },
        afternoon: { count: 35, avgEngagement: 75 },
        evening: { count: 25, avgEngagement: 70 }
    }
};

describe('ImageAnalysisSummary', () => {
    it('renders all summary sections correctly', () => {
        render(<ImageAnalysisSummary data={mockSummaryData} />);

        // Check basic metrics
        expect(screen.getByText('Total Images Analyzed:')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Average Engagement:')).toBeInTheDocument();
        expect(screen.getByText('75.5%')).toBeInTheDocument();

        // Check activity breakdown
        expect(screen.getByText('Activity Type Distribution')).toBeInTheDocument();
        expect(screen.getByText('Lecture: 40%')).toBeInTheDocument();
        expect(screen.getByText('Group Work: 30%')).toBeInTheDocument();
        expect(screen.getByText('Individual Work: 20%')).toBeInTheDocument();
        expect(screen.getByText('Other: 10%')).toBeInTheDocument();

        // Check flagged images
        expect(screen.getByText('Flagged Images:')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();

        // Check student count
        expect(screen.getByText('Average Student Count:')).toBeInTheDocument();
        expect(screen.getByText('23.5')).toBeInTheDocument();

        // Check common objects
        expect(screen.getByText('Most Common Objects')).toBeInTheDocument();
        expect(screen.getByText('desk (95%)')).toBeInTheDocument();
        expect(screen.getByText('chair (90%)')).toBeInTheDocument();
        expect(screen.getByText('whiteboard (85%)')).toBeInTheDocument();
        expect(screen.getByText('projector (60%)')).toBeInTheDocument();

        // Check time of day analysis
        expect(screen.getByText('Time of Day Analysis')).toBeInTheDocument();
        expect(screen.getByText('Morning: 40 images, 80% engagement')).toBeInTheDocument();
        expect(screen.getByText('Afternoon: 35 images, 75% engagement')).toBeInTheDocument();
        expect(screen.getByText('Evening: 25 images, 70% engagement')).toBeInTheDocument();
    });

    it('handles empty data', () => {
        const emptyData = {
            totalImages: 0,
            averageEngagement: 0,
            activityBreakdown: {},
            flaggedImages: 0,
            averageStudentCount: 0,
            commonObjects: [],
            timeOfDayAnalysis: {}
        };

        render(<ImageAnalysisSummary data={emptyData} />);
        expect(screen.getByText('No analysis data available')).toBeInTheDocument();
    });

    it('applies correct color classes based on engagement scores', () => {
        render(<ImageAnalysisSummary data={mockSummaryData} />);
        
        // Check morning engagement color (high)
        expect(screen.getByText('Morning: 40 images, 80% engagement')).toHaveClass('text-green-600');
        
        // Check evening engagement color (lower)
        expect(screen.getByText('Evening: 25 images, 70% engagement')).toHaveClass('text-yellow-600');
    });

    it('formats percentages correctly', () => {
        render(<ImageAnalysisSummary data={mockSummaryData} />);
        
        // Check if percentages are formatted with one decimal place
        expect(screen.getByText('75.5%')).toBeInTheDocument();
        
        // Check if whole numbers don't show decimal
        expect(screen.getByText('Lecture: 40%')).toBeInTheDocument();
    });
}); 