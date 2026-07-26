import { useState, useEffect } from 'react';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Announcements — Company Feed & News Bulletin Register
 * Executive small white boxes with sidebar slate-900 header theming and responsive grid layout.
 */
const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', priority: 'normal' });

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await fetchAnnouncements();
      setAnnouncements(data || []);
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
      alert(error.response?.data?.message || 'Error publishing bulletin');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Retract and delete this bulletin?')) {
      try {
        await deleteAnnouncement(id);
        loadAnnouncements();
      } catch (error) {
        alert('Error deleting bulletin');
      }
    }
  };

  const categoryBadge = {
    general: 'bg-slate-100 text-slate-800 border-slate-300 font-black',
    policy: 'bg-slate-900 text-white border-slate-950 font-black',
    holiday: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black',
    urgent: 'bg-rose-100 text-rose-950 border-rose-400 font-black animate-pulse',
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Executive Header Box (Sidebar slate-900) */}
      <div className="bg-slate-900 text-white rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase flex items-center gap-2">
            <span>📢 Enterprise Announcements & Company Bulletin Feed</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Publish organization-wide notices, holiday reminders, or HR policy directives directly to mobile apps and staff panels.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-black uppercase transition-all shadow shrink-0 active:scale-95 cursor-pointer"
        >
          {showForm ? '✕ Close Form' : '＋ Post Bulletin'}
        </button>
      </div>

      {/* Small Box - Publish Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5 text-xs font-bold">
          <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2">Create New Broadcast Notice</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block mb-1 text-slate-700">Bulletin Title *</label>
              <input type="text" required placeholder="e.g., Diwali Holiday Schedule" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black text-slate-900" />
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black">
                <option value="general">General Notice</option>
                <option value="policy">HR Policy Directives</option>
                <option value="holiday">Holiday Schedule</option>
                <option value="urgent">Urgent Announcement</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-700">Priority Level</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-black">
                <option value="normal">Normal</option>
                <option value="high">High / Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-slate-700">Detailed Message Content *</label>
            <textarea required rows={3} placeholder="Write your full message here..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full p-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-800" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-black uppercase cursor-pointer">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-black uppercase shadow cursor-pointer">📢 Publish to Mobile & Web</button>
          </div>
        </form>
      )}

      {/* Structured Responsive Feed in Small Boxes */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {announcements.map((item) => (
            <div key={item._id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-400 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black border ${categoryBadge[item.category] || 'bg-slate-100 text-slate-800'}`}>
                    {item.category}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-1.5 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] font-extrabold text-slate-400">
                <span>By HR Executive</span>
                <button onClick={() => handleDelete(item._id)} className="text-rose-600 hover:text-rose-800 font-black uppercase text-[11px] cursor-pointer">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-extrabold text-xs col-span-3 bg-white rounded-xl border border-slate-200">
              No active bulletins in the company feed.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Announcements;
