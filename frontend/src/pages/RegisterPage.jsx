import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api';
import { useToast } from '../hooks/useToast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await registerApi(form);
      toast('success', 'Account created! Please sign in.');
      navigate('/login');
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
          <p className="auth-brand-sub">Join the campus placement platform built for students and recruiters.</p>
        </div>
        <div className="auth-form-panel">
          <h2 className="auth-form-title">Create account</h2>
          <p className="auth-form-sub">Fill in your details to get started.</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full Name</span>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Aman Kumar" required autoFocus />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" required />
            </label>
            <label className="field">
              <span>I am a</span>
              <select value={form.role} onChange={set('role')}>
                <option value="STUDENT">Student</option>
                <option value="RECRUITER">Recruiter</option>
              </select>
            </label>
            <button className="button primary" type="submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
