export default function TaskCard({ task, onClick }) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const assignedInitials = task.assignedTo
    ? task.assignedTo.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <div className="task-card" onClick={() => onClick(task)}>
      <div className="task-title">{task.title}</div>

      {task.description && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--gray-400)',
            marginBottom: 8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.description}
        </div>
      )}

      <div className="task-meta">
        <span className={`task-priority priority-${task.priority}`}>
          {task.priority}
        </span>

        {task.dueDate && (
          <span className={`task-due${isOverdue ? ' overdue' : ''}`}>
            {isOverdue ? '⚠ ' : ''}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        <span className={`status-badge status-${task.status}`}>
          <span className={`status-dot ${task.status}`} />
          {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>

        {assignedInitials && (
          <div className="task-assignee">
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--primary-100)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {assignedInitials}
            </div>
            {task.assignedTo.name.split(' ')[0]}
          </div>
        )}
      </div>
    </div>
  );
}
