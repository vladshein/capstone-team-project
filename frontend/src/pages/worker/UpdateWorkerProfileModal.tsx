// import { useState, type FormEvent } from "react";
// import { X } from "lucide-react";
// import type { CreateWorkerProfilePayload } from "../../redux/worker-profile/types";
// export type { CreateWorkerProfilePayload };

// interface CreateWorkerProfileModalProps {
//   isOpen: boolean;
//   isSubmitting: boolean;
//   phone: string;
//   onClose: () => void;
//   onSubmit: (payload: CreateWorkerProfilePayload) => void;
//   serverError?: string;
// }

// const MIN_AGE = 18;

// function calculateAge(isoDate: string): number {
//   const birth = new Date(isoDate);
//   if (Number.isNaN(birth.getTime())) return 0;

//   const today = new Date();
//   let age = today.getFullYear() - birth.getFullYear();
//   const hasHadBirthdayThisYear =
//     today.getMonth() > birth.getMonth() ||
//     (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
//   if (!hasHadBirthdayThisYear) age -= 1;

//   return age;
// }

// export function CreateWorkerProfileModal({
//   isOpen,
//   isSubmitting,
//   phone,
//   onClose,
//   onSubmit,
//   serverError,
// }: CreateWorkerProfileModalProps) {
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [birthDate, setBirthDate] = useState("");
//   const [taxNumber, setTaxNumber] = useState("");
//   const [avatarUrl, setAvatarUrl] = useState("");
//   const [error, setError] = useState<string | null>(null);

//   if (!isOpen) return null;

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();

//     if (!firstName.trim() || !lastName.trim()) {
//       setError("Заповніть, будь ласка, усі поля.");
//       return;
//     }
//     if (!birthDate) {
//       setError("Вкажіть дату народження.");
//       return;
//     }
//     if (calculateAge(birthDate) < MIN_AGE) {
//       setError(`Мінімальний вік для реєстрації — ${MIN_AGE} років.`);
//       return;
//     }

//     // validation — Joi: length(10), pattern /^[0-9]+$/, required
//     const TAX_NUMBER_REGEX = /^[0-9]{10}$/;

//     // inside handleSubmit, alongside existing checks
//     if (!TAX_NUMBER_REGEX.test(taxNumber.trim())) {
//       setError("ІПН повинен складатися рівно з 10 цифр.");
//       return;
//     }
//     if (avatarUrl.trim() && !/^https?:\/\/.+/.test(avatarUrl.trim())) {
//       setError("Посилання на аватар має бути коректною URL-адресою.");
//       return;
//     }

//     setError(null);
//     onSubmit({
//       firstName: firstName.trim(),
//       lastName: lastName.trim(),
//       birthDate,
//       taxNumber: taxNumber.trim(),
//       ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
//     });
//   };

//   return (
//       <div className="w-full max-w-md rounded-[var(--radius-card)] bg-bg p-6 shadow-lg">
//         <div className="flex items-center justify-between">
//           <h2 className="font-heading text-lg font-semibold">Профіль виконавця</h2>
//           <button onClick={onClose} className="text-text-subtle hover:text-text">
//             <X className="h-5 w-5" />
//           </button>
//         </div>
//         <p className="mt-1 text-xs text-text-subtle">
//           Заповніть базові дані — верифікацію (Дія, паспорт, медкнижка) можна пройти пізніше в
//           профілі.
//         </p>

//         <form onSubmit={handleSubmit} className="mt-5 space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs font-medium text-text-muted">Ім'я</label>
//               <input
//                 value={firstName}
//                 onChange={(e) => setFirstName(e.target.value)}
//                 className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//                 placeholder="Олена"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-medium text-text-muted">Прізвище</label>
//               <input
//                 value={lastName}
//                 onChange={(e) => setLastName(e.target.value)}
//                 className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//                 placeholder="Коваленко"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-text-muted">Дата народження</label>
//             <input
//               type="date"
//               value={birthDate}
//               onChange={(e) => setBirthDate(e.target.value)}
//               className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-text-muted">ІПН</label>
//             <input
//               value={taxNumber}
//               onChange={(e) => setTaxNumber(e.target.value)}
//               inputMode="numeric"
//               maxLength={10}
//               className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//               placeholder="1234567890"
//             />
//           </div>

//           // TODO змінити на завантаження фото
//           <div>
//             <label className="block text-xs font-medium text-text-muted">
//               Аватар (посилання) <span className="text-text-subtle">— необов'язково</span>
//             </label>
//             <input
//               value={avatarUrl}
//               onChange={(e) => setAvatarUrl(e.target.value)}
//               className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
//               placeholder="https://..."
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-medium text-text-muted">Телефон</label>
//             <input
//               value={phone}
//               disabled
//               className="mt-1 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-muted"
//             />
//             <p className="mt-1 text-xs text-text-subtle">Змінити номер можна в налаштуваннях акаунта.</p>
//           </div>

