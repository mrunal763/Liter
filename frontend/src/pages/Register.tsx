import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !email || !fullName || !businessName) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          fullName,
          businessName,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Registration failed. Please check your inputs.');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1b3d2b 0%, #0d1f16 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px 28px',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        color: '#fff'
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: '6px',
          background: 'linear-gradient(to right, #ffffff, #a2ebd0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Create Owner Account
        </h2>
        <p style={{
          fontSize: '13px',
          color: '#889f92',
          textAlign: 'center',
          marginBottom: '28px'
        }}>
          Register your dairy profile on LITER
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 83, 80, 0.1)',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            borderRadius: '10px',
            color: '#ef5350',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '20px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(74, 186, 126, 0.1)',
            border: '1px solid rgba(74, 186, 126, 0.3)',
            borderRadius: '10px',
            color: '#4aba7e',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '20px',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            Account created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: '600' }}>
              Owner Full Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Ramesh Patil"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: '600' }}>
              Dairy Business Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Liter"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: '600' }}>
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="e.g. contact@kairy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: '600' }}>
              Username
            </label>
            <input 
              type="text" 
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b2c7bc', marginBottom: '6px', fontWeight: '600' }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4aba7e'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #4aba7e 0%, #349c66 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '12px',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.2s'
            }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '13px',
          color: '#889f92'
        }}>
          Already have an account?{' '}
          <span 
            onClick={() => navigate('/login')}
            style={{
              color: '#4aba7e',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};
