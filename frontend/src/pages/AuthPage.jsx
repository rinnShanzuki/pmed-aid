import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import api from '../services/api';
import '../styles/auth.css';

const QR_STEPS = { VERIFY: 'verify', CHOOSE: 'choose', FORM: 'form', SUCCESS: 'success' };

export default function AuthPage() {
  const { login, googleAuth, qrBind, ROLE_REDIRECTS } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const qrCode = searchParams.get('code');

  // Determine initial mode from route
  const isRegisterRoute = location.pathname === '/register';
  const [isRegister, setIsRegister] = useState(isRegisterRoute);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register form state
  const [regForm, setRegForm] = useState({ email: '', password: '', confirm: '', first_name: '', last_name: '' });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  // QR flow state
  const [qrStep, setQrStep] = useState(qrCode ? QR_STEPS.VERIFY : null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [qrError, setQrError] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  // Sync URL with panel state (only when NOT in QR flow)
  useEffect(() => {
    if (qrCode) return;
    const target = isRegister ? '/register' : '/login';
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [isRegister]);

  // Sync if user navigates via browser back/forward
  useEffect(() => {
    if (!qrCode) setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  // Verify QR on mount
  useEffect(() => {
    let isMounted = true;
    async function verifyQR() {
      if (!isMounted) return;
      setQrLoading(true);
      try {
        const { data } = await api.post('/qr-codes/verify', { code: qrCode });
        if (!isMounted) return;
        if (data.data.is_bound) {
          setQrError('This QR code has already been used. Each code can only bind one account.');
          setQrStep(null);
        } else {
          setPatientInfo({
            name: `${data.data.patient.first_name} ${data.data.patient.last_name}`,
            email: data.data.patient.email
          });
          setQrStep(QR_STEPS.CHOOSE);
        }
      } catch (err) {
        if (isMounted) {
          setQrError(err.response?.data?.message || 'Invalid or expired QR code.');
          setQrStep(null);
        }
      } finally { if (isMounted) setQrLoading(false); }
    }
    if (qrCode) verifyQR();
    return () => { isMounted = false; };
  }, [qrCode]);

  // ── Google Login ────────────────────────────────────────────
  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        if (isRegister) setRegLoading(true); else setLoginLoading(true);
        const { data: userInfo } = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        if (qrCode) {
          // QR binding flow
          setQrLoading(true);
          await qrBind({
            code: qrCode, google_id: userInfo.sub,
            email: userInfo.email, first_name: userInfo.given_name, last_name: userInfo.family_name
          });
          setQrStep(QR_STEPS.SUCCESS);
          setQrLoading(false);
          return;
        }

        const user = await googleAuth({
          google_id: userInfo.sub, email: userInfo.email,
          first_name: userInfo.given_name, last_name: userInfo.family_name
        });
        let dest = ROLE_REDIRECTS[user.role] || '/';
        if (from) {
          const roleRoot = ROLE_REDIRECTS[user.role];
          const adminRoots = ['/admin', '/info-desk']; // Admin has access to both
          
          if (user.role === 'admin' && adminRoots.some(r => from.startsWith(r))) {
            dest = from;
          } else if (from.startsWith(roleRoot)) {
            dest = from;
          }
        }
        navigate(dest, { replace: true });
      } catch (err) {
        const msg = err.response?.data?.message || 'Google authentication failed.';
        if (isRegister) setRegError(msg); else setLoginError(msg);
        setQrLoading(false);
      } finally {
        setLoginLoading(false); setRegLoading(false);
      }
    },
    onError: () => {
      const msg = 'Google authentication failed.';
      if (isRegister) setRegError(msg); else setLoginError(msg);
    }
  });

  // ── QR Google Login (separate hook for QR flow) ─────────────
  const loginGoogleQR = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setQrLoading(true);
        const { data: userInfo } = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        await qrBind({
          code: qrCode, google_id: userInfo.sub,
          email: userInfo.email, first_name: userInfo.given_name, last_name: userInfo.family_name
        });
        setQrStep(QR_STEPS.SUCCESS);
      } catch (err) {
        setRegError(err.response?.data?.message || 'Google Registration failed.');
      } finally { setQrLoading(false); }
    },
    onError: () => setRegError('Google Registration failed.')
  });

  // ── Login Handlers ─────────────────────────────────────────
  function handleLoginChange(e) {
    setLoginForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setLoginError('');
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setLoginError('Please enter your email and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.password);
      let dest = ROLE_REDIRECTS[user.role] || '/';
      if (from) {
        const roleRoot = ROLE_REDIRECTS[user.role];
        const adminRoots = ['/admin', '/info-desk'];
        
        if (user.role === 'admin' && adminRoots.some(r => from.startsWith(r))) {
          dest = from;
        } else if (from.startsWith(roleRoot)) {
          dest = from;
        }
      }
      navigate(dest, { replace: true });
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoginLoading(false); }
  }

  // ── Register Handlers ──────────────────────────────────────
  function handleRegChange(e) {
    setRegForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setRegError('');
  }

  async function handleRegSubmit(e) {
    e.preventDefault();
    if (regForm.password !== regForm.confirm) { setRegError('Passwords do not match.'); return; }
    if (!regForm.first_name || !regForm.last_name || !regForm.email || !regForm.password) {
      setRegError('Please fill in all fields.'); return;
    }
    setRegLoading(true);
    try {
      if (qrCode) {
        await qrBind({
          code: qrCode, email: regForm.email, password: regForm.password,
          first_name: regForm.first_name, last_name: regForm.last_name
        });
        setQrStep(QR_STEPS.SUCCESS);
      } else {
        await api.post('/auth/public-register', {
          email: regForm.email, password: regForm.password,
          first_name: regForm.first_name, last_name: regForm.last_name
        });
        setIsRegister(false);
        setLoginError('');
        setLoginForm({ email: regForm.email, password: '' });
      }
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed.');
    } finally { setRegLoading(false); }
  }

  // ── Switch Panel ───────────────────────────────────────────
  function goToRegister(e) { e.preventDefault(); setIsRegister(true); setRegError(''); }
  function goToLogin(e) { e.preventDefault(); setIsRegister(false); setLoginError(''); }

  // ═══════════════════════════════════════════════════════════
  // QR FLOW SCREENS (centered card layout, not slider)
  // ═══════════════════════════════════════════════════════════

  // QR Success
  if (qrStep === QR_STEPS.SUCCESS) {
    return (
      <div className="auth-root auth-root--centered">
        <div className="auth-card auth-card--centered">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#10b981" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="auth-card-header"><h2 style={{ color: '#10b981' }}>Account Linked!</h2></div>
          <p className="auth-sub" style={{ textAlign: 'center' }}>Your account has been successfully created and linked to your hospital records.</p>
          <button className="btn-primary" onClick={() => navigate('/patient', { replace: true })}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // QR Error
  if (qrCode && (!qrStep || qrError)) {
    return (
      <div className="auth-root auth-root--centered">
        <div className="auth-card auth-card--centered">
          <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>⚠️</div>
          <div className="auth-card-header"><h2>QR Code Issue</h2></div>
          <p className="auth-sub" style={{ textAlign: 'center' }}>{qrError || 'No QR code provided.'}</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </div>
    );
  }

  // QR Choose Method
  if (qrStep === QR_STEPS.CHOOSE) {
    return (
      <div className="auth-root auth-root--centered">
        <div className="auth-card auth-card--register">
          <div className="qr-success-badge">✓ QR Verified</div>
          <div className="auth-card-header"><h2>Welcome, {patientInfo?.name}!</h2></div>
          <p className="auth-sub">Your discharge QR code is valid. Create your account to track your medications at home.</p>
          <div className="auth-methods">
            <button className="btn-google" type="button" onClick={() => loginGoogleQR()} disabled={qrLoading}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>or</span></div>
            <button className="btn-secondary" onClick={() => setQrStep(QR_STEPS.FORM)}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="18"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
              Register with Email &amp; Password
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QR Email Form
  if (qrStep === QR_STEPS.FORM) {
    return (
      <div className="auth-root auth-root--centered">
        <div className="auth-card auth-card--register">
          <button className="btn-back" onClick={() => setQrStep(QR_STEPS.CHOOSE)}>← Back</button>
          <div className="qr-success-badge">✓ QR Verified</div>
          <div className="auth-card-header"><h2>Create your account</h2></div>
          {regError && <div className="auth-error">{regError}</div>}
          <form className="auth-form" onSubmit={handleRegSubmit}>
            <div className="form-row">
              <div className="form-group">
                <div className="label-row"><label htmlFor="qr-first_name">First Name</label></div>
                <div className="input-wrapper">
                  <input type="text" id="qr-first_name" name="first_name" placeholder="First Name"
                    value={regForm.first_name} onChange={handleRegChange} disabled={regLoading} required />
                </div>
              </div>
              <div className="form-group">
                <div className="label-row"><label htmlFor="qr-last_name">Last Name</label></div>
                <div className="input-wrapper">
                  <input type="text" id="qr-last_name" name="last_name" placeholder="Last Name"
                    value={regForm.last_name} onChange={handleRegChange} disabled={regLoading} required />
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="label-row"><label htmlFor="qr-email">Email</label></div>
              <div className="input-wrapper">
                <input type="email" id="qr-email" name="email" placeholder="Enter email"
                  value={regForm.email} onChange={handleRegChange} disabled={regLoading} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="label-row"><label htmlFor="qr-password">Password</label></div>
                <div className="input-wrapper">
                  <input type={showRegPass ? 'text' : 'password'} id="qr-password" name="password"
                    placeholder="Enter Password" value={regForm.password} onChange={handleRegChange}
                    disabled={regLoading} required />
                </div>
              </div>
              <div className="form-group">
                <div className="label-row"><label htmlFor="qr-confirm">Confirm Password</label></div>
                <div className="input-wrapper">
                  <input type={showRegPass ? 'text' : 'password'} id="qr-confirm" name="confirm"
                    placeholder="Confirm Password" value={regForm.confirm} onChange={handleRegChange}
                    disabled={regLoading} required />
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={regLoading}>{regLoading ? 'Processing...' : 'Create Account'}</button>
          </form>
        </div>
      </div>
    );
  }

  // QR Verifying (loading)
  if (qrStep === QR_STEPS.VERIFY) {
    return (
      <div className="auth-root auth-root--centered">
        <div className="auth-card auth-card--centered">
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }}></div>
            <p style={{ color: '#64748b' }}>Verifying QR code...</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // NORMAL SLIDER (Login / Register)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="auth-root">
      <div className={`auth-container auth-slider ${isRegister ? 'auth-slider--register' : ''}`}>

        {/* ─── Login Form Panel (sits on the right by default) ─── */}
        <div className="auth-form-panel auth-panel-login">
          <div className="auth-card">
            <div className="auth-card-header"><h2>Welcome back</h2></div>
            {loginError && <div className="auth-error">{loginError}</div>}
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <div className="label-row"><label htmlFor="login-email">Email address</label></div>
                <div className="input-wrapper">
                  <input type="email" id="login-email" name="email" placeholder="Enter email"
                    value={loginForm.email} onChange={handleLoginChange} disabled={loginLoading} required />
                </div>
              </div>
              <div className="form-group">
                <div className="label-row"><label htmlFor="login-password">Password</label></div>
                <div className="input-wrapper">
                  <input type={showLoginPass ? 'text' : 'password'} id="login-password" name="password"
                    placeholder="Enter Password" value={loginForm.password} onChange={handleLoginChange}
                    disabled={loginLoading} required />
                  <button type="button" className="btn-icon pass-toggle" onClick={() => setShowLoginPass(!showLoginPass)} tabIndex="-1">
                    {showLoginPass ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-options">
                <label className="checkbox-label"><input type="checkbox" required /><span>I agree to the Terms and Conditions</span></label>
              </div>
              <button type="submit" className="btn-primary" disabled={loginLoading}>{loginLoading ? 'Signing in...' : 'Sign In'}</button>
            </form>
            <div className="auth-social-login">
              <p>Or continue with</p>
              <button className="btn-google" type="button" onClick={() => loginGoogle()} disabled={loginLoading}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign In with Google
              </button>
            </div>
            <p className="auth-footer-text">
              Don't have an account? <a href="/register" onClick={goToRegister}>Sign Up</a>
            </p>
          </div>
        </div>

        {/* ─── Register Form Panel (sits on the left, hidden by default) ─── */}
        <div className="auth-form-panel auth-panel-register">
          <div className="auth-card">
            <div className="auth-card-header"><h2>Create your account</h2></div>
            {regError && <div className="auth-error">{regError}</div>}
            <form className="auth-form" onSubmit={handleRegSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <div className="label-row"><label htmlFor="reg-first_name">First Name</label></div>
                  <div className="input-wrapper">
                    <input type="text" id="reg-first_name" name="first_name" placeholder="First Name"
                      value={regForm.first_name} onChange={handleRegChange} disabled={regLoading} required />
                  </div>
                </div>
                <div className="form-group">
                  <div className="label-row"><label htmlFor="reg-last_name">Last Name</label></div>
                  <div className="input-wrapper">
                    <input type="text" id="reg-last_name" name="last_name" placeholder="Last Name"
                      value={regForm.last_name} onChange={handleRegChange} disabled={regLoading} required />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <div className="label-row"><label htmlFor="reg-email">Email</label></div>
                <div className="input-wrapper">
                  <input type="email" id="reg-email" name="email" placeholder="Enter email"
                    value={regForm.email} onChange={handleRegChange} disabled={regLoading} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <div className="label-row"><label htmlFor="reg-password">Password</label></div>
                  <div className="input-wrapper">
                    <input type={showRegPass ? 'text' : 'password'} id="reg-password" name="password"
                      placeholder="Enter Password" value={regForm.password} onChange={handleRegChange}
                      disabled={regLoading} required />
                  </div>
                </div>
                <div className="form-group">
                  <div className="label-row"><label htmlFor="reg-confirm">Confirm Password</label></div>
                  <div className="input-wrapper">
                    <input type={showRegPass ? 'text' : 'password'} id="reg-confirm" name="confirm"
                      placeholder="Confirm Password" value={regForm.confirm} onChange={handleRegChange}
                      disabled={regLoading} required />
                  </div>
                </div>
              </div>
              <div className="form-options">
                <label className="checkbox-label"><input type="checkbox" required /><span>I agree to the Terms and Conditions</span></label>
              </div>
              <button type="submit" className="btn-primary" disabled={regLoading}>{regLoading ? 'Processing...' : 'Sign Up'}</button>
            </form>
            <div className="auth-social-login">
              <p>Or continue with</p>
              <button className="btn-google" type="button" onClick={() => loginGoogle()} disabled={regLoading}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign Up with Google
              </button>
            </div>
            <p className="auth-footer-text">
              Already have an account? <a href="/login" onClick={goToLogin}>Sign In</a>
            </p>
          </div>
        </div>

        {/* ─── Sliding Blue Overlay Panel ─── */}
        <div className="auth-overlay-container">
          {/* Animated wave edge — 3 separate layers for visible CSS animation */}
          <div className="auth-wave-edge">
            <div className="wave-layer wave-layer-1">
              <svg viewBox="0 0 60 600" preserveAspectRatio="none">
                <path fill="#ffffff" d="M60,0 C30,40 0,60 20,100 C40,140 10,160 30,200 C50,240 20,260 40,300 C60,340 20,360 40,400 C60,440 10,460 30,500 C50,540 20,560 40,600 L60,600 Z" />
              </svg>
            </div>
            <div className="wave-layer wave-layer-2">
              <svg viewBox="0 0 60 600" preserveAspectRatio="none">
                <path fill="rgba(255,255,255,0.55)" d="M60,0 C20,50 -10,75 15,115 C40,155 -5,175 25,215 C55,255 15,275 35,315 C55,355 15,375 35,415 C55,455 -5,475 25,515 C55,555 15,575 35,600 L60,600 Z" />
              </svg>
            </div>
            <div className="wave-layer wave-layer-3">
              <svg viewBox="0 0 60 600" preserveAspectRatio="none">
                <path fill="rgba(255,255,255,0.3)" d="M60,0 C10,60 -20,90 10,130 C40,170 -20,190 20,230 C60,270 10,290 30,330 C50,370 10,390 30,430 C50,470 -20,490 20,530 C60,570 10,590 30,600 L60,600 Z" />
              </svg>
            </div>
          </div>
          <div className="auth-overlay">
            <div className="auth-overlay-panel auth-overlay-left">
              <div className="auth-brand-inner">
                <h1 className="auth-brand-welcome">Welcome to</h1>
                <div className="auth-logo">
                  <svg viewBox="0 0 24 24" width="48" height="48"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z" fill="#1d64c1" /></svg>
                </div>
                <h2 className="auth-brand-name">PMed-Aid</h2>
                <p className="auth-brand-tagline">Manage hospital operations, track patient medications, and connect with healthcare professionals in one unified platform.</p>
              </div>
            </div>
            <div className="auth-overlay-panel auth-overlay-right">
              <div className="auth-brand-inner">
                <h1 className="auth-brand-welcome">Welcome to</h1>
                <div className="auth-logo">
                  <svg viewBox="0 0 24 24" width="48" height="48"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z" fill="#1d64c1" /></svg>
                </div>
                <h2 className="auth-brand-name">PMed-Aid</h2>
                <p className="auth-brand-tagline">Manage hospital operations, track patient medications, and connect with healthcare professionals in one unified platform.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}