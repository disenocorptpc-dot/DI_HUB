export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Arma el valor que guardamos: 'YYYY-MM-DD', o 'MM-DD' cuando no se sabe el año. */
export function buildBirthday(month: number, day: number, year: number | null): string {
  if (!month || !day) return '';
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return year ? `${year}-${mm}-${dd}` : `${mm}-${dd}`;
}

export type Birthday = { month: number; day: number; year: number | null };

/**
 * Acepta 'YYYY-MM-DD' (input type=date) o 'MM-DD' para cuando no sabes el año.
 * Parseamos a mano en lugar de usar new Date() porque el constructor interpreta
 * 'YYYY-MM-DD' como UTC y corre la fecha un día en zonas horarias negativas.
 */
export function parseBirthday(value: string | undefined): Birthday | null {
  if (!value) return null;

  const full = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) {
    const [, y, m, d] = full;
    const month = Number(m);
    const day = Number(d);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day, year: Number(y) };
  }

  const short = value.match(/^(\d{2})-(\d{2})$/);
  if (short) {
    const month = Number(short[1]);
    const day = Number(short[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day, year: null };
  }

  return null;
}

/** "14 de marzo" — sin año, porque nadie quiere que su edad esté en el dashboard. */
export function formatBirthday(value: string | undefined): string {
  const b = parseBirthday(value);
  if (!b) return '';
  return `${b.day} de ${MONTHS[b.month - 1]}`;
}

/**
 * Días hasta el próximo cumpleaños. 0 = hoy.
 * El 29 de febrero en año no bisiesto se trata como 1 de marzo.
 */
export function daysUntilBirthday(value: string | undefined, today = new Date()): number | null {
  const b = parseBirthday(value);
  if (!b) return null;

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const occurrence = (year: number) => {
    const date = new Date(year, b.month - 1, b.day);
    // Si el día no existe en ese mes (29-feb en año común), Date rueda al mes
    // siguiente, que es exactamente el comportamiento que queremos.
    return date;
  };

  let next = occurrence(startOfToday.getFullYear());
  if (next < startOfToday) {
    next = occurrence(startOfToday.getFullYear() + 1);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((next.getTime() - startOfToday.getTime()) / msPerDay);
}

/** Edad que cumple en su próximo cumpleaños, o null si no guardamos el año. */
export function ageOnNextBirthday(value: string | undefined, today = new Date()): number | null {
  const b = parseBirthday(value);
  if (!b || b.year === null) return null;

  const days = daysUntilBirthday(value, today);
  if (days === null) return null;

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nextYear = new Date(startOfToday.getTime() + days * 24 * 60 * 60 * 1000).getFullYear();
  return nextYear - b.year;
}

export function birthdayCountdownLabel(days: number): string {
  if (days === 0) return '¡Hoy!';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}
