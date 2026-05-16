const express = require('express');
const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { projectMember } = require('../middleware/rbac');
const {
  createTaskValidator,
  updateTaskValidator,
} = require('../validators/task');

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  return null;
};

router.use(protect);

router.get('/project/:projectId', projectMember, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo } = req.query;

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: tasks.length,
      data: { tasks },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks.',
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const project = await Project.findById(task.project);
    if (!project || !project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task.',
    });
  }
});

router.post(
  '/project/:projectId',
  projectMember,
  createTaskValidator,
  async (req, res) => {
    try {
      const validationError = handleValidation(req, res);
      if (validationError) return;

      const { projectId } = req.params;
      const { title, description, status, priority, assignedTo, dueDate } =
        req.body;

      if (assignedTo) {
        if (!req.project.isMember(assignedTo)) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user must be a project member.',
          });
        }
      }

      const task = await Task.create({
        title,
        description,
        status,
        priority,
        project: projectId,
        assignedTo: assignedTo || null,
        createdBy: req.user._id,
        dueDate: dueDate || null,
      });

      await task.populate([
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email' },
      ]);

      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: { task },
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating task.',
      });
    }
  }
);

router.put('/:id', protect, async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const project = await Project.findById(task.project);
    if (!project || !project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    const { title, description, status, priority, assignedTo, dueDate } =
      req.body;

    if (assignedTo !== undefined && assignedTo !== null) {
      if (!project.isMember(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must be a project member.',
        });
      }
      task.assignedTo = assignedTo;
    } else if (assignedTo === null) {
      task.assignedTo = null;
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task.',
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const isAdmin = project.isAdmin(req.user._id);
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. Only project admins or task creators can delete tasks.',
      });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task.',
    });
  }
});

module.exports = router;
