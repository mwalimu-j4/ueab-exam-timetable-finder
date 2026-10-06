import { createRoute, Navigate } from '@tanstack/react-router';
import { Route as rootRoute } from '../__root';
import { isAuthenticated, clearToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { uploadTimetable, getTimetables, publishTimetable, deleteTimetable, getAnalytics } from '@/services/admin.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { TimetableVersion, UploadResponse } from '@/types/api.types';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: AdminDashboard,
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw new Error('Not authenticated');
    }
  },
  errorComponent: () => <Navigate to="/admin/login" />,
});

function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upload');
  
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);

  const [analyticsFrom, setAnalyticsFrom] = useState('');
  const [analyticsTo, setAnalyticsTo] = useState('');

  const { data: versions } = useQuery({
    queryKey: ['timetables'],
    queryFn: getTimetables,
    enabled: activeTab === 'versions',
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics', analyticsFrom, analyticsTo],
    queryFn: () => getAnalytics(analyticsFrom || analyticsTo ? { from: analyticsFrom, to: analyticsTo } : undefined),
    enabled: activeTab === 'analytics',
  });

  const publishMutation = useMutation({
    mutationFn: publishTimetable,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Timetable published successfully' });
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to publish timetable', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimetable,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Timetable deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete timetable', variant: 'destructive' });
    },
  });

  const handleLogout = () => {
    clearToken();
    window.location.href = '/admin/login';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({ title: 'Error', description: 'Only PDF files are allowed', variant: 'destructive' });
        return;
      }
      if (selectedFile.size > 15 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 15MB', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      toast({ title: 'Error', description: 'Please select a file and enter a name', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const result = await uploadTimetable(file, name, setUploadProgress);
      setUploadResult(result);
      toast({ title: 'Success', description: `Uploaded ${result.rowCount} exams successfully` });
      setFile(null);
      setName('');
      const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to upload timetable',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const confirmDelete = (id: string) => {
    setVersionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (versionToDelete) {
      deleteMutation.mutate(versionToDelete);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload">Upload Timetable</TabsTrigger>
          <TabsTrigger value="versions">Manage Versions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Timetable</CardTitle>
              <CardDescription>Upload a PDF timetable file to parse and add to the database</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Timetable Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., January 2024 Exams"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdf-file">PDF File (Max 15MB)</Label>
                  <Input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">Uploading: {uploadProgress}%</p>
                  </div>
                )}

                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload & Parse'}
                </Button>
              </form>

              {uploadResult && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold mb-2">Upload Summary</h3>
                    <p className="text-sm">Version ID: {uploadResult.versionId}</p>
                    <p className="text-sm">Total Rows Parsed: {uploadResult.rowCount}</p>
                    {uploadResult.unparsedLines.length > 0 && (
                      <p className="text-sm text-yellow-600">Unparsed Lines: {uploadResult.unparsedLines.length}</p>
                    )}
                  </div>

                  {uploadResult.sampleRows.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Sample Rows (First 20)</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Code</TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead>Instructor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadResult.sampleRows.map((exam, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{format(new Date(exam.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{exam.code}</TableCell>
                                <TableCell>{exam.title}</TableCell>
                                <TableCell>{exam.instructor}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {uploadResult.unparsedLines.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-yellow-600">Unparsed Lines</h3>
                      <div className="p-4 border rounded-lg bg-yellow-50 max-h-64 overflow-y-auto">
                        {uploadResult.unparsedLines.map((line, idx) => (
                          <p key={idx} className="text-sm font-mono">{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle>Timetable Versions</CardTitle>
              <CardDescription>Manage uploaded timetable versions</CardDescription>
            </CardHeader>
            <CardContent>
              {versions && versions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Row Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version: TimetableVersion) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">{version.name}</TableCell>
                        <TableCell>{version.rowCount}</TableCell>
                        <TableCell>
                          {version.isActive ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(version.uploadedAt), 'PPpp')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => publishMutation.mutate(version.id)}
                              disabled={version.isActive || publishMutation.isPending}
                            >
                              Publish
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => confirmDelete(version.id)}
                              disabled={version.isActive || deleteMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No timetable versions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View usage statistics and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from">From Date</Label>
                  <Input
                    id="from"
                    type="date"
                    value={analyticsFrom}
                    onChange={(e) => setAnalyticsFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">To Date</Label>
                  <Input
                    id="to"
                    type="date"
                    value={analyticsTo}
                    onChange={(e) => setAnalyticsTo(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={() => refetchAnalytics()}>Refresh Analytics</Button>

              {analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Searches</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold">{analytics.totalSearches}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Unique Visitors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold">
                          {analytics.dailyVisitors.reduce((sum, day) => sum + day.count, 0)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Daily Visitors</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Visitors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.dailyVisitors.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell>{day.date}</TableCell>
                            <TableCell>{day.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Downloads by Type</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.downloadsByType.map((download) => (
                          <TableRow key={download.type}>
                            <TableCell>{download.type}</TableCell>
                            <TableCell>{download.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Top 20 Searched Queries</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead>Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.topQueries.map((query, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{query.query}</TableCell>
                            <TableCell>{query.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this timetable version? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
