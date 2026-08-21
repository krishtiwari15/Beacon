"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_LABELS, CommunityCategory, CommunityComment, CommunityPost } from "@/lib/community";

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]";

export default function Community({ user }: { user: User }) {
  const [category, setCategory] = useState<CommunityCategory>("careers");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [myLikes, setMyLikes] = useState<Set<number>>(new Set());
  const [mySaves, setMySaves] = useState<Set<number>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, CommunityComment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: postRows } = await supabase
      .from("community_posts")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(30);

    const list = (postRows ?? []) as CommunityPost[];
    setPosts(list);

    if (list.length > 0) {
      const ids = list.map((p) => p.id);
      const userIds = Array.from(new Set(list.map((p) => p.user_id)));

      const [profilesRes, reactionsRes, myReactionsRes, mySavesRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
        supabase.from("community_reactions").select("post_id").in("post_id", ids),
        supabase.from("community_reactions").select("post_id").in("post_id", ids).eq("user_id", user.id),
        supabase.from("community_saves").select("post_id").in("post_id", ids).eq("user_id", user.id),
        supabase.from("community_comments").select("post_id").in("post_id", ids),
      ]);

      const names: Record<string, string> = {};
      (profilesRes.data ?? []).forEach((p) => {
        names[p.user_id as string] = (p.full_name as string) || "Beacon Student";
      });
      setAuthorNames(names);

      const likeCountMap: Record<number, number> = {};
      (reactionsRes.data ?? []).forEach((r) => {
        const pid = r.post_id as number;
        likeCountMap[pid] = (likeCountMap[pid] ?? 0) + 1;
      });
      setLikeCounts(likeCountMap);
      setMyLikes(new Set((myReactionsRes.data ?? []).map((r) => r.post_id as number)));
      setMySaves(new Set((mySavesRes.data ?? []).map((r) => r.post_id as number)));

      const commentCountMap: Record<number, number> = {};
      (commentsRes.data ?? []).forEach((c) => {
        const pid = c.post_id as number;
        commentCountMap[pid] = (commentCountMap[pid] ?? 0) + 1;
      });
      setCommentCounts(commentCountMap);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    setExpandedPost(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, user.id]);

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, body }),
      });
      const data = await res.json();
      if (data.error) {
        setPostError(data.error);
      } else {
        setTitle("");
        setBody("");
        setFormOpen(false);
        load();
      }
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId: number) {
    const supabase = createClient();
    const liked = myLikes.has(postId);
    setMyLikes((prev) => {
      const next = new Set(prev);
      if (liked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + (liked ? -1 : 1) }));
    if (liked) {
      await supabase.from("community_reactions").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("community_reactions").insert({ post_id: postId, user_id: user.id });
    }
  }

  async function toggleSave(postId: number) {
    const supabase = createClient();
    const saved = mySaves.has(postId);
    setMySaves((prev) => {
      const next = new Set(prev);
      if (saved) next.delete(postId);
      else next.add(postId);
      return next;
    });
    if (saved) {
      await supabase.from("community_saves").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("community_saves").insert({ post_id: postId, user_id: user.id });
    }
  }

  async function report(postId: number) {
    await fetch("/api/community/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, reason: "Reported by user" }),
    });
  }

  async function loadComments(postId: number) {
    const supabase = createClient();
    const { data } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as CommunityComment[];
    setComments((prev) => ({ ...prev, [postId]: rows }));

    const missingIds = Array.from(new Set(rows.map((c) => c.user_id))).filter((id) => !authorNames[id]);
    if (missingIds.length > 0) {
      const { data: profileRows } = await supabase.from("profiles").select("user_id, full_name").in("user_id", missingIds);
      const additions: Record<string, string> = {};
      (profileRows ?? []).forEach((p) => {
        additions[p.user_id as string] = (p.full_name as string) || "Beacon Student";
      });
      setAuthorNames((prev) => ({ ...prev, ...additions }));
    }
  }

  async function toggleExpand(postId: number) {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) await loadComments(postId);
    }
  }

  async function submitComment(postId: number) {
    if (!commentDraft.trim()) return;
    const supabase = createClient();
    await supabase.from("community_comments").insert({ post_id: postId, user_id: user.id, body: commentDraft.trim() });
    setCommentDraft("");
    loadComments(postId);
    setCommentCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
  }

  const visiblePosts = useMemo(() => posts.filter((p) => !p.hidden || p.user_id === user.id), [posts, user.id]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Student Community
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Ask questions, share projects, discuss careers. Posts reported by multiple students are
        automatically hidden pending review, and posting is rate-limited to keep things spam-free.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              category === c ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <button
        onClick={() => setFormOpen((v) => !v)}
        className="mt-4 cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
      >
        {formOpen ? "Cancel" : `+ New post in ${CATEGORY_LABELS[category]}`}
      </button>

      {formOpen && (
        <form onSubmit={submitPost} className="mt-3 flex flex-col gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required className={inputClass} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's on your mind?" rows={4} required className={`${inputClass} resize-none`} />
          {postError && <p className="text-xs text-red-600">{postError}</p>}
          <button type="submit" disabled={posting} className="h-[40px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50">
            {posting ? "Posting…" : "Post"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-6 h-32 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {visiblePosts.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
              No posts yet in {CATEGORY_LABELS[category]} — be the first.
            </div>
          ) : (
            visiblePosts.map((p) => (
              <div key={p.id} className={`rounded-[16px] border bg-[var(--surface)] p-5 backdrop-blur-md ${p.hidden ? "border-red-400/40" : "border-[var(--border)]"}`}>
                {p.hidden && <p className="mb-2 text-xs font-medium text-red-600">⚠ This post is hidden pending review (multiple reports) — only visible to you.</p>}
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="min-w-0 font-serif text-base font-semibold break-words text-[var(--heading)]">{p.title}</span>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">{authorNames[p.user_id] ?? "Beacon Student"}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text)]">{p.body}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <button onClick={() => toggleLike(p.id)} className={`cursor-pointer ${myLikes.has(p.id) ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} hover:text-[var(--accent)]`}>
                    {myLikes.has(p.id) ? "❤️" : "🤍"} {likeCounts[p.id] ?? 0}
                  </button>
                  <button onClick={() => toggleExpand(p.id)} className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--accent)]">
                    💬 {commentCounts[p.id] ?? 0}
                  </button>
                  <button onClick={() => toggleSave(p.id)} className={`cursor-pointer ${mySaves.has(p.id) ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} hover:text-[var(--accent)]`}>
                    {mySaves.has(p.id) ? "🔖 Saved" : "🔖 Save"}
                  </button>
                  {p.user_id !== user.id && (
                    <button onClick={() => report(p.id)} className="ml-auto cursor-pointer text-[var(--text-muted)] hover:text-red-600">
                      🚩 Report
                    </button>
                  )}
                </div>

                {expandedPost === p.id && (
                  <div className="mt-3 border-t border-[var(--border)] pt-3">
                    {(comments[p.id] ?? []).map((c) => (
                      <div key={c.id} className="mb-2 rounded-[12px] bg-black/[0.02] px-3 py-2 text-sm">
                        <div className="text-xs font-medium text-[var(--text-muted)]">{authorNames[c.user_id] ?? "Beacon Student"}</div>
                        <div className="text-[var(--text)]">{c.body}</div>
                      </div>
                    ))}
                    <div className="mt-2 flex gap-2">
                      <input
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Add a comment…"
                        className={`${inputClass} flex-1`}
                      />
                      <button onClick={() => submitComment(p.id)} className="cursor-pointer rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]">
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
