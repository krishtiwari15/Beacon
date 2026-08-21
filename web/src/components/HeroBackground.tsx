export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-[10%] -left-[10%] h-[60%] w-[60%] rounded-full opacity-60 blur-3xl"
        style={{ background: "#c9dcc2", animation: "drift-a 22s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-[15%] -bottom-[15%] h-[65%] w-[65%] rounded-full opacity-50 blur-3xl"
        style={{ background: "#dfe9d3", animation: "drift-b 26s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[30%] right-[10%] h-[35%] w-[35%] rounded-full opacity-40 blur-3xl"
        style={{ background: "#b8d4be", animation: "drift-a 18s ease-in-out infinite reverse" }}
      />
    </div>
  );
}
