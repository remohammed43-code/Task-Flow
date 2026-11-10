import { useMemo, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function Calendar({ tasks }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const todayKey = toDateKey(new Date());
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthLabel = MONTH_FORMATTER.format(visibleMonth);

  const { calendarDays, tasksByDate, unscheduledTasks, monthTaskCount } =
    useMemo(() => {
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const leadingDays = (firstDay.getDay() + 6) % 7;
      const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
      const firstCell = new Date(year, month, 1 - leadingDays);
      const days = Array.from({ length: totalCells }, (_, index) => {
        const date = new Date(firstCell);
        date.setDate(firstCell.getDate() + index);
        return {
          date,
          dateKey: toDateKey(date),
          isCurrentMonth: date.getMonth() === month,
        };
      });

      const datedTasks = new Map();
      const unscheduled = [];
      let tasksInMonth = 0;

      tasks.forEach((task, index) => {
        if (!isValidDateKey(task.dueDate || "")) {
          unscheduled.push({ ...task, calendarKey: task.id || `task-${index}` });
          return;
        }

        if (task.dueDate.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)) {
          tasksInMonth += 1;
        }

        const dayTasks = datedTasks.get(task.dueDate) || [];
        dayTasks.push({ ...task, calendarKey: task.id || `task-${index}` });
        datedTasks.set(task.dueDate, dayTasks);
      });

      return {
        calendarDays: days,
        tasksByDate: datedTasks,
        unscheduledTasks: unscheduled,
        monthTaskCount: tasksInMonth,
      };
    }, [tasks, year, month]);

  function changeMonth(offset) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function showToday() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <main className="app-shell calendar-page">
      <section className="top-panel">
        <div className="hero-card">
          <p className="eyebrow">TaskFlow Calendar</p>
          <h1>Plan your days.</h1>
          <p className="subtitle">See every task on the date it is due.</p>
        </div>
        <div className="calendar-summary" aria-live="polite">
          <span>Scheduled this month</span>
          <strong>{monthTaskCount}</strong>
        </div>
      </section>

      <section className="calendar-card" aria-label="Task calendar">
        <div className="calendar-toolbar">
          <div className="calendar-month">
            <h2>{monthLabel}</h2>
            <button type="button" className="calendar-today-btn" onClick={showToday}>
              Today
            </button>
          </div>
          <div className="calendar-navigation" aria-label="Calendar navigation">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              &rsaquo;
            </button>
          </div>
        </div>

        <div className="calendar-grid" role="grid" aria-label={monthLabel}>
          {WEEKDAYS.map((weekday) => (
            <div className="calendar-weekday" role="columnheader" key={weekday}>
              {weekday}
            </div>
          ))}
          {calendarDays.map(({ date, dateKey, isCurrentMonth }) => {
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isToday = dateKey === todayKey;

            return (
              <div
                className={`calendar-day${isCurrentMonth ? "" : " outside-month"}${isToday ? " is-today" : ""}`}
                role="gridcell"
                aria-label={`${date.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}${dayTasks.length ? `, ${dayTasks.length} ${dayTasks.length === 1 ? "task" : "tasks"}` : ""}`}
                key={dateKey}
              >
                <span className="calendar-day-number">{date.getDate()}</span>
                <div className="calendar-day-tasks">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      className={`calendar-task${task.completed ? " completed" : ""}`}
                      key={task.calendarKey}
                      title={task.text}
                    >
                      <span className="calendar-task-dot" aria-hidden="true" />
                      <span className="calendar-task-title">{task.text}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="calendar-more">
                      +{dayTasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {unscheduledTasks.length > 0 && (
          <section className="unscheduled-section" aria-labelledby="unscheduled-heading">
            <div className="unscheduled-heading">
              <h3 id="unscheduled-heading">No due date</h3>
              <span>{unscheduledTasks.length}</span>
            </div>
            <ul className="unscheduled-list">
              {unscheduledTasks.map((task) => (
                <li
                  className={task.completed ? "unscheduled-task completed" : "unscheduled-task"}
                  key={task.calendarKey}
                >
                  <span className="calendar-task-dot" aria-hidden="true" />
                  <span>{task.text}</span>
                  {task.completed && <span className="completion-label">Done</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}

export default Calendar;
