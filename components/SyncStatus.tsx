"use client";

import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  PasswordInput,
  Popover,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCloudOff, IconLink, IconUnlink } from "@tabler/icons-react";
import type { SyncState } from "@/lib/applied";

/**
 * Indikator sinkronisasi centang.
 *
 * - SYNC_URL belum diisi  -> sembunyi (dashboard jalan lokal seperti biasa).
 * - Belum tersambung       -> tombol "Sambungkan" + popup input passphrase.
 * - Sudah tersambung       -> badge status + tombol putuskan.
 */

const COPY: Record<SyncState, { label: string; color: string }> = {
  idle: { label: "Tersambung", color: "gray" },
  syncing: { label: "Menyimpan...", color: "blue" },
  ok: { label: "Tersinkron", color: "teal" },
  error: { label: "Gagal menyimpan", color: "red" },
  offline: { label: "Offline", color: "orange" },
  disabled: { label: "Lokal", color: "gray" },
};

function timeLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function SyncStatus({
  enabled,
  sync,
  lastSync,
  hasToken,
  onConnect,
  onDisconnect,
}: {
  enabled: boolean;
  sync: SyncState;
  lastSync: string | null;
  hasToken: boolean;
  onConnect: (token: string) => Promise<boolean>;
  onDisconnect: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const ok = await onConnect(token);
    setBusy(false);
    if (ok) {
      setToken("");
      setOpened(false);
    } else {
      setError("Passphrase salah, atau Worker belum bisa dijangkau.");
    }
  };

  const copy = COPY[sync];

  if (!hasToken) {
    return (
      <Popover
        opened={opened}
        onChange={setOpened}
        width={320}
        position="bottom-end"
        withArrow
        shadow="md"
      >
        <Popover.Target>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconLink size={14} />}
            onClick={() => setOpened((o) => !o)}
          >
            Sambungkan
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Sinkronkan antar perangkat
            </Text>
            <Text size="xs" c="dimmed">
              Masukkan passphrase yang sama dengan yang dipakai saat deploy Worker.
              Centang di perangkat ini akan ikut tersimpan di server, bukan hanya di
              browser ini.
            </Text>
            <PasswordInput
              size="xs"
              label="Passphrase"
              placeholder="passphrase Worker"
              value={token}
              onChange={(e) => setToken(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              autoComplete="current-password"
            />
            {error ? (
              <Text size="xs" c="red">
                {error}
              </Text>
            ) : null}
            <Button size="xs" onClick={submit} loading={busy} disabled={!token.trim()}>
              Hubungkan
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    );
  }

  return (
    <Group gap={6} wrap="nowrap">
      <Badge
        variant="light"
        color={copy.color}
        size="lg"
        leftSection={sync === "syncing" ? <Loader size={10} /> : undefined}
        style={{ textTransform: "none" }}
      >
        {sync === "ok" && lastSync ? `${copy.label} ${timeLabel(lastSync)}` : copy.label}
      </Badge>
      {sync === "error" ? (
        <Tooltip label="Centang tetap aman di perangkat ini, tapi belum terupload. Cek koneksi lalu centang ulang.">
          <IconCloudOff size={15} color="var(--mantine-color-red-6)" />
        </Tooltip>
      ) : null}
      {sync === "ok" ? <IconCheck size={14} color="var(--mantine-color-teal-6)" /> : null}
      <Tooltip label="Putuskan sinkron di perangkat ini (data di server tidak dihapus)">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onDisconnect}
          aria-label="Putuskan sinkron"
        >
          <IconUnlink size={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}