'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Users,
  Building,
  Star,
  Activity
} from 'lucide-react';
import type { 
  UserDashboardStats, 
  ApplicationStatus,
  ApiResponse 
} from '@/lib/types';

interface DashboardProps {
  userId?: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard?userId=${userId}&type=overview`);
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Network error loading dashboard');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <Activity size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Start saving jobs to see your dashboard analytics.</p>
      </div>
    );
  }

  const { user, pipeline, summary } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Search Dashboard</h1>
        <p className="text-gray-600">
          Track your job search progress and application pipeline
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Collections"
          value={user.totalCollections}
          icon={<Building className="text-blue-600" size={24} />}
          subtitle={`${user.activeCollections} active`}
        />
        <MetricCard
          title="Saved Jobs"
          value={user.totalSavedJobs}
          icon={<Target className="text-green-600" size={24} />}
          subtitle={`${user.jobsSavedThisWeek} this week`}
        />
        <MetricCard
          title="Applications"
          value={summary.totalApplications}
          icon={<CheckCircle className="text-purple-600" size={24} />}
          subtitle={`${summary.activeApplications} active`}
        />
        <MetricCard
          title="Success Rate"
          value={`${summary.successRate}%`}
          icon={<TrendingUp className="text-orange-600" size={24} />}
          subtitle="Offer rate"
        />
      </div>

      {/* Application Pipeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Pipeline</h2>
        <ApplicationPipeline pipeline={pipeline} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity user={user} />
        <QuickStats user={user} pipeline={pipeline} />
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, icon, subtitle, trend }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp size={16} className={trend.isPositive ? '' : 'rotate-180'} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
    </div>
  );
}

// Application Pipeline Component
interface ApplicationPipelineProps {
  pipeline: Record<ApplicationStatus, number>;
}

function ApplicationPipeline({ pipeline }: ApplicationPipelineProps) {
  const stages = [
    { key: 'not_applied' as ApplicationStatus, label: 'Not Applied', color: 'bg-gray-500', icon: Clock },
    { key: 'applied' as ApplicationStatus, label: 'Applied', color: 'bg-blue-500', icon: CheckCircle },
    { key: 'interviewing' as ApplicationStatus, label: 'Interviewing', color: 'bg-purple-500', icon: Users },
    { key: 'offered' as ApplicationStatus, label: 'Offered', color: 'bg-green-500', icon: Target },
    { key: 'accepted' as ApplicationStatus, label: 'Accepted', color: 'bg-green-600', icon: CheckCircle },
    { key: 'rejected' as ApplicationStatus, label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  ];

  const total = Object.values(pipeline).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Pipeline Visualization */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const count = pipeline[stage.key] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const Icon = stage.icon;

          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className={`w-12 h-12 rounded-full ${stage.color} flex items-center justify-center mb-2`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-600">{stage.label}</div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 min-w-[20px]" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{pipeline.applied || 0}</div>
          <div className="text-sm text-gray-600">Applications Sent</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{pipeline.interviewing || 0}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{pipeline.offered || 0}</div>
          <div className="text-sm text-gray-600">Offers Received</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{pipeline.rejected || 0}</div>
          <div className="text-sm text-gray-600">Rejections</div>
        </div>
      </div>
    </div>
  );
}

// Recent Activity Component
interface RecentActivityProps {
  user: UserDashboardStats;
}

function RecentActivity({ user }: RecentActivityProps) {
  const activities = [
    {
      type: 'jobs_saved_today',
      count: user.jobsSavedToday,
      label: 'Jobs saved today',
      icon: <Target size={16} className="text-green-600" />,
      timeframe: 'today'
    },
    {
      type: 'jobs_saved_week',
      count: user.jobsSavedThisWeek,
      label: 'Jobs saved this week',
      icon: <Calendar size={16} className="text-blue-600" />,
      timeframe: 'this week'
    },
    {
      type: 'collections',
      count: user.activeCollections,
      label: 'Active collections',
      icon: <Building size={16} className="text-purple-600" />,
      timeframe: 'total'
    },
    {
      type: 'offers',
      count: user.jobOffers,
      label: 'Job offers received',
      icon: <Star size={16} className="text-orange-600" />,
      timeframe: 'total'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {activity.icon}
              <div>
                <div className="text-sm font-medium text-gray-900">{activity.label}</div>
                <div className="text-xs text-gray-600 capitalize">{activity.timeframe}</div>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-900">{activity.count}</div>
          </div>
        ))}
      </div>

      {user.lastActivity && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Last activity: {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }).format(user.lastActivity)}
          </div>
        </div>
      )}
    </div>
  );
}

// Quick Stats Component
interface QuickStatsProps {
  user: UserDashboardStats;
  pipeline: Record<ApplicationStatus, number>;
}

function QuickStats({ user, pipeline }: QuickStatsProps) {
  const totalApplications = Object.values(pipeline).reduce((sum, count) => sum + count, 0);
  const responseRate = totalApplications > 0 ? 
    ((pipeline.interviewing + pipeline.offered + pipeline.accepted) / totalApplications * 100) : 0;
  const conversionRate = pipeline.applied > 0 ? 
    (pipeline.offered / pipeline.applied * 100) : 0;

  const stats = [
    {
      label: 'Response Rate',
      value: `${responseRate.toFixed(1)}%`,
      description: 'Interviews + Offers / Total Applications',
      color: 'text-blue-600'
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      description: 'Offers / Applications Sent',
      color: 'text-green-600'
    },
    {
      label: 'Avg. Jobs per Collection',
      value: user.activeCollections > 0 ? 
        Math.round(user.totalSavedJobs / user.activeCollections) : 0,
      description: 'Total Saved Jobs / Active Collections',
      color: 'text-purple-600'
    },
    {
      label: 'Public Collections',
      value: user.publicCollections,
      description: 'Collections shared publicly',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h2>
      
      <div className="space-y-6">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{stat.label}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.description}</div>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Application Progress</span>
            <span className="text-gray-900">{pipeline.applied || 0} sent</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: totalApplications > 0 ? 
                  `${Math.min((pipeline.applied / totalApplications) * 100, 100)}%` : '0%'
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Success Rate</span>
            <span className="text-gray-900">{pipeline.offered || 0} offers</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: pipeline.applied > 0 ? 
                  `${Math.min((pipeline.offered / pipeline.applied) * 100, 100)}%` : '0%'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
