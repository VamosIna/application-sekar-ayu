"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Box,
  Burger,
  Card,
  Container,
  Group,
  Overlay,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBriefcase,
  IconCheck,
  IconMail,
  IconRotate,
  IconSparkles,
  IconTargetArrow,
  IconWorld,
} from "@tabler/icons-react";
import Sidebar from "./Sidebar";
import JobCard from "./JobCard";
import UpdateCalendar from "./UpdateCalendar";
import FilterBar, { type FilterState } from "./FilterBar";
import ColorSchemeToggle from "./ColorSchemeToggle";
import { useApplied } from "@/lib/applied";
import {
  categoryOptions,
  formatDate,
  generatedAt,
  jobs,
  methodLabel,
  totals,
} from "@/lib/data";
import type { JobMethod } from "@/lib/types";

const DEFAULT_FILTERS: FilterState = {
  query: "",
  method: "all",
  locations: [],
  postedWithin: null,
};

const REF_TIME = Date.parse(generatedAt) || Date.now();

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <Card withBorder radius="lg" padding="md">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color={color} radius="md" size="lg">
          {icon}
        </ThemeIcon>
        <div>
          <Text fw={700} fz="xl" lh={1}>
            {value}
          </Text>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
        </div>
      </Group>
    </Card>
  );
}

export default function LamaranApp() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showApplied, setShowApplied] = useState(false);
  const { applied, persisted, toggle: toggleApplied, clear: clearApplied } = useApplied();

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    if (patch.method !== undefined) setCategory(null);
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCategory(null);
    setSelectedDate(null);
  }, []);

  const activeCount =
    (filters.method !== "all" ? 1 : 0) +
    (filters.locations.length > 0 ? 1 : 0) +
    (filters.postedWithin ? 1 : 0) +
    (selectedDate ? 1 : 0);

  const catOptions = useMemo(() => categoryOptions(filters.method), [filters.method]);
  const methodTotal = useMemo(
    () => (filters.method === "all" ? jobs.length : jobs.filter((j) => j.method === filters.method).length),
    [filters.method]
  );

  const list = useMemo(() => {
    let items = jobs;

    if (selectedDate) items = items.filter((j) => (j.first_seen ?? "").slice(0, 10) === selectedDate);
    if (filters.method !== "all") items = items.filter((j) => j.method === filters.method);
    if (category) items = items.filter((j) => j.category === category);
    if (filters.locations.length) items = items.filter((j) => filters.locations.includes(j.location));
    if (filters.postedWithin) {
      const cutoff = REF_TIME - Number(filters.postedWithin) * 86_400_000;
      items = items.filter((j) => {
        const t = Date.parse(j.posted_at);
        return Number.isFinite(t) && t >= cutoff;
      });
    }
    if (!showApplied) items = items.filter((j) => !applied.has(j.db_id));

    const q = filters.query.trim().toLowerCase();
    if (q) {
      items = items.filter((j) =>
        `${j.title} ${j.company} ${j.location} ${j.category} ${j.source_label}`
          .toLowerCase()
          .includes(q)
      );
    }
    return items;
  }, [filters, category, selectedDate, showApplied, applied]);

  const avgScore = list.length
    ? Math.round(list.reduce((sum, j) => sum + (j.score ?? 0), 0) / list.length)
    : 0;

  const heading = selectedDate
    ? `Update ${formatDate(selectedDate)}`
    : `${
        filters.method === "all" ? "Semua lowongan" : methodLabel(filters.method as JobMethod)
      }${category ? ` · ${category}` : ""}`;

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 292, breakpoint: "md", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap" gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
            <Avatar
              radius="xl"
              color="blue"
              variant="gradient"
              gradient={{ from: "blue", to: "green" }}
            >
              SA
            </Avatar>
            <Box visibleFrom="sm">
              <Text fw={700} lh={1.15}>
                Sekar Ayu Herdyningrum
              </Text>
              <Text size="xs" c="dimmed">
                {jobs.length} lowongan &middot; {totals.email} email &middot; {totals.portal} portal
              </Text>
            </Box>
          </Group>

          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Sidebar
            color={filters.method === "portal" ? "green" : "blue"}
            total={methodTotal}
            options={catOptions}
            category={category}
            onSelect={(c) => {
              setCategory(c);
              close();
            }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg" px={0}>
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} mb="md">
            <Stat icon={<IconBriefcase size={18} />} label="Total lowongan" value={jobs.length} color="blue" />
            <Stat icon={<IconMail size={18} />} label="Via email" value={totals.email} color="blue" />
            <Stat icon={<IconWorld size={18} />} label="Via portal" value={totals.portal} color="green" />
            <Stat icon={<IconSparkles size={18} />} label="Baru" value={totals.new ?? 0} color="yellow" />
            <Stat icon={<IconTargetArrow size={18} />} label="Rata-rata kecocokan" value={`${avgScore}%`} color="grape" />
            <Stat icon={<IconCheck size={18} />} label="Sudah dilamar" value={applied.size} color="teal" />
          </SimpleGrid>

          <FilterBar
            value={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            activeCount={activeCount}
          />

          <UpdateCalendar selected={selectedDate} onSelect={setSelectedDate} />

          <Group justify="space-between" align="center" mt="lg" mb="sm" wrap="wrap">
            <Title order={4}>{heading}</Title>
            <Group gap="sm">
              <Badge variant="light" size="lg">
                {list.length} lowongan
              </Badge>
              <Switch
                size="sm"
                checked={showApplied}
                onChange={(e) => setShowApplied(e.currentTarget.checked)}
                label={`Tampilkan yang sudah dilamar (${applied.size})`}
              />
              {applied.size > 0 ? (
                <Tooltip label="Reset semua centang">
                  <ActionIcon variant="default" size="lg" onClick={clearApplied} aria-label="Reset centang">
                    <IconRotate size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
            </Group>
          </Group>

          {!persisted ? (
            <Text size="xs" c="red" mb="sm">
              Peringatan: penyimpanan browser tidak aktif (mode privat?), centang bisa tidak tersimpan.
            </Text>
          ) : null}

          <Stack gap="md">
            {list.map((job, i) => (
              <JobCard
                key={job.db_id}
                job={job}
                index={i + 1}
                applied={applied.has(job.db_id)}
                onToggleApplied={() => toggleApplied(job.db_id)}
              />
            ))}
            {list.length === 0 ? (
              <Card withBorder radius="lg" padding="xl">
                <Text ta="center" c="dimmed">
                  Tidak ada lowongan yang cocok dengan filter ini.
                </Text>
              </Card>
            ) : null}
          </Stack>

          <Text ta="center" size="xs" c="dimmed" mt="xl">
            Update terakhir {formatDate(generatedAt)}
          </Text>
        </Container>
      </AppShell.Main>

      {opened ? (
        <Overlay hiddenFrom="md" zIndex={190} backgroundOpacity={0.45} blur={1} onClick={close} />
      ) : null}
    </AppShell>
  );
}
