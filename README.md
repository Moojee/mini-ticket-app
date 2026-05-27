# Mini Ticket App 🎫

Internal task management with Slack notifications.  
Built with **Next.js 14** · **Supabase** · **Slack Webhook** · **Tailwind CSS**

---

## Tech Stack

| Frontend | Next.js 14 (App Router) + TypeScript |
| Auth     | Supabase Auth (Google OAuth)        |
| Database | Supabase (PostgreSQL)               |
| Styling  | Tailwind CSS                        |
| Notify   | Slack Incoming Webhook              |



1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Update Supabase redirect URL to your production URL:  
   `https://yourapp.vercel.app/api/auth/callback`
5. Update `NEXT_PUBLIC_APP_URL` to production URL
