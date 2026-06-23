import { emptyOption } from "../lib/survey.js";

export default function OptionsEditor({ options, onChange }) {
  const update = (i, patch) =>
    onChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  const add = () => onChange([...options, emptyOption()]);
  const remove = (i) => onChange(options.filter((_, idx) => idx !== i));

  return (
    <div>
      <label>Options</label>
      {options.map((o, i) => (
        <div className="opt-row" key={o.key}>
          <input
            className="opt-label"
            value={o.label}
            placeholder={`Option ${i + 1} label`}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <button
            type="button"
            className="icon-btn danger"
            title="Remove option"
            disabled={options.length <= 1}
            onClick={() => remove(i)}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="icon-btn" onClick={add}>
        + Add option
      </button>
    </div>
  );
}
