"use client";

import type { TeacherFollowUpComment } from "@/lib/study-planner/types";
import type { FlyPathFollowUpSummary } from "@/lib/study-planner/teacher-follow-up";
import type { RecommendedFollowUpTask } from "@/lib/study-planner/teacher-follow-up";
import { plannerSectionHeading } from "@/lib/study-planner/planner-ui";
import { FollowUpSummaryCard } from "./FollowUpSummaryCard";
import { FollowUpCommentsList } from "./FollowUpCommentsList";
import { RecommendedTasksBlock } from "./RecommendedTasksBlock";

type FlyPathFollowUpPremiumPanelProps = {
  summary: FlyPathFollowUpSummary;
  recommendedTasks: RecommendedFollowUpTask[];
  followUpComments: TeacherFollowUpComment[];
  onDeleteFollowUpComment: (id: string) => void;
  onPlanClass: () => void;
};

export function FlyPathFollowUpPremiumPanel({
  summary,
  recommendedTasks,
  followUpComments,
  onDeleteFollowUpComment,
  onPlanClass,
}: FlyPathFollowUpPremiumPanelProps) {
  return (
    <div className="space-y-4">
      <FollowUpSummaryCard
        summary={summary}
        onPlanClass={onPlanClass}
        title="Seguimiento FlyPath activo"
        variant="premium"
      />

      <RecommendedTasksBlock tasks={recommendedTasks} />

      <section className="space-y-2">
        <h3 className={plannerSectionHeading}>Comentarios de seguimiento</h3>
        <FollowUpCommentsList
          comments={followUpComments}
          onDelete={onDeleteFollowUpComment}
          emptyMessage="Todavía no hay comentarios de seguimiento del profesor."
        />
      </section>
    </div>
  );
}
