const commonClass = 'mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20';

export default function QuestionInput({ question, value, onChange }) {
  const options = question.type === 'yes_no' ? [{ label: 'Haa', value: 'Haa' }, { label: 'Maya', value: 'Maya' }] : question.options || [];

  if (question.type === 'paragraph') {
    return <textarea rows="4" value={value || ''} onChange={(event) => onChange(event.target.value)} className={commonClass} />;
  }

  if (question.type === 'numeric') {
    return <input type="number" value={value || ''} onChange={(event) => onChange(event.target.value)} className={commonClass} />;
  }

  if (question.type === 'multiple_choice') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) => {
                onChange(event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value));
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (['single_select', 'likert', 'yes_no'].includes(question.type)) {
    return (
      <select value={value || ''} onChange={(event) => onChange(event.target.value)} className={commonClass}>
        <option value="">Dooro jawaab</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return <input value={value || ''} onChange={(event) => onChange(event.target.value)} className={commonClass} />;
}
