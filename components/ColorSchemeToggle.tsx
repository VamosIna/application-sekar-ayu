"use client";

import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light", { getInitialValueInEffect: true });

  return (
    <ActionIcon
      variant="default"
      size="lg"
      radius="md"
      aria-label="Ganti tema terang/gelap"
      onClick={() => setColorScheme(computed === "light" ? "dark" : "light")}
    >
      {computed === "light" ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}
