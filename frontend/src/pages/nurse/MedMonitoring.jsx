import { useState, useEffect } from 'react';
import api from '../../services/api';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function MedMonitoring() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const { data } = await api.get('/schedules');
      setSchedules(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  const overdue = schedules
    .filter((s) => s.status === 'pending' && new Date(s.scheduled_time) < now)
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  const dueSoon = schedules
    .filter((s) => s.status === 'pending' && new Date(s.scheduled_time) >= now && new Date(s.scheduled_time) <= soonThreshold)
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  return (
    <div style={{ padding: '12px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .med-monitoring-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .med-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        @media (max-width: 768px) {
          .med-cards-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        
        .monitor-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          border-top: 4px solid;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .monitor-card.overdue {
          border-top-color: #ef4444;
        }
        
        .monitor-card.due-soon {
          border-top-color: #f59e0b;
        }
        
        .monitor-card-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .card-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .card-icon-bg {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .card-icon-bg.overdue {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .card-icon-bg.due-soon {
          background: #fef3c7;
          color: #d97706;
        }
        
        .card-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        
        .card-title.overdue {
          color: #991b1b;
        }
        
        .card-title.due-soon {
          color: #b45309;
        }
        
        .badge {
          background: #f3f4f6;
          color: #374151;
          padding: 4px 12px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.875rem;
        }
        
        .card-content {
          padding: 20px;
          flex: 1;
          background: #fafafa;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          text-align: center;
        }
        
        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        .empty-icon.success {
          background: #d1fae5;
          color: #10b981;
        }
        
        .empty-icon.neutral {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .med-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .med-item {
          background: white;
          border-radius: 8px;
          padding: 16px;
          border-left: 3px solid #3b82f6;
          border: 1px solid #e2e8f0;
          border-left: 3px solid;
          transition: all 0.2s ease;
        }
        
        .med-item.overdue {
          border-left-color: #ef4444;
        }
        
        .med-item.due-soon {
          border-left-color: #f59e0b;
        }
        
        .med-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .med-item-info {
          flex: 1;
        }
        
        .med-medication-name {
          margin: 0 0 8px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }
        
        .med-patient-room {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #64748b;
        }
        
        .med-patient-room strong {
          color: #0f172a;
          font-weight: 600;
        }
        
        .med-time-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
        }
        
        .med-time-badge.overdue {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .med-time-badge.due-soon {
          background: #fef3c7;
          color: #d97706;
        }
        
        .med-details {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: #475569;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }
        
        .med-detail {
          display: flex;
          gap: 4px;
        }
        
        .med-detail strong {
          color: #0f172a;
        }
        
        @media (max-width: 640px) {
          .med-details {
            flex-direction: column;
            gap: 8px;
          }
          
          .monitor-card-header {
            padding: 12px 16px;
          }
          
          .card-content {
            padding: 16px;
          }
          
          .med-item {
            padding: 12px;
          }
        }
      `}</style>

      <div className="med-monitoring-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            Loading medication schedules...
          </div>
        ) : (
          <div className="med-cards-grid">
            {/* OVERDUE MEDICATIONS */}
            <div className={`monitor-card overdue`}>
              <div className="monitor-card-header">
                <div className="card-header-left">
                  <div className="card-icon-bg overdue">
                    <AlertTriangle size={18} />
                  </div>
                  <h3 className="card-title overdue">Overdue Medications</h3>
                </div>
                <div className="badge">{overdue.length}</div>
              </div>

              <div className="card-content">
                {overdue.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon success">
                      <CheckCircle size={40} />
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', color: '#10b981', fontWeight: 700 }}>All Clear!</h4>
                    <p style={{ margin: 0, color: '#059669', fontWeight: 500, fontSize: '0.9rem' }}>No overdue medications. Great job!</p>
                  </div>
                ) : (
                  <div className="med-list">
                    {overdue.map((med, index) => (
                      <div key={index} className="med-item overdue">
                        <div className="med-item-header">
                          <div className="med-item-info">
                            <h4 className="med-medication-name">{med.prescriptionItem?.medication_name}</h4>
                            <div className="med-patient-room">
                              <strong>{med.patient?.first_name} {med.patient?.last_name}</strong>
                            </div>
                          </div>
                          <div className="med-time-badge overdue">
                            <Clock size={14} />
                            {new Date(med.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DUE SOON MEDICATIONS */}
            <div className={`monitor-card due-soon`}>
              <div className="monitor-card-header">
                <div className="card-header-left">
                  <div className="card-icon-bg due-soon">
                    <Clock size={18} />
                  </div>
                  <h3 className="card-title due-soon">Due Soon</h3>
                </div>
                <div className="badge">{dueSoon.length}</div>
              </div>

              <div className="card-content">
                {dueSoon.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon neutral">
                      <Clock size={40} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>No medications due in the near future.</p>
                  </div>
                ) : (
                  <div className="med-list">
                    {dueSoon.map((med, index) => (
                      <div key={index} className="med-item due-soon">
                        <div className="med-item-header">
                          <div className="med-item-info">
                            <h4 className="med-medication-name">{med.prescriptionItem?.medication_name}</h4>
                            <div className="med-patient-room">
                              <strong>{med.patient?.first_name} {med.patient?.last_name}</strong>
                            </div>
                          </div>
                          <div className="med-time-badge due-soon">
                            <Clock size={14} />
                            {new Date(med.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
