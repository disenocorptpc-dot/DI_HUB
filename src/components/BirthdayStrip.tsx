import { birthdayCountdownLabel, daysUntilBirthday, formatBirthday } from '../lib/dates';
import type { Item } from '../types';

const HORIZON_DAYS = 30;

/**
 * Franja de próximos cumpleaños. No renderiza nada si no hay ninguno en el
 * horizonte, para no dejar un hueco vacío en el dashboard.
 */
export default function BirthdayStrip({ people, onOpen }: { people: Item[]; onOpen: (item: Item) => void }) {
  const upcoming = people
    .map(person => ({ person, days: daysUntilBirthday(person.meta.birthday) }))
    .filter((entry): entry is { person: Item; days: number } => entry.days !== null && entry.days <= HORIZON_DAYS)
    .sort((a, b) => a.days - b.days);

  if (upcoming.length === 0) return null;

  return (
    <div className="mb-8 bg-surface border border-yellow-400/20 rounded-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-yellow-400 text-lg">cake</span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-400">Próximos cumpleaños</h3>
      </div>

      <div className="flex gap-2 flex-wrap">
        {upcoming.map(({ person, days }) => (
          <button
            key={person.id}
            onClick={() => onOpen(person)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-left transition-all ${
              days <= 1
                ? 'bg-yellow-400/10 border-yellow-400/40 hover:bg-yellow-400/20'
                : 'bg-surface-dark border-primary/10 hover:border-primary/30'
            }`}
          >
            <div>
              <p className="text-xs text-white font-medium leading-tight">{person.title}</p>
              <p className={`text-[10px] leading-tight ${days <= 1 ? 'text-yellow-400 font-bold' : 'text-slate-500'}`}>
                {formatBirthday(person.meta.birthday)} · {birthdayCountdownLabel(days)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
