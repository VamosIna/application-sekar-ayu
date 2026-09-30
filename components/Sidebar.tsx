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

      <NavLink
        label="Semua"
        color={color}
        variant="light"
        active={category === null}
        onClick={() => onSelect(null)}
        rightSection={
          <Badge size="sm" variant="transparent" color="gray" px={6}>
            {total}
          </Badge>
        }
      />

      {options.map((o) => (
        <NavLink
          key={o.value}
          label={o.label}
          color={color}
          variant="light"
          active={category === o.value}
          onClick={() => onSelect(o.value)}
          rightSection={
            <Badge size="sm" variant="transparent" color="gray" px={6}>
              {o.count}
            </Badge>
          }
        />
      ))}
    </Stack>
  );
}
