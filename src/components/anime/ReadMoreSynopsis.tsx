
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ReadMoreSynopsisProps {
  text: string;
  maxLength?: number;
}

const ReadMoreSynopsis: React.FC<ReadMoreSynopsisProps> = ({ text, maxLength = 250 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line selection:bg-primary/20 selection:text-primary">{text}</p>;
  }

  return (
    <div>
      <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line selection:bg-primary/20 selection:text-primary">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </p>
      <Button variant="link" onClick={() => setIsExpanded(!isExpanded)} className="px-0 text-primary hover:text-primary/80 text-sm mt-1">
        {isExpanded ? 'Read Less' : 'Read More'}
      </Button>
    </div>
  );
};

export default ReadMoreSynopsis;
