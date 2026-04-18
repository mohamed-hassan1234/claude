import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/ui/Modal';

const emptyQuestion = {
  code: '',
  section: '',
  text: '',
  helpText: '',
  type: 'short_text',
  optionsText: '',
  order: 1,
  required: false,
  isActive: true,
  scoringKey: 'none'
};

const typeOptions = ['short_text', 'paragraph', 'multiple_choice', 'single_select', 'likert', 'yes_no', 'numeric'];
const scoreOptions = ['none', 'awareness', 'technology', 'infrastructure', 'backup', 'cloudTools', 'securityTrust', 'willingness'];

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyQuestion);

  const load = () => api.get('/questions?includeInactive=true').then((res) => setQuestions(res.data.questions));

  useEffect(() => {
    load();
  }, []);

  const toOptionsText = (options = []) => options.map((option) => option.label).join('\n');
  const fromOptionsText = (text) => text.split('\n').map((item) => item.trim()).filter(Boolean).map((item) => ({ label: item, value: item }));

  const startEdit = (question) => {
    setEditing(question);
    setForm({ ...question, optionsText: toOptionsText(question.options) });
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      code: form.code,
      section: form.section,
      text: form.text,
      helpText: form.helpText,
      type: form.type,
      order: Number(form.order),
      required: form.required,
      isActive: form.isActive,
      scoringKey: form.scoringKey,
      options: ['multiple_choice', 'single_select', 'likert'].includes(form.type) ? fromOptionsText(form.optionsText) : []
    };
    if (editing?._id) await api.put(`/questions/${editing._id}`, payload);
    else await api.post('/questions', payload);
    setEditing(null);
    setForm(emptyQuestion);
    load();
  };

  const move = async (question, direction) => {
    const nextOrder = Math.max(1, question.order + direction);
    await api.put(`/questions/${question._id}`, { order: nextOrder });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Survey Question Management</h1>
          <p className="text-slate-500">Build reusable dynamic survey sections and questions.</p>
        </div>
        <button onClick={() => { setEditing({}); setForm({ ...emptyQuestion, order: questions.length + 1 }); }} className="w-full rounded bg-ocean px-4 py-2 text-sm font-semibold text-white sm:w-auto">Add question</button>
      </div>

      <div className="space-y-3">
        {questions.map((question) => (
          <div key={question._id} className="rounded border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean">{question.section}</p>
                <h3 className="mt-1 break-words font-semibold text-ink">{question.order}. {question.text}</h3>
                <p className="mt-1 text-sm text-slate-500">{question.code} · {question.type} · {question.required ? 'Required' : 'Optional'} · {question.isActive ? 'Visible' : 'Hidden'} · score: {question.scoringKey}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => move(question, -1)} className="rounded border border-slate-300 px-3 py-1 text-sm">Up</button>
                <button onClick={() => move(question, 1)} className="rounded border border-slate-300 px-3 py-1 text-sm">Down</button>
                <button onClick={() => startEdit(question)} className="rounded border border-slate-300 px-3 py-1 text-sm">Edit</button>
                <button onClick={async () => { if (confirm('Delete question?')) { await api.delete(`/questions/${question._id}`); load(); } }} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <Modal title={editing._id ? 'Edit question' : 'Add question'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <input required className="rounded border border-slate-300 px-3 py-2" placeholder="Question code, for example q5" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input required className="rounded border border-slate-300 px-3 py-2" placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            <input required type="number" className="rounded border border-slate-300 px-3 py-2" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            <textarea required className="rounded border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Question text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            <input className="rounded border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Help text" value={form.helpText || ''} onChange={(e) => setForm({ ...form, helpText: e.target.value })} />
            <select className="rounded border border-slate-300 px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select className="rounded border border-slate-300 px-3 py-2" value={form.scoringKey} onChange={(e) => setForm({ ...form, scoringKey: e.target.value })}>
              {scoreOptions.map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
            {['multiple_choice', 'single_select', 'likert'].includes(form.type) ? (
              <textarea className="rounded border border-slate-300 px-3 py-2 md:col-span-2" rows="5" placeholder="One option per line" value={form.optionsText || ''} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} />
            ) : null}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} /> Required</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Visible</label>
            <div className="md:col-span-2">
              <button className="w-full rounded bg-ocean px-4 py-2 font-semibold text-white sm:w-auto">Save question</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
