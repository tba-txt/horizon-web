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
  template: `
    <div class="dp-field" [class.is-disabled]="disabled()">
      <input
        [id]="inputId()"
        type="text"
        inputmode="numeric"
        maxlength="10"
        autocomplete="bday"
        class="dp-input"
        [class.is-invalid]="invalid()"
        [placeholder]="placeholder()"
        [value]="displayText()"
        [disabled]="disabled()"
        [readonly]="disabled()"
        (input)="onType($event)"
        (blur)="onTouched()"
      />
      @if (!disabled()) {
        <button type="button" class="dp-toggle" [class.active]="open()" (click)="toggle()" aria-label="Abrir calendário">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
          </svg>
        </button>
      } @else {
        <span class="dp-lock" title="Campo bloqueado para edição">
          <i class="bi bi-lock-fill"></i>
        </span>
      }
    </div>

    @if (open() && !disabled()) {
      <div #popup class="dp-popup" role="dialog" [style.top.px]="popupPos().top" [style.left.px]="popupPos().left">
        <div class="dp-header">
          <button type="button" class="dp-nav" (click)="step(-1)" aria-label="Anterior">&#8249;</button>
          <button type="button" class="dp-title" (click)="zoomOut()">{{ title() }}</button>
          <button type="button" class="dp-nav" (click)="step(1)" [disabled]="!canStepForward()" aria-label="Próximo">&#8250;</button>
        </div>

        @switch (view()) {
          @case ('days') {
            <div class="dp-grid dp-weekdays">
              @for (w of weekdays; track $index) { <span>{{ w }}</span> }
            </div>
            <div class="dp-grid">
              @for (cell of days(); track cell.date.getTime()) {
                <button type="button" class="dp-day"
                  [class.muted]="!cell.inMonth"
                  [class.today]="isToday(cell.date)"
                  [class.selected]="isSelected(cell.date)"
                  [disabled]="cell.disabled"
                  (click)="pick(cell.date)">{{ cell.date.getDate() }}</button>
              }
            </div>
          }
          @case ('months') {
            <div class="dp-grid dp-grid-3">
              @for (m of months; track $index) {
                <button type="button" class="dp-cell"
                  [class.selected]="selected()?.getFullYear() === viewYear() && selected()?.getMonth() === $index"
                  [disabled]="isFutureMonth($index)"
                  (click)="chooseMonth($index)">{{ m.slice(0, 3) }}</button>
              }
            </div>
          }
          @case ('years') {
            <div class="dp-grid dp-grid-3">
              @for (y of years(); track y) {
                <button type="button" class="dp-cell"
                  [class.selected]="selected()?.getFullYear() === y"
                  [disabled]="y > maxDate.getFullYear()"
                  (click)="chooseYear(y)">{{ y }}</button>
              }
            </div>
          }
        }

        <div class="dp-footer">
          <button type="button" class="dp-link" (click)="clear()">Limpar</button>
          <span class="dp-hint">{{ view() === 'days' ? 'Clique no mês para trocar o ano' : 'Selecione' }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .dp-field { position: relative; display: flex; align-items: center; }
    .dp-input {
      width: 100%;
      background: #ffffff;
      border: 1.5px solid #dbeafe;
      border-radius: 10px;
      padding: 0.6rem 2.2rem 0.6rem 0.85rem;
      font-size: 0.88rem;
      color: #1e293b;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      outline: none;
    }
    .dp-input::placeholder { color: #94a3b8; }
    .dp-input:focus { background: #fff; border-color: #5BA4D8; box-shadow: 0 0 0 3px rgba(91, 164, 216, 0.18); }
    .dp-input:disabled {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #64748b;
      cursor: not-allowed;
      box-shadow: none;
    }
    .dp-input.is-invalid { border-color: #ef4444; background: #fef2f2; }
    .dp-toggle {
      position: absolute; right: 8px; z-index: 2;
      width: 28px; height: 28px; border: none; border-radius: 6px;
      background: transparent; color: #64748b;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.2s ease, background 0.2s ease;
    }
    .dp-toggle:hover, .dp-toggle.active { background: rgba(91, 164, 216, 0.14); color: #5BA4D8; }
    .dp-lock {
      position: absolute; right: 12px; z-index: 2;
      color: #94a3b8; font-size: 0.85rem; pointer-events: none;
    }

    .dp-popup {
      position: fixed; z-index: 2000; width: 290px; padding: 14px;
      background: #ffffff;
      border: 1.5px solid #5BA4D8;
      border-radius: 12px;
      box-shadow: 0 20px 44px -10px rgba(11, 37, 69, 0.24);
      animation: dp-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dp-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }

    .dp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; background: #f0f7fd; padding: 6px 8px; border-radius: 8px; }
    .dp-title {
      border: none; background: transparent; font-weight: 700; font-size: 0.92rem; color: #0f172a;
      padding: 4px 10px; border-radius: 6px; transition: background 0.2s ease;
    }
    .dp-title:hover { background: rgba(91, 164, 216, 0.16); color: #5BA4D8; }
    .dp-nav {
      width: 30px; height: 30px; border: none; border-radius: 6px;
      background: transparent; color: #5BA4D8; font-size: 1.3rem; line-height: 1;
      transition: background 0.2s ease;
    }
    .dp-nav:hover:not(:disabled) { background: rgba(91, 164, 216, 0.16); }
    .dp-nav:disabled { color: #cbd5e1; }

    .dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    .dp-grid-3 { grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 4px 0; }
    .dp-weekdays span { text-align: center; font-size: 0.72rem; font-weight: 700; color: #5BA4D8; padding: 4px 0; }

    .dp-day, .dp-cell {
      border: none; background: transparent; color: #1e293b; font-size: 0.84rem;
      transition: all 0.15s ease;
    }
    .dp-day { aspect-ratio: 1; border-radius: 6px; font-weight: 500; }
    .dp-cell { padding: 10px 0; border-radius: 8px; font-weight: 600; }
    .dp-day:hover:not(:disabled), .dp-cell:hover:not(:disabled) { background: #f0f7fd; color: #5BA4D8; }
    .dp-day.muted { color: #cbd5e1; }
    .dp-day.today { box-shadow: inset 0 0 0 1.5px #65A30D; color: #65A30D; font-weight: 700; }
    .dp-day.selected, .dp-cell.selected {
      background: #5BA4D8; color: #fff; font-weight: 700;
      box-shadow: 0 3px 10px rgba(91, 164, 216, 0.35);
    }
    .dp-day:disabled, .dp-cell:disabled { color: #e2e8f0; cursor: not-allowed; }

    .dp-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 6px; }
    .dp-link { border: none; background: transparent; color: #5BA4D8; font-size: 0.78rem; font-weight: 700; padding: 0; }
    .dp-link:hover { text-decoration: underline; }
    .dp-hint { font-size: 0.7rem; color: #64748b; }
  `]
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
