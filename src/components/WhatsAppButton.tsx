export function WhatsAppButton() {
  const phone = "41988551599";
  const message = encodeURIComponent("Olá! Gostaria de agendar uma consulta.");

  return (
    <a
      href={`https://wa.me/55${phone}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 bg-[#25D366] text-white py-3 pl-4 pr-5 rounded-full shadow-lg hover:-translate-y-0.5 transition-transform text-sm font-semibold"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l.6.953-1.005 3.668 3.768-.987z"/>
      </svg>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
