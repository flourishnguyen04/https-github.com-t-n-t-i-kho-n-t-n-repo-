export const FINAL_WRITING_SLUG = "final-writing";

export const TASK_FLOW = [
  "present-simple",
  "modal-verbs",
  "conditional-sentences",
  "conditional-sentences-type-2",
  "relative-clauses",
  "complex-sentences",
  FINAL_WRITING_SLUG
];

export const getOrderedSteps = (tasks = [], finalWriting = null) =>
  TASK_FLOW.map((slug) =>
    slug === FINAL_WRITING_SLUG
      ? finalWriting
      : tasks.find((step) => step.slug === slug || step.taskSlug === slug || step.type === slug)
  ).filter(Boolean);

export const getTaskMeta = (stepOrSlug) => {
  if (typeof stepOrSlug === "object" && stepOrSlug) {
    return {
      slug: stepOrSlug.slug || stepOrSlug.taskSlug || stepOrSlug.type,
      taskNumber: stepOrSlug.taskNumber,
      label: stepOrSlug.title || `Task ${stepOrSlug.taskNumber}`,
      title: stepOrSlug.title || `Task ${stepOrSlug.taskNumber}`,
      grammarTitle: stepOrSlug.grammarTitle,
      instruction: stepOrSlug.instruction,
      isFinalWriting: (stepOrSlug.slug || stepOrSlug.taskSlug || stepOrSlug.type) === FINAL_WRITING_SLUG
    };
  }

  return {
    slug: stepOrSlug,
    taskNumber: 1,
    label: "Task",
    title: "Task",
    grammarTitle: "",
    instruction: "",
    isFinalWriting: stepOrSlug === FINAL_WRITING_SLUG
  };
};
