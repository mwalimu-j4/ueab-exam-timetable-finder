import { createRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Route as rootRoute } from '../__root';
import { isAuthenticated } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { getAnalytics } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, Search, FileDown, Calendar } from 'lucide-react';

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
    </div>
  );
}
