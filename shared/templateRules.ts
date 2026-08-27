export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function validateDocxTemplateMetadata(filename: string, mimeType: string) {
  const normalizedFilename = filename.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!normalizedFilename.toLowerCase().endsWith(".docx") || (mimeType !== DOCX_MIME && mimeType !== "application/octet-stream")) {
    throw new Error("Anexe somente um arquivo DOCX válido.");
  }
  return { normalizedFilename, mimeType: DOCX_MIME } as const;
}
