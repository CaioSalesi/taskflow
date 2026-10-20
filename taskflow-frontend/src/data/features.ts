export interface Feature {
  id: string
  icon: 'dashboard' | 'board' | 'shield' | 'task' | 'search' | 'comment'
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    id: 'dashboard',
    icon: 'dashboard',
    title: 'Dashboard',
    description:
      'Get a bird’s-eye view of everything in flight: your projects, assigned tasks, and recent activity in one place.',
  },
  {
    id: 'projects',
    icon: 'board',
    title: 'Project Management',
    description:
      'Organize work into projects with Kanban boards. Create columns, drag cards, and keep every initiative moving.',
  },
  {
    id: 'permissions',
    icon: 'shield',
    title: 'Permissions Management',
    description:
      'Role-based access control for teams. Decide who can view, edit, or administer each project with fine-grained roles.',
  },
  {
    id: 'tasks',
    icon: 'task',
    title: 'Task Creation & Editing',
    description:
      'Create tasks in seconds with titles, descriptions, due dates, labels, and assignees. Edit anything at any time.',
  },
  {
    id: 'search',
    icon: 'search',
    title: 'Powerful Search',
    description:
      'Find any task instantly. Filter by project, assignee, label, or status so nothing slips through the cracks.',
  },
  {
    id: 'comments',
    icon: 'comment',
    title: 'Comments & Collaboration',
    description:
      'Discuss work where it happens. Leave comments on tasks, mention teammates, and keep context with the work.',
  },
]

/**
 * Simulates fetching features from the API so the landing page can
 * exercise its loading state. Swap for a real endpoint later.
 */
export function fetchFeatures(): Promise<Feature[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(FEATURES), 900)
  })
}
