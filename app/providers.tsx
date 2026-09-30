"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/id";

const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "md",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: { fontWeight: "700" },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: "id", firstDayOfWeek: 1 }}>{children}</DatesProvider>
    </MantineProvider>
  );
}
