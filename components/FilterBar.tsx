"use client";

import {
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  MultiSelect,
  SegmentedControl,
  Select,
  SimpleGrid,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAdjustmentsHorizontal, IconSearch, IconX } from "@tabler/icons-react";
import { locationOptions } from "@/lib/data";

export type Method = "all" | "email" | "portal";

export interface FilterState {
  query: string;
  method: Method;
  locations: string[];
  postedWithin: string | null;
}

interface FilterBarProps {
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  activeCount: number;
}

const POSTED = [
  { value: "", label: "Semua waktu" },
  { value: "1", label: "1 hari terakhir" },
  { value: "2", label: "2 hari terakhir" },
  { value: "7", label: "7 hari terakhir" },
  { value: "14", label: "14 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
];

const LOC_DATA = locationOptions.map((o) => ({
  value: o.value,
  label: `${o.label} (${o.count})`,
}));

export default function FilterBar({ value, onChange, onReset, activeCount }: FilterBarProps) {
  const [open, { toggle }] = useDisclosure(false);

  return (
    <Card withBorder radius="lg" padding="md" mb="md">
      <Group gap="sm" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          placeholder="Cari posisi / perusahaan"
          leftSection={<IconSearch size={16} />}
          value={value.query}
          onChange={(e) => onChange({ query: e.currentTarget.value })}
        />
        <Button
          variant={activeCount > 0 ? "light" : "default"}
          leftSection={<IconAdjustmentsHorizontal size={16} />}
          onClick={toggle}
          rightSection={
            activeCount > 0 ? (
              <Badge size="sm" circle>
                {activeCount}
              </Badge>
            ) : null
          }
        >
          Filter
        </Button>
      </Group>

      <Collapse in={open}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} mt="md">
          <div>
            <Text size="xs" fw={600} c="dimmed" mb={6}>
              Metode lamar
            </Text>
            <SegmentedControl
              fullWidth
              value={value.method}
              onChange={(v) => onChange({ method: v as Method })}
              data={[
                { value: "all", label: "Semua" },
                { value: "email", label: "Email" },
                { value: "portal", label: "Portal" },
              ]}
            />
          </div>

          <div>
            <Text size="xs" fw={600} c="dimmed" mb={6}>
              Lokasi
            </Text>
            <MultiSelect
              placeholder="Semua lokasi"
              data={LOC_DATA}
              value={value.locations}
              onChange={(v) => onChange({ locations: v })}
              searchable
              clearable
              maxDropdownHeight={280}
              nothingFoundMessage="Tidak ada"
            />
          </div>

          <div>
            <Text size="xs" fw={600} c="dimmed" mb={6}>
              Tanggal posting
            </Text>
            <Select
              data={POSTED}
              value={value.postedWithin ?? ""}
              onChange={(v) => onChange({ postedWithin: v || null })}
              allowDeselect={false}
              checkIconPosition="right"
            />
          </div>
        </SimpleGrid>

        {activeCount > 0 ? (
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            mt="sm"
            leftSection={<IconX size={14} />}
            onClick={onReset}
          >
            Reset filter
          </Button>
        ) : null}
      </Collapse>
    </Card>
  );
}
