"use client";

import { useState, type ReactNode } from "react";
import type { CompanyRow } from "@polza/db/companies";
import type { Messages } from "./i18n";

type CompanyTableProps = {
  rows: CompanyRow[];
  messages: Messages;
};

type ModalMode = "profile" | "reviews";

export function CompanyTable({ rows, messages }: CompanyTableProps) {
  const [selected, setSelected] = useState<CompanyRow | null>(null);
  const [mode, setMode] = useState<ModalMode>("profile");

  function openModal(company: CompanyRow, nextMode: ModalMode): void {
    setSelected(company);
    setMode(nextMode);
  }

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
                <td>
                  <button
                    className="text-button num"
                    type="button"
                    onClick={() => openModal(company, "reviews")}
                  >
                    {company.reviewsCount ?? "—"}
                  </button>
                </td>
                <td>
                  <Progress value={company.outreachScore} />
                </td>
                <td>
                  <Progress value={company.dataCompleteness} muted />
                </td>
                <td className="row-action">
                  <button
                    type="button"
                    onClick={() => openModal(company, "profile")}
                  >
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
          initialMode={mode}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

function CompanyModal({
  company,
  messages,
  initialMode,
  onClose,
}: {
  company: CompanyRow;
  messages: Messages;
  initialMode: ModalMode;
  onClose: () => void;
}) {
  const [activeMode, setActiveMode] = useState<ModalMode>(initialMode);

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

        <div className="modal-tabs" role="tablist">
          <button
            className={activeMode === "profile" ? "active-tab" : ""}
            type="button"
            onClick={() => setActiveMode("profile")}
          >
            {messages.profile}
          </button>
          <button
            className={activeMode === "reviews" ? "active-tab" : ""}
            type="button"
            onClick={() => setActiveMode("reviews")}
          >
            {messages.reviewsBlock}
          </button>
        </div>

        {activeMode === "profile" ? (
          <ProfilePanel company={company} messages={messages} />
        ) : (
          <ReviewsPanel company={company} messages={messages} />
        )}
      </section>
    </div>
  );
}

function ProfilePanel({
  company,
  messages,
}: {
  company: CompanyRow;
  messages: Messages;
}) {
  return (
    <>
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
    </>
  );
}

function ReviewsPanel({
  company,
  messages,
}: {
  company: CompanyRow;
  messages: Messages;
}) {
  return (
    <section className="reviews-panel">
      <div className="review-summary">
        <Detail
          label={messages.aggregateOnly}
          value={company.reviewsCount?.toString()}
        />
      </div>

      {company.recentReviews.length > 0 ? (
        <div className="review-list">
          {company.recentReviews.map((review, index) => (
            <article key={`${review.reviewDate ?? "no-date"}-${index}`}>
              <div>
                <strong>{review.author ?? messages.reviewsBlock}</strong>
                <span className="num">{review.rating?.toFixed(1) ?? "—"}</span>
              </div>
              <p>{review.body ?? "—"}</p>
              <small>{review.reviewDate ?? review.emailStatus ?? "—"}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="reviews-empty">
          <strong>{messages.reviewsUnavailable}</strong>
          <p>{messages.aggregateOnly}</p>
        </div>
      )}
    </section>
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
