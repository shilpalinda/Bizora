import { useEffect, useState } from 'react';
import { CalendarDays, Inbox, Pencil, Search, ShieldAlert, Trash2, X } from 'lucide-react';

export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Half Day', 'Leave', 'Week Off'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SUMMARY_KEYS = ['Present', 'Absent', 'Leave', 'Half Day', 'Week Off', 'Not marked'];
const NOTE_SUGGESTIONS = ['Weekly off', 'Rotational off', 'Special week off', 'Approved by Admin'];
const STATUS_META = {
  Present: { code: 'P', cls: 'present' },
  Absent: { code: 'A', cls: 'absent' },
  'Half Day': { code: 'HD', cls: 'halfday' },
  Leave: { code: 'L', cls: 'leave' },
  'Week Off': { code: 'OFF', cls: 'weekoff' }
};

const pad = (value) => String(value).padStart(2, '0');
const parseISO = (iso) => { const [year, month, day] = iso.split('-').map(Number); return new Date(year, month - 1, day); };
const toISO = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const addDays = (iso, days) => { const date = parseISO(iso); date.setDate(date.getDate() + days); return toISO(date); };
const addMonths = (iso, months) => { const date = parseISO(iso); date.setDate(1); date.setMonth(date.getMonth() + months); return toISO(date); };
const weekStart = (iso) => addDays(iso, -((parseISO(iso).getDay() + 6) % 7));
const monthDates = (iso) => {
  const date = parseISO(iso);
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => toISO(new Date(date.getFullYear(), date.getMonth(), index + 1)));
};
const shortDate = (iso) => { const date = parseISO(iso); return `${pad(date.getDate())}-${MONTH_SHORT[date.getMonth()]}`; };
const longDate = (iso) => parseISO(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const formatTime = (time) => { if (!time) return '—'; const [hours, minutes] = time.split(':').map(Number); return `${hours % 12 || 12}:${pad(minutes)} ${hours < 12 ? 'AM' : 'PM'}`; };
const workedMinutes = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const [inHours, inMinutes] = checkIn.split(':').map(Number);
  const [outHours, outMinutes] = checkOut.split(':').map(Number);
  const minutes = outHours * 60 + outMinutes - (inHours * 60 + inMinutes);
  return minutes > 0 ? minutes : null;
};
const formatHours = (minutes) => minutes == null ? '—' : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;
const usesTimes = (status) => status === 'Present' || status === 'Half Day';

// Older attendance stored a bare status string per staff per day.
const normalizeRecord = (raw) => !raw ? null : typeof raw === 'string' ? { status: raw } : raw;
// An explicit record for the date always wins over the staff member's weekly-off schedule.
export const resolveAttendance = (attendance, member, iso) => {
  const record = normalizeRecord(attendance[iso]?.[member.id]);
  const scheduledOff = (member.weekOffs || []).includes(parseISO(iso).getDay());
  if (record) return { ...record, scheduledOff, source: 'manual' };
  return scheduledOff ? { status: 'Week Off', scheduledOff, source: 'scheduled' } : { status: null, scheduledOff, source: 'none' };
};
const countStatuses = (attendance, staff, dates) => dates.reduce((counts, iso) => {
  staff.forEach((member) => { counts[resolveAttendance(attendance, member, iso).status || 'Not marked'] += 1; });
  return counts;
}, Object.fromEntries(SUMMARY_KEYS.map((key) => [key, 0])));

function StatusBadge({ entry, compact = false }) {
  if (!entry.status) return <span className="at-badge at-none" title="Not marked">{compact ? '·' : 'Not marked'}</span>;
  const meta = STATUS_META[entry.status];
  const title = `${entry.status}${entry.source === 'scheduled' ? ' — scheduled weekly off' : ''}${entry.overrideWeekOff ? ' — worked on scheduled week off' : ''}`;
  const label = compact ? meta.code : entry.status === 'Week Off' ? 'OFF' : entry.status;
  return <span className={`at-badge at-${meta.cls} ${entry.source === 'scheduled' ? 'is-scheduled' : ''} ${entry.overrideWeekOff ? 'is-override' : ''}`} title={title}>{label}</span>;
}

