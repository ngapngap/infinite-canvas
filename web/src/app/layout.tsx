import type { ReactNode } from "react";

// Root layout chỉ là shell tối thiểu.
// Layout thực tế nằm trong [locale]/layout.tsx với NextIntlClientProvider.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
