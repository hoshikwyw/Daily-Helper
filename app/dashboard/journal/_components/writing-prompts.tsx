import { WRITING_PROMPTS } from "@/lib/journal";

type WritingPromptsProps = {
  onPick: (prompt: string) => void;
};

/**
 * Tappable starter questions. The blank box is the point where most people
 * give up on journalling, so this turns "write something" into "answer this".
 */
export function WritingPrompts({ onPick }: WritingPromptsProps) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">Not sure what to write? Tap one to add it:</p>
      <div className="flex flex-wrap gap-2">
        {WRITING_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs hover:bg-kv-500/15 hover:border-kv-500/50 hover:text-kv-200 transition-colors"
          >
            + {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
