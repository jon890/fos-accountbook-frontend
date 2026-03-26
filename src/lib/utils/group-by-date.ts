/**
 * 날짜별 그룹핑 공통 유틸리티
 * ExpenseListClient, IncomeListClient 등에서 재사용
 */

export interface DateGroup<T> {
  dateKey: string;
  label: string;
  items: T[];
}

export function getDateLabel(dateStr: string): string {
  const dayPart = dateStr.split("T")[0]; // YYYY-MM-DD
  const [year, month, day] = dayPart.split("-").map(Number);

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

  if (dayPart === todayStr) return "오늘";
  if (dayPart === yesterdayStr) return "어제";
  if (year === today.getFullYear()) return `${month}월 ${day}일`;
  return `${year}년 ${month}월 ${day}일`;
}

export function groupByDate<T extends { date: string }>(items: T[]): DateGroup<T>[] {
  const groups: DateGroup<T>[] = [];
  const seenDates = new Map<string, number>();

  for (const item of items) {
    const dayPart = item.date.split("T")[0];
    if (!seenDates.has(dayPart)) {
      seenDates.set(dayPart, groups.length);
      groups.push({ dateKey: dayPart, label: getDateLabel(dayPart), items: [] });
    }
    groups[seenDates.get(dayPart)!].items.push(item);
  }

  return groups;
}
