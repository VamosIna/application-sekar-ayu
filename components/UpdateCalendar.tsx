"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  Group,
  Text,
  ThemeIcon,
  Timeline,
  Title,
} from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { IconCalendarEvent, IconCircleCheck } from "@tabler/icons-react";
import { formatDate, history } from "@/lib/data";
import type { HistoryEntry } from "@/lib/types";

export default function UpdateCalendar() {
  const map = useMemo(() => {
    const m = new Map<string, HistoryEntry>();
    history.forEach((h) => m.set(h.date, h));
    return m;
  }, []);

  const latest = history[history.length - 1];
  const [date, setDate] = useState<string | undefined>(latest?.date);
  const selected = date ? map.get(date) : undefined;

  return (
    <Card withBorder radius="lg" padding="lg">
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" radius="md" size="lg">
            <IconCalendarEvent size={18} />
          </ThemeIcon>
          <div>
            <Title order={4}>Riwayat update</Title>
            <Text size="xs" c="dimmed">
              {history.length} kali update
              {latest ? ` · terakhir ${formatDate(latest.date)}` : ""}
            </Text>
          </div>
        </Group>
        <Badge variant="light" size="lg">
          tiap 2 hari
        </Badge>
      </Group>

      <Calendar
        date={date}
        onDateChange={(d) => {
          if (d) setDate(d);
        }}
        excludeDate={(d) => !map.has(d)}
        hideOutsideDates
        getDayProps={(d) => {
          const entry = map.get(d);
          if (!entry) return {};
          return {
            style: {
              backgroundColor: "var(--mantine-color-blue-light)",
              color: "var(--mantine-color-blue-light-color)",
              fontWeight: 700,
            },
          };
        }}
      />

      {selected ? (
        <Card withBorder radius="md" padding="sm" mt="sm" bg="var(--mantine-color-default-hover)">
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              {formatDate(selected.date)}
            </Text>
            <Text size="sm" c="dimmed">
              {selected.total != null ? `${selected.total} lowongan` : "data awal"}
              {selected.new ? ` · ${selected.new} baru` : ""}
            </Text>
          </Group>
        </Card>
      ) : null}

      <Timeline active={history.length} bulletSize={22} lineWidth={2} mt="lg">
        {[...history].reverse().map((h) => (
          <Timeline.Item
            key={h.date}
            bullet={<IconCircleCheck size={12} />}
            title={formatDate(h.date)}
          >
            <Text size="xs" c="dimmed">
              {h.total != null ? `${h.total} lowongan` : "data awal"}
              {h.new ? ` · ${h.new} baru` : ""}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
}
