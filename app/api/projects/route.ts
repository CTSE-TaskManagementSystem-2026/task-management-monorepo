// app/api/projects/route.ts  (analytics-service)
// Thin proxy layer — all mutations are forwarded to projects-service.
import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

const PROJECTS_SERVICE_URL =
  process.env.PROJECTS_SERVICE_URL ||
  "http://projects-service.internal.local/api/projects";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  status: "active" | "inactive" | "archived" | "completed";
  dueDate?: string;
  tasks: { title: string; completed: boolean }[];
  tasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsSummary {
  totalProjects: number;
  activeProjects: number;
  overdue: number;
  totalTasks: number;
}

interface ProjectsSuccessResponse {
  projects: Project[];
  summary: ProjectsSummary;
}

interface ProjectErrorResponse {
  error: string;
  details?: string;
}

type CreateProjectBody = {
  name: string;
  description?: string;
  active?: boolean;
  status?: Project["status"];
  dueDate?: string;
  tasks?: { title: string; completed?: boolean }[];
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function handleAxiosError(err: unknown, fallback: string) {
  if (err instanceof AxiosError) {
    const status = err.response?.status ?? 500;
    const details =
      err.response?.data?.details ?? err.response?.data?.error ?? err.message;
    return NextResponse.json<ProjectErrorResponse>(
      { error: fallback, details },
      { status }
    );
  }
  return NextResponse.json<ProjectErrorResponse>(
    { error: fallback, details: String(err) },
    { status: 500 }
  );
}

// ─── GET — fetch all projects + build analytics summary ──────────────────────

export async function GET(): Promise<
  NextResponse<ProjectsSuccessResponse | ProjectErrorResponse>
> {
  try {
    const { data } = await axios.get<Project[] | { data: Project[] }>(
      PROJECTS_SERVICE_URL
    );

    const list: Project[] = Array.isArray(data)
      ? data
      : ((data as { data?: Project[] }).data ?? []);

    const now = Date.now();

    const summary: ProjectsSummary = {
      totalProjects: list.length,
      activeProjects: list.filter((p) =>
        typeof p.active === "boolean" ? p.active : p.status === "active"
      ).length,
      overdue: list.filter((p) => {
        if (!p.dueDate) return false;
        const d = Date.parse(p.dueDate);
        return !Number.isNaN(d) && d < now;
      }).length,
      totalTasks: list.reduce(
        (acc, p) => acc + (p.tasks?.length ?? p.tasksCount ?? 0),
        0
      ),
    };

    return NextResponse.json({ projects: list, summary }, { status: 200 });
  } catch (err) {
    return handleAxiosError(err, "Failed to fetch projects from projects-service");
  }
}

// ─── POST — create a project (proxied to projects-service) ───────────────────

export async function POST(
  req: NextRequest
): Promise<NextResponse<Project | ProjectErrorResponse>> {
  try {
    const body = (await req.json()) as CreateProjectBody;

    if (!body?.name?.trim()) {
      return NextResponse.json<ProjectErrorResponse>(
        { error: "Validation error", details: "`name` is required" },
        { status: 400 }
      );
    }

    const { data } = await axios.post<Project>(PROJECTS_SERVICE_URL, body);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return handleAxiosError(err, "Failed to create project");
  }
}

// ─── PUT — update a project by id (?id=…) → proxied ─────────────────────────

export async function PUT(
  req: NextRequest
): Promise<NextResponse<Project | ProjectErrorResponse>> {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json<ProjectErrorResponse>(
        { error: "Validation error", details: "`id` query param is required" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Partial<CreateProjectBody>;
    const { data } = await axios.put<Project>(
      `${PROJECTS_SERVICE_URL}?id=${id}`,
      body
    );
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return handleAxiosError(err, "Failed to update project");
  }
}

// ─── DELETE — delete a project by id (?id=…) → proxied ──────────────────────

export async function DELETE(
  req: NextRequest
): Promise<NextResponse<{ message: string } | ProjectErrorResponse>> {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json<ProjectErrorResponse>(
        { error: "Validation error", details: "`id` query param is required" },
        { status: 400 }
      );
    }

    const { data } = await axios.delete<{ message: string }>(
      `${PROJECTS_SERVICE_URL}?id=${id}`
    );
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return handleAxiosError(err, "Failed to delete project");
  }
}