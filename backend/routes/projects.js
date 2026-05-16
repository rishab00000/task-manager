const express = require('express');
const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  projectAdmin,
  projectMember,
} = require('../middleware/rbac');
const {
  createProjectValidator,
  updateProjectValidator,
  addMemberValidator,
} = require('../validators/project');

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

router.post('/', createProjectValidator, async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await project.populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project.',
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort('-updatedAt');

    res.json({
      success: true,
      count: projects.length,
      data: { projects },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects.',
    });
  }
});

router.get('/:id', projectMember, async (req, res) => {
  try {
    const project = req.project;
    await project.populate([
      { path: 'members.user', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project.',
    });
  }
});

router.put('/:id', projectAdmin, updateProjectValidator, async (req, res) => {
  try {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { name, description } = req.body;
    const project = req.project;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: { project },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating project.',
    });
  }
});

router.delete('/:id', projectAdmin, async (req, res) => {
  try {
    const project = req.project;

    // Delete associated tasks
    await require('../models/Task').deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project.',
    });
  }
});

router.post(
  '/:id/members',
  projectAdmin,
  addMemberValidator,
  async (req, res) => {
    try {
      const validationError = handleValidation(req, res);
      if (validationError) return;

      const { userId, role } = req.body;
      const project = req.project;

      const userToAdd = await User.findById(userId);
      if (!userToAdd) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      if (project.isMember(userId)) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this project.',
        });
      }

      project.members.push({ user: userId, role: role || 'member' });
      await project.save();
      await project.populate('members.user', 'name email avatar');

      res.status(201).json({
        success: true,
        message: 'Member added successfully.',
        data: { project },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while adding member.',
      });
    }
  }
);

router.delete(
  '/:id/members/:userId',
  projectAdmin,
  async (req, res) => {
    try {
      const project = req.project;
      const { userId } = req.params;

      if (!project.isMember(userId)) {
        return res.status(404).json({
          success: false,
          message: 'Member not found in this project.',
        });
      }

      if (project.isAdmin(userId)) {
        const adminCount = project.members.filter(
          (m) => m.role === 'admin'
        ).length;
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message:
              'Cannot remove the last admin. Promote another member to admin first.',
          });
        }
      }

      project.members = project.members.filter(
        (m) => m.user.toString() !== userId
      );
      await project.save();
      await project.populate('members.user', 'name email avatar');

      res.json({
        success: true,
        message: 'Member removed successfully.',
        data: { project },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while removing member.',
      });
    }
  }
);

router.put(
  '/:id/members/:userId',
  projectAdmin,
  async (req, res) => {
    try {
      const project = req.project;
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !['admin', 'member'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be admin or member.',
        });
      }

      const member = project.members.find(
        (m) => m.user.toString() === userId
      );
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found.',
        });
      }

      member.role = role;
      await project.save();
      await project.populate('members.user', 'name email avatar');

      res.json({
        success: true,
        message: 'Member role updated successfully.',
        data: { project },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error while updating member role.',
      });
    }
  }
);

module.exports = router;
