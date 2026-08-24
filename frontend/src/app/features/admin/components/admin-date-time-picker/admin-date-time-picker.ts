import { Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
export class AdminDateTimePicker implements ControlValueAccessor {
  @Input({ required: true }) inputId = '';

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
    this.onChange(value ? new Date(value) : null);
  }

  markTouched(): void {
    this.onTouched();
  }

  private toLocalInputValue(value: Date): string {
    const pad = (part: number): string => part.toString().padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
}