//           {error && <p className="text-sm text-danger">{error}</p>}
//           {!error && serverError && (
//             <p className="text-sm text-danger">{serverError}</p>
//           )}

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="w-full rounded-[var(--radius-pill)] bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
//           >
//             {isSubmitting ? "Збереження..." : "Зберегти"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type {
  UpdateWorkerProfilePayload,
  WorkerProfile,
} from "../../redux/worker-profile/types";

export type { UpdateWorkerProfilePayload };

interface UpdateWorkerProfileModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  phone: string;
  /**
   * Наявний профіль користувача (або null, якщо ще не завантажений
   * чи ще не створений). Форма підставляє ці значення в поля щоразу,
   * коли модалка відкривається.
   */
  profile: WorkerProfile | null;
  onClose: () => void;
  onSubmit: (payload: UpdateWorkerProfilePayload) => void;
  serverError?: string;
}

const MIN_AGE = 18;
const TAX_NUMBER_REGEX = /^[0-9]{10}$/;
const URL_REGEX = /^https?:\/\/.+/;

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

export function UpdateWorkerProfileModal({
  isOpen,
  isSubmitting,
  phone,
  profile,
  onClose,
  onSubmit,
  serverError,
}: UpdateWorkerProfileModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Підставляємо дані наявного профілю в поля форми щоразу,
  // коли модалка відкривається (isOpen -> true), або коли сам
  // профіль оновився, поки модалка вже відкрита (напр. після
  // успішного збереження).
  useEffect(() => {
    if (!isOpen) return;

    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setBirthDate(profile?.birthDate ?? "");
    setTaxNumber(profile?.taxNumber ?? "");
    setAvatarUrl(profile?.avatarUrl ?? "");
    setError(null);
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Update-форма: поле не є обов'язковим саме по собі, але якщо
    // користувач його заповнив (або воно вже було заповнене раніше
    // і залишилось непорожнім), значення має бути коректним.
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedTaxNumber = taxNumber.trim();
    const trimmedAvatarUrl = avatarUrl.trim();

    if (trimmedFirstName && trimmedFirstName.length < 2) {
      setError("Ім'я має містити мінімум 2 символи.");
      return;
    }
    if (trimmedLastName && trimmedLastName.length < 2) {
      setError("Прізвище має містити мінімум 2 символи.");
      return;
    }
    if (birthDate && calculateAge(birthDate) < MIN_AGE) {
      setError(`Мінімальний вік для реєстрації — ${MIN_AGE} років.`);
      return;
    }
    if (trimmedTaxNumber && !TAX_NUMBER_REGEX.test(trimmedTaxNumber)) {
      setError("ІПН повинен складатися рівно з 10 цифр.");
      return;
    }
    if (trimmedAvatarUrl && !URL_REGEX.test(trimmedAvatarUrl)) {
      setError("Посилання на аватар має бути коректною URL-адресою.");
      return;
    }

    setError(null);

    // У payload потрапляють лише реально заповнені поля —
    // PATCH-семантика: те, що лишили порожнім, бекенд не чіпає.
    const payload: UpdateWorkerProfilePayload = {
      ...(trimmedFirstName ? { firstName: trimmedFirstName } : {}),
      ...(trimmedLastName ? { lastName: trimmedLastName } : {}),
      ...(birthDate ? { birthDate } : {}),
      ...(trimmedTaxNumber ? { taxNumber: trimmedTaxNumber } : {}),
      ...(trimmedAvatarUrl ? { avatarUrl: trimmedAvatarUrl } : {}),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-inverse/40 px-4">
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
            <label className="block text-xs font-medium text-text-muted">ІПН</label>
            <input
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="1234567890"
            />
          </div>

          {/* TODO змінити на завантаження фото */}
          <div>
            <label className="block text-xs font-medium text-text-muted">
              Аватар (посилання) <span className="text-text-subtle">— необов'язково</span>
            </label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted">Телефон</label>
            <input
              value={phone}
              disabled
              className="mt-1 w-full rounded-md border border-border bg-bg-muted px-3 py-2 text-sm text-text-muted"
            />
            <p className="mt-1 text-xs text-text-subtle">Змінити номер можна в налаштуваннях акаунта.</p>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {!error && serverError && (
            <p className="text-sm text-danger">{serverError}</p>
          )}

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
