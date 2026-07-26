const Announcement = require('../models/Announcement');

/**
 * @desc    Create announcement
 * @route   POST /api/announcements
 * @access  HR / Admin
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, priority, expiryDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      author: req.user._id,
      category: category || 'general',
      priority: priority || 'normal',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('author', 'name designation');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create announcement error:', error.message);
    res.status(500).json({ message: 'Server error creating announcement' });
  }
};

/**
 * @desc    Get all active announcements (employee feed)
 * @route   GET /api/announcements
 * @access  Private (any employee)
 */
const getAnnouncements = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;

    // Exclude expired announcements
    filter.$or = [
      { expiryDate: null },
      { expiryDate: { $gte: new Date() } },
    ];

    const announcements = await Announcement.find(filter)
      .populate('author', 'name designation avatar')
      .sort({ priority: -1, publishDate: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Get announcements error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update an announcement
 * @route   PUT /api/announcements/:id
 * @access  HR / Admin
 */
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const { title, content, category, priority, isActive, expiryDate } = req.body;

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (category !== undefined) announcement.category = category;
    if (priority !== undefined) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate ? new Date(expiryDate) : null;

    await announcement.save();

    const updated = await Announcement.findById(announcement._id)
      .populate('author', 'name designation');

    res.json(updated);
  } catch (error) {
    console.error('Update announcement error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  HR / Admin
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};
