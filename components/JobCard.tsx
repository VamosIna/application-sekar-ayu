"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Collapse,
  CopyButton,
  Group,
  Text,
} from "@mantine/core";
import {
  IconBrandGoogle,
  IconBuildingSkyscraper,
  IconCheck,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconLink,
  IconMapPin,
} from "@tabler/icons-react";
import type { Job } from "@/lib/types";
import { cv, formatDate } from "@/lib/data";
import { buildGmailWebUrl, openGmail } from "@/lib/gmail";

interface JobCardProps {
  job: Job;
  index: number;
}

export default function JobCard({ job, index }: JobCardProps) {
  const [open, setOpen] = useState(false);
  const isEmail = job.method === "email";
  const accent = isEmail ? "blue" : "green";
  const webUrl = job.to ? buildGmailWebUrl(job.to, job.subject, job.body) : "#";

  return (
    <Card
      withBorder
      radius="lg"
      padding="lg"
      style={{ borderLeft: `4px solid var(--mantine-color-${accent}-6)` }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={700} style={{ wordBreak: "break-word" }}>
              {index}. {job.title}
            </Text>
            {job.is_new ? (
              <Badge color="yellow" variant="light" size="sm">
                BARU
              </Badge>
            ) : null}
          </Group>

          <Group gap="md" mt={6}>
            {job.source_label ? (
              <Badge variant="default" size="sm">
                {job.source_label}
              </Badge>
            ) : null}
            {job.company ? (
              <Group gap={4} wrap="nowrap">
                <IconBuildingSkyscraper size={14} opacity={0.6} />
                <Text size="xs" c="dimmed">
                  {job.company}
                </Text>
              </Group>
            ) : null}
            {job.location ? (
              <Group gap={4} wrap="nowrap">
                <IconMapPin size={14} opacity={0.6} />
                <Text size="xs" c="dimmed">
                  {job.location}
                </Text>
              </Group>
            ) : null}
          </Group>

          {job.posted_at ? (
            <Text size="xs" c="dimmed" mt={6}>
              Diposting {formatDate(job.posted_at)}
            </Text>
          ) : null}
        </div>

        {job.score != null ? (
          <Badge size="lg" radius="xl" color={accent} variant="filled">
            {job.score}
          </Badge>
        ) : null}
      </Group>

      {isEmail ? (
        <>
          <Text size="sm" mt="sm">
            To:{" "}
            <Text span fw={600}>
              {job.to}
            </Text>
          </Text>
          <Text size="sm">
            Subject:{" "}
            <Text span fw={600}>
              {job.subject}
            </Text>
          </Text>
          {job.subject_source ? (
            <Text size="xs" c="green" mt={4}>
              &#10004; Sesuai format diminta: &ldquo;{job.subject_source}&rdquo;
            </Text>
          ) : null}
        </>
      ) : (
        <Text size="sm" c="dimmed" mt="sm">
          Lamaran via portal &middot; copy cover letter lalu paste di form
        </Text>
      )}

      <Group mt="md" gap="xs">
        {isEmail ? (
          <Button
            color="blue"
            leftSection={<IconBrandGoogle size={16} />}
            component="a"
            href={webUrl}
            onClick={(e) => {
              e.preventDefault();
              if (job.to) openGmail(job.to, job.subject, job.body);
            }}
          >
            Buka di Gmail
          </Button>
        ) : (
          <Button
            color="green"
            leftSection={<IconExternalLink size={16} />}
            component="a"
            href={job.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka Lowongan / Lamar
          </Button>
        )}

        {cv.url ? (
          <Button
            variant="default"
            leftSection={<IconDownload size={16} />}
            component="a"
            href={cv.url}
            download={cv.name || undefined}
          >
            Download CV
          </Button>
        ) : null}

        <CopyButton value={job.body} timeout={1500}>
          {({ copied, copy }) => (
            <Button
              variant="default"
              color={copied ? "green" : undefined}
              leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              onClick={copy}
            >
              {copied ? "Tersalin!" : "Copy cover letter"}
            </Button>
          )}
        </CopyButton>

        {isEmail && job.url ? (
          <Button
            variant="subtle"
            leftSection={<IconLink size={16} />}
            component="a"
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Lowongan
          </Button>
        ) : null}
      </Group>

      <Button
        variant="subtle"
        size="xs"
        mt="xs"
        px={0}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Sembunyikan isi lamaran" : "Lihat isi lamaran"}
      </Button>

      <Collapse in={open}>
        <Card.Section inheritPadding py="sm">
          <Text
            component="pre"
            size="xs"
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              lineHeight: 1.55,
            }}
          >
            {job.body}
          </Text>
        </Card.Section>
      </Collapse>
    </Card>
  );
}
