import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/auth.css';

export default function Unauthorized() {
  const { user, logout, ROLE_REDIRECTS } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="auth-root auth-root--centered">
      <div className="auth-card auth-card--centered">
        <div className="unauthorized-code">403</div>
        <h2 className="unauthorized-title">Access Denied</h2>
        <p className="unauthorized-msg">
          You don't have permission to view this page.
          {user && <><br/>Your role is <strong>{user.role}</strong>.</>}
        </p>
        <div className="unauthorized-actions">
          {user && (
            <button
              className="btn-primary"
              onClick={() => navigate(ROLE_REDIRECTS[user.role] || '/', { replace: true })}
            >
              Go to My Dashboard
            </button>
          )}
          <button className="btn-secondary" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
