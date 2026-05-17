import { promises as fs } from "fs";
import path from "path";
import type { SegmentKey } from "./brandTheme";

export type Submission = {
  id: string;
  url: string;
  name: string;
  pitch: string;
  createdAt: string;
  screenshotUrl: string;
  headline: string;
  bullets: string[];
  caption: string;
  hashtags: string[];
  language?: "en" | "ar";
  segment?: SegmentKey;
  /** Captured screenshot dimensions, populated lazily by the first render. */
  shotWidth?: number;
  shotHeight?: number;
};

const FILE = path.join(process.cwd(), "data", "submissions.json");

async function readAll(): Promise<Submission[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as Submission[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Submission[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function listSubmissions() {
  const all = await readAll();
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addSubmission(s: Submission) {
  const all = await readAll();
  all.push(s);
  await writeAll(all);
}
