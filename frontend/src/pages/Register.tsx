import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Building2, Lock, Eye, EyeOff, Mail, Phone, MapPin, 
  ArrowLeft, CheckCircle2, ShieldCheck, ChevronRight, ChevronLeft 
} from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState('100-500 L/day');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (currentStep === 1) {
      if (!fullName.trim() || !email.trim()) {
        setError('Please provide your Full Name and Email Address.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!businessName.trim()) {
        setError('Please enter your Dairy Business Name.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password || !confirmPassword) {
      setError('Please fill in all security credential fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (!agreedTerms) {
      setError('Please accept the Terms & Privacy Policy to register.');
      return;
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          email: email.trim(),
          fullName: fullName.trim(),
          businessName: businessName.trim(),
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Registration failed. Please check your details.';
        try {
          const text = await response.text();
          if (text) {
            // Try to parse if JSON error object or plain string
            try {
              const json = JSON.parse(text);
              errorMsg = json.message || json.error || text;
            } catch {
              errorMsg = text;
            }
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
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
      padding: '32px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Decorative Emojis */}
      <div style={{
        position: 'absolute', top: '8%', left: '6%',
        fontSize: '48px', opacity: 0.15,
        pointerEvents: 'none'
      }}>🐄</div>
      <div style={{
        position: 'absolute', bottom: '10%', right: '8%',
        fontSize: '44px', opacity: 0.15,
        pointerEvents: 'none'
      }}>🥛</div>

      {/* Top Bar */}
      <div style={{
        position: 'absolute',
        top: '20px', left: '0', right: '0',
        padding: '0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        maxWidth: '1200px', margin: '0 auto', zIndex: 10
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff', padding: '8px 16px', borderRadius: '24px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(10px)', transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', fontWeight: 500
        }}>
          <ShieldCheck size={14} style={{ color: '#4aba7e' }} />
          <span>Verified Dairy Onboarding</span>
        </div>
      </div>

      {/* Glassmorphic Card Container */}
      <div style={{
        maxWidth: '520px',
        width: '100%',
        margin: '40px auto 0',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(74, 186, 126, 0.25)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(74, 186, 126, 0.1)',
        color: '#fff',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #2E7D32, #43A047)',
            color: '#fff', fontSize: '24px', fontWeight: '900',
            boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)', marginBottom: '10px'
          }}>
            L
          </div>

          <h2 style={{
            fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0,
            background: 'linear-gradient(to right, #ffffff, #a2ebd0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Register Your Dairy on LITER
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px', margin: 0 }}>
            Join smart dairy owners managing daily operations digitally
          </p>
        </div>

        {/* Step Indicator Wizard */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px', padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.2)', borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { step: 1, label: 'Owner' },
            { step: 2, label: 'Profile' },
            { step: 3, label: 'Security' }
          ].map((item, idx) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;

            return (
              <React.Fragment key={item.step}>
                <div 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    backgroundColor: isCompleted ? '#4aba7e' : isActive ? '#2E7D32' : 'rgba(255, 255, 255, 0.1)',
                    color: isCompleted || isActive ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                    transition: 'all 0.3s ease'
                  }}>
                    {isCompleted ? '✓' : item.step}
                  </div>
                  <span style={{
                    fontSize: '12px', fontWeight: isActive || isCompleted ? 700 : 500,
                    color: isActive ? '#4aba7e' : isCompleted ? '#fff' : 'rgba(255, 255, 255, 0.4)'
                  }}>
                    {item.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 8px',
                    backgroundColor: currentStep > idx + 1 ? '#4aba7e' : 'rgba(255, 255, 255, 0.1)'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 83, 80, 0.15)',
            border: '1px solid rgba(239, 83, 80, 0.35)',
            color: '#ff8a80', padding: '12px 16px', borderRadius: '12px',
            fontSize: '13px', fontWeight: 500, marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div style={{
            backgroundColor: 'rgba(74, 186, 126, 0.15)',
            border: '1px solid rgba(74, 186, 126, 0.35)',
            color: '#4aba7e', padding: '16px', borderRadius: '14px',
            fontSize: '14px', fontWeight: 700, marginBottom: '20px',
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle2 size={32} />
            <span>Registration Completed Successfully!</span>
          </div>
        )}

        {/* STEP 1: OWNER DETAILS */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: 600 }}>
                Owner Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: 600 }}>
                Mobile Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: 600 }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="email"
                  placeholder="e.g. contact@kairy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '10px', width: '100%', padding: '14px', borderRadius: '12px',
                border: 'none', background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
                color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)'
              }}
            >
              <span>Continue to Dairy Profile</span>
              <ChevronRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: DAIRY PROFILE */}
        {currentStep === 2 && (
          <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: 600 }}>
                Dairy Business Name *
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  placeholder="e.g. Liter"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required
                />
              </div>
            </div>



            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: 600 }}>
                Location / City
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  placeholder="e.g. Pune Outskirts, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  padding: '14px', borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px',
                  border: 'none', background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
                  color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 6px 20px rgba(46, 125, 50, 0.4)'
                }}
              >
                <span>Continue to Security</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SECURITY & CREDENTIALS */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: 600 }}>
                Choose Username *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  placeholder="e.g. ramesh_dairy"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: 600 }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 42px 12px 42px', borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)', background: 'rgba(0, 0, 0, 0.25)',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#b2c7bc', fontWeight: 600 }}>
                  Confirm Password *
                </label>
                {confirmPassword && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: isPasswordMatch ? '#4aba7e' : '#ef5350' }}>
                    {isPasswordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                    border: `1px solid ${confirmPassword ? (isPasswordMatch ? 'rgba(74, 186, 126, 0.5)' : 'rgba(239, 83, 80, 0.5)') : 'rgba(255, 255, 255, 0.12)'}`,
                    background: 'rgba(0, 0, 0, 0.25)', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: '14px', borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <ChevronLeft size={18} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
                  color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                  opacity: loading ? 0.7 : 1, boxShadow: '0 6px 24px rgba(46, 125, 50, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Creating Dairy Account...' : '🎉 Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
          Already have an account? <Link to="/login" style={{ color: '#4aba7e', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};
