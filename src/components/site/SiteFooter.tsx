export function SiteFooter() {
  return (
    <footer className="bg-[#202522] text-white/55">
      <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-3 px-5 py-7 text-xs sm:flex-row sm:items-center lg:px-8">
        <span className="font-semibold text-white">Vendora</span>
        <span>Operações de comércio, sem perder o fio.</span>
        <span>© {new Date().getFullYear()} Vendora</span>
      </div>
    </footer>
  );
}
