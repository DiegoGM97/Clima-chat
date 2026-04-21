import { useRef } from "react";

interface WeatherSearchFormProps {
  onSearch: (formData: FormData) => void | Promise<void>;
}

export function WeatherSearchForm({ onSearch }: WeatherSearchFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    await onSearch(formData);
    formRef.current?.reset();
  };

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2">
      <input
        name="city"
        placeholder="Busca una ciudad"
        type="text"
        minLength={2}
        maxLength={50}
        title="Escribe una ciudad valida (2 a 50 caracteres)."
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white/90 px-3 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300"
        required
      />
      <button
        type="submit"
        className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
      >
        Buscar
      </button>
    </form>
  );
}