function EmptyState({ title, text }) {
  return <div className="rx-empty"><span className="rx-empty-icon"><Inbox size={20} strokeWidth={1.6} aria-hidden="true" /></span><strong>{title}</strong><p>{text}</p></div>;
}

export default function StaffAttendance({ staffList, attendance, today, isAdmin, userLabel, onSaveRecord, onUpdateWeekOffs, notify }) {
  const view = 'daily';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    if (!editor && !pendingDelete) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (pendingDelete) setPendingDelete(null);
      else setEditor(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor, pendingDelete]);

  const query = search.trim().toLowerCase();
  const visibleStaff = staffList.filter((member) => !query || [member.name, member.role].some((value) => String(value || '').toLowerCase().includes(query)));
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart(today), index));
  const rangeDates = [today];
  // Weekly/monthly totals stop at the working date so future days are not reported as "Not marked".
  const countedDates = view === 'daily' ? rangeDates : rangeDates.filter((iso) => iso <= today);
  const summary = countStatuses(attendance, visibleStaff, countedDates);
  const rangeLabel = longDate(today);
  const dailyRows = visibleStaff.map((member) => ({ member, entry: resolveAttendance(attendance, member, today) }))
    .filter(({ entry }) => statusFilter === 'All' || (entry.status || 'Not marked') === statusFilter);
  const filtersActive = Boolean(query || statusFilter !== 'All');

  const openEditor = (member, iso) => {
    const entry = resolveAttendance(attendance, member, iso);
    setEditor({ member, date: iso, scheduledOff: entry.scheduledOff, form: { status: entry.status || 'Present', checkIn: entry.checkIn || '', checkOut: entry.checkOut || '', notes: entry.notes || (entry.source === 'scheduled' ? 'Weekly off' : ''), overrideWeekOff: Boolean(entry.overrideWeekOff) } });
    setEditorError('');
  };
  const updateForm = (field, value) => setEditor((current) => ({ ...current, form: { ...current.form, [field]: value } }));
  const needsOverride = Boolean(editor?.scheduledOff && editor.form.status !== 'Week Off');
  const saveEditor = (event) => {
    event.preventDefault();
    const { form, member } = editor;
    const withTimes = usesTimes(form.status);
    if (!ATTENDANCE_STATUSES.includes(form.status)) { setEditorError('Choose an attendance status.'); return; }
    if (needsOverride && !isAdmin) { setEditorError('This is a scheduled week off. Only an admin can override it.'); return; }
    if (needsOverride && !form.overrideWeekOff) { setEditorError('Tick “Override Week Off” to record attendance on a scheduled week off.'); return; }
    if (withTimes && form.checkIn && form.checkOut && workedMinutes(form.checkIn, form.checkOut) == null) { setEditorError('Check out must be later than check in.'); return; }
    onSaveRecord(editor.date, member.id, { status: form.status, checkIn: withTimes ? form.checkIn : '', checkOut: withTimes ? form.checkOut : '', notes: form.notes.trim(), overrideWeekOff: needsOverride, updatedAt: new Date().toISOString(), updatedBy: userLabel });
    notify(`Attendance saved for ${member.name}`);
    setEditor(null);
  };
  const confirmDelete = () => {
    const { member, iso, scheduledOff } = pendingDelete;
    onSaveRecord(iso, member.id, null);
    notify(scheduledOff ? 'Record deleted — scheduled week off restored' : 'Attendance record deleted');
    setPendingDelete(null);
  };
  const toggleWeekOff = (member, day) => {
    if (!isAdmin) return;
    const current = member.weekOffs || [];
    const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((first, second) => first - second);
    onUpdateWeekOffs(member.id, next);
    notify(`${member.name}: weekly off ${next.length ? next.map((item) => WEEKDAY_LONG[item]).join(', ') : 'removed'}`);
  };

  return <section className="panel rx-panel at-panel">
    <div className="rx-panel-head at-head">
      <div><h3>Attendance</h3><span className="rx-count">{rangeLabel}</span></div>
      <div className="at-controls">
        <span className="at-current-date"><CalendarDays size={14} strokeWidth={2} aria-hidden="true" />{longDate(today)} · Current day</span>
        <button type="button" className="secondary-button small rx-with-icon" onClick={() => setShowSchedule((visible) => !visible)} aria-expanded={showSchedule}><CalendarDays size={14} strokeWidth={2} aria-hidden="true" />Weekly off schedule</button>
      </div>
    </div>

    <div className="at-summary" aria-label="Attendance summary">{SUMMARY_KEYS.map((key) => <div key={key} className={`at-sum at-sum-${STATUS_META[key]?.cls || 'none'}`}><span>{key}</span><strong>{summary[key]}</strong></div>)}</div>
    {view !== 'daily' && <p className="at-footnote">{countedDates.length ? `Counted ${shortDate(countedDates[0])} – ${shortDate(countedDates.at(-1))} (up to the working date).` : 'No days counted yet — this period is after the working date.'} Week Off is never counted as Absent.</p>}

    {showSchedule && <div className="at-schedule">
      <div className="at-schedule-head"><div><strong>Weekly off schedule</strong><span>{isAdmin ? 'Tap a day to set or clear a staff member’s regular weekly off. A record on a specific date overrides it for that date only.' : 'Only an admin can change weekly offs.'}</span></div></div>
      {staffList.length ? <div className="rx-sheet-scroll"><table className="rx-sheet at-sheet at-schedule-sheet"><colgroup><col className="at-col-staff" /><col className="at-col-role" />{WEEK_ORDER.map((day) => <col key={day} className="at-col-day" />)}</colgroup><thead><tr><th className="at-th">Staff</th><th className="at-th">Role</th>{WEEK_ORDER.map((day) => <th key={day} className="at-th at-center">{WEEKDAY_SHORT[day]}</th>)}</tr></thead><tbody>{staffList.map((member) => <tr key={member.id}><td title={member.name}><strong>{member.name}</strong></td><td title={member.role}>{member.role}</td>{WEEK_ORDER.map((day) => { const off = (member.weekOffs || []).includes(day); return <td key={day} className="at-center"><button type="button" className={`at-day-toggle ${off ? 'on' : ''}`} aria-pressed={off} disabled={!isAdmin} onClick={() => toggleWeekOff(member, day)} title={`${member.name} · ${WEEKDAY_LONG[day]}: ${off ? 'weekly off' : 'working day'}`}>{off ? 'OFF' : '—'}</button></td>; })}</tr>)}</tbody></table></div> : <EmptyState title="No staff yet" text="Add staff above to set their weekly offs." />}
    </div>}

    <div className="at-toolbar">
      <label className="rx-search"><Search size={15} strokeWidth={2} aria-hidden="true" /><span className="sr-only">Search staff</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff or role…" /></label>
      {view === 'daily' && <label className="rx-filter"><span className="sr-only">Attendance status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All statuses</option>{SUMMARY_KEYS.map((key) => <option key={key}>{key}</option>)}</select></label>}
      {filtersActive && <button type="button" className="rx-text-button" onClick={() => { setSearch(''); setStatusFilter('All'); }}><X size={13} strokeWidth={2.2} aria-hidden="true" />Clear</button>}
      {view === 'weekly' && <div className="at-legend" aria-label="Legend">{ATTENDANCE_STATUSES.map((status) => <span key={status}><StatusBadge entry={{ status }} compact />{status}</span>)}<span><span className="at-badge at-weekoff is-scheduled">OFF</span>Scheduled</span></div>}
    </div>

    {!staffList.length ? <EmptyState title="No staff yet" text="Add staff members to start tracking attendance." /> : view === 'daily' ? (dailyRows.length ? <div className="rx-sheet-scroll"><table className="rx-sheet at-sheet at-daily-sheet"><colgroup><col className="at-col-date" /><col className="at-col-staff" /><col className="at-col-role" /><col className="at-col-status" /><col className="at-col-time" /><col className="at-col-time" /><col className="at-col-hours" /><col className="at-col-notes" /><col className="rx-col-actions" /></colgroup><thead><tr><th className="at-th">Date</th><th className="at-th">Staff Name</th><th className="at-th">Role</th><th className="at-th">Attendance</th><th className="at-th">Check In</th><th className="at-th">Check Out</th><th className="at-th rx-num">Hours</th><th className="at-th">Notes</th><th className="rx-actions-col">Actions</th></tr></thead><tbody>{dailyRows.map(({ member, entry }) => {
      const withTimes = usesTimes(entry.status);
      const notes = entry.notes || (entry.source === 'scheduled' ? 'Scheduled weekly off' : '');
      return <tr key={member.id} className={entry.status === 'Week Off' ? 'at-row-off' : ''}>
        <td className="rx-date" title={longDate(today)}>{shortDate(today)}</td>
        <td title={member.name}><strong>{member.name}</strong></td>
        <td title={member.role}>{member.role}</td>
        <td><StatusBadge entry={entry} />{entry.overrideWeekOff && <span className="at-flag" title="Worked on scheduled week off">Override</span>}</td>
        <td>{withTimes ? formatTime(entry.checkIn) : '—'}</td>
        <td>{withTimes ? formatTime(entry.checkOut) : '—'}</td>
        <td className="rx-num">{withTimes ? formatHours(workedMinutes(entry.checkIn, entry.checkOut)) : '—'}</td>
        <td title={notes} className={entry.source === 'scheduled' ? 'at-muted' : ''}>{notes || '—'}</td>
        <td className="rx-actions"><button type="button" className="rx-icon-button" onClick={() => openEditor(member, today)} title="Edit" aria-label={`Edit attendance for ${member.name}`}><Pencil size={14} strokeWidth={2} /></button>{entry.source === 'manual' && <button type="button" className="rx-icon-button rx-danger" onClick={() => setPendingDelete({ member, iso: today, scheduledOff: entry.scheduledOff })} title="Delete" aria-label={`Delete attendance for ${member.name}`}><Trash2 size={14} strokeWidth={2} /></button>}</td>
      </tr>;
    })}</tbody></table></div> : <EmptyState title="No matching staff" text="Try a different search or clear the status filter." />) : !visibleStaff.length ? <EmptyState title="No matching staff" text="Try a different search term." /> : view === 'weekly' ? <div className="rx-sheet-scroll"><table className="rx-sheet at-sheet at-week-sheet"><colgroup><col className="at-col-staff" />{weekDates.map((iso) => <col key={iso} className="at-col-day" />)}<col className="at-col-count" /><col className="at-col-count" /></colgroup><thead><tr><th className="at-th">Staff</th>{weekDates.map((iso) => <th key={iso} className={`at-th at-center ${iso === today ? 'at-today' : ''}`} title={longDate(iso)}>{WEEKDAY_SHORT[parseISO(iso).getDay()]} <small>{parseISO(iso).getDate()}</small></th>)}<th className="at-th at-center" title="Present + Half Day">Worked</th><th className="at-th at-center" title="Week Off days">Off</th></tr></thead><tbody>{visibleStaff.map((member) => {
      const entries = weekDates.map((iso) => resolveAttendance(attendance, member, iso));
      return <tr key={member.id}>
        <td title={`${member.name} · ${member.role}`}><strong>{member.name}</strong></td>
        {entries.map((entry, index) => <td key={weekDates[index]} className={`at-center ${weekDates[index] === today ? 'at-today' : ''}`}><button type="button" className="at-cell" onClick={() => openEditor(member, weekDates[index])} title={`${member.name} · ${longDate(weekDates[index])}: ${entry.status || 'Not marked'}${entry.source === 'scheduled' ? ' (scheduled weekly off)' : ''}`}><StatusBadge entry={entry} compact /></button></td>)}
        <td className="at-center at-count">{entries.filter((entry) => usesTimes(entry.status)).length}</td>
        <td className="at-center at-count">{entries.filter((entry) => entry.status === 'Week Off').length}</td>
      </tr>;
    })}</tbody></table></div> : <div className="rx-sheet-scroll"><table className="rx-sheet at-sheet at-month-sheet"><colgroup><col className="at-col-staff" /><col className="at-col-role" />{SUMMARY_KEYS.map((key) => <col key={key} className="at-col-count" />)}<col className="at-col-count" /></colgroup><thead><tr><th className="at-th">Staff</th><th className="at-th">Role</th>{SUMMARY_KEYS.map((key) => <th key={key} className="at-th at-center">{key === 'Not marked' ? 'Unmarked' : key}</th>)}<th className="at-th at-center" title="Days counted up to the working date">Days</th></tr></thead><tbody>{visibleStaff.map((member) => {
      const counts = countStatuses(attendance, [member], countedDates);
      return <tr key={member.id}><td title={member.name}><strong>{member.name}</strong></td><td title={member.role}>{member.role}</td>{SUMMARY_KEYS.map((key) => <td key={key} className={`at-center at-count ${counts[key] ? `at-count-${STATUS_META[key]?.cls || 'none'}` : 'at-zero'}`}>{counts[key]}</td>)}<td className="at-center at-count">{countedDates.length}</td></tr>;
    })}</tbody></table></div>}

    {editor && <div className="rx-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
      <form className="rx-modal panel at-modal" role="dialog" aria-modal="true" aria-labelledby="at-editor-title" onSubmit={saveEditor} noValidate>
        <div className="rx-modal-head"><div><h2 id="at-editor-title">Edit Attendance</h2><p className="page-intro">{editor.member.name} · {editor.member.role} · {longDate(editor.date)}</p></div><button type="button" className="rx-icon-button" onClick={() => setEditor(null)} aria-label="Close"><X size={16} strokeWidth={2} /></button></div>
        {editor.scheduledOff && <div className="at-callout"><CalendarDays size={15} strokeWidth={2} aria-hidden="true" />Scheduled weekly off ({WEEKDAY_LONG[parseISO(editor.date).getDay()]}) for {editor.member.name}.</div>}
        <div className="rx-form-grid">
          <label>Attendance Status *<select value={editor.form.status} onChange={(event) => updateForm('status', event.target.value)} autoFocus>{ATTENDANCE_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Notes<input list="at-note-suggestions" value={editor.form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder={editor.form.status === 'Week Off' ? 'e.g. Weekly off' : 'Optional'} /><datalist id="at-note-suggestions">{NOTE_SUGGESTIONS.map((note) => <option key={note} value={note} />)}</datalist></label>
          {usesTimes(editor.form.status) ? <>
            <label>Check In<input type="time" value={editor.form.checkIn} onChange={(event) => updateForm('checkIn', event.target.value)} /></label>
            <label>Check Out<input type="time" value={editor.form.checkOut} onChange={(event) => updateForm('checkOut', event.target.value)} /></label>
            <label>Working Hours<input value={formatHours(workedMinutes(editor.form.checkIn, editor.form.checkOut))} readOnly tabIndex={-1} /></label>
          </> : <p className="at-muted-note">Check in, check out and working hours are not required for <strong>{editor.form.status}</strong>.</p>}
        </div>
        {needsOverride && (isAdmin ? <label className="at-override"><input type="checkbox" checked={editor.form.overrideWeekOff} onChange={(event) => updateForm('overrideWeekOff', event.target.checked)} /><span><strong>Override Week Off</strong><small>{editor.member.name} worked on their scheduled week off. This record applies to this date only.</small></span></label> : <div className="at-callout is-warning" role="alert"><ShieldAlert size={15} strokeWidth={2} aria-hidden="true" />This is a scheduled week off. Only an admin can override it.</div>)}
        {editorError && <div className="form-error" role="alert">{editorError}</div>}
        <div className="rx-modal-actions"><button type="button" className="secondary-button" onClick={() => setEditor(null)}>Cancel</button><button type="submit" className="primary-button" disabled={needsOverride && !isAdmin}>Save Attendance</button></div>
      </form>
    </div>}

    {pendingDelete && <div className="rx-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setPendingDelete(null); }}>
      <div className="rx-modal rx-confirm panel" role="alertdialog" aria-modal="true" aria-labelledby="at-delete-title" aria-describedby="at-delete-text">
        <span className="rx-confirm-icon"><Trash2 size={18} strokeWidth={1.8} aria-hidden="true" /></span>
        <h2 id="at-delete-title">Delete Attendance Record?</h2>
        <p id="at-delete-text" className="page-intro">{pendingDelete.member.name} · {longDate(pendingDelete.iso)}. {pendingDelete.scheduledOff ? 'The date will return to the scheduled week off.' : 'The date will return to “Not marked”.'}</p>
        <div className="rx-modal-actions"><button type="button" className="secondary-button" autoFocus onClick={() => setPendingDelete(null)}>Cancel</button><button type="button" className="primary-button rx-danger-button" onClick={confirmDelete}>Delete</button></div>
      </div>
    </div>}
  </section>;
}
