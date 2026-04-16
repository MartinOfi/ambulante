export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#160800] via-[#2a1204] to-[#080200]"
    >
      <div
        className="amb-orb-drift absolute w-[320px] h-[320px] rounded-full bg-orange-600/20 blur-3xl"
        style={{ left: "15%", top: "20%", animationDuration: "8s" }}
      />
      <div
        className="amb-orb-drift absolute w-[240px] h-[240px] rounded-full bg-amber-500/15 blur-3xl"
        style={{ left: "75%", top: "15%", animationDuration: "11s", animationDelay: "2s" }}
      />
      <div
        className="amb-orb-drift absolute w-[400px] h-[400px] rounded-full bg-orange-800/25 blur-3xl"
        style={{ left: "85%", top: "70%", animationDuration: "9s", animationDelay: "1s" }}
      />
      <div
        className="amb-orb-drift absolute w-[280px] h-[280px] rounded-full bg-red-900/20 blur-3xl"
        style={{ left: "10%", top: "80%", animationDuration: "13s", animationDelay: "3s" }}
      />
    </div>
  );
}
