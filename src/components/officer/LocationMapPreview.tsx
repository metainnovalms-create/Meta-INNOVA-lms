/**
 * Visual Location Map Preview Component
 * Shows officer's location relative to institution with radius indicator
 */

import { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LocationMapPreviewProps {
  institutionLatitude: number;
  institutionLongitude: number;
  institutionName: string;
  allowedRadius: number; // in meters
  officerLatitude?: number;
  officerLongitude?: number;
  officerDistance?: number; // in meters
  isValidated?: boolean;
  showOfficerLocation?: boolean;
}

export function LocationMapPreview({
  institutionLatitude,
  institutionLongitude,
  institutionName,
  allowedRadius,
  officerLatitude,
  officerLongitude,
  officerDistance,
  isValidated,
  showOfficerLocation = true,
}: LocationMapPreviewProps) {
  const [mapError, setMapError] = useState(false);

  // Calculate relative position for SVG visualization
  const calculateRelativePosition = () => {
    if (!officerLatitude || !officerLongitude || !officerDistance) {
      return { x: 50, y: 50, withinRadius: false };
    }

    // Calculate bearing and relative position
    const latDiff = officerLatitude - institutionLatitude;
    const lonDiff = officerLongitude - institutionLongitude;
    
    // Normalize to SVG coordinates (0-100)
    // Scale based on distance - max display is 2x the allowed radius
    const maxDisplayRadius = allowedRadius * 2;
    const scale = 40 / maxDisplayRadius; // 40 is the visual radius in SVG units
    
    const relX = 50 + (lonDiff * 111320 * Math.cos(institutionLatitude * Math.PI / 180) * scale);
    const relY = 50 - (latDiff * 110540 * scale);
    
    // Clamp to viewbox
    const clampedX = Math.max(5, Math.min(95, relX));
    const clampedY = Math.max(5, Math.min(95, relY));
    
    return {
      x: clampedX,
      y: clampedY,
      withinRadius: officerDistance <= allowedRadius,
    };
  };

  const position = calculateRelativePosition();

  const openInGoogleMaps = () => {
    const url = officerLatitude && officerLongitude
      ? `https://www.google.com/maps/dir/${officerLatitude},${officerLongitude}/${institutionLatitude},${institutionLongitude}`
      : `https://www.google.com/maps?q=${institutionLatitude},${institutionLongitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      {/* SVG Map Visualization */}
      <div className="relative bg-muted/30 rounded-lg p-2 border">
        <svg viewBox="0 0 100 100" className="w-full h-32">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/20" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Allowed radius circle */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            className="text-primary/30"
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="currentColor"
            className="text-primary/5"
          />
          
          {/* Radius label */}
          <text x="50" y="88" textAnchor="middle" className="text-[3px] fill-muted-foreground">
            {allowedRadius}m radius
          </text>
          
          {/* Institution marker (center) */}
          <g transform="translate(50, 50)">
            <circle r="4" fill="currentColor" className="text-primary" />
            <circle r="6" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/50" />
            <circle r="2" fill="white" />
          </g>
          
          {/* Officer location marker */}
          {showOfficerLocation && officerLatitude && officerLongitude && (
            <g transform={`translate(${position.x}, ${position.y})`}>
              {/* Connection line */}
              <line
                x1="0"
                y1="0"
                x2={50 - position.x}
                y2={50 - position.y}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="1,1"
                className={cn(
                  position.withinRadius ? "text-green-500" : "text-destructive"
                )}
              />
              
              {/* Officer marker */}
              <circle
                r="3"
                fill="currentColor"
                className={cn(
                  position.withinRadius ? "text-green-500" : "text-destructive"
                )}
              />
              <circle r="1.5" fill="white" />
              
              {/* Pulsing effect */}
              <circle
                r="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className={cn(
                  "animate-ping",
                  position.withinRadius ? "text-green-500/50" : "text-destructive/50"
                )}
              />
            </g>
          )}
        </svg>
        
        {/* Legend */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Institution</span>
          </div>
          {showOfficerLocation && officerLatitude && (
            <div className="flex items-center gap-1 text-xs">
              <div className={cn(
                "w-2 h-2 rounded-full",
                position.withinRadius ? "bg-green-500" : "bg-destructive"
              )} />
              <span className="text-muted-foreground">Your Location</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Location Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{institutionName}</span>
          </div>
          {officerDistance !== undefined && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Distance: <span className="font-medium">{Math.round(officerDistance)}m</span>
              </span>
              {isValidated !== undefined && (
                <Badge 
                  variant={isValidated ? "default" : "destructive"} 
                  className={cn("text-xs", isValidated && "bg-green-500")}
                >
                  {isValidated ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" />Verified</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" />Outside Range</>
                  )}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={openInGoogleMaps}>
          <Navigation className="h-4 w-4 mr-1" />
          Maps
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
