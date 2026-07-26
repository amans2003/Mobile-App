const Meeting = require('../models/Meeting');

/**
 * @desc    Schedule a new meeting
 * @route   POST /api/meetings
 * @access  Private (any employee)
 */
const createMeeting = async (req, res) => {
  try {
    const { title, description, attendees, startTime, endTime, meetingLink, location } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, start time, and end time are required' });
    }

    if (!attendees || attendees.length === 0) {
      return res.status(400).json({ message: 'At least one attendee is required' });
    }

    const attendeeList = attendees.map((userId) => ({
      user: userId,
      status: 'pending',
    }));

    const meeting = await Meeting.create({
      organizer: req.user._id,
      title,
      description: description || '',
      attendees: attendeeList,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      meetingLink: meetingLink || '',
      location: location || '',
    });

    const populated = await Meeting.findById(meeting._id)
      .populate('organizer', 'name email designation')
      .populate('attendees.user', 'name email designation');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create meeting error:', error.message);
    res.status(500).json({ message: 'Server error creating meeting' });
  }
};

/**
 * @desc    Get my meetings (as organiser or attendee)
 * @route   GET /api/meetings/my
 * @access  Private
 */
const getMyMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { organizer: req.user._id },
        { 'attendees.user': req.user._id },
      ],
    })
      .populate('organizer', 'name email designation avatar')
      .populate('attendees.user', 'name email designation avatar')
      .sort({ startTime: -1 });

    res.json(meetings);
  } catch (error) {
    console.error('Get my meetings error:', error.message);
    res.status(500).json({ message: 'Server error fetching meetings' });
  }
};

/**
 * @desc    Get all meetings (HR / Admin view)
 * @route   GET /api/meetings
 * @access  HR / Admin
 */
const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('organizer', 'name email designation')
      .populate('attendees.user', 'name email designation')
      .sort({ startTime: -1 });

    res.json(meetings);
  } catch (error) {
    console.error('Get all meetings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    RSVP to a meeting (accept/decline)
 * @route   PUT /api/meetings/:id/rsvp
 * @access  Private (attendee only)
 */
const rsvpMeeting = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or declined' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const attendee = meeting.attendees.find(
      (a) => a.user.toString() === req.user._id.toString()
    );

    if (!attendee) {
      return res.status(403).json({ message: 'You are not an attendee of this meeting' });
    }

    attendee.status = status;
    await meeting.save();

    const updated = await Meeting.findById(meeting._id)
      .populate('organizer', 'name email designation')
      .populate('attendees.user', 'name email designation');

    res.json(updated);
  } catch (error) {
    console.error('RSVP meeting error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Cancel a meeting
 * @route   PUT /api/meetings/:id/cancel
 * @access  Private (organiser only)
 */
const cancelMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organiser can cancel this meeting' });
    }

    meeting.status = 'cancelled';
    await meeting.save();

    res.json({ message: 'Meeting cancelled', meeting });
  } catch (error) {
    console.error('Cancel meeting error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createMeeting,
  getMyMeetings,
  getAllMeetings,
  rsvpMeeting,
  cancelMeeting,
};
