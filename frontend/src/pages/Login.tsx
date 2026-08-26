import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, Lock, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle, 
  Sparkles, HelpCircle, ShieldCheck, Mail
} from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Mode state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const success = await login(username.trim(), password);

    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetInput.trim()) {
      setError('Please enter your registered email or username.');
      return;
    }

    setError(null);
    setResetLoading(true);

    // Simulate OTP / Reset email request delay
    setTimeout(() => {
      setResetLoading(false);
      setResetSuccess(true);
    }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(circle at 50% 20%, #0F2C14 0%, #061509 70%, #030D06 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Floating Decorative Emojis */}
      <div style={{
        position: 'absolute',
        top: '10%', left: '8%',
        fontSize: '42px', opacity: 0.15,
        animation: 'floatY 6s ease-in-out infinite',
        pointerEvents: 'none'
      }}>🥛</div>
      <div style={{
        position: 'absolute',
        bottom: '12%', right: '10%',
        fontSize: '48px', opacity: 0.15,
        animation: 'floatY 7s ease-in-out infinite 1s',
        pointerEvents: 'none'
      }}>🐄</div>
      <div style={{
        position: 'absolute',
        top: '20%', right: '12%',
        fontSize: '36px', opacity: 0.12,
        animation: 'floatY 5s ease-in-out infinite 0.5s',
        pointerEvents: 'none'
      }}>🧀</div>
      <div style={{
        position: 'absolute',
        bottom: '15%', left: '12%',
        fontSize: '40px', opacity: 0.12,
        animation: 'floatY 8s ease-in-out infinite 1.5s',
        pointerEvents: 'none'
      }}>🌿</div>

      {/* Top Floating Navigation */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '0',
        right: '0',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(74, 186, 126, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(74, 186, 126, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          fontWeight: 500
        }}>
          <ShieldCheck size={14} style={{ color: '#4aba7e' }} />
          <span>Secure Encrypted Portal</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div style={{
        maxWidth: '440px',
        width: '100%',
        margin: '40px auto 0',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(74, 186, 126, 0.25)',
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(74, 186, 126, 0.1)',
        color: '#fff',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2E7D32, #43A047)',
            color: '#fff',
            fontSize: '28px',
            fontWeight: '900',
            boxShadow: '0 8px 24px rgba(46, 125, 50, 0.5)',
            marginBottom: '12px'
          }}>
            L
          </div>

          <h1 style={{
            fontSize: '26px',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            margin: 0,
            background: 'linear-gradient(to right, #ffffff, #a2ebd0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            LITER
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '4px',
            fontWeight: 500
          }}>
            {isForgotPassword ? 'Reset Your Account Password' : 'Smart Digital Dairy Management Platform'}
          </p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 83, 80, 0.15)',
            border: '1px solid rgba(239, 83, 80, 0.35)',
            color: '#ff8a80',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* MODE 1: FORGOT PASSWORD FLOW */}
        {isForgotPassword ? (
          <div>
            {resetSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '20px 12px',
                background: 'rgba(74, 186, 126, 0.1)',
                border: '1px solid rgba(74, 186, 126, 0.3)',
                borderRadius: '16px',
                color: '#fff',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '50%', backgroundColor: 'rgba(74, 186, 126, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', color: '#4aba7e'
                }}>
                  <CheckCircle size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#4aba7e' }}>
                  Reset Link Sent!
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5, margin: 0 }}>
                  We've dispatched password reset instructions to <strong>{resetInput}</strong>. Please check your inbox or spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSuccess(false);
                    setResetInput('');
                  }}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(74, 186, 126, 0.4)',
                    background: 'rgba(74, 186, 126, 0.15)',
                    color: '#a2ebd0',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '8px', fontWeight: 600 }}>
                    Registered Email or Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                      type="text"
                      required
                      value={resetInput}
                      onChange={(e) => setResetInput(e.target.value)}
                      placeholder="e.g. owner@kairy.com or admin"
                      disabled={resetLoading}
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <KeyRound size={18} />
                  <span>{resetLoading ? 'Sending Instructions...' : 'Send Password Reset Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  ← Back to Login
                </button>
              </form>
            )}
          </div>
        ) : (
          /* MODE 2: REGULAR LOGIN FORM */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '8px', fontWeight: 600 }}>
                Username / Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username or email"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: '#b2c7bc', fontWeight: 600, margin: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4aba7e',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: '#2E7D32',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="remember" style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}>
                Remember this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(46, 125, 50, 0.4)',
                marginTop: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {isSubmitting ? 'Authenticating...' : '🚀 Sign In to Dashboard'}
            </button>
          </form>
        )}

        {/* Footer Link to Register */}
        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Don't have a dairy business account?{' '}
          <Link
            to="/register"
            style={{
              color: '#4aba7e',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Register Dairy →
          </Link>
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{
        marginTop: '24px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        zIndex: 1
      }}>
        © {new Date().getFullYear()} LITER · Smart Dairy Management System
      </div>
    </div>
  );
};

