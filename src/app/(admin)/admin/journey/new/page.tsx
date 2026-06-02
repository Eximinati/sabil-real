import { requireAdmin } from '@/lib/admin-auth';
import { getLatestDayNumber } from '@/lib/admin-journey-actions';
import { JourneyAuthoringStudio } from '@/components/admin/journey-authoring-studio';

export default async function NewLessonPage() {
  const { userId } = await requireAdmin();

  const nextDayNumber = await getLatestDayNumber();

  return (
    <div>
      <div className="mb-6">
        <a href="/admin/journey" className="text-sm text-[var(--color-primary)] hover:underline">
          ← Back to Lessons
        </a>
      </div>
      <JourneyAuthoringStudio 
        initialData={{
          metadata: {
            day_number: nextDayNumber,
            title: '',
            subtitle: '',
            topic: '',
            description: '',
            estimated_minutes: 15,
            is_published: false,
            localized_content: {},
            shared_metadata: {},
          },
        }}
        userId={userId}
      />
    </div>
  );
}
