import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';

const columns = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filterPriority, setFilterPriority] = useState('');

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = project?.members?.some(
    (m) => m.user?._id === user?._id && m.role === 'admin'
  );

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await projectsAPI.getOne(id);
      setProject(data.data.project);
    } catch {
      navigate('/projects');
    }
  }, [id, navigate]);

  const fetchTasks = useCallback(async () => {
    try {
      const params = filterPriority
        ? { priority: filterPriority }
        : {};
      const { data } = await tasksAPI.getByProject(id, params);
      setTasks(data.data.tasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, [id, filterPriority]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProject();
      setLoading(false);
    };
    init();
  }, [fetchProject]);

  useEffect(() => {
    if (project) fetchTasks();
  }, [project, fetchTasks]);

  const getColumnTasks = (status) =>
    tasks.filter((t) => t.status === status);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      setActionError('Task title is required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
      };
      await tasksAPI.create(id, payload);
      setShowCreateTask(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
      });
      setActionError('');
      fetchTasks();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!editTask) return;
    setSubmitting(true);
    try {
      await tasksAPI.update(editTask._id, {
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null,
      });
      setShowEditTask(false);
      setEditTask(null);
      setActionError('');
      fetchTasks();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      setShowEditTask(false);
      setEditTask(null);
      fetchTasks();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      setActionError('Please enter an email.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await projectsAPI.addMember(id, {
        userId: memberEmail.trim(),
      });
      setProject(data.data.project);
      setShowAddMember(false);
      setMemberEmail('');
      setActionError('');
    } catch (err) {
      setActionError(
        err.response?.data?.message || 'Failed to add member. Make sure the email belongs to a registered user.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const { data } = await projectsAPI.removeMember(id, userId);
      setProject(data.data.project);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '',
    });
    setShowEditTask(true);
    setActionError('');
  };

  const openCreateTask = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
    });
    setActionError('');
    setShowCreateTask(true);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/projects')}
              style={{ padding: '4px 8px' }}
            >
              ←
            </button>
            <h1 className="page-title" style={{ fontSize: 20 }}>
              {project.name}
            </h1>
          </div>
          {project.description && (
            <p className="page-subtitle">{project.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddMember(true)}
            >
              + Add Member
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={openCreateTask}>
            + New Task
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button
            className={`tab${activeTab === 'tasks' ? ' active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({tasks.length})
          </button>
          <button
            className={`tab${activeTab === 'members' ? ' active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members ({project.members?.length || 0})
          </button>
        </div>

        {activeTab === 'tasks' && (
          <>
            <div className="filter-bar">
              <select
                className="form-input"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{ minWidth: 140 }}
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3 className="empty-title">No tasks yet</h3>
                <p className="empty-text">
                  Create your first task to get started
                </p>
                <button className="btn btn-primary" onClick={openCreateTask}>
                  Create Task
                </button>
              </div>
            ) : (
              <div className="task-board">
                {columns.map((col) => (
                  <div key={col.key} className="task-column">
                    <div className="column-header">
                      <span>{col.label}</span>
                      <span className="column-count">
                        {getColumnTasks(col.key).length}
                      </span>
                    </div>
                    {getColumnTasks(col.key).map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onClick={openEditTask}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <div style={{ maxWidth: 500 }}>
            {project.members?.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <p className="empty-text">No members in this project</p>
              </div>
            ) : (
              <div className="members-list">
                {project.members?.map((member) => (
                  <div key={member.user?._id || member.user} className="member-item">
                    <div className="member-info">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--primary-100)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {member.user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--gray-900)',
                          }}
                        >
                          {member.user?.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {member.user?.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className={`member-role-badge role-${member.role}`}
                      >
                        {member.role}
                      </span>
                      {isAdmin &&
                        member.user?._id !== user?._id && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              handleRemoveMember(member.user?._id)
                            }
                            style={{ color: 'var(--danger)', fontSize: 12 }}
                          >
                            Remove
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title="Create Task"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreateTask(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateTask}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </>
        }
      >
        {actionError && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <span>⚠</span> {actionError}
          </div>
        )}
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Task description (optional)"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select
                className="form-input"
                value={taskForm.assignedTo}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assignedTo: e.target.value })
                }
              >
                <option value="">Unassigned</option>
                {project.members?.map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>
                    {m.user?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-input"
              value={taskForm.dueDate}
              onChange={(e) =>
                setTaskForm({ ...taskForm, dueDate: e.target.value })
              }
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditTask}
        onClose={() => {
          setShowEditTask(false);
          setEditTask(null);
        }}
        title="Edit Task"
        footer={
          <>
            {editTask && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteTask(editTask._id)}
                style={{ marginRight: 'auto' }}
              >
                Delete
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowEditTask(false);
                setEditTask(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditTask}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        {actionError && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <span>⚠</span> {actionError}
          </div>
        )}
        <form onSubmit={handleEditTask}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={taskForm.status}
                onChange={(e) => {
                  setTaskForm({ ...taskForm, status: e.target.value });
                  if (editTask && e.target.value !== editTask.status) {
                    handleStatusChange(editTask._id, e.target.value);
                    setShowEditTask(false);
                    setEditTask(null);
                  }
                }}
              >
                {columns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select
                className="form-input"
                value={taskForm.assignedTo}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assignedTo: e.target.value })
                }
              >
                <option value="">Unassigned</option>
                {project.members?.map((m) => (
                  <option key={m.user?._id} value={m.user?._id}>
                    {m.user?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, dueDate: e.target.value })
                }
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAddMember}
        onClose={() => {
          setShowAddMember(false);
          setMemberEmail('');
          setActionError('');
        }}
        title="Add Member"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowAddMember(false);
                setMemberEmail('');
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddMember}
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </>
        }
      >
        {actionError && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <span>⚠</span> {actionError}
          </div>
        )}
        <p
          style={{
            fontSize: 14,
            color: 'var(--gray-500)',
            marginBottom: 16,
          }}
        >
          Enter the user's ID to add them to this project. Users must have an
          account first.
        </p>
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label className="form-label">User ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="User's MongoDB ID"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
