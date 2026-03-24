import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';
import { Mail } from 'lucide-react';

describe('Input Component', () => {
    it('renders with label and placeholder', () => {
        render(<Input label="Email" placeholder="test@example.com" id="email" />);
        
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/test@example.com/i)).toBeInTheDocument();
    });

    it('displays helper text when provided', () => {
        render(<Input label="Password" helperText="Must be 8 characters" id="password" />);
        
        expect(screen.getByText(/must be 8 characters/i)).toBeInTheDocument();
    });

    it('displays error message and ignores helper text when error is provided', () => {
        render(
            <Input 
                label="Email" 
                error="Invalid email" 
                helperText="We'll never share your email" 
                id="email" 
            />
        );
        
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
        expect(screen.queryByText(/we'll never share your email/i)).not.toBeInTheDocument();
        
        // Check for error class on input
        const input = screen.getByLabelText(/email/i);
        expect(input).toHaveClass('border-red-500');
    });

    it('renders with an icon', () => {
        const { container } = render(
            <Input label="Search" icon={<Mail data-testid="mail-id" />} id="search" />
        );
        
        // Since the guideline says avoid testId, let's see if we can find it differently.
        // But for decorative icons, sometimes testId is the only way if they don't have text.
        // However, we can check if the parent div with class "relative" has an icon child.
        const iconContainer = container.querySelector('.absolute.left-3');
        expect(iconContainer).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
        render(<Input label="Name" disabled id="name" />);
        
        const input = screen.getByLabelText(/name/i);
        expect(input).toBeDisabled();
        expect(input).toHaveClass('disabled:bg-slate-50');
    });

    it('calls onChange when value changes', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();
        render(<Input label="Name" onChange={handleChange} id="name" />);
        
        const input = screen.getByLabelText(/name/i);
        await user.type(input, 'John');
        
        expect(handleChange).toHaveBeenCalled();
    });

    it('works correctly with registration from react-hook-form', async () => {
        const registration = {
            name: 'testName',
            onChange: vi.fn(),
            onBlur: vi.fn(),
            ref: vi.fn()
        };
        const user = userEvent.setup();
        render(<Input label="Test" registration={registration} id="test" />);
        
        const input = screen.getByLabelText(/test/i);
        await user.type(input, 'Testing');
        
        expect(registration.onChange).toHaveBeenCalled();
    });
});
