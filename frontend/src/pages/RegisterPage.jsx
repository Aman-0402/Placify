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
    <div className="auth-body">
      <header className="auth-topbar">
        <Link to="/" className="auth-topbar-brand">
          <img src="/images/Logo.png" alt="Placify" />
          <span>Placify</span>
        </Link>
        <Link to="/login" className="auth-topbar-link">Sign in</Link>
      </header>
      <div className="auth-wrap auth-wrap--wide">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Join Placify and start your placement journey</p>
          </div>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full name</span>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Aman Kumar" required autoFocus />
            </label>
            <label className="field">
              <span>Email address</span>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@college.edu" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" required />
            </label>
            <label className="field">
              <span>I am a</span>
              <select value={form.role} onChange={set('role')}>
                <option value="STUDENT">Student</option>
                <option value="RECRUITER">Recruiter</option>
              </select>
            </label>
            <button className="button primary button--full" type="submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="auth-alt-link">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
