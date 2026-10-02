"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  Text,
  ThemeIcon,
  Title,
  Timeline,
} from "@mantine/core";
import { Calendar } from "@mantine/dates";
import { IconCalendarEvent, IconCircleCheck } from "@tabler/icons-react";
import { formatDate, history, jobs } from "@/lib/data";
import type { HistoryEntry } from "@/lib/types";

interface UpdateCalendarProps {
  selected: string | null;
  onSelect: (date: string | null) => void;
}

export default function UpdateCalendar({ selected, onSelect }: UpdateCalendarProps) {
  const map = useMemo(() => {
    const m = new Map<string, HistoryEntry>();
    history.forEach((h) => m.set(h.date, h));
    return m;
  }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const job of jobs) {
      const day = (job.first_seen ?? "").slice(0, 10);
      if (day) m.set(day, (m.get(day) ?? 0) + 1);
    }
    return m;
  }, []);

  const latest = history[history.length - 1];
  const [displayDate, setDisplayDate] = useState<string | undefined>(latest?.date);

  // kalau tanggal dipilih dari Timeline (atau direset), ikutkan bulan yang tampil
  useEffect(() => {
    if (selected) setDisplayDate(selected);
  }, [selected]);

  return (
    <Card withBorder radius="lg" padding="lg">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" radius="md" size="lg">
            <IconCalendarEvent size={18} />
          </ThemeIcon>
          <div>
            <Title order={4}>Riwayat update</Title>
            <Text size="xs" c="dimmed">
              Klik tanggal untuk lihat lowongan yang masuk hari itu
            </Text>
          </div>
        </Group>
        {selected ? (
          <Button variant="subtle" size="xs" onClick={() => onSelect(null)}>
            Tampilkan semua
          </Button>
        ) : (
          <Badge variant="light" size="lg">
            tiap 2 hari
          </Badge>
        )}
      </Group>

      <Calendar
        date={displayDate}
        onDateChange={(d) => {
          // dipanggil saat navigasi bulan/tahun — hanya untuk memindah tampilan
          if (d) setDisplayDate(d);
        }}
        excludeDate={(d) => !map.has(d)}
        hideOutsideDates
        getDayProps={(d) => {
          const entry = map.get(d);
          const isActive = d === selected;
          return {
            // klik tanggal -> filter daftar (Calendar tidak memanggil onDateChange saat hari diklik)
            onClick: () => {
              if (entry) onSelect(isActive ? null : d);
            },
            style: entry
              ? {
                  backgroundColor: isActive
                    ? "var(--mantine-color-blue-6)"
                    : "var(--mantine-color-blue-light)",
                  color: isActive ? "#fff" : "var(--mantine-color-blue-light-color)",
                  fontWeight: 700,
                }
              : undefined,
          };
        }}
      />

      {selected ? (
        <Card withBorder radius="md" padding="sm" mt="sm" bg="var(--mantine-color-blue-light)">
          <Group justify="space-between" wrap="wrap">
            <Text size="sm" fw={600}>
              Update {formatDate(selected)}
            </Text>
            <Badge color="blue">
              {(counts.get(selected) ?? 0)} lowongan
            </Badge>
          </Group>
        </Card>
      ) : null}

      <Timeline
        active={history.length}
        bulletSize={22}
        lineWidth={2}
        mt="lg"
        style={{ cursor: "pointer" }}
      >
        {[...history].reverse().map((h) => {
          const isActive = selected === h.date;
          return (
            <Timeline.Item
              key={h.date}
              bullet={<IconCircleCheck size={12} />}
              title={
                <Text
                  size="sm"
                  fw={isActive ? 700 : 500}
                  c={isActive ? "blue" : undefined}
                  onClick={() => onSelect(isActive ? null : h.date)}
                >
                  {formatDate(h.date)}
                </Text>
              }
              >
                <Text size="xs" c="dimmed">
                  {(counts.get(h.date) ?? 0)} lowongan
                  {h.new ? ` · ${h.new} baru` : ""}
                </Text>
              </Timeline.Item>
          );
        })}
      </Timeline>
    </Card>
  );
}