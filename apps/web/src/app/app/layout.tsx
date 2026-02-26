import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { prisma } from '@/lib/db'

async function getPendingCount(userId: string): Promise<number> {
  try {
    return await prisma.webPlan.count({
      where: { userId, status: 'pending_approval' },
    })
  } catch {
    return 0
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as { id?: string })?.id ?? ''
  const pendingApprovals = await getPendingCount(userId)

  return (
    <div className="flex min-h-screen bg-[#07070f]">
      <Sidebar user={session.user} pendingApprovals={pendingApprovals} />
      <main className="ml-[220px] flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
