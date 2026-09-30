"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Collapse,
  CopyButton,
  Group,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconBrandGoogle,
  IconBuildingSkyscraper,
  IconBulb,
  IconCheck,
  IconCircleCheck,
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
  applied?: boolean;
  onToggleApplied?: () => void;
}

export default function JobCard({ job, index, applied, onToggleApplied }: JobCardProps) {
  const [open, setOpen] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const isEmail = job.method === "email";
  const accent = isEmail ? "blue" : "green";
  const webUrl = job.to ? buildGmailWebUrl(job.to, job.subject, job.body) : "#";

  return (
    <Card
      withBorder
      radius="lg"
      padding="lg"
      style={{
        borderLeft: `4px solid var(--mantine-color-${accent}-6)`,
        opacity: applied ? 0.7 : 1,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
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
          <Tooltip label="Kecocokan dengan requirement" withArrow>
            <Badge size="lg" radius="xl" color={accent} variant="filled">
              {job.score}%
            </Badge>
          </Tooltip>
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

      {onToggleApplied ? (
        <Button
          variant={applied ? "light" : "default"}
          color={applied ? "teal" : undefined}
          fullWidth
          mt="md"
          size="md"
          leftSection={applied ? <IconCheck size={18} /> : <IconCircleCheck size={18} />}
          onClick={onToggleApplied}
        >
          {applied ? "Sudah dilamar · ketuk untuk batal" : "Tandai sudah dilamar"}
        </Button>
      ) : null}

      {job.reasons.length || job.gaps.length ? (
        <>
          <Button
            variant="subtle"
            size="xs"
            mt="xs"
            px={0}
            leftSection={<IconBulb size={14} />}
            onClick={() => setShowScore((s) => !s)}
          >
            {showScore
              ? "Sembunyikan penilaian AI"
              : `Penilaian AI · kecocokan ${job.score ?? "-"}%`}
          </Button>

          <Collapse in={showScore}>
            <Card.Section inheritPadding py="sm">
              {job.breakdown ? (
                <div style={{ marginBottom: 12 }}>
                  <Text size="xs" fw={700} mb={8}>
                    Rincian per kriteria (berbobot)
                  </Text>
                  <Stack gap={7}>
                    {Object.entries(job.breakdown)
                      .sort((a, b) => b[1].weight - a[1].weight)
                      .map(([key, d]) => (
                        <div key={key}>
                          <Group justify="space-between" gap="xs" mb={2} wrap="nowrap">
                            <Text size="xs">{d.label}</Text>
                            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                              {d.score}% · bobot {d.weight}%
                            </Text>
                          </Group>
                          <Progress
                            value={d.score}
                            size="sm"
                            radius="xl"
                            color={d.score >= 75 ? "teal" : d.score >= 60 ? "blue" : "orange"}
                          />
                        </div>
                      ))}
                  </Stack>
                </div>
              ) : null}

              {job.reasons.length ? (
                <>
                  <Text size="xs" fw={700} c="teal" mb={6}>
                    Cocok karena
                  </Text>
                  <Stack gap={5}>
                    {job.reasons.map((r, i) => (
                      <Group key={i} gap="xs" wrap="nowrap" align="flex-start">
                        <ThemeIcon size={16} radius="xl" variant="light" color="teal">
                          <IconCheck size={11} />
                        </ThemeIcon>
                        <Text size="xs">{r}</Text>
                      </Group>
                    ))}
                  </Stack>
                </>
              ) : null}

              {job.gaps.length ? (
                <div style={{ marginTop: 10 }}>
                  <Text size="xs" fw={700} c="orange" mb={6}>
                    Gap / kurang
                  </Text>
                  <Stack gap={5}>
                    {job.gaps.map((g, i) => (
                      <Group key={i} gap="xs" wrap="nowrap" align="flex-start">
                        <ThemeIcon size={16} radius="xl" variant="light" color="orange">
                          <IconAlertTriangle size={11} />
                        </ThemeIcon>
                        <Text size="xs">{g}</Text>
                      </Group>
                    ))}
                  </Stack>
                </div>
              ) : null}
            </Card.Section>
          </Collapse>
        </>
      ) : null}

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
