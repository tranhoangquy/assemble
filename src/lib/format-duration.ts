/** Production timecode; raw seconds remain available in render metadata. */
export function formatDuration(seconds:number):string {
  const whole=Math.max(0,Math.round(Number.isFinite(seconds)?seconds:0));
  return `${String(Math.floor(whole/60)).padStart(2,'0')}:${String(whole%60).padStart(2,'0')}`;
}
