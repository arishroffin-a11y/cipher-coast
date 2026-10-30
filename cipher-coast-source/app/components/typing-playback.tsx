import { useEffect, useRef, useState } from "react";

export interface TypingTrace {
  events?: { t: number; v: string }[];
  keystrokes?: number;
  pastes?: number;
  durationMs?: number;
  firstKeyDelayMs?: number | null;
}

function stats(trace: TypingTrace, answer: string) {
  const events = trace.events ?? [];
  return {
    events: events.length,
    keystrokes: trace.keystrokes ?? 0,
    pastes: trace.pastes ?? 0,
    durationMs: trace.durationMs ?? (events.length ? events[events.length - 1].t : 0),
    firstKeyDelayMs: trace.firstKeyDelayMs ?? null,
    characters: answer.length,
  };
}

export function TypingPlayback({ label, answer, trace }: { label: string; answer: string; trace?: TypingTrace }) {
  const data = trace ?? {};
  const events = data.events ?? [];
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const cursorRef = useRef(0);
  const speedRef = useRef(1);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let localCursor = cursorRef.current;
    let localTime = events[localCursor] ? events[localCursor].t : 0;
    const tick = (now: number) => {
      const delta = (now - last) * speedRef.current;
      last = now;
      localTime += delta;
      while (localCursor < events.length && events[localCursor].t <= localTime) localCursor += 1;
      if (localCursor !== cursorRef.current) {
        cursorRef.current = localCursor;
        setCursor(localCursor);
      }
      if (localCursor >= events.length) {
        setPlaying(false);
        setFinished(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, events]);

  const summary = stats(data, answer);
  const shownValue = events.length === 0 ? answer : cursor === 0 ? "" : events[Math.min(cursor, events.length) - 1].v;
  const complete = events.length === 0 || cursor >= events.length;
  const finalValue = finishCheck(shownValue, answer, complete);

  function restart() {
    cursorRef.current = 0;
    setCursor(0);
    setFinished(false);
    setPlaying(true);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => (playing ? setPlaying(false) : events.length ? restart() : setPlaying(true))} className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10">
            {playing ? "Pause" : finished || complete ? "Replay" : "Play"}
          </button>
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="rounded-md border border-white/15 bg-black px-2 py-1 text-xs text-white">
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>
      <div className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/60 p-3 text-sm whitespace-pre-wrap text-white/90">
        {finalValue || <span className="text-white/35">Waiting for playback...</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/50">
        <span>{summary.keystrokes} keystrokes</span>
        <span>{summary.pastes} paste events</span>
        <span>{Math.round(summary.durationMs / 1000)}s typing time</span>
        <span>{summary.firstKeyDelayMs === null ? "no delay data" : "first key after " + (summary.firstKeyDelayMs / 1000).toFixed(1) + "s"}</span>
        <span>{summary.characters} characters</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-white transition-all" style={{ width: (events.length ? Math.round((cursor / events.length) * 100) : 100) + "%" }} />
      </div>
    </div>
  );
}

function finishCheck(shown: string, answer: string, complete: boolean): string {
  if (complete && !shown) return answer;
  return shown;
}
