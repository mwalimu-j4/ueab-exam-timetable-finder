import { createRoute, Link, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Route as rootRoute } from '../__root';
import { isAuthenticated } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import {
  uploadTimetable,
  getTimetables,
  publishTimetable,
  deleteTimetable,
} from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UploadZone } from '@/components/admin/UploadZone';
import { TimetablePreview } from '@/components/admin/TimetablePreview';
import { VersionHistory } from '@/components/admin/VersionHistory';
import type { UploadResponse } from '@/types/api.types';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/timetables',
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/admin/login' });
    }
  },
  component: TimetablesPage,
});

function TimetablesPage() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const [isActivating, setIsActivating] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);

  const { data: versions = [] } = useQuery({
    queryKey: ['timetables'],
    queryFn: getTimetables,
  });

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !name.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a name and select a file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadTimetable(selectedFile, name, (progress) => {
        setUploadProgress(progress);
      });
      setUploadResult(result);
      toast({
        title: 'Upload successful',
        description: `Parsed ${result.rowCount} exams`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to upload timetable',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePublish = async () => {
    if (!uploadResult) return;

    setIsPublishing(true);
    try {
      await publishTimetable(uploadResult.versionId);
      toast({
        title: 'Timetable published',
        description: 'The timetable is now live for students',
      });
      setUploadResult(null);
      setSelectedFile(null);
      setName('');
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
    } catch (error: any) {
      toast({
        title: 'Publish failed',
        description: error.response?.data?.message || 'Failed to publish timetable',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscard = async () => {
    if (!uploadResult) return;

    setIsDiscarding(true);
    try {
      await deleteTimetable(uploadResult.versionId);
      toast({
        title: 'Upload discarded',
        description: 'The uploaded timetable has been removed',
      });
      setUploadResult(null);
      setSelectedFile(null);
      setName('');
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
    } catch (error: any) {
      toast({
        title: 'Discard failed',
        description: error.response?.data?.message || 'Failed to discard timetable',
        variant: 'destructive',
      });
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleMakeActive = async (id: string) => {
    setIsActivating(true);
    setActivatingId(id);
    try {
      await publishTimetable(id);
      toast({
        title: 'Timetable activated',
        description: 'This version is now live for students',
      });
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
    } catch (error: any) {
      toast({
        title: 'Activation failed',
        description: error.response?.data?.message || 'Failed to activate timetable',
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
      setActivatingId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setVersionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!versionToDelete) return;

    setIsDeleting(true);
    setDeletingId(versionToDelete);
    try {
      await deleteTimetable(versionToDelete);
      toast({
        title: 'Timetable deleted',
        description: 'The timetable version has been removed',
      });
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
    } catch (error: any) {
      toast({
        title: 'Deletion failed',
        description: error.response?.data?.message || 'Failed to delete timetable',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Timetable Management</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {/* Admin Nav */}
      <div className="flex gap-4 mb-8 border-b pb-2">
        <Link
          to="/admin/timetables"
          className="text-sm font-medium text-primary border-b-2 border-primary pb-2"
        >
          Timetables
        </Link>
        <Link
          to="/admin/analytics"
          className="text-sm font-medium text-muted-foreground hover:text-primary pb-2"
        >
          Analytics
        </Link>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload New Timetable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Timetable Name</Label>
            <Input
              id="name"
              placeholder="e.g., December 2024 Exams"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUploading || !!uploadResult}
            />
          </div>

          <UploadZone
            onFileAccepted={handleFileAccepted}
            disabled={isUploading || !!uploadResult}
          />

          {!uploadResult && (
            <>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !name.trim() || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>

              {isUploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600">{uploadProgress}%</p>
                </div>
              )}
            </>
          )}

          {uploadResult && (
            <TimetablePreview
              result={uploadResult}
              onPublish={handlePublish}
              onDiscard={handleDiscard}
              isPublishing={isPublishing}
              isDiscarding={isDiscarding}
            />
          )}
        </CardContent>
      </Card>

      {/* Version History */}
      <VersionHistory
        versions={versions}
        onMakeActive={handleMakeActive}
        onDelete={handleDeleteClick}
        isActivating={isActivating}
        isDeleting={isDeleting}
        activatingId={activatingId}
        deletingId={deletingId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this timetable version? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
