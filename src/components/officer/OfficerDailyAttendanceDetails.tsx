import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MapPin, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getOfficerAttendanceRecord } from '@/data/mockOfficerAttendance';
import { getOfficerById } from '@/data/mockOfficerData';
import { exportToCSV } from '@/utils/attendanceHelpers';

interface OfficerDailyAttendanceDetailsProps {
  officerId: string;
  officerName: string;
  month: string;
}

export function OfficerDailyAttendanceDetails({
  officerId,
  officerName,
  month,
}: OfficerDailyAttendanceDetailsProps) {
  const attendanceRecord = useMemo(() => {
    return getOfficerAttendanceRecord(officerId, month);
  }, [officerId, month]);

  const officerProfile = useMemo(() => {
    return getOfficerById(officerId);
  }, [officerId]);

  const dailyAttendanceDetails = useMemo(() => {
    if (!attendanceRecord) return [];
    
    const [currentYear, currentMonthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(currentYear, currentMonthNum, 0).getDate();
    const today = new Date();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = `${month}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(currentYear, currentMonthNum - 1, day);
      const isFutureDate = dayDate > today;
      
      const record = attendanceRecord.daily_records.find((r: any) => r.date === date);
      
      if (isFutureDate) {
        return {
          date,
          displayDate: format(dayDate, 'EEE, MMM dd'),
          status: 'future',
          checkInTime: '-',
          checkOutTime: '-',
          checkInLocation: null,
          checkOutLocation: null,
          locationValidated: null,
          totalHours: '-',
          overtime: '-',
        };
      }
      
      if (!record) {
        return {
          date,
          displayDate: format(dayDate, 'EEE, MMM dd'),
          status: 'not_marked',
          checkInTime: '-',
          checkOutTime: '-',
          checkInLocation: null,
          checkOutLocation: null,
          locationValidated: null,
          totalHours: '-',
          overtime: '-',
        };
      }
      
      const normalHours = officerProfile?.normal_working_hours || 8;
      const totalHours = record.hours_worked || 0;
      const overtime = Math.max(0, totalHours - normalHours);
      
      return {
        date,
        displayDate: format(dayDate, 'EEE, MMM dd'),
        status: record.status,
        checkInTime: record.check_in_time || '-',
        checkOutTime: record.check_out_time || '-',
        checkInLocation: record.check_in_location,
        checkOutLocation: record.check_out_location,
        locationValidated: record.location_validated,
        totalHours: record.hours_worked ? `${record.hours_worked.toFixed(1)} hrs` : '-',
        overtime: overtime > 0 ? `${overtime.toFixed(1)} hrs` : '-',
      };
    });
  }, [attendanceRecord, month, officerProfile]);

  const renderGPSLink = (location: { latitude: number; longitude: number; address?: string } | null) => {
    if (!location) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    const { latitude, longitude, address } = location;
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const coordinateDisplay = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
    return (
      <a 
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center gap-1"
        title={address || coordinateDisplay}
      >
        <MapPin className="h-3 w-3" />
        <span className="font-mono text-xs">{coordinateDisplay}</span>
      </a>
    );
  };

  const getValidationBadge = (validated: boolean | null, status: string) => {
    if (validated === null || status === 'future' || status === 'not_marked' || status === 'absent' || status === 'leave') {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">N/A</Badge>;
    }
    
    if (validated === true) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">✓ Verified</Badge>;
    }
    
    return <Badge className="bg-red-100 text-red-800 border-red-300">✗ Invalid</Badge>;
  };

  const getAttendanceStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Present', className: 'bg-green-100 text-green-800 border-green-300' },
      absent: { label: 'Absent', className: 'bg-red-100 text-red-800 border-red-300' },
      leave: { label: 'Leave', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      not_marked: { label: 'Not Marked', className: 'bg-gray-100 text-gray-600 border-gray-300' },
      future: { label: 'Future', className: 'bg-blue-100 text-blue-600 border-blue-300' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_marked;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleExport = () => {
    const exportData = dailyAttendanceDetails.map(day => {
      const checkInCoords = day.checkInLocation 
        ? `${day.checkInLocation.latitude}, ${day.checkInLocation.longitude}`
        : '-';
      const checkOutCoords = day.checkOutLocation 
        ? `${day.checkOutLocation.latitude}, ${day.checkOutLocation.longitude}`
        : '-';
      const validation = day.locationValidated === null 
        ? 'N/A' 
        : day.locationValidated 
          ? 'Verified' 
          : 'Invalid';
      
      return {
        Date: day.displayDate,
        Status: day.status.replace('_', ' ').toUpperCase(),
        'Check-in Time': day.checkInTime,
        'Check-out Time': day.checkOutTime,
        'Check-in GPS': checkInCoords,
        'Check-out GPS': checkOutCoords,
        'Location Validated': validation,
        'Total Hours': day.totalHours,
        'Overtime Hours': day.overtime,
      };
    });
    
    const filename = `${officerName.replace(/\s+/g, '_')}_Daily_Attendance_${month}.csv`;
    exportToCSV(exportData, filename);
    toast.success('Daily attendance details exported successfully');
  };

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Daily Attendance Details</CardTitle>
              <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Complete daily breakdown with GPS location tracking
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
              
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[90px]">Check-in</TableHead>
                      <TableHead className="min-w-[90px]">Check-out</TableHead>
                      <TableHead className="min-w-[180px]">Check-in Location</TableHead>
                      <TableHead className="min-w-[180px]">Check-out Location</TableHead>
                      <TableHead className="min-w-[100px]">Validated</TableHead>
                      <TableHead className="min-w-[90px]">Total Hours</TableHead>
                      <TableHead className="min-w-[90px]">Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyAttendanceDetails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No attendance data available for this month
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyAttendanceDetails.map((day) => (
                        <TableRow key={day.date}>
                          <TableCell className="font-medium">{day.displayDate}</TableCell>
                          <TableCell>{getAttendanceStatusBadge(day.status)}</TableCell>
                          <TableCell className="text-sm">{day.checkInTime}</TableCell>
                          <TableCell className="text-sm">{day.checkOutTime}</TableCell>
                          <TableCell>{renderGPSLink(day.checkInLocation)}</TableCell>
                          <TableCell>{renderGPSLink(day.checkOutLocation)}</TableCell>
                          <TableCell>{getValidationBadge(day.locationValidated, day.status)}</TableCell>
                          <TableCell className="text-sm">{day.totalHours}</TableCell>
                          <TableCell>
                            {day.overtime !== '-' && day.overtime !== '0.0 hrs' ? (
                              <span className="text-orange-600 font-semibold text-sm">{day.overtime}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">{day.overtime}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
