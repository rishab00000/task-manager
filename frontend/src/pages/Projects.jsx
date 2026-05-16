import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/axios';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await projectsAPI.getAll();
        setProjects(data.data.projects);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/projects/new')}
        >
          + New Project
        </button>
      </div>

      <div className="page-body">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3 className="empty-title">No projects yet</h3>
            <p className="empty-text">
              Create your first project to start managing tasks
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/projects/new')}
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <div className="project-name">{project.name}</div>
                {project.description && (
                  <div className="project-desc">{project.description}</div>
                )}
                <div className="project-meta">
                  <span>
                    Created {formatDate(project.createdAt)}
                  </span>
                  <div className="project-members">
                    {project.members?.slice(0, 3).map((member) => (
                      <div
                        key={member.user?._id || member.user}
                        className="member-avatar-sm"
                        title={member.user?.name}
                      >
                        {member.user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <div
                        className="member-avatar-sm"
                        style={{ background: 'var(--gray-200)', color: 'var(--gray-500)' }}
                      >
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
