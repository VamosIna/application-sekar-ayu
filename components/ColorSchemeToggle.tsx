"use client";

import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light", { getInitialValueInEffect: true });

  return (
    <button
      aria-label="Ganti tema terang/gelap"
      onClick={() => setColorScheme(computed === "light" ? "dark" : "light")}
      style={{
        width: 40,
        height: 40,
        borderRadius: "10px",
        border: "none",
        background: computed === "light" ? "var(--mantine-color-gray-100)" : "var(--mantine-color-gray-800)",
        color: computed === "light" ? "var(--mantine-color-gray-800)" : "var(--mantine-color-gray-100)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.2s ease",
      }}
    >
      {computed === "light" ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
}