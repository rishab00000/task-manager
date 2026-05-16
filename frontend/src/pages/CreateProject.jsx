import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api/axios';

export default function CreateProject() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Project name is required.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await projectsAPI.create(form);
      navigate(`/projects/${data.data.project._id}`);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create project.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Project</h1>
          <p className="page-subtitle">Set up a new project for your team</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 600 }}>
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Enter project name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Brief description of the project"
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/projects')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
