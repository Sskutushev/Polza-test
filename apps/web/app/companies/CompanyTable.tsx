"use client";

import { useState, type ReactNode } from "react";
import type { CompanyRow } from "@polza/db/companies";
import type { Messages } from "./i18n";

type CompanyTableProps = {
  rows: CompanyRow[];
  messages: Messages;
};

export function CompanyTable({ rows, messages }: CompanyTableProps) {
  const [selected, setSelected] = useState<CompanyRow | null>(null);

  return (
    <>
      <section className="company-list">
        <table>
          <caption>{messages.tableCaption}</caption>
          <thead>
            <tr>
              <th>{messages.name}</th>
              <th>{messages.category}</th>
              <th>{messages.city}</th>
              <th>{messages.rating}</th>
              <th>{messages.reviews}</th>
              <th>{messages.priority}</th>
              <th>{messages.quality}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((company) => (
              <tr key={company.id}>
                <td>
                  <strong>{company.name}</strong>
                  <span className="row-subtitle">
                    {company.websiteHost ?? company.phoneE164 ?? "—"}
                  </span>
                </td>
                <td>{company.category ?? "—"}</td>
                <td>{company.city ?? "—"}</td>
                <td className="num">{company.rating?.toFixed(1) ?? "—"}</td>
                <td className="num">{company.reviewsCount ?? "—"}</td>
                <td>
                  <Progress value={company.outreachScore} />
                </td>
                <td>
                  <Progress value={company.dataCompleteness} muted />
                </td>
                <td className="row-action">
                  <button type="button" onClick={() => setSelected(company)}>
                    {messages.openProfile}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected ? (
        <CompanyModal
          company={selected}
          messages={messages}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

function CompanyModal({
  company,
  messages,
  onClose,
}: {
  company: CompanyRow;
  messages: Messages;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="company-modal"
        role="dialog"
        aria-modal="true"
        aria-label={messages.profile}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <span>{messages.profile}</span>
            <h2>{company.name}</h2>
          </div>
          <button type="button" onClick={onClose}>
            {messages.close}
          </button>
        </header>

        <div className="modal-score-grid">
          <ScoreBlock label={messages.priority} value={company.outreachScore} />
          <ScoreBlock
            label={messages.quality}
            value={company.dataCompleteness}
            muted
          />
        </div>

        <div className="detail-grid">
          <Detail label={messages.category} value={company.category} />
          <Detail label={messages.city} value={company.city} />
          <Detail label={messages.address} value={company.address} />
          <Detail label={messages.rating} value={company.rating?.toFixed(1)} />
          <Detail
            label={messages.reviews}
            value={company.reviewsCount?.toString()}
          />
        </div>

        <h3>{messages.contactData}</h3>
        <div className="detail-grid">
          <Detail
            label={messages.site}
            value={
              company.website ? (
                <a
                  href={company.website}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {company.websiteHost}
                </a>
              ) : null
            }
          />
          <Detail label={messages.phone} value={company.phoneE164} />
        </div>

        <h3>{messages.sourceData}</h3>
        <div className="detail-grid">
          <Detail label={messages.sourceId} value={company.sourceId} />
          <Detail label={messages.sourceFile} value={company.sourceFile} />
          <Detail
            label={messages.sourceIndex}
            value={company.sourceIndex?.toString()}
          />
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function ScoreBlock({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="score-block">
      <span>{label}</span>
      <Progress value={value} muted={muted} />
    </div>
  );
}

function Progress({
  value,
  muted = false,
}: {
  value: number;
  muted?: boolean;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <span className={muted ? "progress muted-progress" : "progress"}>
      <span style={{ width: `${width}%` }} />
      <em className="num">{value}</em>
    </span>
  );
}
