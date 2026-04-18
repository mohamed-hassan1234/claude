import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import QuestionInput from '../components/forms/QuestionInput';

const initialMeta = {
  respondentName: '',
  organizationName: '',
  sector: '',
  district: '',
  phoneNumber: ''
};

export default function PublicSurvey() {
  const [sectors, setSectors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState(initialMeta);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState({ loading: true, saving: false, message: '', error: '' });

  useEffect(() => {
    Promise.all([api.get('/sectors'), api.get('/questions')])
      .then(([sectorRes, questionRes]) => {
        setSectors(sectorRes.data.sectors);
        setQuestions(questionRes.data.questions);
      })
      .catch(() => setStatus((current) => ({ ...current, error: 'Survey data could not be loaded.' })))
      .finally(() => setStatus((current) => ({ ...current, loading: false })));
  }, []);

  const grouped = useMemo(() => {
    return questions.reduce((acc, question) => {
      acc[question.section] = acc[question.section] || [];
      acc[question.section].push(question);
      return acc;
    }, {});
  }, [questions]);

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: false, saving: true, message: '', error: '' });
    try {
      await api.post('/responses/public', {
        ...meta,
        answers
      });
      setMeta(initialMeta);
      setAnswers({});
      setStatus({ loading: false, saving: false, message: 'Mahadsanid. Jawaabtaada waa la gudbiyay.', error: '' });
    } catch (error) {
      setStatus({
        loading: false,
        saving: false,
        message: '',
        error: error.response?.data?.message || 'Submission failed. Please check required fields.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Somalia District Survey</p>
            <h1 className="mt-1 text-3xl font-bold text-ink">Cloud Computing Readiness Survey</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Fadlan buuxi xogta si loo fahmo diyaargarowga, caqabadaha, iyo baahiyaha Cloud Computing ee ganacsiyada iyo hayadaha.
            </p>
          </div>
          <img
            className="h-28 w-full rounded object-cover lg:w-72"
            src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80"
            alt="Technology workspace"
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex justify-end">
          <Link to="/login" className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            Admin login
          </Link>
        </div>
        {status.message ? <div className="mb-5 rounded border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{status.message}</div> : null}
        {status.error ? <div className="mb-5 rounded border border-red-200 bg-red-50 p-4 text-red-700">{status.error}</div> : null}

        <form onSubmit={submit} className="space-y-6">
          <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">Xogta jawaab-bixiyaha</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Magaca jawaab-bixiyaha
                <input className="mt-2 w-full rounded border border-slate-300 px-3 py-2" value={meta.respondentName} onChange={(e) => setMeta({ ...meta, respondentName: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Magaca ganacsiga / hayadda *
                <input required className="mt-2 w-full rounded border border-slate-300 px-3 py-2" value={meta.organizationName} onChange={(e) => setMeta({ ...meta, organizationName: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Sector *
                <select required className="mt-2 w-full rounded border border-slate-300 px-3 py-2" value={meta.sector} onChange={(e) => setMeta({ ...meta, sector: e.target.value })}>
                  <option value="">Dooro sector</option>
                  {sectors.map((sector) => (
                    <option key={sector._id} value={sector._id}>{sector.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Degmada *
                <input required className="mt-2 w-full rounded border border-slate-300 px-3 py-2" value={meta.district} onChange={(e) => setMeta({ ...meta, district: e.target.value })} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Telefoon
                <input className="mt-2 w-full rounded border border-slate-300 px-3 py-2" value={meta.phoneNumber} onChange={(e) => setMeta({ ...meta, phoneNumber: e.target.value })} />
              </label>
            </div>
          </section>

          {Object.entries(grouped).map(([section, items]) => (
            <section key={section} className="rounded border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">{section}</h2>
              <div className="mt-5 space-y-5">
                {items.map((question) => (
                  <label key={question._id} className="block text-sm font-medium text-slate-700">
                    {question.text} {question.required ? <span className="text-red-600">*</span> : null}
                    {question.helpText ? <span className="block text-xs font-normal text-slate-500">{question.helpText}</span> : null}
                    <QuestionInput question={question} value={answers[question.code]} onChange={(value) => setAnswers({ ...answers, [question.code]: value })} />
                  </label>
                ))}
              </div>
            </section>
          ))}

          <button disabled={status.saving} className="w-full rounded bg-ocean px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
            {status.saving ? 'Waa la dirayaa...' : 'Gudbi Survey'}
          </button>
        </form>
      </main>
    </div>
  );
}
