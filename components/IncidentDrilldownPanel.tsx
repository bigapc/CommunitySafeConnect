'use client';

import { useMemo, useState } from 'react';
import type { IncidentRow, CommandCenterEventRow } from '@/lib/localDataStore';

type SeverityFilter = 'all' | IncidentRow['severity'];
type StatusFilter = 'all' | IncidentRow['status'];

interface IncidentDrilldownPanelProps {
  incidents: IncidentRow[];
  incidentEventsById: Record<string, CommandCenterEventRow[]>;
}

export default function IncidentDrilldownPanel({ incidents, incidentEventsById }: IncidentDrilldownPanelProps) {
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      const severityPass = severity === 'all' || incident.severity === severity;
      const statusPass = status === 'all' || incident.status === status;
      return severityPass && statusPass;
    });
  }, [incidents, severity, status]);

  const selectedIncident = filtered.find((incident) => incident.id === selectedIncidentId) || null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</span>
        <FilterChip label="All" active={severity === 'all'} onClick={() => setSeverity('all')} />
        <FilterChip label="Low" active={severity === 'low'} onClick={() => setSeverity('low')} />
        <FilterChip label="Medium" active={severity === 'medium'} onClick={() => setSeverity('medium')} />
        <FilterChip label="High" active={severity === 'high'} onClick={() => setSeverity('high')} />
        <FilterChip label="Critical" active={severity === 'critical'} onClick={() => setSeverity('critical')} />

        <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
        <FilterChip label="All" active={status === 'all'} onClick={() => setStatus('all')} />
        <FilterChip label="New" active={status === 'new'} onClick={() => setStatus('new')} />
        <FilterChip label="Triaged" active={status === 'triaged'} onClick={() => setStatus('triaged')} />
        <FilterChip label="In Progress" active={status === 'in_progress'} onClick={() => setStatus('in_progress')} />
        <FilterChip label="Resolved" active={status === 'resolved'} onClick={() => setStatus('resolved')} />
      </div>

      {filtered.length === 0 ? (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="m-0 text-slate-700">No incidents match the selected filters.</p>
        </article>
      ) : (
        filtered.slice(0, 12).map((incident) => (
          <button
            key={incident.id}
            type="button"
            onClick={() => setSelectedIncidentId(incident.id)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="m-0 text-base font-semibold text-slate-900">{incident.title}</p>
                <p className="mt-1 text-xs text-slate-500">{incident.id.slice(0, 12)} | {new Date(incident.updated_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">{incident.status.replaceAll('_', ' ')}</span>
                <span className="rounded-full bg-rose-100 px-2 py-1 font-semibold text-rose-700">{incident.severity}</span>
                {incident.escalated && <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">escalated</span>}
              </div>
            </div>
          </button>
        ))
      )}

      <div
        className={`fixed inset-0 z-50 transition ${selectedIncident ? 'pointer-events-auto bg-slate-900/40' : 'pointer-events-none bg-transparent'}`}
        onClick={() => setSelectedIncidentId(null)}
      >
        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl transition-transform duration-200 ${selectedIncident ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(event) => event.stopPropagation()}
        >
          {selectedIncident && (
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Incident Detail</p>
                  <h4 className="mt-1 text-xl font-bold text-slate-900">{selectedIncident.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIncidentId(null)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <p className="text-sm text-slate-700">{selectedIncident.description}</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard label="Assignee" value={selectedIncident.assignee || 'Unassigned'} />
                <InfoCard label="SLA Due" value={selectedIncident.sla_due_at ? new Date(selectedIncident.sla_due_at).toLocaleString() : 'Not scheduled'} />
                <InfoCard label="Status" value={selectedIncident.status.replaceAll('_', ' ')} />
                <InfoCard label="Severity" value={selectedIncident.severity} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                <div className="mt-2 space-y-2">
                  {(incidentEventsById[selectedIncident.id] || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No timeline events yet.</p>
                  ) : (
                    (incidentEventsById[selectedIncident.id] || []).map((event) => (
                      <div key={event.id} className="rounded-md border border-slate-200 p-2">
                        <p className="text-sm font-semibold text-slate-800">{event.action}</p>
                        <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
                        {event.details && <p className="mt-1 text-xs text-slate-600">{event.details}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
    >
      {label}
    </button>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}
