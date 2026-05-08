import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getMyApplications, getAllApplications, updateApplicationStatus } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const STEPS = ['APPLIED', 'IN_REVIEW', 'SHORTLISTED', 'INTERVIEW'];
const STATUS_LABELS = { APPLIED: 'Applied', IN_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', SELECTED: 'Selected', REJECTED: 'Rejected' };
const ALL_STATUSES = ['APPLIED', 'IN_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];

function statusTone(s) {
  if (s === 'SELECTED' || s === 'SHORTLISTED') return 'success';
  if (s === 'REJECTED') return 'danger';
  return 'warning';
}

function Timeline({ status }) {
  const stepIdx = STEPS.indexOf(status);
  const isRejected = status === 'REJECTED';
  const isSelected = status === 'SELECTED';

  return (
    <div className="app-timeline">
      {STEPS.map((step, i) => {
        let state = 'pending';
        if (isRejected) state = i === 0 ? 'done' : 'pending';
        else if (isSelected) state = 'done';
        else if (i < stepIdx) state = 'done';
        else if (i === stepIdx) state = 'active';
        return (
          <div key={step} className={`tl-step ${state}`}>
            {i > 0 && <div className="tl-connector" />}
            <div className="tl-node" />
            <div className="tl-label">{STATUS_LABELS[step]}</div>
          </div>
        );
      })}
      <div className={`tl-step ${isSelected ? 'outcome-success' : isRejected ? 'outcome-danger' : 'outcome-pending'}`}>
        <div className="tl-connector" />
        <div className="tl-node" />
        <div className="tl-label">{isSelected ? '🎉 Offered' : isRejected ? 'Rejected' : 'Decision'}</div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const isManager = user?.role === 'ADMIN' || user?.role === 'RECRUITER';

  useEffect(() => {
    const fetch = isManager ? getAllApplications : getMyApplications;
    fetch().then((r) => setApps(r.data.data || []))
      .catch((err) => toast('error', err.message))
      .finally(() => setLoading(false));
  }, [isManager]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const r = await updateApplicationStatus(appId, newStatus);
      setApps((prev) => prev.map((a) => a.id === appId ? r.data.data : a));
      toast('success', `Status updated to ${STATUS_LABELS[newStatus]}.`);
    } catch (err) {
      toast('error', err.message);
    }
  };

  const filtered = filter === 'ALL' ? apps : apps.filter((a) => a.status === filter);

  return (
    <Layout title="Applications">
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', ...ALL_STATUSES].map((s) => (
          <button key={s} className={`tab-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: 'var(--muted-light)' }}>Loading…</p> : filtered.length === 0 ? (
        <div className="empty-state">No applications found.</div>
      ) : isManager ? (
        /* Manager table */
        <section className="panel">
          <div className="pipeline-wrap">
            <table className="pipeline-table">
              <thead>
                <tr><th>Student</th><th>Email</th><th>Branch</th><th>CGPA</th><th>Job</th><th>Company</th><th>Status</th><th>Applied</th></tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id}>
                    <td>{app.studentName}</td>
                    <td>{app.studentEmail}</td>
                    <td>{app.studentBranch || '—'}</td>
                    <td>{app.studentCgpa ?? '—'}</td>
                    <td>{app.jobTitle}</td>
                    <td>{app.companyName}</td>
                    <td>
                      <select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)}>
                        {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* Student timeline cards */
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map((app) => (
            <section key={app.id} className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{app.jobTitle}</div>
                  <div style={{ color: 'var(--muted-light)', fontSize: '0.85rem' }}>{app.companyName}</div>
                </div>
                <span className={`status-pill ${statusTone(app.status)}`}>{STATUS_LABELS[app.status]}</span>
              </div>
              <Timeline status={app.status} />
            </section>
          ))}
        </div>
      )}
    </Layout>
  );
}
