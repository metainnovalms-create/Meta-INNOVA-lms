import { AcademicYear } from '@/types/calendar';
import { format, differenceInDays } from 'date-fns';

interface TimelineVisualizationProps {
  academicYear: AcademicYear;
}

export function TimelineVisualization({ academicYear }: TimelineVisualizationProps) {
  const totalDays = differenceInDays(
    new Date(academicYear.end_date),
    new Date(academicYear.start_date)
  );

  const getTermPosition = (startDate: string, endDate: string) => {
    const daysFromStart = differenceInDays(
      new Date(startDate),
      new Date(academicYear.start_date)
    );
    const termDuration = differenceInDays(new Date(endDate), new Date(startDate));

    const left = (daysFromStart / totalDays) * 100;
    const width = (termDuration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Academic Year Timeline</h3>
      <div className="relative h-16 bg-muted rounded-lg overflow-hidden">
        {academicYear.terms.map((term, index) => {
          const position = getTermPosition(term.start_date, term.end_date);
          return (
            <div
              key={term.id}
              className={`absolute top-0 h-full ${colors[index % colors.length]} opacity-70 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center text-white text-sm font-medium`}
              style={position}
              title={`${term.name}: ${format(new Date(term.start_date), 'MMM dd')} - ${format(new Date(term.end_date), 'MMM dd')}`}
            >
              {term.name}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{format(new Date(academicYear.start_date), 'MMM yyyy')}</span>
        <span>{format(new Date(academicYear.end_date), 'MMM yyyy')}</span>
      </div>
    </div>
  );
}
