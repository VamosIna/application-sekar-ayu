"use client";

import { Badge, Group, NavLink, Stack, Text } from "@mantine/core";
import { emailViews, portalViews, totals } from "@/lib/data";
import type { JobMethod, View } from "@/lib/types";

interface SidebarProps {
  view: string;
  onSelect: (id: string) => void;
}

interface SectionProps {
  title: string;
  total: number;
  items: View[];
  color: "blue" | "green";
  view: string;
  onSelect: (id: string) => void;
}

function Section({ title, total, items, color, view, onSelect }: SectionProps) {
  return (
    <Stack gap={4}>
      <Group justify="space-between" px="xs">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {title}
        </Text>
        <Badge size="sm" variant="light" color={color}>
          {total}
        </Badge>
      </Group>
      {items.map((item) => (
        <NavLink
          key={item.id}
          label={item.label}
          color={color}
          variant="light"
          active={view === item.id}
          onClick={() => onSelect(item.id)}
          rightSection={
            <Badge size="sm" variant="transparent" color="gray" px={6}>
              {item.count}
            </Badge>
          }
        />
      ))}
    </Stack>
  );
}

const colorOf: Record<JobMethod, "blue" | "green"> = {
  email: "blue",
  portal: "green",
};

export default function Sidebar({ view, onSelect }: SidebarProps) {
  return (
    <Stack gap="lg">
      <Section
        title="Via Email"
        total={totals.email}
        items={emailViews}
        color={colorOf.email}
        view={view}
        onSelect={onSelect}
      />
      <Section
        title="Via Portal"
        total={totals.portal}
        items={portalViews}
        color={colorOf.portal}
        view={view}
        onSelect={onSelect}
      />
    </Stack>
  );
}
