import { createClient } from "@/lib/supabase/server";
import NotificationCard from "./NotificationCard";
import MarkAllReadButton from "./MarkAllReadButton";

interface UserProfile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface TicketNotification {
  id: string;
  title: string;
  updated_at: string;
  is_assigned_read: boolean;
  creator: UserProfile | null;
}

interface CommentNotification {
  id: string;
  created_at: string;
  is_read: boolean;
  author: UserProfile | null;
  ticket: {
    id: string;
    title: string;
  } | null;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div className="text-center py-10">Please sign in</div>;

  // ดึงข้อมูล Tickets พร้อมจับ Error
  const { data: myTickets, error: ticketsError } = (await supabase
    .from("tickets")
    .select(`
      id, title, updated_at, is_assigned_read,
      creator:profiles!tickets_created_by_fkey(full_name, email, avatar_url)
    `)
    .eq("assigned_to", user.id)
    .order("updated_at", { ascending: false })
    .limit(20));

  if (ticketsError) console.error("Error fetching tickets:", ticketsError);

  // ดึงข้อมูล Comments พร้อมจับ Error และแก้ Syntax การ Filter
  const { data: myComments, error: commentsError } = (await supabase
    .from("comments")
    .select(`
      id, created_at, is_read,
      author:profiles(full_name, email, avatar_url),
      ticket:tickets!inner(id, title, created_by)
    `)
    .eq("tickets.created_by", user.id) // 👈 แก้ตรงนี้: ใช้ tickets.created_by
    .neq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20));

  if (commentsError) console.error("Error fetching comments:", commentsError);

  // แคสต์ Type หลังจากดึงข้อมูลสำเร็จ
  const typedTickets = myTickets as unknown as TicketNotification[] | null;
  const typedComments = myComments as unknown as CommentNotification[] | null;

  // คำนวณจำนวนแจ้งเตือนที่ "ยังไม่ได้อ่าน"
  const unreadTicketsCount = typedTickets?.filter((t) => !t.is_assigned_read).length ?? 0;
  const unreadCommentsCount = typedComments?.filter((c) => !c.is_read).length ?? 0;
  const totalUnread = unreadTicketsCount + unreadCommentsCount;
  const totalNotifications = (typedTickets?.length ?? 0) + (typedComments?.length ?? 0);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {totalUnread > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {totalUnread} new
            </span>
          )}
        </div>
        {totalUnread > 0 && <MarkAllReadButton />}
      </div>

      {/* Content Section */}
      {totalNotifications === 0 ? (
        <p className="text-sm text-gray-400 py-10 text-center bg-white rounded-2xl border border-gray-100">
          All caught up! No new notifications.
        </p>
      ) : (
        <div className="space-y-6">
          {typedTickets && typedTickets.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Assigned to you
              </h2>
              <div className="flex flex-col gap-2">
                {typedTickets.map((ticket) => (
                  <NotificationCard
                    key={ticket.id}
                    id={ticket.id}
                    type="ticket"
                    href={`/ticket/${ticket.id}`}
                    profile={ticket.creator}
                    title={ticket.title}
                    time={ticket.updated_at}
                    actionText="assigned you a ticket"
                    isRead={ticket.is_assigned_read}
                    theme="indigo"
                  />
                ))}
              </div>
            </div>
          )}

          {typedComments && typedComments.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Comments on your tickets
              </h2>
              <div className="flex flex-col gap-2">
                {typedComments.map((comment) => (
                  <NotificationCard
                    key={comment.id}
                    id={comment.id}
                    type="comment"
                    href={`/ticket/${comment.ticket?.id}`}
                    profile={comment.author}
                    title={comment.ticket?.title ?? "Untitled Ticket"}
                    time={comment.created_at}
                    actionText="commented"
                    isRead={comment.is_read}
                    theme="gray"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}