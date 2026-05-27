'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ฟังก์ชันอัปเดตสถานะตั๋วว่า "อ่านแล้ว"
export async function markTicketAsRead(ticketId: string) {
  const supabase = await createClient()
  await supabase
    .from('tickets')
    .update({ is_assigned_read: true })
    .eq('id', ticketId)
  
  revalidatePath('/', 'layout') // สั่งให้รีเฟรชข้อมูลในหน้านี้
}

// ฟังก์ชันอัปเดตสถานะคอมเมนต์ว่า "อ่านแล้ว"
export async function markCommentAsRead(commentId: string) {
  const supabase = await createClient()
  await supabase
    .from('comments')
    .update({ is_read: true })
    .eq('id', commentId)
  
  revalidatePath('/', 'layout')
}

// เพิ่มฟังก์ชันใหม่สำหรับ Mark All as Read
export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  // 1. อัปเดตตั๋วที่มอบหมายให้เราทั้งหมด ให้เป็นอ่านแล้ว
  await supabase
    .from('tickets')
    .update({ is_assigned_read: true })
    .eq('assigned_to', user.id)
    .eq('is_assigned_read', false)

  // 2. สำหรับคอมเมนต์ เราต้องหา ID ของคอมเมนต์ในตั๋วเราที่ยังไม่อ่านออกมาก่อน
  const { data: unreadComments } = await supabase
    .from('comments')
    .select('id, ticket:tickets!inner(created_by)')
    .eq('ticket.created_by', user.id)
    .eq('is_read', false)

  // ถ้ามีคอมเมนต์ที่ยังไม่อ่าน ให้อัปเดตทั้งหมด
  if (unreadComments && unreadComments.length > 0) {
    const commentIds = unreadComments.map(c => c.id)
    await supabase
      .from('comments')
      .update({ is_read: true })
      .in('id', commentIds)
  }

  // รีเฟรชหน้าจอเพื่อลบเลขแจ้งเตือน
  revalidatePath('/', 'layout')
}