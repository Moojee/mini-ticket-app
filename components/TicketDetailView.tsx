"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Ticket,
  Comment,
  Profile,
  Status,
  Priority,
  Category,
  STATUS_COLUMNS,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
} from "@/lib/types";
import { ArrowLeft, Trash2, Send, ChevronDown, Info, X } from "lucide-react";

interface Props {
  ticket: Ticket & { comments?: Comment[]; mention_type?: string | null;  };
  comments: Comment[];
  
  profiles: Profile[];
  currentUserId: string;
}

export default function TicketDetailView({
  ticket: initialTicket,
  comments: initialComments,
  profiles,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initialTicket);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<Profile[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);

  const priority = PRIORITY_CONFIG[ticket.priority];
  const category = CATEGORY_CONFIG[ticket.category];

  const priorities: Priority[] = ["Low", "Medium", "High"];
  const categories: Category[] = [
    "Dashboard",
    "Mobile app",
    "Backend",
    "Design",
    "Bug",
    "Feature",
  ];

  async function patch(body: Partial<Ticket> & { mention_type?: string | null }) {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updatedTicket = await res.json();
      
      // ค้นหาโปรไฟล์ตัวจริงเพื่อนำมาอัปเดตอวาตาร์และชื่อในฝั่ง Frontend ทันที
      let updatedAssignee = null;
      if (body.assigned_to) {
        updatedAssignee = profiles.find(p => p.id === body.assigned_to) || null;
      }

      setTicket((prev) => ({
        ...prev,
        ...updatedTicket,
        assignee: body.assigned_to !== undefined ? updatedAssignee : prev.assignee,
        mention_type: body.mention_type !== undefined ? body.mention_type : prev.mention_type,
      }));
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this ticket?")) return;
    setDeleting(true);
    const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
    if (res.ok) router.push("/board");
    else setDeleting(false);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSendingComment(true);
    const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newComment,
        mention_user_ids: mentionedUsers.map((u) => u.id),
      }),
    });
    if (res.ok) {
      const freshComment = await res.json();
      setComments((prev) => [...prev, freshComment]);
      setNewComment("");
      setMentionedUsers([]);
    }
    setSendingComment(false);
  }

  function toggleMention(profile: Profile) {
    setMentionedUsers((prev) =>
      prev.find((u) => u.id === profile.id)
        ? prev.filter((u) => u.id !== profile.id)
        : [...prev, profile],
    );
  }

  // หามูลค่าของ Dropdown สำหรับช่อง Assignee เพื่อให้สอดคล้องกับค่าที่มีในตัวแปร
  const currentAssigneeValue = (() => {
    const mt = (ticket as any).mention_type;
    if (mt === "__here__") return "__here__";
    if (mt === "__channel__") return "__channel__";
    return ticket.assigned_to ?? "";
  })();

  return (
    <div className="min-h-screen bg-[#f1f2f6]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-3">
        <Link
          href="/board"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 flex-shrink-0"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <span className="text-gray-300 hidden sm:inline">/</span>
        <span className="text-sm text-gray-700 font-medium truncate flex-1">
          {ticket.title}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <Info
              size={15}
              className={showInfo ? "text-indigo-600" : "text-gray-400"}
            />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">
              {deleting ? "Deleting…" : "Delete"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile info panel */}
      {showInfo && (
        <div className="md:hidden p-4 bg-[#f1f2f6] border-b border-gray-200">
          <SidebarPanel 
            ticket={ticket} 
            profiles={profiles} 
            priorities={priorities} 
            categories={categories} 
            currentAssigneeValue={currentAssigneeValue} 
            patch={patch} 
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 md:p-6 md:grid md:grid-cols-3 md:gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Title card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-md ${category.bg} ${category.color}`}
              >
                {ticket.category}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}
              >
                {priority.emoji} {ticket.priority}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {ticket.title}
            </h1>
            <p className="text-xs text-gray-500">
              By{" "}
              <span className="font-medium text-gray-700">
                {ticket.creator?.full_name ?? ticket.creator?.email}
              </span>
              {" · "}
              {format(new Date(ticket.created_at), "MMM d, yyyy · HH:mm")}
            </p>
            {ticket.detail && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {ticket.detail}
                </p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Comments{" "}
              <span className="text-gray-400 font-normal">
                ({comments.length})
              </span>
            </h2>

            <div className="flex flex-col gap-4 mb-4">
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No comments yet
                </p>
              )}
              {comments.map((comment) => {
                const initials = (
                  comment.author?.full_name ??
                  comment.author?.email ??
                  "U"
                )
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const isMe = comment.user_id === currentUserId;
                return (
                  <div key={comment.id} className="flex gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? "bg-indigo-100" : "bg-gray-100"}`}
                    >
                      {comment.author?.avatar_url ? (
                        <img
                          src={comment.author.avatar_url}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className={`text-[10px] font-bold ${isMe ? "text-indigo-600" : "text-gray-600"}`}
                        >
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-gray-700">
                          {comment.author?.full_name ??
                            comment.author?.email ??
                            "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(
                            new Date(comment.created_at),
                            "MMM d · HH:mm",
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mention tags */}
            {mentionedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {mentionedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full"
                  >
                    @{u.full_name ?? u.email}
                    <button type="button" onClick={() => toggleMention(u)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Comment input */}
            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="button"
                  onClick={() => setShowMentionPicker(!showMentionPicker)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    showMentionPicker
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  @ Tag
                </button>
                <button
                  type="submit"
                  disabled={sendingComment || !newComment.trim()}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>

              {/* Mention picker */}
              {showMentionPicker && (
                <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                  <p className="text-xs text-gray-400 px-3 pt-2 pb-1">
                    Tag people in this comment
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    {profiles.map((p) => {
                      const selected = mentionedUsers.some(
                        (u) => u.id === p.id,
                      );
                      const initials = (p.full_name ?? p.email)
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleMention(p)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                            selected
                              ? "bg-indigo-50 text-indigo-700"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                              selected
                                ? "bg-indigo-200 text-indigo-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {p.avatar_url ? (
                              <img
                                src={p.avatar_url}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <span className="truncate">
                            {p.full_name ?? p.email}
                          </span>
                          {selected && (
                            <span className="ml-auto text-indigo-500 text-xs">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-col md:gap-4">
          <SidebarPanel 
            ticket={ticket} 
            profiles={profiles} 
            priorities={priorities} 
            categories={categories} 
            currentAssigneeValue={currentAssigneeValue} 
            patch={patch} 
          />
        </div>
      </div>
    </div>
  );
}

// แยกส่วน UI Sidebar ออกมาข้างนอก ป้องกันปัญหา Re-render พร่ำเพรื่อ
interface SidebarPanelProps {
  ticket: any;
  profiles: Profile[];
  priorities: Priority[];
  categories: Category[];
  currentAssigneeValue: string;
  patch: (body: any) => Promise<void>;
}

function SidebarPanel({
  ticket,
  profiles,
  priorities,
  categories,
  currentAssigneeValue,
  patch,
}: SidebarPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Status
        </h3>
        <div className="flex flex-col gap-1.5">
          {STATUS_COLUMNS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => patch({ status: col.id as Status })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                ticket.status === col.id
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              {col.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Priority
        </h3>
        <div className="flex gap-1.5">
          {priorities.map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => patch({ priority: p })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  ticket.priority === p
                    ? `${cfg.bg} ${cfg.color} border-transparent`
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Category
        </h3>
        <div className="relative">
          <select
            value={ticket.category}
            onChange={(e) => patch({ category: e.target.value as Category })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white appearance-none pr-8"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Assignee */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Assignee{" "}
          <span className="text-indigo-400 font-normal normal-case tracking-normal">
            (notifies Slack)
          </span>
        </h3>
        <div className="relative">
          <select
            value={currentAssigneeValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__here__" || val === "__channel__") {
                patch({
                  assigned_to: null, // ส่งเป็น null ของจริงไปให้ฐานข้อมูล
                  mention_type: val, // บันทึกประเภทการแอดแท็กตรงๆ
                });
              } else {
                patch({ 
                  assigned_to: val || null, 
                  mention_type: null 
                });
              }
            }}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white appearance-none pr-8"
          >
            <option value="">Unassigned</option>
            <option value="__here__">📢 @here</option>
            <option value="__channel__">📣 @channel</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name ?? p.email}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
        {ticket.assignee && !ticket.mention_type && (
          <div className="flex items-center gap-2 mt-3 px-1">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              {ticket.assignee.avatar_url ? (
                <img
                  src={ticket.assignee.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold text-violet-600">
                  {(ticket.assignee.full_name ?? ticket.assignee.email)
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700">
                {ticket.assignee.full_name ?? ticket.assignee.email}
              </p>
              <p className="text-xs text-gray-400">{ticket.assignee.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Dates
        </h3>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-gray-400">Created</p>
            <p className="text-xs font-medium text-gray-700">
              {format(new Date(ticket.created_at), "MMM d, yyyy · HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Updated</p>
            <p className="text-xs font-medium text-gray-700">
              {format(new Date(ticket.updated_at), "MMM d · HH:mm")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}