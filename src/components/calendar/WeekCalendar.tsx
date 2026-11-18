import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Session } from '../../types'
import { addDays, formatWeek, localISODate, parseLocalDate, startOfWeek } from '../../utils/dates'

type Props = {
  sessions: Session[]
  selectedDate: string
  weekStart: string
  onSelectDate: (date: string) => void
  onChangeWeek: (date: string) => void
}

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function WeekCalendar({ sessions, selectedDate, weekStart, onSelectDate, onChangeWeek }: Props) {
  const monday = parseLocalDate(weekStart)
  const today = localISODate(new Date())
  const days = weekdays.map((label, index) => {
    const date = addDays(monday, index)
    const iso = localISODate(date)
    const daySessions = sessions.filter(session => session.date === iso)
    return { label, date, iso, daySessions }
  })
  const selected = parseLocalDate(selectedDate)
  const shiftWeek = (amount: number) => {
    const offset = Math.max(0, Math.min(6, Math.round((selected.getTime() - monday.getTime()) / 86400000)))
    const nextMonday = addDays(monday, amount * 7)
    onChangeWeek(localISODate(nextMonday))
    onSelectDate(localISODate(addDays(nextMonday, offset)))
  }
  const goToToday = () => {
    const nextMonday = startOfWeek(new Date())
    onChangeWeek(localISODate(nextMonday))
    onSelectDate(today)
  }

  return <>
    <section className="week-head">
      <div><h2>План и факт</h2><p>{formatWeek(monday)} · неделя в движении</p></div>
      <div className="week-arrows">
        <button aria-label="Предыдущая неделя" onClick={() => shiftWeek(-1)}><ChevronLeft size={18}/></button>
        <button className="today-button" onClick={goToToday}>Сегодня</button>
        <button aria-label="Следующая неделя" onClick={() => shiftWeek(1)}><ChevronRight size={18}/></button>
      </div>
    </section>
    <section className="day-strip">
      {days.map(day => <button key={day.iso} onClick={() => onSelectDate(day.iso)} className={`day-cell ${selectedDate === day.iso ? 'chosen' : ''} ${day.iso === today ? 'is-today' : ''}`}>
        <span>{day.label}</span><b>{day.date.getDate()}</b>
        <i className={day.daySessions.some(session => session.done) ? 'has-done' : day.daySessions.length ? 'has-plan' : ''}/>
      </button>)}
    </section>
  </>
}
