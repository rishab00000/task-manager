const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    }).select('_id name');

    const projectIds = projects.map((p) => p._id);

    const totalTasks = await Task.countDocuments({
      project: { $in: projectIds },
    });

    const tasksByStatus = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const tasksByPriority = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const myTasks = await Task.find({
      project: { $in: projectIds },
      assignedTo: req.user._id,
    })
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(10);

    const myPendingTasks = await Task.countDocuments({
      project: { $in: projectIds },
      assignedTo: req.user._id,
      status: { $ne: 'done' },
    });

    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    });

    const myOverdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      assignedTo: req.user._id,
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    });

    const recentTasks = await Task.find({
      project: { $in: projectIds },
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(10);

    const getStatusCount = (status) => {
      const found = tasksByStatus.find((s) => s._id === status);
      return found ? found.count : 0;
    };

    const getPriorityCount = (priority) => {
      const found = tasksByPriority.find((p) => p._id === priority);
      return found ? found.count : 0;
    };

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalTasks,
        tasksByStatus: {
          todo: getStatusCount('todo'),
          inProgress: getStatusCount('in_progress'),
          review: getStatusCount('review'),
          done: getStatusCount('done'),
        },
        tasksByPriority: {
          low: getPriorityCount('low'),
          medium: getPriorityCount('medium'),
          high: getPriorityCount('high'),
          urgent: getPriorityCount('urgent'),
        },
        myTasks,
        myPendingTasks,
        overdueTasks,
        myOverdueTasks,
        recentTasks,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data.',
    });
  }
});

module.exports = router;
