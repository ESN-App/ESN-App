import { Component, Input, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SiteSettings } from '../../../../core';
import { zonedParts, zonedTimeToUtc } from '../../../../shared';

const INPUT_VALUE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

@Component({
  selector: 'app-admin-date-time-picker',
  templateUrl: './admin-date-time-picker.html',
  styleUrl: './admin-date-time-picker.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AdminDateTimePicker),
      multi: true,
    },
  ],
})
/** The admin types wall-clock time in the site zone; the form value is the matching instant. */
export class AdminDateTimePicker implements ControlValueAccessor {
  @Input({ required: true }) inputId = '';
  private readonly timeZone = inject(SiteSettings).timeZone;

  readonly inputValue = signal('');
  readonly disabled = signal(false);

  private onChange: (value: Date | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: Date | string | null): void {
    const parsed = value ? new Date(value) : null;
    this.inputValue.set(
      parsed && !Number.isNaN(parsed.getTime()) ? this.toLocalInputValue(parsed) : '',
    );
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  updateValue(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    this.inputValue.set(value);
    const match = INPUT_VALUE.exec(value);
    const [year, month, day, hour, minute] = match ? match.slice(1).map(Number) : [];
    this.onChange(match ? zonedTimeToUtc(year, month, day, hour, minute, this.timeZone()) : null);
  }

  markTouched(): void {
    this.onTouched();
  }

  private toLocalInputValue(value: Date): string {
    const pad = (part: number): string => part.toString().padStart(2, '0');
    const p = zonedParts(value, this.timeZone());
    return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
  }
}
