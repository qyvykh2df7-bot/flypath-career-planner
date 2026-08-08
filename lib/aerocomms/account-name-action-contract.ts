export type SaveAeroCommsAccountNameResult =
  | { status: "success"; fullName: string }
  | { status: "error" };
