const User = require('../models/User');

// get all users (admin only)
async function getAllUsers(req, res) {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
}

// update user role (admin only)
async function updateUserRole(req, res) {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'user', 'read-only'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, user, or read-only.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // admin cant change their own role
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role.' });
    }

    await User.updateRole(req.params.id, role);
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ message: 'Failed to update user role.' });
  }
}

// delete user (admin only)
async function deleteUser(req, res) {
  try {
    // admin cant delete themselves
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await User.delete(req.params.id);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
}

module.exports = { getAllUsers, updateUserRole, deleteUser };
