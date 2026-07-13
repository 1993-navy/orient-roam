import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackHeader } from "@/components/FeedbackForm";

// Feedback (意见反馈) page. Public — signed-out visitors can submit too.
export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <FeedbackHeader />
      <div className="mt-6">
        <FeedbackForm />
      </div>
    </div>
  );
}
