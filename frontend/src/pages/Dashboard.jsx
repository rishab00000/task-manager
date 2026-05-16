import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api/axios';

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await dashboardAPI.getStats();
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Projects',
      value: data?.totalProjects || 0,
      icon: '📁',
      color: 'blue',
    },
    {
      label: 'Total Tasks',
      value: data?.totalTasks || 0,
      icon: '📋',
      color: 'blue',
    },
    {
      label: 'My Pending Tasks',
      value: data?.myPendingTasks || 0,
      icon: '⏳',
      color: 'yellow',
    },
    {
      label: 'Overdue Tasks',
      value: data?.myOverdueTasks || 0,
      icon: '🚨',
      color: 'red',
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your projects and tasks</p>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Tasks by Status</h3>
            </div>
            <div className="card-body">
              {data?.tasksByStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(data.tasksByStatus).map(([key, count]) => (
                    <div key={key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: 'var(--gray-600)' }}>
                          {statusLabels[key] || key}
                        </span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: 'var(--gray-100)',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${
                              data.totalTasks > 0
                                ? (count / data.totalTasks) * 100
                                : 0
                            }%`,
                            background:
                              key === 'done'
                                ? 'var(--success)'
                                : key === 'in_progress'
                                ? 'var(--info)'
                                : key === 'review'
                                ? 'var(--warning)'
                                : 'var(--gray-400)',
                            borderRadius: 4,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 20 }}>
                  <p className="empty-text">No tasks yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">My Recent Tasks</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {data?.myTasks?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {data.myTasks.map((task) => (
                    <div
                      key={task._id}
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid var(--gray-100)',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        navigate(`/projects/${task.project?._id || task.project}`)
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: 'var(--gray-900)',
                            }}
                          >
                            {task.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                            {task.project?.name || 'Project'}
                          </div>
                        </div>
                        <span
                          className={`status-badge status-${task.status}`}
                        >
                          {statusLabels[task.status] || task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 30 }}>
                  <p className="empty-text">
                    No tasks assigned to you yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
