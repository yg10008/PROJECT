import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageComparison from './ImageComparison';

const mockImages = [
    {
        _id: '1',
        imageUrl: 'https://example.com/image1.jpg',
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
    },
    {
        _id: '2',
        imageUrl: 'https://example.com/image2.jpg',
        createdAt: '2024-03-21T10:00:00Z',
        analysisResult: {
            basicMetrics: {
                engagementScore: 75,
                flagged: false
            },
            detailedAnalysis: {
                studentCount: 23,
                activityType: 'group_work',
                detectedObjects: ['desk', 'chair', 'projector']
            }
        }
    }
];

describe('ImageComparison', () => {
    it('renders initial interface correctly', () => {
        render(<ImageComparison images={mockImages} />);

        // Check if title and mode selector are rendered
        expect(screen.getByText('Compare Images')).toBeInTheDocument();
        const modeSelector = screen.getByRole('combobox');
        expect(modeSelector).toBeInTheDocument();
        expect(modeSelector).toHaveValue('engagement');

        // Check if images are rendered with select buttons
        const images = screen.getAllByRole('img', { name: 'Classroom' });
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute('src', mockImages[0].imageUrl);
        expect(images[1]).toHaveAttribute('src', mockImages[1].imageUrl);

        const selectButtons = screen.getAllByText('Select for Comparison');
        expect(selectButtons).toHaveLength(2);
    });

    it('handles empty images array', () => {
        render(<ImageComparison images={[]} />);
        expect(screen.getByText('Compare Images')).toBeInTheDocument();
        expect(screen.queryByText('Select for Comparison')).not.toBeInTheDocument();
    });

    it('handles single image', () => {
        render(<ImageComparison images={[mockImages[0]]} />);
        
        // Should show one image with select button
        const images = screen.getAllByRole('img', { name: 'Classroom' });
        expect(images).toHaveLength(1);
        expect(screen.getByText('Select for Comparison')).toBeInTheDocument();
    });

    it('allows selecting and comparing images', () => {
        render(<ImageComparison images={mockImages} />);

        // Select both images
        const selectButtons = screen.getAllByText('Select for Comparison');
        fireEvent.click(selectButtons[0]);
        fireEvent.click(selectButtons[1]);

        // Check if selected images are shown
        expect(screen.getByText('Selected Images')).toBeInTheDocument();
        
        // Check if comparison results are shown
        expect(screen.getByText('Comparison Results')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('allows changing comparison mode', () => {
        render(<ImageComparison images={mockImages} />);

        // Select both images
        const selectButtons = screen.getAllByText('Select for Comparison');
        fireEvent.click(selectButtons[0]);
        fireEvent.click(selectButtons[1]);

        // Change to attendance mode
        const modeSelector = screen.getByRole('combobox');
        fireEvent.change(modeSelector, { target: { value: 'attendance' } });

        // Check if attendance comparison is shown
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('23')).toBeInTheDocument();
        expect(screen.getByText('2%')).toBeInTheDocument();
    });

    it('allows deselecting images', () => {
        render(<ImageComparison images={mockImages} />);

        // Select both images
        const selectButtons = screen.getAllByText('Select for Comparison');
        fireEvent.click(selectButtons[0]);
        fireEvent.click(selectButtons[1]);

        // Check if comparison is shown
        expect(screen.getByText('Comparison Results')).toBeInTheDocument();

        // Deselect first image
        const deselectButton = screen.getAllByText('×')[0];
        fireEvent.click(deselectButton);

        // Check if comparison is removed
        expect(screen.queryByText('Comparison Results')).not.toBeInTheDocument();
    });
}); 