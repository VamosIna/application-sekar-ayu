"use client";

import { Badge, Group, NavLink, Stack, Text } from "@mantine/core";
import type { Option } from "@/lib/data";

interface SidebarProps {
  color: "blue" | "green";
  total: number;
  options: Option[];
  category: string | null;
  onSelect: (category: string | null) => void;
}

export default function Sidebar({ color, total, options, category, onSelect }: SidebarProps) {
  const bgColor = color === "blue" ? "var(--mantine-color-blue-light)" : "var(--mantine-color-green-light)";
  const borderColor = color === "blue" ? "var(--mantine-color-blue-primary)" : "var(--mantine-color-green-primary)";

  return (
    <Stack gap={4}>
      <Group justify="space-between" px="xs">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Kategori
        </Text>
        <Badge size="sm" variant="light" color={color}>
          {total}
        </Badge>
      </Group>

      <Stack gap={3}>
        {options.map((o) => (
          <NavLink
            key={o.value}
            label={o.label}
            color={color}
            variant="light"
            active={category === o.value}
            onClick={() => onSelect(o.value)}
            style={{
              borderRadius: "6px",
              margin: "2px 0",
              transition: "all 0.2s ease",
              ...(category === o.value
                ? { backgroundColor: bgColor, color: color }
                : { color: "var(--mantine-color-gray-7)" })
            }}
            rightSection={
              <Badge size="sm" variant="transparent" color="gray" px={6}>
                {o.count}
              </Badge>
            }
          />
        ))}

        <NavLink
          label="Semua"
          color={color}
          variant="light"
          active={category === null}
          onClick={() => onSelect(null)}
          style={{
            borderRadius: "6px",
            margin: "2px 0",
            transition: "all 0.2s ease",
            ...(category === null
              ? { backgroundColor: bgColor, color: color }
              : { color: "var(--mantine-color-gray-7)" })
          }}
          rightSection={
            <Badge size="sm" variant="transparent" color="gray" px={6}>
              {total}
            </Badge>
          }
        />
      </Stack>
    </Stack>
  );
}