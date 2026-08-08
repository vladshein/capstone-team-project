import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

export interface CreateWorkerProfilePayload {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO "YYYY-MM-DD"
  phone: string;
  city: string;
}

interface CreateWorkerProfileModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateWorkerProfilePayload) => void;
}

// Мінімальний легальний вік для виходу на зміни. Уточнити з бекенд-командою —
// в Backend_TZ вікове обмеження явно не прописане.
const MIN_AGE = 18;

const PHONE_REGEX = /^\+380\d{9}$/; // той самий формат, що й у SignUpModal

function calculateAge(isoDate: string): number {
  const birth = new Date(isoDate);
  if (Number.isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

export function CreateWorkerProfileModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateWorkerProfileModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("+380");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !city.trim()) {
      setError("Заповніть, будь ласка, усі поля.");
      return;
    }
    if (!birthDate) {
      setError("Вкажіть дату народження.");
      return;
    }
    if (calculateAge(birthDate) < MIN_AGE) {
      setError(`Мінімальний вік для реєстрації — ${MIN_AGE} років.`);
      return;
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      setError("Телефон має бути у форматі +380XXXXXXXXX.");
      return;
    }

    setError(null);
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      phone: phone.trim(),
      city: city.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-bg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Профіль виконавця</h2>
          <button onClick={onClose} className="text-text-subtle hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-text-subtle">
          Заповніть базові дані — верифікацію (Дія, паспорт, медкнижка) можна пройти пізніше в
          профілі.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted">Ім'я</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Олена"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted">Прізвище</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Коваленко"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted">Дата народження</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted">Телефон</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="+380XXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted">Місто</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Київ"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[var(--radius-pill)] bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {isSubmitting ? "Збереження..." : "Зберегти"}
          </button>
        </form>
      </div>
    </div>
  );
}