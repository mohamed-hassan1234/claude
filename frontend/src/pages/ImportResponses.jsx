import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, RotateCcw, Upload } from 'lucide-react';
import api from '../api/axios';
import Loading from '../components/ui/Loading';

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read CSV file'));
    reader.readAsText(file);
  });

const summaryItems = [
  { key: 'totalRows', label: 'Total rows' },
  { key: 'importedRows', label: 'Imported rows' },
  { key: 'skippedRows', label: 'Skipped rows' },
  { key: 'errorRows', label: 'Error rows' }
];

export default function ImportResponses() {
  const [filename, setFilename] = useState('');
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [timestampColumn, setTimestampColumn] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const mappedCount = useMemo(
    () => (preview?.questions || []).filter((question) => mapping[question.code]).length,
    [mapping, preview]
  );

  const reset = () => {
    setFilename('');
    setCsv('');
    setPreview(null);
    setMapping({});
    setTimestampColumn('');
    setError('');
    setResult(null);
  };

  const loadPreview = async (file) => {
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const text = await readFileAsText(file);
      const { data } = await api.post('/responses/import/preview', { csv: text, filename: file.name });
      setFilename(file.name);
      setCsv(text);
      setPreview(data.preview);
      setMapping(data.preview.mapping || {});
      setTimestampColumn(data.preview.timestampColumn || '');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'CSV preview failed');
    } finally {
      setLoading(false);
    }
  };

  const importRows = async () => {
    setImporting(true);
    setError('');

    try {
      const { data } = await api.post('/responses/import', {
        csv,
        filename,
        mapping,
        timestampColumn
      });
      setResult(data.importResult);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Import Responses</h1>
          <p className="text-slate-500">Upload Google Forms CSV responses and save them into the main survey response collection.</p>
        </div>
        <button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-ocean hover:bg-ocean/5">
          <FileUp size={32} className="text-ocean" />
          <span className="mt-3 font-semibold text-ink">{filename || 'Choose CSV file'}</span>
          <span className="mt-1 text-sm text-slate-500">CSV headers should match the active survey questions.</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => loadPreview(event.target.files?.[0])} />
        </label>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? <Loading /> : null}

      {preview ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-4 rounded border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-ink">Column Mapping</h2>
                <p className="text-sm text-slate-500">{mappedCount} of {preview.questions.length} questions mapped.</p>
              </div>
              <button
                disabled={importing || !csv}
                onClick={importRows}
                className="inline-flex w-full items-center justify-center gap-2 rounded bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
              >
                <Upload size={16} />
                {importing ? 'Importing...' : 'Import responses'}
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Timestamp column
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={timestampColumn} onChange={(event) => setTimestampColumn(event.target.value)}>
                <option value="">Select timestamp column</option>
                {preview.columns.map((column) => <option key={column} value={column}>{column}</option>)}
              </select>
            </label>

            <div className="overflow-hidden rounded border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Question</th>
                      <th className="p-3">CSV column</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.questions.map((question) => (
                      <tr key={question.code}>
                        <td className="p-3 font-mono text-xs">{question.code}</td>
                        <td className="p-3">
                          <p className="font-medium text-ink">{question.text}</p>
                          <p className="mt-1 text-xs text-slate-500">{question.type}{question.required ? ' · required' : ''}</p>
                        </td>
                        <td className="p-3">
                          <select
                            className="w-64 rounded border border-slate-300 px-3 py-2"
                            value={mapping[question.code] || ''}
                            onChange={(event) => setMapping({ ...mapping, [question.code]: event.target.value })}
                          >
                            <option value="">Not mapped</option>
                            {preview.columns.map((column) => <option key={column} value={column}>{column}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Preview</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded border border-slate-200 p-3">
                  <p className="text-slate-500">Columns</p>
                  <p className="text-2xl font-bold text-ink">{preview.columns.length}</p>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <p className="text-slate-500">Rows</p>
                  <p className="text-2xl font-bold text-ink">{preview.totalRows}</p>
                </div>
              </div>
              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto text-sm">
                {preview.columns.map((column) => (
                  <div key={column} className="rounded bg-slate-50 px-3 py-2 text-slate-700">{column}</div>
                ))}
              </div>
            </section>

            {result ? (
              <section className="rounded border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <h2 className="text-lg font-semibold text-ink">Import Summary</h2>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {summaryItems.map((item) => (
                    <div key={item.key} className="rounded border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="text-2xl font-bold text-ink">{result.summary[item.key]}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm">
                  {result.rows.filter((row) => row.status !== 'imported').map((row) => (
                    <div key={row.rowNumber} className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">
                      <p className="font-semibold">Row {row.rowNumber}: {row.status}</p>
                      <p>{row.reason || (row.errors || []).join('; ')}</p>
                    </div>
                  ))}
                  {result.rows.every((row) => row.status === 'imported') ? (
                    <div className="rounded bg-emerald-50 p-3 text-emerald-700">All rows imported. No skipped or error rows.</div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
