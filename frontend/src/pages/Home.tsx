import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Star, CheckCircle, Phone, Mail, MessageSquare, Leaf, 
  Clock, Settings, DollarSign, Users, ClipboardCheck, TrendingUp, 
  MapPin, Eye, Award, ShieldCheck, ChevronLeft, ChevronRight, FileText,
  Truck, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Product {
  id?: number;
  name: string;
  category: string;
  unit: string;
  defaultPrice: number;
}

// ── Draggable floating dairy item ──────────────────────────────────────────
interface FloatyItem {
  id: number;
  emoji: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  size: number;
}

const DAIRY_ITEMS = [
  { emoji: '🥛', label: 'Milk' },
  { emoji: '🐄', label: 'Cow' },
  { emoji: '🐃', label: 'Buffalo' },
  { emoji: '🧈', label: 'Butter' },
  { emoji: '🫙', label: 'Curd' },
  { emoji: '🥚', label: 'Eggs' },
  { emoji: '🧀', label: 'Paneer' },
  { emoji: '🍼', label: 'Bottle' },
];

function createFloaties(): FloatyItem[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    emoji: DAIRY_ITEMS[i % DAIRY_ITEMS.length].emoji,
    label: DAIRY_ITEMS[i % DAIRY_ITEMS.length].label,
    x: Math.random() * (window.innerWidth - 80),
    y: Math.random() * (document.body.scrollHeight || 3000),
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    angle: Math.random() * 360,
    vAngle: (Math.random() - 0.5) * 0.4,
    size: 36 + Math.random() * 24,
  }));
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, authFetch } = useAuth();
  
  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [inHero, setInHero] = useState(true);
  
  // Products from catalog
  const [products, setProducts] = useState<Product[]>([]);
  
  // Review Carousel State
  const [currentReview, setCurrentReview] = useState(0);

  // Floating dairy items state
  const [floaties, setFloaties] = useState<FloatyItem[]>([]);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const animFrameRef = useRef<number>(0);
  const floatiesRef = useRef<FloatyItem[]>([]);

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Track scrolling for navbar transparency + hero detection
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
      setInHero(y < window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialise floaties after mount
  useEffect(() => {
    const items = createFloaties();
    setFloaties(items);
    floatiesRef.current = items;
  }, []);

  // Physics animation loop
  useEffect(() => {
    const tick = () => {
      const W = window.innerWidth;
      const H = document.documentElement.scrollHeight;
      const SIZE = 60;

      floatiesRef.current = floatiesRef.current.map(f => {
        if (dragRef.current?.id === f.id) return f; // paused while dragging
        let { x, y, vx, vy, angle, vAngle } = f;
        x += vx;
        y += vy;
        angle += vAngle;
        // Bounce off walls
        if (x < 0)       { x = 0;       vx = Math.abs(vx); }
        if (x > W - SIZE){ x = W - SIZE; vx = -Math.abs(vx); }
        if (y < 0)       { y = 0;        vy = Math.abs(vy); }
        if (y > H - SIZE){ y = H - SIZE; vy = -Math.abs(vy); }
        return { ...f, x, y, vx, vy, angle, vAngle };
      });

      setFloaties([...floatiesRef.current]);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const f = floatiesRef.current.find(f => f.id === id)!;
    dragRef.current = { id, offsetX: e.clientX - f.x, offsetY: e.clientY + window.scrollY - f.y };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { id, offsetX, offsetY } = dragRef.current;
    floatiesRef.current = floatiesRef.current.map(f =>
      f.id === id ? { ...f, x: e.clientX - offsetX, y: e.clientY + window.scrollY - offsetY, vx: 0, vy: 0 } : f
    );
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent, id: number) => {
    const t = e.touches[0];
    const f = floatiesRef.current.find(f => f.id === id)!;
    dragRef.current = { id, offsetX: t.clientX - f.x, offsetY: t.clientY + window.scrollY - f.y };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const t = e.touches[0];
    const { id, offsetX, offsetY } = dragRef.current;
    floatiesRef.current = floatiesRef.current.map(f =>
      f.id === id ? { ...f, x: t.clientX - offsetX, y: t.clientY + window.scrollY - offsetY, vx: 0, vy: 0 } : f
    );
  }, []);

  // Fetch products from backend or load defaults
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await authFetch('/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          loadDefaultProducts();
        }
      } catch (e) {
        loadDefaultProducts();
      }
    };
    fetchProducts();
  }, []);

  const loadDefaultProducts = () => {
    setProducts([
      { name: 'Fresh Milk', category: 'Milk', unit: 'L', defaultPrice: 60.00 },
      { name: 'Pure Curd', category: 'Curd', unit: 'kg', defaultPrice: 80.00 },
      { name: 'Soft Paneer', category: 'Paneer', unit: 'kg', defaultPrice: 320.00 },
      { name: 'Pure Buffalo Ghee', category: 'Ghee', unit: 'kg', defaultPrice: 650.00 },
    ]);
  };

  const reviews = [
    {
      stars: 5,
      text: "Liter delivers the freshest milk every single morning. Their service is incredibly reliable, and the quality is outstanding.",
      author: "Radha Sharma",
      role: "Regular Customer"
    },
    {
      stars: 5,
      text: "The curd and paneer are exceptionally fresh and soft. We love that the milk has zero adulteration, directly from local buffaloes.",
      author: "Amit Patel",
      role: "Krishna Nagar Resident"
    },
    {
      stars: 5,
      text: "Since they started using the LITER system, receiving daily WhatsApp bill summaries has made tracking our dairy expenses so easy and transparent!",
      author: "Vikram Deshmukh",
      role: "Subscriber since 2024"
    }
  ];

  const handleNextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const handlePrevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      style={{ backgroundColor: '#F8FAF8', color: 'var(--primary-text)', width: '100%', overflowX: 'hidden', position: 'relative' }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
    >
      {/* ══════ FLOATING DAIRY ITEMS LAYER ══════ */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
        {floaties.map(f => (
          <div
            key={f.id}
            onMouseDown={e => onMouseDown(e, f.id)}
            onTouchStart={e => onTouchStart(e, f.id)}
            title={f.label}
            style={{
              position: 'absolute',
              left: f.x,
              top: f.y - window.scrollY,
              fontSize: `${f.size}px`,
              transform: `rotate(${f.angle}deg)`,
              cursor: 'grab',
              userSelect: 'none',
              pointerEvents: 'all',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
              transition: dragRef.current?.id === f.id ? 'none' : 'filter 0.2s',
              lineHeight: 1,
            }}
          >
            {f.emoji}
          </div>
        ))}
      </div>
      
      {/* ==================== NAVBAR ==================== */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        backgroundColor: 'transparent',
        backdropFilter: 'none',
        borderBottom: inHero
          ? '1px solid rgba(255, 255, 255, 0.12)'
          : '1px solid rgba(74, 186, 126, 0.35)',
        boxShadow: 'none',
        transition: 'padding 0.4s cubic-bezier(0.4,0,0.2,1), border-color 0.4s ease',
        padding: scrolled ? '10px 24px' : '20px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          {/* Logo & Brand */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-green)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '800'
            }}>
              L
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: inHero ? '#fff' : 'var(--primary-text)' }}>LITER</span>
              <span style={{ fontSize: '10px', color: inHero ? 'rgba(255,255,255,0.7)' : 'var(--secondary-text)', fontWeight: '600' }}>Liter</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {['hero|Home','products|Products','why-choose-us|Benefits','about|About','reviews|Reviews','contact|Contact'].map(item => {
              const [sec, label] = item.split('|');
              return (
                <span key={sec} onClick={() => scrollToSection(sec)} style={{
                  cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                  color: inHero ? 'rgba(255,255,255,0.88)' : 'var(--secondary-text)',
                  transition: 'color 0.3s ease',
                  textShadow: inHero ? '0 1px 4px rgba(0,0,0,0.3)' : 'none'
                }}>{label}</span>
              );
            })}
          </nav>

          {/* Desktop Auth Actions */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                border: inHero ? '1.5px solid rgba(255,255,255,0.55)' : '1.5px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: inHero ? '#fff' : 'var(--primary-text)',
                transition: 'all 0.3s ease'
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                border: 'none',
                backgroundColor: inHero ? 'rgba(255,255,255,0.92)' : 'var(--primary-green)',
                color: inHero ? '#1B5E20' : '#fff',
                transition: 'all 0.3s ease'
              }}
            >
              Register
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <button 
            className="mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: 'var(--primary-green)', padding: '4px' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 400,
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 24px 40px 24px'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <span onClick={() => scrollToSection('hero')} style={{ fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>Home</span>
            <span onClick={() => scrollToSection('products')} style={{ fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>Products</span>
            <span onClick={() => scrollToSection('why-choose-us')} style={{ fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>Benefits</span>
            <span onClick={() => scrollToSection('about')} style={{ fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>About</span>
            <span onClick={() => scrollToSection('reviews')} style={{ fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>Reviews</span>
            <span onClick={() => scrollToSection('contact')} style={{ fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>Contact</span>
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={() => navigate('/login')}
              className="btn-outline"
              style={{ padding: '12px', width: '100%', borderRadius: '8px', textAlign: 'center', fontWeight: '700' }}
            >
              Owner Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn-primary"
              style={{ padding: '12px', width: '100%', borderRadius: '8px', textAlign: 'center', fontWeight: '700' }}
            >
              Create Account
            </button>
          </div>
        </div>
      )}

      {/* ==================== HERO SECTION ==================== */}
      <section id="hero" style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 45%, #388E3C 100%)',
      }}>
        {/* Animated background blobs */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-10%', right: '-5%',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'floatY 8s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', bottom: '-15%', left: '-8%',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'floatY 10s ease-in-out infinite',
            animationDelay: '3s'
          }} />
          {/* Diagonal light streaks */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)',
            backgroundSize: '300px 300px'
          }} />
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '140px 40px 80px 40px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }} className="hero-grid">

          {/* ── LEFT: Content ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Badge pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '24px',
              fontSize: '12px', fontWeight: 700,
              width: 'fit-content',
              border: '1px solid rgba(255,255,255,0.25)',
              textTransform: 'uppercase', letterSpacing: '1px',
              animation: 'fadeInUp 0.6s ease both'
            }}>
              <Leaf size={12} />
              <span>Liter</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 62px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              color: '#ffffff',
              animation: 'fadeInUp 0.7s ease 0.1s both'
            }}>
              Fresh Dairy.<br />
              <span style={{
                background: 'linear-gradient(90deg, #A5D6A7, #E8F5E9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Simple Management.</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.7,
              maxWidth: '460px',
              animation: 'fadeInUp 0.7s ease 0.2s both'
            }}>
              Discover Liter's fresh, farm-direct products — or simplify your entire dairy business with <strong style={{ color: '#fff' }}>LITER</strong>, the smart management platform built for dairy owners.
            </p>

            {/* Primary CTA Buttons */}
            <div style={{
              display: 'flex', gap: '14px', flexWrap: 'wrap',
              animation: 'fadeInUp 0.7s ease 0.3s both'
            }}>
              <button
                onClick={() => scrollToSection('products')}
                style={{
                  padding: '14px 30px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  color: '#1B5E20',
                  fontWeight: 800,
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                  letterSpacing: '-0.3px'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
                }}
              >
                Explore Products
              </button>

              <button
                onClick={() => scrollToSection('liter-platform')}
                style={{
                  padding: '14px 30px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '-0.3px'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.22)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                Get Started with LITER
              </button>
            </div>

            {/* Divider */}
            <div style={{
              width: '100%', maxWidth: '460px',
              height: '1px',
              background: 'rgba(255,255,255,0.15)',
              animation: 'fadeInUp 0.7s ease 0.35s both'
            }} />

            {/* Login / Register auth buttons */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
              animation: 'fadeInUp 0.7s ease 0.4s both'
            }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                Dairy owner?
              </span>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '9px 22px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: '1.5px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.2px'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.8)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.5)';
                }}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  padding: '9px 22px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: '#1B5E20',
                  fontWeight: 800,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.2px'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.9)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                Register Free
              </button>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: '32px', flexWrap: 'wrap',
              marginTop: '8px',
              animation: 'fadeInUp 0.7s ease 0.5s both'
            }}>
              {[
                { value: '500+', label: 'Happy Customers' },
                { value: '10+', label: 'Years of Trust' },
                { value: '100%', label: 'Pure Quality' },
              ].map((stat) => (
                <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{stat.value}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Hero Image ── */}
          <div style={{
            position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
            animation: 'fadeInRight 0.9s ease 0.2s both'
          }}>
            {/* Glow halo */}
            <div style={{
              position: 'absolute',
              width: '80%', height: '80%',
              background: 'radial-gradient(circle, rgba(165,214,167,0.35) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(30px)',
              zIndex: 0
            }} />

            {/* Image card */}
            <div style={{
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.15)',
              border: '3px solid rgba(255,255,255,0.2)',
              aspectRatio: '4 / 3',
              width: '100%',
              maxWidth: '540px',
              position: 'relative',
              zIndex: 1
            }}>
              <img
                src="/hero_dairy_farm.png"
                alt="Liter Dairy Farm"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Overlay gradient at bottom of image */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                background: 'linear-gradient(to top, rgba(27,94,32,0.6), transparent)'
              }} />
            </div>

            {/* Floating badge: Fresh Daily */}
            <div style={{
              position: 'absolute', top: '16px', left: '-24px',
              backgroundColor: '#fff',
              borderRadius: '14px',
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              animation: 'floatY 4s ease-in-out infinite',
              zIndex: 2
            }}>
              <span style={{ fontSize: '22px' }}>🥛</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1B5E20' }}>Fresh Daily</div>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Delivered to your door</div>
              </div>
            </div>

            {/* Floating badge: Customers */}
            <div style={{
              position: 'absolute', bottom: '30px', right: '-20px',
              backgroundColor: '#fff',
              borderRadius: '14px',
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              animation: 'floatY 5s ease-in-out infinite',
              animationDelay: '1.5s',
              zIndex: 2
            }}>
              <span style={{ fontSize: '22px' }}>⭐</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1B5E20' }}>500+ Customers</div>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Trusted since 2010</div>
              </div>
            </div>

            {/* Floating badge: LITER */}
            <div style={{
              position: 'absolute', bottom: '-18px', left: '30px',
              backgroundColor: '#1B5E20',
              borderRadius: '14px',
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              animation: 'floatY 6s ease-in-out infinite',
              animationDelay: '2.5s',
              zIndex: 2
            }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>LITER Platform</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Smart dairy management</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-down indicator */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '12px', fontWeight: 500,
          animation: 'floatY 3s ease-in-out infinite',
          cursor: 'pointer'
        }} onClick={() => scrollToSection('trust-strip')}>
          <span>Scroll to explore</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </section>

      {/* ==================== TRUST / HIGHLIGHTS STRIP ==================== */}
      <section id="trust-strip" style={{
        backgroundColor: '#fff',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '24px',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }} className="grid-responsive four-col">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🥛</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-text)' }}>Fresh Daily Deliveries</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-text)' }}>Farm-to-Door Process</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>✓</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-text)' }}>Rigorous Quality Audits</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🤝</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-text)' }}>Reliable Local Partner</span>
          </div>
        </div>
      </section>

      {/* ==================== PRODUCTS SECTION ==================== */}
      <section id="products" style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary-text)' }}>
            Freshness You Can Taste
          </h2>
          <p style={{ color: 'var(--secondary-text)', marginTop: '8px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Simple, fresh and quality dairy products for everyday life.
          </p>
        </div>

        {/* Product Grid - Inline/Horizontal format */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }} className="grid-responsive two-col">
          {products.map((p, idx) => (
            <div key={idx} className="card card-inline" style={{
              padding: '16px',
              overflow: 'hidden'
            }}>
              {/* Product Visual Container (Left side in row / Top in col) */}
              <div className="product-visual-container" style={{
                width: '100px',
                height: '100px',
                flexShrink: 0,
                borderRadius: '12px',
                backgroundColor: 'var(--light-green)',
                background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                position: 'relative'
              }}>
                {p.name.includes('Milk') && '🥛'}
                {p.name.includes('Curd') && '🥣'}
                {p.name.includes('Paneer') && '🧀'}
                {p.name.includes('Ghee') && '🏺'}
                {!['Milk', 'Curd', 'Paneer', 'Ghee'].some(term => p.name.includes(term)) && '📦'}
              </div>

              {/* Product Info (Right side in row / Bottom in col) */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{p.name}</h3>
                  <span className="badge badge-success" style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}>
                    ₹{p.defaultPrice.toFixed(2)} / {p.unit}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.4, margin: 0 }}>
                  Fresh, pure {p.category.toLowerCase()} sourced locally. Checked daily for high quality standards.
                </p>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--primary-green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                  cursor: 'pointer'
                }} onClick={() => scrollToSection('contact')}>
                  <span>Order Now</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== WHY CHOOSE US ==================== */}
      <section id="why-choose-us" style={{
        backgroundColor: '#fff',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '80px 24px',
        width: '100%'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800 }}>
              Why Choose Liter?
            </h2>
            <p style={{ color: 'var(--secondary-text)', marginTop: '8px' }}>
              We dedicate ourselves to preserving authentic values while enhancing service quality.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px'
          }} className="grid-responsive four-col">
            <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--light-green)', color: 'var(--primary-green)' }}>
                <Leaf size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Farm Fresh</h3>
              <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
                Fresh dairy products handled with extreme care directly from local healthy cattle.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--light-green)', color: 'var(--primary-green)' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Quality First</h3>
              <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
                Focus on absolute freshness and hygiene tests at every stage of the packaging.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--light-green)', color: 'var(--primary-green)' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Trusted Relationships</h3>
              <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
                Built around reliable daily delivery routines and customer-specific accommodations.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--light-green)', color: 'var(--primary-green)' }}>
                <Settings size={24} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Simple & Modern</h3>
              <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
                Traditional dairy values combined with modern tracking tools for billing and payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== BENEFITS OF LITER ==================== */}
      <section id="benefits" style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800 }}>
            Everything Your Dairy Needs, In One Place
          </h2>
          <p style={{ color: 'var(--secondary-text)', marginTop: '8px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Stop managing your dairy with paper notebooks and scattered calculations. LITER brings daily operations, customers, deliveries and billing together in one simple platform.
          </p>
        </div>

        {/* Benefits Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }} className="grid-responsive three-col">
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck size={20} style={{ color: 'var(--primary-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Manage Daily Sales</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
              Track daily milk deliveries, quantities, products, and customer attendance transactions.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} style={{ color: 'var(--primary-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Customer Directory</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
              Keep customer profiles, defaults, purchase logs, and custom price history configurations organized.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign size={20} style={{ color: 'var(--primary-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Customer-Specific Pricing</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
              Support custom subscription price overrides per client so you can calculate distinct milk rates seamlessly.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} style={{ color: 'var(--primary-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Automatic Statements</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
              Compile accurate monthly ledgers and generate one-click plain text billing summaries ready to share via WhatsApp.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} style={{ color: 'var(--primary-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Business Overview</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
              Get a live snapshot of today's total volume sold,Served customer metrics, and outstanding pending balances.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} style={{ color: 'var(--primary-green)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Spend Less Time on Paperwork</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.5 }}>
              Avoid manual calculator fatigue, missing ledger sheets, and notebook clutter. Focus on farming, not paperwork.
            </p>
          </div>

        </div>
      </section>

      {/* ==================== FARM / ANIMAL SECTION ==================== */}
      <section style={{
        backgroundColor: '#fff',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '80px 24px',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
          alignItems: 'center'
        }} className="grid-responsive two-col">
          {/* Visual Column */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              aspectRatio: '16 / 10',
              width: '100%'
            }}>
              <img 
                src="/farm_animals.png" 
                alt="Buffaloes on the dairy farm pasture" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* Animated leaf overlay decoration */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '20px',
              fontSize: '24px',
              opacity: 0.6,
              animation: 'floatY 4s ease-in-out infinite'
            }}>🍃</div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '-15px',
              fontSize: '20px',
              opacity: 0.5,
              animation: 'floatY 6s ease-in-out infinite',
              animationDelay: '1.5s'
            }}>💧</div>
          </div>

          {/* Content Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800 }}>From Our Farm to Your Home</h2>
            <h3 style={{ fontSize: '18px', color: 'var(--primary-green)', fontWeight: 600 }}>
              Healthy animals. Caring hands. Better dairy.
            </h3>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              At Liter, we believe that pure, fresh milk is a result of absolute care. Our healthy buffaloes are fed organic fodder and handled by caring, local hands. This commitment ensures that every drop of buffalo milk is thick, fresh, rich, and full of natural nutrients.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              By merging traditional animal husbandry values with LITER's modern tracking system, we keep delivery schedules accurate, transparent, and completely dependable.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== SMART DAIRY MANAGEMENT (LITER MOCK) ==================== */}
      <section id="liter-platform" style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
          alignItems: 'center'
        }} className="grid-responsive two-col">
          
          {/* Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800 }}>Smart Dairy Management with LITER</h2>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              LITER is the underlying engine that makes Liter run efficiently. It handles everything a private dairy farmer needs to record sales, manage schedules, adjust client-specific rates, and track outstanding collections.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <CheckCircle size={16} style={{ color: 'var(--primary-green)' }} />
                <span>Customer & Active Configuration Management</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <CheckCircle size={16} style={{ color: 'var(--primary-green)' }} />
                <span>Daily Delivery Tracking Sheets</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <CheckCircle size={16} style={{ color: 'var(--primary-green)' }} />
                <span>Flexible Customer-Specific Price Overrides</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <CheckCircle size={16} style={{ color: 'var(--primary-green)' }} />
                <span>Automatic FIFO Payment Allocations</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                onClick={() => navigate('/register')}
                className="btn-primary"
                style={{ width: 'auto', padding: '12px 24px', borderRadius: '8px' }}
              >
                Start Using LITER
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-outline"
                style={{ width: 'auto', padding: '12px 24px', borderRadius: '8px' }}
              >
                Owner Login
              </button>
            </div>
          </div>

          {/* Visual Mock Dashboard Column */}
          <div>
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '20px',
              padding: '24px',
              color: '#F8FAFC',
              boxShadow: 'var(--shadow-lg)',
              fontFamily: 'monospace',
              border: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
                <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>LITER DASHBOARD v1.0</span>
                <span style={{ color: '#4ADE80' }}>● ONLINE</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>TODAY'S VOLUME</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>128.5 Liters</div>
                </div>
                <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>ACTIVE DIRECTORY</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>86 Clients</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#0F172A', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>RECENT DELIVERIES LOG</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>Ramesh Patil</span>
                    <span style={{ color: '#4ADE80' }}>1.0 L (Morn)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>Suresh Kumar</span>
                    <span style={{ color: '#4ADE80' }}>2.0 L (Morn)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>Mahesh Deshmukh</span>
                    <span style={{ color: '#F87171' }}>SKIPPED</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                <span>Delivery Mode: Daily Attendance</span>
                <span>Database: PostgreSQL</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== ABOUT SECTION ==================== */}
      <section id="about" style={{
        backgroundColor: '#fff',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '80px 24px',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '40px',
          alignItems: 'center'
        }} className="grid-responsive two-col">
          
          {/* Left Column Image */}
          <div>
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              aspectRatio: '16 / 10',
              width: '100%'
            }}>
              <img 
                src="/about_dairy.png" 
                alt="Organic dairy bottles on farm table" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>

          {/* Right Column Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800 }}>About Liter</h2>
            <h3 style={{ fontSize: '18px', color: 'var(--primary-green)', fontWeight: 600 }}>
              Rooted in dairy. Growing with technology.
            </h3>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              Liter combines the values of traditional dairy farming with simple modern technology. With LITER, everyday dairy operations can be managed more easily, accurately and efficiently.
            </p>
            <p style={{ color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              We started as a small family farm committed to supplying local families with clean, pure milk. Over the years, our dairy grew, but our core principles remained unchanged: focus on animal welfare, ensure quality standards, and maintain trustworthy bonds with our subscribers.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginTop: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🐄</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Farm Focused</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🤝</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Customer First</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🏅</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Quality Driven</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Technology Enabled</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== CUSTOMER REVIEWS ==================== */}
      <section id="reviews" style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800 }}>Loved by Our Customers</h2>
          <p style={{ color: 'var(--secondary-text)', marginTop: '8px' }}>
            Hear from families who receive our fresh deliveries daily.
          </p>
        </div>

        {/* Desktop Review Cards */}
        <div className="desktop-only" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {reviews.map((rev, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[...Array(rev.stars)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--warning-color)" stroke="none" />
                ))}
              </div>
              <p style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--primary-text)', lineHeight: 1.5 }}>
                "{rev.text}"
              </p>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>— {rev.author}</h4>
                <span style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>{rev.role}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Review Carousel */}
        <div className="mobile-only" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '180px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(reviews[currentReview].stars)].map((_, i) => (
                <Star key={i} size={16} fill="var(--warning-color)" stroke="none" />
              ))}
            </div>
            <p style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--primary-text)', lineHeight: 1.5 }}>
              "{reviews[currentReview].text}"
            </p>
            <div style={{ marginTop: 'auto' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700 }}>— {reviews[currentReview].author}</h4>
              <span style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>{reviews[currentReview].role}</span>
            </div>
          </div>

          {/* Carousel Buttons & Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handlePrevReview} 
              style={{
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-green)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {reviews.map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => setCurrentReview(i)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: i === currentReview ? 'var(--primary-green)' : 'var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                />
              ))}
            </div>
            <button 
              onClick={handleNextReview}
              style={{
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-green)'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section style={{
        padding: '60px 24px',
        width: '100%',
        backgroundColor: 'var(--primary-green)',
        backgroundImage: 'linear-gradient(135deg, var(--primary-green) 0%, var(--dark-green) 100%)',
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating background drops */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '40px', opacity: 0.1 }}>💧</div>
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', fontSize: '32px', opacity: 0.1 }}>🍃</div>

        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1, position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Fresh Dairy. Simple Management.
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
            Discover Liter or simplify your dairy business with LITER.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
            <button 
              onClick={() => scrollToSection('products')}
              className="btn-secondary"
              style={{ width: 'auto', padding: '14px 28px', backgroundColor: '#fff', color: 'var(--primary-green)', borderRadius: '8px' }}
            >
              Explore Products
            </button>
            <button 
              onClick={() => navigate('/register')}
              style={{
                width: 'auto',
                padding: '14px 28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontWeight: 700
              }}
            >
              Get Started with LITER
            </button>
          </div>

          {/* Small Owner Specific CTA */}
          <div style={{
            marginTop: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Manage your dairy with LITER</h4>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '13px' }}>
              <span>Already using LITER? <span onClick={() => navigate('/login')} style={{ fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}>Login</span></span>
              <span>New to LITER? <span onClick={() => navigate('/register')} style={{ fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}>Register</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CONTACT SECTION ==================== */}
      <section id="contact" style={{
        background: 'linear-gradient(135deg, #0A1F0D 0%, #0F2C14 50%, #122E16 100%)',
        padding: '80px 32px',
        width: '100%',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'rgba(74,186,126,0.12)',
              border: '1px solid rgba(74,186,126,0.25)',
              color: '#4aba7e',
              padding: '6px 16px', borderRadius: '24px',
              fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '1px',
              marginBottom: '16px'
            }}>
              <Phone size={12} />
              <span>Contact Us</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: '10px' }}>
              Let's Connect
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.6 }}>
              Get in touch for subscriptions or general business queries.
            </p>
          </div>

          {/* 3 Horizontal Contact Cards */}
          <div className="contact-cards-grid">

            {/* Card 1 — Call Us */}
            <a href="tel:+919876543210" style={{ textDecoration: 'none' }}>
              <div className="contact-card"
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(74,186,126,0.5)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,186,126,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(46,125,50,0.4)',
                  flexShrink: 0
                }}>
                  <Phone size={24} color="#fff" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>Call Us</h3>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: '#4aba7e',
                      backgroundColor: 'rgba(74,186,126,0.12)',
                      border: '1px solid rgba(74,186,126,0.25)',
                      padding: '2px 8px', borderRadius: '20px',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>Available</span>
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: '#4aba7e', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>+91 98765 43210</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4aba7e', flexShrink: 0 }} />
                    Mon–Sun: 6:00 AM – 8:00 PM
                  </p>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.2)', transition: 'color 0.2s', flexShrink: 0 }}>
                  <ArrowRight size={20} />
                </div>
              </div>
            </a>

            {/* Card 2 — Email Us */}
            <a href="mailto:support@kairy.com" style={{ textDecoration: 'none' }}>
              <div className="contact-card"
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(74,186,126,0.5)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,186,126,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(21,101,192,0.4)',
                  flexShrink: 0
                }}>
                  <Mail size={24} color="#fff" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>Email Us</h3>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: '#64B5F6',
                      backgroundColor: 'rgba(100,181,246,0.1)',
                      border: '1px solid rgba(100,181,246,0.2)',
                      padding: '2px 8px', borderRadius: '20px',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>Support</span>
                  </div>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#64B5F6', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>support@kairy.com</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#64B5F6', flexShrink: 0 }} />
                    Send us your billing questions
                  </p>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  <ArrowRight size={20} />
                </div>
              </div>
            </a>

            {/* Card 3 — WhatsApp */}
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="contact-card"
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,211,102,0.5)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(37,211,102,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #128C7E, #25D366)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(37,211,102,0.3)',
                  flexShrink: 0
                }}>
                  <MessageSquare size={24} color="#fff" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>WhatsApp Chat</h3>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: '#25D366',
                      backgroundColor: 'rgba(37,211,102,0.1)',
                      border: '1px solid rgba(37,211,102,0.2)',
                      padding: '2px 8px', borderRadius: '20px',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>Instant</span>
                  </div>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#25D366', margin: '0 0 6px 0' }}>Chat directly on WhatsApp</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#25D366', flexShrink: 0 }} />
                    Immediate responses for deliveries
                  </p>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  <ArrowRight size={20} />
                </div>
              </div>
            </a>

          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer style={{
        backgroundColor: '#0A1F0D',
        color: 'rgba(255,255,255,0.65)',
        borderTop: '3px solid #2E7D32',
        padding: '0',
        width: '100%'
      }}>

        {/* Top accent strip */}
        <div style={{
          background: 'linear-gradient(90deg, #1B5E20, #2E7D32, #43A047, #2E7D32, #1B5E20)',
          height: '3px',
          width: '100%'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px 0 32px', width: '100%' }}>

          {/* ── 4-column grid ── */}
          <div className="footer-grid">

            {/* COL 1 — Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '900',
                  boxShadow: '0 4px 16px rgba(46,125,50,0.4)'
                }}>L</div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff', lineHeight: 1 }}>LITER</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginTop: '2px' }}>Made with ❤️ by Mrunal</div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '240px', margin: 0 }}>
                Fresh dairy directly from the farm, backed by smart digital dairy-management.
              </p>
              {/* Social / contact badge */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {['🥛','🐄','🌿'].map(em => (
                  <div key={em} style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', cursor: 'default'
                  }}>{em}</div>
                ))}
              </div>
            </div>

            {/* COL 2 — Products */}
            <div>
              <h4 style={{
                fontSize: '11px', fontWeight: 800, marginBottom: '20px',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                color: '#4aba7e',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(74,186,126,0.2)'
              }}>Products</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Fresh Milk', 'Pure Curd', 'Soft Paneer', 'Buffalo Ghee'
                ].map(item => (
                  <li key={item}
                    onClick={() => scrollToSection('products')}
                    style={{ cursor: 'pointer', fontSize: '14px', color: 'rgba(255,255,255,0.65)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#4aba7e'; e.currentTarget.style.paddingLeft = '6px'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.paddingLeft = '0'; }}
                  >
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#2E7D32', flexShrink: 0, display: 'inline-block' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* COL 3 — Company */}
            <div>
              <h4 style={{
                fontSize: '11px', fontWeight: 800, marginBottom: '20px',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                color: '#4aba7e',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(74,186,126,0.2)'
              }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'About Us', section: 'about' },
                  { label: 'Reviews', section: 'reviews' },
                  { label: 'Contact Info', section: 'contact' },
                ].map(item => (
                  <li key={item.label}
                    onClick={() => scrollToSection(item.section)}
                    style={{ cursor: 'pointer', fontSize: '14px', color: 'rgba(255,255,255,0.65)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#4aba7e'; e.currentTarget.style.paddingLeft = '6px'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.paddingLeft = '0'; }}
                  >
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#2E7D32', flexShrink: 0, display: 'inline-block' }} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* COL 4 — LITER Platform */}
            <div>
              <h4 style={{
                fontSize: '11px', fontWeight: 800, marginBottom: '20px',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                color: '#4aba7e',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(74,186,126,0.2)'
              }}>LITER Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Owner Login', action: () => navigate('/login') },
                  { label: 'Register Dairy', action: () => navigate('/register') },
                  { label: 'Dashboard', action: () => navigate('/login') },
                ].map(item => (
                  <li key={item.label}
                    onClick={item.action}
                    style={{ cursor: 'pointer', fontSize: '14px', color: 'rgba(255,255,255,0.65)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#4aba7e'; e.currentTarget.style.paddingLeft = '6px'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.paddingLeft = '0'; }}
                  >
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#2E7D32', flexShrink: 0, display: 'inline-block' }} />
                    {item.label}
                  </li>
                ))}
              </ul>

              {/* Quick login button */}
              <button
                onClick={() => navigate('/login')}
                style={{
                  marginTop: '24px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(46,125,50,0.35)',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'}
              >
                🚀 Get Started Free
              </button>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: '48px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            padding: '18px 32px',
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'center',
            gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.38)'
          }}>
            <span>© {new Date().getFullYear()} LITER · Made with ❤️ by Mrunal. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['Privacy Policy','Terms of Service'].map(link => (
                <span key={link} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#4aba7e'}
                  onMouseOut={e => e.currentTarget.style.color = ''}>
                  {link}
                </span>
              ))}
            </div>
          </div>
        </div>

      </footer>

    </div>
  );
};
