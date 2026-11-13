interface StatusOption {
  value: number;
  modifier: string;
  label: string;
  hint: string;
}

const DRAFT_AND_PUBLISHED: StatusOption[] = [
  { value: 0, modifier: 'draft', label: 'Draft', hint: 'Visible only to logged-in administrators.' },
  { value: 1, modifier: 'published', label: 'Published', hint: 'Visible to everyone.' },
];

interface StatusOptionsProps {
  legend: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  options?: StatusOption[];
}

/** The status radio cards at the top of every admin editor (styles live in the editor stylesheets). */
export function StatusOptions({ legend, description, value, onChange, options = DRAFT_AND_PUBLISHED }: StatusOptionsProps) {
  return (
    <fieldset className="status-field">
      <legend>{legend}</legend>
      <p>{description}</p>
      <div className="status-options">
        {options.map((option) => (
          <label key={option.value} className={`status-option status-option--${option.modifier}`}>
            <input type="radio" name="status" checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="status-option__dot" aria-hidden="true"></span>
            <span className="status-option__copy">
              <strong>{option.label}</strong>
              <small>{option.hint}</small>
            </span>
            <span className="status-option__choice" aria-hidden="true"></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export type { StatusOption };
