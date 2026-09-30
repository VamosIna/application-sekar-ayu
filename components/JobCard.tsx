"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";
import { cv, formatDate } from "@/lib/data";
import { buildGmailWebUrl, copyToClipboard, openGmail } from "@/lib/gmail";

interface JobCardProps {
  job: Job;
  index: number;
}

export default function JobCard({ job, index }: JobCardProps) {
  const [copied, setCopied] = useState(false);
  const isEmail = job.method === "email";

  async function handleCopy() {
    await copyToClipboard(job.body);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handleGmail(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!job.to) return;
    e.preventDefault();
    openGmail(job.to, job.subject, job.body);
  }

  const webUrl = job.to ? buildGmailWebUrl(job.to, job.subject, job.body) : "#";

  return (
    <article className={`card ${job.method}`}>
      <div className="card-head">
        <div className="title">
          <span className="num">{index}.</span> {job.title}
          {job.is_new ? <span className="new-badge">BARU</span> : null}
        </div>
        {job.score != null ? <div className="score">{job.score}</div> : null}
      </div>

      <div className="meta">
        {job.source_label ? <span className="src-badge">{job.source_label}</span> : null}
        {job.company ? <> &middot; {job.company}</> : null}
        {job.location ? <> &middot; {job.location}</> : null}
      </div>

      {job.posted_at ? (
        <div className="posted">Diposting {formatDate(job.posted_at)}</div>
      ) : null}

      {isEmail ? (
        <>
          <div className="to">
            To: <b>{job.to}</b>
          </div>
          <div className="subj">
            Subject: <b>{job.subject}</b>
          </div>
          {job.subject_source ? (
            <div className="src">
              &#10004; Sesuai format diminta: &ldquo;{job.subject_source}&rdquo;
            </div>
          ) : null}
        </>
      ) : (
        <div className="subj">Lamaran via portal &middot; copy cover letter lalu paste di form</div>
      )}

      <div className="btns">
        {isEmail ? (
          <a className="btn primary" href={webUrl} onClick={handleGmail}>
            Buka di Gmail
          </a>
        ) : (
          <a
            className="btn primary portal"
            href={job.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka Lowongan / Lamar
          </a>
        )}

        {cv.url ? (
          <a className="btn" href={cv.url} download={cv.name || undefined}>
            Download CV
          </a>
        ) : null}

        <button className="btn" onClick={handleCopy}>
          {copied ? "Tersalin!" : "Copy cover letter"}
        </button>

        {isEmail && job.url ? (
          <a className="btn ghost" href={job.url} target="_blank" rel="noopener noreferrer">
            Lowongan
          </a>
        ) : null}
      </div>

      <details>
        <summary>Lihat isi lamaran</summary>
        <pre>{job.body}</pre>
      </details>
    </article>
  );
}
