// CUSTOM: fork-local feature flags. Read NEXT_PUBLIC_* vars; values are inlined at build time.
export const FEATURES = {
  // Show the "Quản trị" entry in the user dropdown for admin users.
  // Set NEXT_PUBLIC_SHOW_ADMIN_ENTRY=true to enable.
  showAdminEntry: process.env.NEXT_PUBLIC_SHOW_ADMIN_ENTRY === "true",
} as const;
