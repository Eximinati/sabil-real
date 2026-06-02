import { requireAdmin } from '@/lib/admin-auth';
import { getLessonForEditing } from '@/lib/admin-journey-actions';
import { JourneyAuthoringStudio } from '@/components/admin/journey-authoring-studio';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await requireAdmin();

  const lessonData = await getLessonForEditing(id);

  if (!lessonData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-[var(--color-text)] mb-2">Lesson not found</h1>
        <a href="/admin/journey" className="text-[var(--color-primary)] hover:underline">
          Back to Lessons
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <a href="/admin/journey" className="text-sm text-[var(--color-primary)] hover:underline">
          ← Back to Lessons
        </a>
      </div>
      <JourneyAuthoringStudio 
        initialData={{ metadata: lessonData.metadata }}
        userId={userId}
      />
    </div>
  );
}
