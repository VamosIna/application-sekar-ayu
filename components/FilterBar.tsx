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
    <Card withBorder radius="lg" padding="md" mb="md" style={{ background: "var(--mantine-bg-card)" }}>
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
              <Group gap="xs" wrap="nowrap">
                <span style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  Metode lamar
                </span>
              </Group>

            <div>
              <Group gap="xs" wrap="nowrap">
                <span style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  Lokasi
                </span>
              </Group>
              <MultiSelect
                placeholder="Semua lokasi"
                data={LOC_DATA}
                value={value.locations}
                onChange={(v) => onChange({ locations: v })}
                searchable
                clearable
                maxDropdownHeight={280}
                nothingFoundMessage="Tidak ada"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--mantine-color-gray-3)",
                  "& .rc-virtual-list-holder-inner": { maxHeight: "280px" },
                }}
              />
            </div>

            <div>
              <Group gap="xs" wrap="nowrap">
                <span style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  Tanggal posting
                </span>
              </Group>
              <Select
                data={POSTED}
                value={value.postedWithin ?? ""}
                onChange={(v) => onChange({ postedWithin: v || null })}
                allowDeselect={false}
                checkIconPosition="right"
                style={{ borderRadius: "6px", border: "1px solid var(--mantine-color-gray-3)" }}
              />
            </div>
          </div>

          {activeCount > 0 ? (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              mt="sm"
              leftSection={<IconX size={14} />}
              onClick={onReset}
              style={{ borderRadius: "4px", padding: "4px 8px" }}
            >
              Reset filter
            </Button>
          ) : null}
        </SimpleGrid>
      </Collapse>
    </Card>
  );
}