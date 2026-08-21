export type RoadmapTask = { text: string; done: boolean; done_at?: string };
export type RoadmapStageRow = { title: string; tasks: RoadmapTask[] };

export type Roadmap = {
  id: number;
  user_id: string;
  career_title: string;
  stages: RoadmapStageRow[];
  created_at: string;
  updated_at: string;
};

export function roadmapProgress(roadmap: Roadmap): number {
  const allTasks = roadmap.stages.flatMap((s) => s.tasks);
  if (allTasks.length === 0) return 0;
  const done = allTasks.filter((t) => t.done).length;
  return Math.round((done / allTasks.length) * 100);
}
