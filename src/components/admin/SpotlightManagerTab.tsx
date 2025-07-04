
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Presentation, Construction } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SpotlightManagerTab() {
  return (
    <Card className="shadow-lg border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-primary flex items-center">
          <Presentation className="w-6 h-6 mr-2" /> Spotlight Manager
        </CardTitle>
        <CardDescription>Manage the anime featured in the homepage spotlight slider.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
            <Construction className="h-4 w-4" />
            <AlertTitle>Under Construction!</AlertTitle>
            <AlertDescription>
                This feature is coming soon. You'll be able to add, remove, and reorder up to 8 spotlight slides directly from this panel.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
