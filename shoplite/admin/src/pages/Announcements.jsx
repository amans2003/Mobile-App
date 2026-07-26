import { useState, useEffect } from 'react';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from '../services/api';

/**
 * Announcements — Company news & bulletin management
 */
const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', priority: 'normal' });

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAnnouncement(form);
      setForm({ title: '', content: '', category: 'general', priority: 'normal' });
      setShowForm(false);
      loadAnnouncements();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating announcement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        loadAnnouncements();
      } catch (error) {
        alert('Error deleting announcement');
      }
    }
  };

  const categoryColors = {
    general: 'bg-blue-100 text-blue-700',
    policy: 'bg-purple-100 text-purple-700',
    holiday: 'bg-emerald-100 text-emerald-700',
    event: 'bg-pink-100 text-pink-700',
    recognition: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const priorityIcons = { low: '🔵', normal: '🟡', high: '🔴' };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Company news, policies, and bulletin board</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all">
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="general">General</option>
                <option value="policy">Policy</option>
                <option value="holiday">Holiday</option>
                <option value="event">Event</option>
                <option value="recognition">Recognition</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <button type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all">
            Publish Announcement
          </button>
        </form>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{priorityIcons[ann.priority]}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[ann.category]}`}>
                      {ann.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{ann.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{ann.content}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>By {ann.author?.name || 'Unknown'}</span>
                    <span>·</span>
                    <span>{new Date(ann.publishDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(ann._id)} className="text-gray-400 hover:text-red-500 transition-colors ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              No announcements yet. Create one!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Announcements;
