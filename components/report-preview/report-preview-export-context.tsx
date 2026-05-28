"use client";

import { createContext, useContext } from "react";

export type ReportPreviewExportContextValue = {
  enabled: boolean;
  origin: string;
};

const defaultValue: ReportPreviewExportContextValue = {
  enabled: false,
  origin: "",
};

export const ReportPreviewExportContext = createContext<ReportPreviewExportContextValue>(defaultValue);

export function useReportPreviewExport(): ReportPreviewExportContextValue {
  return useContext(ReportPreviewExportContext);
}
