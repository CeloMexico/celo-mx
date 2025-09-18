type ModuleKey = { courseSlug: string; moduleIndex: number };
const KEY = "academy:progress:v1";

export type ProgressState = {
  // courseSlug -> Set of completed module indices
  completed: Record<string, number[]>;
};

function read(): ProgressState {
  try { return JSON.parse(localStorage.getItem(KEY) || '{"completed":{}}'); }
  catch { return { completed: {} }; }
}
function write(state: ProgressState) { localStorage.setItem(KEY, JSON.stringify(state)); }

export function isModuleDone(courseSlug: string, moduleIndex: number) {
  const s = read(); return (s.completed[courseSlug] || []).includes(moduleIndex);
}
export function markModuleDone(courseSlug: string, moduleIndex: number) {
  const s = read(); const arr = new Set(s.completed[courseSlug] || []);
  arr.add(moduleIndex); s.completed[courseSlug] = Array.from(arr); write(s);
}
export function courseProgressPercent(courseSlug: string, totalModules: number) {
  const s = read(); const done = (s.completed[courseSlug] || []).length;
  return totalModules ? Math.min(100, Math.round((done / totalModules) * 100)) : 0;
}
