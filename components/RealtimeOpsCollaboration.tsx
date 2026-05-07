'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

interface PresenceEntry {
  id: string;
  alias: string;
  role: string;
  updatedAt: number;
}

interface FeedMessage {
  id: string;
  author: string;
  role: string;
  text: string;
  createdAt: number;
}

const PRESENCE_KEY = 'csc_ops_presence';
const FEED_KEY = 'csc_ops_feed';
const CHANNEL_NAME = 'csc_ops_channel';
const PRESENCE_TTL_MS = 30_000;

export default function RealtimeOpsCollaboration() {
  const [operatorId] = useState(() => `op_${Math.random().toString(16).slice(2, 9)}`);
  const [alias] = useState(() => `Operator-${Math.floor(Math.random() * 90 + 10)}`);
  const [role] = useState<'moderator' | 'org_admin'>(() => (Math.random() > 0.6 ? 'org_admin' : 'moderator'));
  const [presence, setPresence] = useState<PresenceEntry[]>([]);
  const [feed, setFeed] = useState<FeedMessage[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const loadPresence = () => {
      const raw = localStorage.getItem(PRESENCE_KEY);
      const list = raw ? (JSON.parse(raw) as PresenceEntry[]) : [];
      const now = Date.now();
      const active = list.filter((item) => now - item.updatedAt <= PRESENCE_TTL_MS);
      setPresence(active);
      localStorage.setItem(PRESENCE_KEY, JSON.stringify(active));
    };

    const loadFeed = () => {
      const raw = localStorage.getItem(FEED_KEY);
      const list = raw ? (JSON.parse(raw) as FeedMessage[]) : [];
      setFeed(list.slice(0, 25));
    };

    const writeHeartbeat = () => {
      const raw = localStorage.getItem(PRESENCE_KEY);
      const list = raw ? (JSON.parse(raw) as PresenceEntry[]) : [];
      const now = Date.now();
      const next = [
        ...list.filter((item) => item.id !== operatorId && now - item.updatedAt <= PRESENCE_TTL_MS),
        { id: operatorId, alias, role, updatedAt: now },
      ];
      localStorage.setItem(PRESENCE_KEY, JSON.stringify(next));
      setPresence(next);
    };

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
    channel?.addEventListener('message', () => {
      loadPresence();
      loadFeed();
    });

    loadPresence();
    loadFeed();
    writeHeartbeat();

    const heartbeatInterval = setInterval(() => {
      writeHeartbeat();
      channel?.postMessage({ kind: 'presence' });
    }, 5000);

    const refreshInterval = setInterval(() => {
      loadPresence();
      loadFeed();
    }, 4000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(refreshInterval);
      channel?.close();
    };
  }, [operatorId, alias, role]);

  const roleCounts = useMemo(() => {
    const moderators = presence.filter((p) => p.role === 'moderator').length;
    const admins = presence.filter((p) => p.role === 'org_admin').length;
    return { moderators, admins };
  }, [presence]);

  const sendUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();

    if (!text) {
      return;
    }

    const message: FeedMessage = {
      id: `msg_${Date.now()}`,
      author: alias,
      role,
      text,
      createdAt: Date.now(),
    };

    const raw = localStorage.getItem(FEED_KEY);
    const list = raw ? (JSON.parse(raw) as FeedMessage[]) : [];
    const next = [message, ...list].slice(0, 25);
    localStorage.setItem(FEED_KEY, JSON.stringify(next));
    setFeed(next);
    setDraft('');

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ kind: 'feed' });
      channel.close();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Realtime Collaboration</p>
          <h4 className="text-lg font-semibold text-slate-900">Operator Presence and Live Ops Notes</h4>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700">Online: {presence.length}</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">Moderators: {roleCounts.moderators}</span>
          <span className="rounded-full bg-violet-100 px-2 py-1 font-semibold text-violet-700">Admins: {roleCounts.admins}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {presence.length === 0 ? (
          <span className="text-sm text-slate-500">No active operators detected.</span>
        ) : (
          presence.map((entry) => (
            <span key={entry.id} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
              {entry.alias} ({entry.role})
            </span>
          ))
        )}
      </div>

      <form onSubmit={sendUpdate} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Post a live operations update for other operators"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Broadcast
        </button>
      </form>

      <div className="mt-4 max-h-44 space-y-2 overflow-y-auto">
        {feed.length === 0 ? (
          <p className="text-sm text-slate-500">No live updates yet. Start with the first dispatch note.</p>
        ) : (
          feed.map((item) => (
            <article key={item.id} className="rounded-md border border-slate-200 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{item.author}</p>
                <span className="text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-slate-600">{item.role}</p>
              <p className="mt-1 text-sm text-slate-700">{item.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
