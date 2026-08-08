export type UpdateFlyPathProfileNameState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialUpdateFlyPathProfileNameState: UpdateFlyPathProfileNameState = {
  status: "idle",
  message: null,
};
