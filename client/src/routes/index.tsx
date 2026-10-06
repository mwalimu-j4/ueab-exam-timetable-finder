import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Download, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { searchExams } from '@/services/exam.service';
import { recordVisit, recordEvent } from '@/services/tracking.service';
import { getVisitorId } from '@/lib/visitor';
import { useToast } from '@/components/ui/use-toast';
import type { Exam } from '@/types/api.types';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Index,
});

function Index() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState<Date>();
  const [building, setBuilding] = useState('');
  const [session, setSession] = useState('');
  const [results, setResults] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const visitorId = getVisitorId();
    recordVisit(visitorId).catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params: any = {};
      if (query) params.q = query;
      if (date) params.date = format(date, 'yyyy-MM-dd');
      if (building) params.building = building;
      if (session) params.session = session;

      const exams = await searchExams(params);
      setResults(exams);

      await recordEvent({ type: 'SEARCH', query: query || undefined });

      if (exams.length === 0) {
        toast({
          title: 'No results found',
          description: 'Try adjusting your search criteria',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search exams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadICS = async (exam: Exam) => {
    await recordEvent({ type: 'DOWNLOAD_ICS', query: exam.code });
    toast({
      title: 'ICS Download',
      description: 'Calendar event feature coming soon',
    });
  };

  const handleAddCourse = async (exam: Exam) => {
    await recordEvent({ type: 'ADD_COURSE', query: exam.code });
    toast({
      title: 'Course Added',
      description: `${exam.code} has been added to your list`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Search Exam Timetable</CardTitle>
          <CardDescription>Find your exam schedule by course code, title, instructor, or date</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="query">Course Code or Title</Label>
                <Input
                  id="query"
                  placeholder="e.g., CS101 or Computer Science"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Exam Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Input
                  id="building"
                  placeholder="e.g., Main Block"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session">Session/Option</Label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger id="session">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sessions</SelectItem>
                    <SelectItem value="Main">Main</SelectItem>
                    <SelectItem value="Group A">Group A</SelectItem>
                    <SelectItem value="Group B">Group B</SelectItem>
                    <SelectItem value="Group C">Group C</SelectItem>
                    <SelectItem value="Group D">Group D</SelectItem>
                    <SelectItem value="Inter Session 1">Inter Session 1</SelectItem>
                    <SelectItem value="Inter Session 2">Inter Session 2</SelectItem>
                    <SelectItem value="Blended Online">Blended Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Option</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>{format(new Date(exam.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{exam.dayName}</TableCell>
                        <TableCell>{exam.start} - {exam.end}</TableCell>
                        <TableCell className="font-medium">{exam.code}</TableCell>
                        <TableCell>{exam.title}</TableCell>
                        <TableCell>
                          {exam.option && <Badge variant="secondary">{exam.option}</Badge>}
                        </TableCell>
                        <TableCell>{exam.instructor}</TableCell>
                        <TableCell>{exam.building} - {exam.venue}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadICS(exam)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddCourse(exam)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No exams found matching your criteria
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
