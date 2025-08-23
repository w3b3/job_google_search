import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserUsageStats } from '@/lib/database/auth-operations';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log('❌ No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const stats = await getUserUsageStats(session.user.id);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}
