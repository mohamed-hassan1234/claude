import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import QuestionInput from '../components/forms/QuestionInput';
import Loading from '../components/ui/Loading';

export default function ResponseDetails() {
  const { id } = useParams();
  const [response, setResponse] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/responses/${id}`), api.get('/sectors?includeInactive=true'), api.get('/questions?includeInactive=true')]).then(
      ([responseRes, sectorRes, questionRes]) => {
        const loaded = responseRes.data.response;
        setResponse(loaded);
        setSectors(sectorRes.data.sectors);
        setQuestions(questionRes.data.questions);
        setForm({
          respondentName: loaded.respondentName || '',
          organizationName: loaded.organizationName || '',
          sector: loaded.sector?._id || loaded.sector,
          district: loaded.district || '',
          phoneNumber: loaded.phoneNumber || '',
          answers: loaded.answers || {}
        });
      }
    );
  }, [id]);

  if (!response || !form) return <Loading />;

  const save = async (event) => {
    event.preventDefault();
    const { data } = await api.put(`/responses/${id}`, {
      respondentName: form.respondentName,
      organizationName: form.organizationName,
      sector: form.sector,
      district: form.district,
      phoneNumber: form.phoneNumber,
      answers: form.answers
    });
    const refreshed = await api.get(`/responses/${data.response._id}`);
    setResponse(refreshed.data.response);
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="break-words text-2xl font-bold text-ink">{response.organizationName}</h1>
          <p className="text-slate-500">{response.sector?.name} in {response.district}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={() => setEditing(!editing)} className="w-full rounded bg-ocean px-4 py-2 text-sm font-semibold text-white sm:w-auto">
            {editing ? 'Cancel edit' : 'Edit response'}
          </button>
          <Link to="/admin/responses" className="w-full rounded border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold sm:w-auto">Back</Link>
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-5 rounded border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Edit response</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Respondent name" value={form.respondentName} onChange={(e) => setForm({ ...form, respondentName: e.target.value })} />
            <input required className="rounded border border-slate-300 px-3 py-2" placeholder="Organization" value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
            <select required className="rounded border border-slate-300 px-3 py-2" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
              {sectors.map((sector) => <option key={sector._id} value={sector._id}>{sector.name}</option>)}
            </select>
            <input required className="rounded border border-slate-300 px-3 py-2" placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <input className="rounded border border-slate-300 px-3 py-2" placeholder="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          </div>
          <div className="space-y-4">
            {questions.map((question) => (
              <label key={question._id} className="block text-sm font-medium text-slate-700">
                {question.text}
                <QuestionInput
                  question={question}
                  value={form.answers[question.code]}
                  onChange={(value) => setForm({ ...form, answers: { ...form.answers, [question.code]: value } })}
                />
              </label>
            ))}
          </div>
          <button className="w-full rounded bg-ink px-4 py-2 font-semibold text-white sm:w-auto">Save changes</button>
        </form>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">Readiness score</p>
          <p className="text-4xl font-bold text-ocean">{response.readinessScore}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">Readiness band</p>
          <p className="text-2xl font-bold text-ink">{response.readinessBand}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="text-lg font-semibold text-ink">{new Date(response.createdAt).toLocaleString()}</p>
        </div>
      </section>
      <section className="rounded border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-ink">Answers</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {(response.answerDetails || []).map((answer) => (
            <div key={answer.questionId} className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ocean">{answer.section}</p>
              <p className="mt-1 font-medium text-ink">{answer.questionText}</p>
              <p className="mt-2 text-slate-600">{Array.isArray(answer.value) ? answer.value.join(', ') : String(answer.value || '')}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
