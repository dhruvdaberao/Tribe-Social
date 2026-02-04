import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    containerClassName?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ className, containerClassName, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={`relative ${containerClassName || ''}`}>
            <input
                type={showPassword ? 'text' : 'password'}
                className={`${className} pr-10`} // Add padding right to prevent text overlap with icon
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors focus:outline-none"
                tabIndex={-1} // Prevent tabbing to this button for smoother form navigation
            >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>
    );
};

export default PasswordInput;
