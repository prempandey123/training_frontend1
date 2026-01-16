import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import api from '../../api/api';
import './trainingCalendar.css';

export default function TrainingCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr('');

      try {
        // Backend: GET /trainings/calendar  (tumhare backend me hai)
        const res = await api.get('/trainings/calendar');
        const list = Array.isArray(res?.data) ? res.data : [];

        // FullCalendar expects: [{ title, start, end?, extendedProps? }]
        // Backend already calendar-friendly shape de raha hai
        const normalized = list
          .filter((e) => e && typeof e === 'object' && e.title && e.start)
          .map((e) => ({
            id: String(e.id ?? ''),
            title: String(e.title ?? ''),
            start: e.start, // "YYYY-MM-DD" OR "YYYY-MM-DDTHH:mm:00"
            end: e.end || undefined,
            extendedProps: e.extendedProps || {},
          }));

        if (alive) setEvents(normalized);
      } catch (e) {
        console.error('Failed to load calendar events', e?.response?.status, e?.response?.data);
        if (alive) {
          setErr('Calendar data load nahi hua. Backend/URL check karo.');
          setEvents([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const headerToolbar = useMemo(
    () => ({
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    }),
    []
  );

  return (
    <div className="calendar-page">
      <h2>Training Calendar</h2>

      {loading && <div className="calendar-note">Loading...</div>}
      {!!err && <div className="calendar-error">{err}</div>}

      {/* IMPORTANT: plugins array me actual plugin functions hi do */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={headerToolbar}
        events={events}
        dateClick={(info) => {
          // When user clicks on an empty date cell, open Create Training page
          // and prefill trainingDate with the clicked date.
          const dateStr = info?.dateStr; // YYYY-MM-DD
          if (!dateStr) return;
          navigate(`/training/add?date=${encodeURIComponent(dateStr)}`);
        }}
        eventClick={(info) => {
          const p = info?.event?.extendedProps || {};
          alert(
            `Training: ${info.event.title}
Department: ${p.department || '-'}
Trainer: ${p.trainer || '-'}
Status: ${p.status || '-'}
Time: ${p.time || '-'}`
          );
        }}
        height="auto"
      />
    </div>
  );
}
