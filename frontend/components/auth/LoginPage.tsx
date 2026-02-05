import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import * as api from '../../api';
import { toast } from '../common/Toast';
import PasswordInput from '../common/PasswordInput';
import { isValidUsername, normalizeUsername, usernameValidationMessage } from '../../utils/usernameValidation';

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  setCurrentUser: (user: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'otp';

const LoginPage: React.FC = () => {
  const auth = useAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleError = (err: any) => {
    if (axios.isAxiosError(err)) {
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } else {
      setError('An unexpected error occurred.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) throw new Error('Fill all fields.');
        await auth.login(email, password);
      } else if (mode === 'register') {
        if (!name || !username || !email || !password) throw new Error('Fill all fields.');
        const normalized = normalizeUsername(username);
        if (!isValidUsername(normalized)) {
          setUsernameError(usernameValidationMessage);
          throw new Error('Please fix the username format.');
        }
        await auth.register(name, normalized, email, password);
      } else if (mode === 'forgot') {
        if (!email) throw new Error('Enter your email.');
        await api.forgotPassword(email);
        setMode('otp');
        toast.info("OTP sent to your email!");
        setResendTimer(60);
      } else if (mode === 'otp') {
        if (!otp || otp.length !== 6) throw new Error('Enter 6-digit OTP.');
        const { data } = await api.verifyOtp(email, otp);
        localStorage.setItem('token', data.token);
        auth.setCurrentUser(data.user);
        toast.success("Welcome back!");
        // Persistent reminder via success toast
        setTimeout(() => {
          toast.info("Security Tip: Please update your password from Settings soon.");
        }, 1500);
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        handleError(err);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setResendTimer(60);
      toast.success("New OTP sent!");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img
              src={theme === 'dark' ? '/white-color-logo.png' : '/black-color-logo.png'}
              alt="Tribe Logo"
              className="h-40 sm:h-32 md:h-36 w-auto object-contain select-none"
            />
          </div>
          <p className="text-secondary mt-2">Connect with your community.</p>
        </div>

        <div className="bg-surface p-8 rounded-2xl shadow-lg border border-border">
          <h2 className="text-2xl font-bold text-center text-primary mb-8">
            {mode === 'login' ? 'Log In' : mode === 'register' ? 'Sign Up' : mode === 'forgot' ? 'Reset Access' : 'Verify OTP'}
          </h2>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="mb-4">
                  <label className="block text-secondary text-sm font-semibold mb-2">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary" placeholder="Alex Jordan" disabled={isLoading} />
                </div>
                <div className="mb-4">
                  <label className="block text-secondary text-sm font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const normalized = normalizeUsername(e.target.value);
                      setUsername(normalized);
                      if (!normalized) {
                        setUsernameError('');
                        return;
                      }
                      setUsernameError(isValidUsername(normalized) ? '' : usernameValidationMessage);
                    }}
                    className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                    placeholder="alex.j"
                    disabled={isLoading}
                  />
                  {usernameError && (
                    <p className="text-xs text-red-400 mt-2">{usernameError}</p>
                  )}
                </div>
              </>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div className="mb-4">
                <label className="block text-secondary text-sm font-semibold mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary" placeholder="you@example.com" disabled={isLoading} />
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div className="mb-2">
                <label className="block text-secondary text-sm font-semibold mb-2">Password</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right mb-4">
                <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-sm font-semibold text-accent hover:underline">Forgot Password?</button>
              </div>
            )}

            {mode === 'otp' && (
              <div className="mb-6 text-center">
                <p className="text-secondary text-sm mb-4">We've sent a 6-digit code to <strong>{email}</strong></p>
                <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-3xl tracking-[1rem] font-bold p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary" placeholder="000000" disabled={isLoading} />
                <div className="mt-4">
                  <button type="button" onClick={handleResendOtp} disabled={isLoading || resendTimer > 0} className={`text-sm font-semibold ${resendTimer > 0 ? 'text-secondary' : 'text-accent hover:underline'}`}>
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-text font-semibold p-3 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50">
              {isLoading ? 'Processing...' : mode === 'login' ? 'Log In' : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Send OTP' : 'Verify & Login'}
            </button>
          </form>

          <p className="text-center text-secondary text-sm mt-6">
            {mode === 'forgot' || mode === 'otp' ? (
              <button onClick={() => { setMode('login'); setError(''); }} className="font-semibold text-accent hover:underline">Back to Login</button>
            ) : mode === 'login' ? (
              <>Don't have an account? <button onClick={() => { setMode('register'); setError(''); }} className="font-semibold text-accent hover:underline ml-1">Sign Up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }} className="font-semibold text-accent hover:underline ml-1">Log In</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
