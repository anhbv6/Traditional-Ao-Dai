"use client";

import { useSyncExternalStore } from "react";

export interface TodayTodo {
  id: string;
  text: string;
  done: boolean;
}

interface StoredTodos {
  /** Ngày (YYYY-MM-DD, giờ máy) mà danh sách thuộc về */
  date: string;
  items: TodayTodo[];
}

// Ghi chú cá nhân của người đang dùng máy này — tiện ích theo trình duyệt, mất cũng không sao, không phải dữ liệu nghiệp vụ
const STORAGE_KEY = "aodai-admin-today-todos";
const EMPTY: TodayTodo[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedItems: TodayTodo[] = EMPTY;

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isTodo(value: unknown): value is TodayTodo {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.text === "string" && typeof v.done === "boolean";
}

function parse(raw: string | null): TodayTodo[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY;
    const { date, items } = data as Partial<StoredTodos>;
    if (!Array.isArray(items)) return EMPTY;
    const valid = items.filter(isTodo);
    // Sang ngày mới: việc đã xong bỏ đi, việc còn dở chuyển tiếp sang hôm nay
    return date === todayKey() ? valid : valid.filter((item) => !item.done);
  } catch {
    return EMPTY;
  }
}

function read(): TodayTodo[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Trình duyệt chặn lưu trữ: dùng bản trong bộ nhớ
    return cachedItems;
  }
  // useSyncExternalStore cần snapshot ổn định — chỉ parse lại khi chuỗi lưu trữ đổi
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parse(raw);
  }
  return cachedItems;
}

function write(items: TodayTodo[]) {
  const raw = JSON.stringify({ date: todayKey(), items } satisfies StoredTodos);
  cachedRaw = raw;
  cachedItems = items;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Không lưu được thì vẫn giữ trong phiên này
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Danh sách việc cần làm hôm nay của người quản trị, nhớ theo trình duyệt */
export function useTodayTodos() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);

  return {
    items,
    add: (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      write([...read(), { id: crypto.randomUUID(), text: trimmed, done: false }]);
    },
    toggle: (id: string) => write(read().map((item) => (item.id === id ? { ...item, done: !item.done } : item))),
    remove: (id: string) => write(read().filter((item) => item.id !== id)),
    clearDone: () => write(read().filter((item) => !item.done)),
  };
}
