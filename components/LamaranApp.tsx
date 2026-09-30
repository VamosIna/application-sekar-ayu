"use client";

import { useMemo, useState } from "react";
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
  TextInput,
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
  IconSearch,
  IconSparkles,
  IconWorld,
} from "@tabler/icons-react";
import Sidebar from "./Sidebar";
import JobCard from "./JobCard";
import UpdateCalendar from "./UpdateCalendar";
import ColorSchemeToggle from "./ColorSchemeToggle";
import { useApplied } from "@/lib/applied";
import {
  DEFAULT_VIEW,
  formatDate,
  generatedAt,
  getView,
  jobs,
  jobsForView,
  methodLabel,
  totals,
} from "@/lib/data";

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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
  const [view, setView] = useState(DEFAULT_VIEW);
  const [query, setQuery] = useState("");
  const [showApplied, setShowApplied] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { applied, persisted, toggle: toggleApplied, clear: clearApplied } = useApplied();

  const current = getView(view);

  const list = useMemo(() => {
    const base = selectedDate
      ? jobs.filter((j) => (j.first_seen ?? "").slice(0, 10) === selectedDate)
      : jobsForView(view);
    const visible = showApplied ? base : base.filter((j) => !applied.has(j.db_id));
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((j) =>
      `${j.title} ${j.company} ${j.location} ${j.category} ${j.source_label}`
        .toLowerCase()
        .includes(q)
    );
  }, [view, query, applied, showApplied, selectedDate]);

  function handleSelect(id: string) {
    setView(id);
    close();
  }

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
            <Avatar radius="xl" color="blue" variant="gradient" gradient={{ from: "blue", to: "green" }}>
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

          <Group wrap="nowrap" gap="xs">
            <TextInput
              placeholder="Cari posisi / perusahaan"
              leftSection={<IconSearch size={16} />}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              w={{ base: 130, xs: 170, sm: 260 }}
            />
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Sidebar view={view} onSelect={handleSelect} />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg" px={0}>
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} mb="md">
            <Stat icon={<IconBriefcase size={18} />} label="Total lowongan" value={jobs.length} color="blue" />
            <Stat icon={<IconMail size={18} />} label="Via email" value={totals.email} color="blue" />
            <Stat icon={<IconWorld size={18} />} label="Via portal" value={totals.portal} color="green" />
            <Stat icon={<IconSparkles size={18} />} label="Baru" value={totals.new ?? 0} color="yellow" />
            <Stat icon={<IconCheck size={18} />} label="Sudah dilamar" value={applied.size} color="teal" />
          </SimpleGrid>

          <UpdateCalendar selected={selectedDate} onSelect={setSelectedDate} />

          <Group justify="space-between" align="center" mt="lg" mb="sm" wrap="wrap">
            <Title order={4}>
              {selectedDate
                ? `Update ${formatDate(selectedDate)}`
                : `${current ? methodLabel(current.method) : ""}${
                    current?.category ? ` · ${current.label}` : ""
                  }`}
            </Title>
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
                  Tidak ada lowongan yang cocok.
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
        <Overlay
          hiddenFrom="md"
          zIndex={190}
          backgroundOpacity={0.45}
          blur={1}
          onClick={close}
        />
      ) : null}
    </AppShell>
  );
}
