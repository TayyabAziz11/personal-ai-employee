import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#07070f]">
      <Sidebar user={session.user} />
      <main className="ml-[220px] flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
