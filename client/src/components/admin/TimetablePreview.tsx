import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
import type { UploadResponse } from '@/types/api.types';

interface TimetablePreviewProps {
  result: UploadResponse;
  onPublish: () => void;
  onDiscard: () => void;
  isPublishing: boolean;
  isDiscarding: boolean;
}

export function TimetablePreview({
  result,
  onPublish,
  onDiscard,
  isPublishing,
  isDiscarding,
}: TimetablePreviewProps) {
  const [showUnparsed, setShowUnparsed] = useState(false);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-2">
        <Badge variant="default" className="bg-green-600">
          Parsed {result.rowCount} exams
        </Badge>
        {result.unparsedLines.length > 0 && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            {result.unparsedLines.length} unparsed lines
          </Badge>
        )}
      </div>

      {/* Sample rows table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Option</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Venue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.sampleRows.map((exam, idx) => (
              <TableRow key={idx}>
                <TableCell>{format(new Date(exam.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {exam.start} – {exam.end}
                </TableCell>
                <TableCell className="font-mono">{exam.code}</TableCell>
                <TableCell>{exam.title}</TableCell>
                <TableCell>{exam.option || '-'}</TableCell>
                <TableCell>{exam.instructor}</TableCell>
                <TableCell>
                  {exam.building} {exam.venue}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Unparsed lines */}
      {result.unparsedLines.length > 0 && (
        <div className="border rounded-lg p-4">
          <button
            onClick={() => setShowUnparsed(!showUnparsed)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {showUnparsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Unparsed Lines ({result.unparsedLines.length})
          </button>
          {showUnparsed && (
            <div className="mt-3 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded">
              {result.unparsedLines.map((line, idx) => (
                <div key={idx} className="font-mono text-xs text-gray-600 mb-1">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onPublish} disabled={isPublishing || isDiscarding}>
          {isPublishing ? 'Publishing...' : 'Publish'}
        </Button>
        <Button
          variant="destructive"
          onClick={onDiscard}
          disabled={isPublishing || isDiscarding}
        >
          {isDiscarding ? 'Discarding...' : 'Discard'}
        </Button>
      </div>
    </div>
  );
}
