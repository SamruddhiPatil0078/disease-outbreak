export default function LoadingSkeleton({ count = 3, type = "card" }) {
  if (type === "chart") {
    return (
      <div className="glass p-6 animate-fade-in">
        <div className="skeleton h-4 w-36 mb-5" />
        <div className="skeleton h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="glass-subtle p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
