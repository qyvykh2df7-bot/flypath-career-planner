export type ContentOsActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const CONTENT_OS_INITIAL_ACTION_STATE: ContentOsActionState = {
  status: "idle",
  message: null,
};
