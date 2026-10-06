import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TimetableVersion } from '@/types/api.types';

interface VersionHistoryProps {
  versions: TimetableVersion[];
  onMakeActive: (id: string) => void;
  onDelete: (id: string) => void;
  isActivating: boolean;
  isDeleting: boolean;
  activatingId: string | null;
  deletingId: string | null;
}

export function VersionHistory({
  versions,
  onMakeActive,
  onDelete,
  isActivating,
  isDeleting,
  activatingId,
  deletingId,
}: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No timetable versions yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Exams</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-medium">{version.name}</TableCell>
                <TableCell>
                  {format(new Date(version.uploadedAt), 'dd MMM yyyy, HH:mm')}
                </TableCell>
                <TableCell>{version.rowCount}</TableCell>
                <TableCell>
                  {version.isActive ? (
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {!version.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMakeActive(version.id)}
                      disabled={isActivating && activatingId === version.id}
                    >
                      {isActivating && activatingId === version.id
                        ? 'Activating...'
                        : 'Make Active'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(version.id)}
                    disabled={
                      version.isActive ||
                      (isDeleting && deletingId === version.id)
                    }
                    title={version.isActive ? 'Active timetable cannot be deleted' : ''}
                  >
                    {isDeleting && deletingId === version.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
