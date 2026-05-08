import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await loginApi(form);
      const { token, user } = res.data.data;
      login(token, user);
      const dest = user.role === 'STUDENT' ? '/student-dashboard' : '/recruiter-dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      toast('error', err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-grid">
        <div className="auth-brand-panel">
          <img src="/images/Logo.png" alt="Placify" className="auth-logo" />
          <h1 className="auth-brand-title">Placify</h1>
          <p className="auth-brand-sub">Campus Placement OS — connecting students and recruiters on one platform.</p>
        </div>
        <div className="auth-form-panel">
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-sub">Sign in to your account to continue.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoFocus />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
            </label>
            <button className="button primary" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}
