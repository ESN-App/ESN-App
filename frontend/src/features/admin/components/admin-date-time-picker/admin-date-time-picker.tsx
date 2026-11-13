import { Host } from '../../../../shared/host';
import './admin-date-time-picker.scss';

function toLocalInputValue(value: Date): string {
  const pad = (part: number): string => part.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

interface AdminDateTimePickerProps {
  inputId: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AdminDateTimePicker({ inputId, value, onChange, onBlur, disabled = false, className }: AdminDateTimePickerProps) {
  const inputValue = value && !Number.isNaN(value.getTime()) ? toLocalInputValue(value) : '';

  return (
    <Host tag="app-admin-date-time-picker" className={className}>
      <input
        type="datetime-local"
        id={inputId}
        value={inputValue}
        disabled={disabled}
        step="60"
        onChange={(event) => {
          const next = event.currentTarget.value;
          onChange(next ? new Date(next) : null);
        }}
        onBlur={onBlur}
      />
    </Host>
  );
}
