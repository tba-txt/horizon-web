import { Component, ElementRef, HostListener, OnDestroy, computed, effect, forwardRef, inject, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type PickerView = 'days' | 'months' | 'years';

interface DayCell {
  date: Date;
  inMonth: boolean;
  disabled: boolean;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const YEARS_PER_PAGE = 12;

/**
 * Seletor de data do Horizon (substitui o popup nativo, que não aceita estilização).
 * Valor do form control no formato ISO `YYYY-MM-DD`; exibição/digitação em `dd/mm/aaaa`.
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePickerComponent), multi: true }],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss']
})
export class DatePickerComponent implements ControlValueAccessor, OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  private popupRef = viewChild<ElementRef<HTMLElement>>('popup');

  constructor() {
    // Move o popup para o <body>: o card de vidro usa overflow:hidden + backdrop-filter,
    // o que cortaria e reposicionaria um elemento position:fixed dentro dele.
    effect(() => {
      const el = this.popupRef()?.nativeElement;
      if (el && el.parentElement !== document.body) document.body.appendChild(el);
    });
  }

  ngOnDestroy(): void {
    this.popupRef()?.nativeElement.remove();
  }

  inputId = input<string>('');
  placeholder = input<string>('dd/mm/aaaa');
  invalid = input<boolean>(false);

  readonly weekdays = WEEKDAYS;
  readonly months = MONTHS;
  readonly today = startOfDay(new Date());
  readonly maxDate = new Date(this.today.getFullYear() - 18, this.today.getMonth(), this.today.getDate());

  open = signal(false);
  disabled = signal(false);
  view = signal<PickerView>('days');
  selected = signal<Date | null>(null);
  viewYear = signal(this.maxDate.getFullYear());
  viewMonth = signal(this.maxDate.getMonth());
  popupPos = signal({ top: 0, left: 0 });
  private typed = signal<string | null>(null);

  displayText = computed(() => this.typed() ?? formatBr(this.selected()));

  title = computed(() => {
    switch (this.view()) {
      case 'days': return `${MONTHS[this.viewMonth()]} ${this.viewYear()}`;
      case 'months': return `${this.viewYear()}`;
      case 'years': { const s = this.yearPageStart(); return `${s} – ${s + YEARS_PER_PAGE - 1}`; }
    }
  });

  private yearPageStart = computed(() => this.viewYear() - (this.viewYear() % YEARS_PER_PAGE));
  years = computed(() => Array.from({ length: YEARS_PER_PAGE }, (_, i) => this.yearPageStart() + i));

  days = computed<DayCell[]>(() => {
    const year = this.viewYear(), month = this.viewMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date, inMonth: date.getMonth() === month, disabled: date > this.maxDate };
    });
  });

  private onChange: (value: string | null) => void = () => {};
  onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----
  writeValue(value: string | null): void {
    this.selected.set(parseIso(value));
    this.typed.set(null);
  }
  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  // ---- Interação ----
  toggle(): void {
    if (this.disabled()) return;
    if (this.open()) { this.close(); return; }
    const base = this.selected();
    // Sem data: abre na grade de anos já limitada a maiores de 18 anos.
    this.view.set(base ? 'days' : 'years');
    this.viewYear.set(base ? Math.min(base.getFullYear(), this.maxDate.getFullYear()) : this.maxDate.getFullYear() - 4);
    this.viewMonth.set(base ? base.getMonth() : this.maxDate.getMonth());
    this.positionPopup();
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.onTouched();
  }

  step(direction: 1 | -1): void {
    switch (this.view()) {
      case 'days': {
        const d = new Date(this.viewYear(), this.viewMonth() + direction, 1);
        this.viewYear.set(d.getFullYear());
        this.viewMonth.set(d.getMonth());
        break;
      }
      case 'months': this.viewYear.update(y => y + direction); break;
      case 'years': this.viewYear.update(y => y + direction * YEARS_PER_PAGE); break;
    }
  }

  canStepForward(): boolean {
    const max = this.maxDate;
    switch (this.view()) {
      case 'days': return this.viewYear() < max.getFullYear() || this.viewMonth() < max.getMonth();
      case 'months': return this.viewYear() < max.getFullYear();
      case 'years': return this.yearPageStart() + YEARS_PER_PAGE <= max.getFullYear();
    }
  }

  zoomOut(): void {
    this.view.update(v => (v === 'days' ? 'months' : 'years'));
  }

  chooseYear(year: number): void {
    this.viewYear.set(year);
    this.view.set('months');
  }

  chooseMonth(month: number): void {
    this.viewMonth.set(month);
    this.view.set('days');
  }

  pick(date: Date): void {
    this.commit(date);
    this.close();
  }

  clear(): void {
    this.commit(null);
    this.close();
  }

  onType(event: Event): void {
    const el = event.target as HTMLInputElement;
    const masked = maskBr(el.value);
    el.value = masked;
    this.typed.set(masked);

    if (masked.length === 10) {
      const parsed = parseBr(masked);
      this.selected.set(parsed);
      this.onChange(parsed ? toIso(parsed) : masked); // valor inválido segue para o validator acusar
    } else {
      this.onChange(masked ? masked : null);
    }
  }

  isSelected(date: Date): boolean {
    const s = this.selected();
    return !!s && s.getTime() === date.getTime();
  }

  isToday(date: Date): boolean {
    return date.getTime() === this.maxDate.getTime();
  }

  isFutureMonth(month: number): boolean {
    return new Date(this.viewYear(), month, 1) > this.maxDate;
  }

  private commit(date: Date | null): void {
    this.selected.set(date);
    this.typed.set(null);
    this.onChange(date ? toIso(date) : null);
  }

  private positionPopup(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const width = 280, height = 360, gap = 6;
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    const below = rect.bottom + gap;
    const top = below + height > window.innerHeight ? Math.max(8, rect.top - height - gap) : below;
    this.popupPos.set({ top, left });
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    const insidePopup = this.popupRef()?.nativeElement.contains(target);
    if (!insidePopup && !this.host.nativeElement.contains(target)) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.open()) this.positionPopup();
  }
}

// ---- Helpers puros ----
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatBr(d: Date | null): string {
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '';
}

function buildDate(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? d : null;
}

function parseIso(value: string | null): Date | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? buildDate(+m[1], +m[2], +m[3]) : null;
}

function parseBr(value: string): Date | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? buildDate(+m[3], +m[2], +m[1]) : null;
}

function maskBr(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
