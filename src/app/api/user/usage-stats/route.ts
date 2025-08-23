import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getUserUsageStats } from '@/lib/database/auth-operations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
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
