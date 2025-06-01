
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAllReports, deleteReport } from '@/services/reportService';
import type { Report } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Trash2, ExternalLink, RefreshCw, MessageSquareWarning, UserCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedReports = await getAllReports();
      setReports(fetchedReports);
    } catch (err) {
      console.error('Failed to fetch reports list:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not load reports.';
      setError(`Failed to load reports. ${errorMessage}`);
      toast({ variant: 'destructive', title: 'Fetch Error', description: `Could not load reports list. ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      toast({ title: 'Report Deleted', description: `Report ID ${reportId} has been successfully deleted.` });
    } catch (err) {
      console.error('Failed to delete report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not delete report.';
      toast({ variant: 'destructive', title: 'Delete Error', description: `Could not delete report. ${errorMessage}` });
    }
  };

  const formatReportTimestamp = (timestamp: string | Date | undefined) => {
    if (!timestamp) return 'N/A';
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <MessageSquareWarning className="w-6 h-6 mr-2" /> User Reported Issues
        </CardTitle>
        <CardDescription>View and manage issues reported by users. Resolve or delete reports as needed.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center">
          <Button onClick={fetchReports} variant="outline" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Reports
          </Button>
        </div>

        {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
        
        {error && !isLoading && (
          <div className="text-center py-10 text-destructive bg-destructive/5 p-6 rounded-lg">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && reports.length === 0 && (
          <p className="text-center py-10 text-muted-foreground text-lg">
            No reports found. All clear for now!
          </p>
        )}

        {!isLoading && !error && reports.length > 0 && (
          <ScrollArea className="h-[calc(100vh-20rem)] lg:h-[calc(100vh-18rem)] border border-border/30 rounded-lg shadow-inner">
            <div className="space-y-4 p-3 sm:p-4">
              {reports.map(report => (
                <Card key={report.id} className="bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="p-3 sm:p-4 pb-2">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div>
                            <CardTitle className="text-base font-semibold text-foreground mb-0.5">
                                Report ID: <span className="text-primary">{report.id.substring(0,8)}...</span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Reported: {formatReportTimestamp(report.createdAt as string)}
                            </CardDescription>
                        </div>
                        <Badge variant={report.status === 'open' ? 'destructive' : report.status === 'resolved' ? 'default' : 'secondary'} className="capitalize text-xs h-fit mt-1 sm:mt-0">
                            {report.status}
                        </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-1 text-sm space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <p><strong className="text-muted-foreground">User:</strong> {report.userEmail || report.userId || <span className="italic">Anonymous</span>}</p>
                        <p><strong className="text-muted-foreground">Type:</strong> <Badge variant="outline">{report.issueType}</Badge></p>
                        <p className="md:col-span-2"><strong className="text-muted-foreground">Anime:</strong> {report.animeTitle || 'N/A'} (ID: {report.animeId})</p>
                        <p><strong className="text-muted-foreground">Episode:</strong> {report.episodeTitle || 'N/A'} (ID: {report.episodeId || 'N/A'})</p>
                        <p><strong className="text-muted-foreground">Source:</strong> {report.sourceLabel || 'N/A'}</p>
                    </p>
                    </div>
                     <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="line-clamp-2"><strong className="text-muted-foreground">Description:</strong> {report.description}</p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-popover text-popover-foreground p-2 border rounded-md shadow-lg" side="bottom" align="start">
                                <p className="text-xs whitespace-pre-wrap">{report.description}</p>
                            </TooltipContent>
                        </Tooltip>
                     </TooltipProvider>
                    {report.sourceUrl && (
                        <p className="text-xs truncate">
                        <strong className="text-muted-foreground">URL:</strong> 
                        <Link href={report.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                            {report.sourceUrl} <ExternalLink size={10} className="inline -mt-0.5"/>
                        </Link>
                        </p>
                    )}
                    <div className="pt-2 flex justify-end items-center gap-2">
                       {/* Future actions like "Mark as Resolved" can go here */}
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="xs" className="text-xs h-7 px-2">
                                <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Delete Report</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this report (ID: {report.id})? This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleDeleteReport(report.id)}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Delete Report
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

