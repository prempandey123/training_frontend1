import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import './trainingCalendar.css';

export default function TrainingCalendar() {
  const events = [
    {
      title: 'Safety Induction',
      start: '2025-12-20',
      extendedProps: {
        department: 'Production',
        trainer: 'Mr. Sharma',
      },
    },
    {
      title: 'HRS Operation',
      start: '2025-12-22',
      extendedProps: {
        department: 'HRS & Pickling',
        trainer: 'Mr. Verma',
      },
    },
    {
      title: 'Quality Awareness',
      start: '2025-12-25',
      extendedProps: {
        department: 'Quality',
        trainer: 'Mr. Singh',
      },
    },
  ];

  return (
    <div className="calendar-page">
      <h2>Training Calendar</h2>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={(info) => {
          alert(
            `Training: ${info.event.title}
Department: ${info.event.extendedProps.department}
Trainer: ${info.event.extendedProps.trainer}`
          );
        }}
        height="auto"
      />
    </div>
  );
}
