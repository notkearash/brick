import { useTheme, type Theme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const options: { value: Theme; label: string; description: string }[] = [
  { value: "system", label: "System", description: "Follow OS preference" },
  { value: "light", label: "Light", description: "Always light" },
  { value: "dark", label: "Dark", description: "Always dark" },
];

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-sm font-medium mb-4">Settings</h1>

      <div>
        <h2 className="text-xs text-muted-foreground mb-2">Theme</h2>
        <div className="flex gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                theme === opt.value
                  ? "ring-1 ring-primary text-primary border-primary"
                  : "text-muted-foreground hover:ring-1 hover:ring-ring",
              )}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-[10px] mt-0.5 opacity-70">
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
