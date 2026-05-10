/** PostgREST when referenced tables are absent from the API schema cache. */
export function isChatTablesMissingFromPostgrest(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const msg = error.message ?? "";
  if (code === "PGRST205" && /\bchat_/i.test(msg)) return true;
  if (/Could not find the table 'public\.chat_/i.test(msg)) return true;
  return false;
}
