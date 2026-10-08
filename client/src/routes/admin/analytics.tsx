import { createRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, formatDistanceToNow, differenceInDays } from 'date-fns';
import { Route as rootRoute } from '../__root';
import { isAuthenticated } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { getAnalytics } from '@/services/admin.service';
import { getRatingSummary } from '@/services/rating.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/admin/StatCard';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { Users, Search, FileDown, Calendar, Star } from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/analytics',
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      console.log('Not authenticated, redirecting to login from analytics');
      throw redirect({ 
        to: '/admin/login',
        search: {
          redirect: location.href,
        },
      });
    }
    console.log('Authenticated, allowing access to analytics');
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { logout } = useAuth();

  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(today);
  const [appliedFrom, setAppliedFrom] = useState(defaultFrom);
  const [appliedTo, setAppliedTo] = useState(today);

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', appliedFrom, appliedTo],
    queryFn: () => getAnalytics({ from: appliedFrom, to: appliedTo }),
  });

  // Log analytics data for debugging
  console.log('[AnalyticsPage] Analytics data:', analytics);
  console.log('[AnalyticsPage] Daily visitors:', analytics?.dailyVisitors);

  const handleApply = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  // Calculate stats with safe fallbacks
  const todayVisitors = analytics?.dailyVisitors
    ?.filter((v) => v.date === today)
    .reduce((sum, v) => sum + (v.count || 0), 0) || 0;

  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  );
  const weekVisitors = analytics?.dailyVisitors
    ?.filter((v) => last7Days.includes(v.date))
    .reduce((sum, v) => sum + (v.count || 0), 0) || 0;

  const totalVisitors = analytics?.dailyVisitors
    ?.reduce((sum, v) => sum + (v.count || 0), 0) || 0;

  const pdfDownloads = analytics?.downloadsByType
    ?.find((d) => d.type === 'DOWNLOAD_PDF')?.count || 0;

  const icsDownloads = analytics?.downloadsByType
    ?.find((d) => d.type === 'DOWNLOAD_ICS')?.count || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-lg text-red-600">Failed to load analytics</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Ensure analytics data exists with proper structure
  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {/* Admin Nav */}
      <div className="flex gap-4 mb-8 border-b pb-2">
        <Link
          to="/admin/timetables"
          className="text-sm font-medium text-muted-foreground hover:text-primary pb-2"
        >
          Timetables
        </Link>
        <Link
          to="/admin/analytics"
          className="text-sm font-medium text-primary border-b-2 border-primary pb-2"
        >
          Analytics
        </Link>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Today's Visitors"
          value={todayVisitors}
          icon={<Users />}
        />
        <StatCard
          title="This Week's Visitors"
          value={weekVisitors}
          icon={<Users />}
        />
        <StatCard
          title="Total Unique Visitors"
          value={totalVisitors}
          icon={<Users />}
        />
        <StatCard
          title="Total Searches"
          value={analytics?.totalSearches || 0}
          icon={<Search />}
        />
        <StatCard
          title="PDF Downloads"
          value={pdfDownloads}
          icon={<FileDown />}
        />
        <StatCard
          title="Calendar Downloads"
          value={icsDownloads}
          icon={<Calendar />}
        />
      </div>

      {/* Visitor Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Unique Visitors Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsChart data={analytics?.dailyVisitors || []} />
        </CardContent>
      </Card>

      {/* Top Searched Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Top Searched Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics && analytics.topQueries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topQueries.slice(0, 20).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{item.query}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No search queries recorded yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Student Feedback */}
      <StudentFeedback days={appliedTo === today ? 30 : Math.round(differenceInDays(new Date(appliedTo), new Date(appliedFrom)))} />
    </div>
  );
}

function StudentFeedback({ days }: { days: number }) {
  const { data: ratings, isLoading } = useQuery({
    queryKey: ['ratings-summary', days],
    queryFn: () => getRatingSummary(days),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Loading feedback...</p>
        </CardContent>
      </Card>
    );
  }

  if (!ratings || ratings.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No ratings yet. Students will be able to rate their experience soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render filled, half, and empty stars
  const renderStars = (average: number) => {
    const stars = [];
    const fullStars = Math.floor(average);
    const hasHalfStar = average % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <Star className="h-5 w-5 text-yellow-400" />
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 absolute top-0 left-0" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        </div>
      );
    }
    const emptyStars = 5 - Math.ceil(average);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    }
    return stars;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average rating */}
        <div className="text-center">
          <div className="text-5xl font-bold text-[#8A3FD8] mb-2">{ratings.average.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {renderStars(ratings.average)}
          </div>
          <p className="text-sm text-muted-foreground">{ratings.total} rating{ratings.total !== 1 ? 's' : ''}</p>
        </div>

        {/* Distribution bars */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map(stars => {
            const dist = ratings.distribution.find(d => d.stars === stars);
            const count = dist?.count || 0;
            const percentage = ratings.total > 0 ? (count / ratings.total) * 100 : 0;
            
            return (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm w-12">{stars} ⭐</span>
                <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm w-12 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Recent comments */}
        {ratings.recentComments.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-3">Recent Comments</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ratings.recentComments.map((comment, idx) => (
                <div key={idx} className="border dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(comment.stars)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {comment.userAgentType && (
                        <Badge variant="secondary" className="text-xs">
                          {comment.userAgentType}
                        </Badge>
                      )}
                      <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
