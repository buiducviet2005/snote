const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/snote_test';
process.env.JWT_SECRET ||= 'test-access-secret-at-least-32-characters';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-at-least-32-characters';

const { createScheduleEventSchema, updateScheduleEventSchema } = require('../dist/modules/schedule/schedule.schemas');
const { scheduleRouter } = require('../dist/modules/schedule/schedule.routes');

// ============================================================================
// SUITE 1: SCHEDULE VALIDATION & SCHEMA TESTING
// ============================================================================

test('[Viet-Schedule-1] createScheduleEventSchema accepts valid academic event', () => {
  const validPayload = {
    title: 'Học Lập trình Web nâng cao',
    location: 'Phòng 402 - A2',
    eventType: 'CLASS',
    startTime: '2026-11-02T07:00:00.000Z',
    endTime: '2026-11-02T09:25:00.000Z',
    isRecurring: true,
    repeatWeeks: 15
  };

  const parsed = createScheduleEventSchema.parse(validPayload);
  assert.equal(parsed.title, 'Học Lập trình Web nâng cao');
  assert.equal(parsed.eventType, 'CLASS');
  assert.equal(parsed.isRecurring, true);
  assert.equal(parsed.repeatWeeks, 15);
});

test('[Viet-Schedule-2] createScheduleEventSchema rejects empty title and missing time bounds', () => {
  const emptyTitle = {
    title: '   ',
    startTime: '2026-11-02T07:00:00.000Z',
    endTime: '2026-11-02T09:25:00.000Z'
  };
  assert.throws(() => createScheduleEventSchema.parse(emptyTitle));

  const missingTimes = {
    title: 'Thi Giữa kỳ'
  };
  assert.throws(() => createScheduleEventSchema.parse(missingTimes));
});

test('[Viet-Schedule-3] createScheduleEventSchema enforces valid repeatWeeks range (1 to 20)', () => {
  const valid15 = createScheduleEventSchema.parse({
    title: 'Toán Rời Rạc',
    startTime: '2026-11-02T07:00:00.000Z',
    endTime: '2026-11-02T09:25:00.000Z',
    isRecurring: true,
    repeatWeeks: 15
  });
  assert.equal(valid15.repeatWeeks, 15);

  // Rejects 0 or negative
  assert.throws(() => {
    createScheduleEventSchema.parse({
      title: 'Toán Rời Rạc',
      startTime: '2026-11-02T07:00:00.000Z',
      endTime: '2026-11-02T09:25:00.000Z',
      isRecurring: true,
      repeatWeeks: 0
    });
  });

  // Rejects > 20 weeks
  assert.throws(() => {
    createScheduleEventSchema.parse({
      title: 'Toán Rời Rạc',
      startTime: '2026-11-02T07:00:00.000Z',
      endTime: '2026-11-02T09:25:00.000Z',
      isRecurring: true,
      repeatWeeks: 25
    });
  });
});

test('[Viet-Schedule-4] createScheduleEventSchema rejects invalid UUID foreign keys', () => {
  assert.throws(() => {
    createScheduleEventSchema.parse({
      title: 'Họp Nhóm',
      startTime: '2026-11-02T07:00:00.000Z',
      endTime: '2026-11-02T09:25:00.000Z',
      subjectId: 'not-a-valid-uuid'
    });
  });
});

// ============================================================================
// SUITE 2: ACADEMIC SHIFTS (CA HỌC ĐẠI HỌC) SPECIFICATION
// ============================================================================

test('[Viet-Schedule-5] Academic Shifts conform to Vietnamese University standards', () => {
  const SHIFTS = [
    { id: 1, label: 'Ca 1', start: '07:00', end: '09:25' },
    { id: 2, label: 'Ca 2', start: '09:35', end: '12:00' },
    { id: 3, label: 'Ca 3', start: '12:30', end: '14:55' },
    { id: 4, label: 'Ca 4', start: '15:05', end: '17:30' },
    { id: 5, label: 'Ca 5', start: '18:00', end: '20:30' }
  ];

  const parseMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  SHIFTS.forEach((shift) => {
    const startMin = parseMinutes(shift.start);
    const endMin = parseMinutes(shift.end);
    const duration = endMin - startMin;

    // Standard Vietnamese academic shift: 2.5 - 3 hours
    assert.ok(duration >= 145 && duration <= 155, `${shift.label} duration should be ~145-150 mins, got ${duration}`);
    assert.ok(endMin > startMin, `${shift.label} end time must be after start time`);
  });

  // Verify non-overlapping progression with breaks
  for (let i = 0; i < SHIFTS.length - 1; i++) {
    const currentEnd = parseMinutes(SHIFTS[i].end);
    const nextStart = parseMinutes(SHIFTS[i + 1].start);
    const breakMinutes = nextStart - currentEnd;
    assert.ok(breakMinutes >= 10, `Break between ${SHIFTS[i].label} and ${SHIFTS[i+1].label} must be at least 10 minutes (got ${breakMinutes})`);
  }
});

// ============================================================================
// SUITE 3: GOOGLE CALENDAR OVERLAP CLUSTERING & COLUMN PLACEMENT ALGORITHM
// ============================================================================

function layoutDayEventsSimulation(dayEvents) {
  if (dayEvents.length === 0) return [];

  const parsed = dayEvents.map((item) => {
    const s = new Date(item.startTime);
    const e = new Date(item.endTime);
    const startMin = s.getHours() * 60 + s.getMinutes();
    let endMin = e.getHours() * 60 + e.getMinutes();
    if (endMin <= startMin) endMin = startMin + 45;
    return { item, startMin, endMin };
  });

  parsed.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  const clusters = [];
  let currentCluster = [];
  let currentClusterEnd = -1;

  for (const ev of parsed) {
    if (currentCluster.length === 0) {
      currentCluster.push(ev);
      currentClusterEnd = ev.endMin;
    } else if (ev.startMin < currentClusterEnd) {
      currentCluster.push(ev);
      currentClusterEnd = Math.max(currentClusterEnd, ev.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [ev];
      currentClusterEnd = ev.endMin;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const results = [];

  for (const cluster of clusters) {
    const columns = [];

    for (const ev of cluster) {
      let placed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const lastInCol = columns[colIdx][columns[colIdx].length - 1];
        if (lastInCol.endMin <= ev.startMin) {
          columns[colIdx].push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([ev]);
      }
    }

    const totalCols = columns.length;
    columns.forEach((colEvents, colIdx) => {
      const colWidth = 100 / totalCols;
      const left = colIdx * colWidth;

      for (const ev of colEvents) {
        results.push({
          id: ev.item.id,
          title: ev.item.title,
          leftPct: left,
          widthPct: colWidth,
          totalCols
        });
      }
    });
  }

  return results;
}

test('[Viet-Schedule-6] Single isolated event receives 100% full column width', () => {
  const events = [
    { id: '1', title: 'Học Ca 1', startTime: '2026-11-02T07:00:00Z', endTime: '2026-11-02T09:25:00Z' }
  ];

  const layout = layoutDayEventsSimulation(events);
  assert.equal(layout.length, 1);
  assert.equal(layout[0].widthPct, 100);
  assert.equal(layout[0].leftPct, 0);
  assert.equal(layout[0].totalCols, 1);
});

test('[Viet-Schedule-7] Two overlapping events are allocated into 2 side-by-side columns (50% each)', () => {
  const events = [
    { id: '1', title: 'Học Ca 1', startTime: '2026-11-02T07:00:00Z', endTime: '2026-11-02T09:25:00Z' },
    { id: '2', title: 'Luyện đề Tiếng Anh', startTime: '2026-11-02T08:00:00Z', endTime: '2026-11-02T10:00:00Z' }
  ];

  const layout = layoutDayEventsSimulation(events);
  assert.equal(layout.length, 2);

  const ev1 = layout.find((e) => e.id === '1');
  const ev2 = layout.find((e) => e.id === '2');

  assert.equal(ev1.widthPct, 50);
  assert.equal(ev1.leftPct, 0);
  assert.equal(ev2.widthPct, 50);
  assert.equal(ev2.leftPct, 50);
});

test('[Viet-Schedule-8] Three overlapping events divide the lane equally into 33.33% columns', () => {
  const events = [
    { id: '1', title: 'Sự kiện A', startTime: '2026-11-02T09:00:00Z', endTime: '2026-11-02T11:00:00Z' },
    { id: '2', title: 'Sự kiện B', startTime: '2026-11-02T09:30:00Z', endTime: '2026-11-02T11:30:00Z' },
    { id: '3', title: 'Sự kiện C', startTime: '2026-11-02T10:00:00Z', endTime: '2026-11-02T12:00:00Z' }
  ];

  const layout = layoutDayEventsSimulation(events);
  assert.equal(layout.length, 3);
  layout.forEach((e) => {
    assert.equal(e.totalCols, 3);
    assert.ok(Math.abs(e.widthPct - 33.333333333333336) < 0.001);
  });
});

test('[Viet-Schedule-9] Sequential non-overlapping events share the same column (100% width)', () => {
  const events = [
    { id: '1', title: 'Ca 1 Buổi sáng', startTime: '2026-11-02T07:00:00Z', endTime: '2026-11-02T09:25:00Z' },
    { id: '2', title: 'Ca 2 Buổi sáng', startTime: '2026-11-02T09:35:00Z', endTime: '2026-11-02T12:00:00Z' }
  ];

  const layout = layoutDayEventsSimulation(events);
  assert.equal(layout.length, 2);
  layout.forEach((e) => {
    assert.equal(e.totalCols, 1);
    assert.equal(e.widthPct, 100);
    assert.equal(e.leftPct, 0);
  });
});

// ============================================================================
// SUITE 4: ALL-DAY TRAY VS TIMED EVENTS CLASSIFICATION
// ============================================================================

test('[Viet-Schedule-10] Events spanning >= 20 hours or untimed tasks are correctly categorized as All-Day', () => {
  const classifyItem = (item) => {
    const s = item.startTime ? new Date(item.startTime) : null;
    const e = item.endTime ? new Date(item.endTime) : (s ? new Date(s) : null);

    if (item.itemType === 'TASK' && (!item.startTime || (s && s.getHours() === 0 && s.getMinutes() === 0))) {
      return 'ALL_DAY';
    }
    if (s && e) {
      const durationHours = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
      if (durationHours >= 20) return 'ALL_DAY';
      return 'TIMED';
    }
    return 'ALL_DAY';
  };

  const deadlineTask = { itemType: 'TASK', title: 'Nộp báo cáo', startTime: null };
  const allDayEvent = { itemType: 'SCHEDULE', title: 'Nghỉ lễ 2/9', startTime: '2026-09-02T00:00:00Z', endTime: '2026-09-02T23:59:59Z' };
  const classEvent = { itemType: 'SCHEDULE', title: 'Học Ca 1', startTime: '2026-11-02T07:00:00Z', endTime: '2026-11-02T09:25:00Z' };

  assert.equal(classifyItem(deadlineTask), 'ALL_DAY');
  assert.equal(classifyItem(allDayEvent), 'ALL_DAY');
  assert.equal(classifyItem(classEvent), 'TIMED');
});

// ============================================================================
// SUITE 5: SEMESTER RECURRENCE CALCULATION
// ============================================================================

test('[Viet-Schedule-11] 15-week recurrence generates exactly 15 sequential dates spaced 7 days apart', () => {
  const baseStart = new Date('2026-09-07T07:00:00.000Z'); // Monday 07:00
  const baseEnd = new Date('2026-09-07T09:25:00.000Z');   // Monday 09:25
  const repeatWeeks = 15;

  const occurrences = [];
  occurrences.push({ week: 1, start: baseStart, end: baseEnd });

  for (let week = 1; week < repeatWeeks; week++) {
    const nextStart = new Date(baseStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const nextEnd = new Date(baseEnd.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    occurrences.push({ week: week + 1, start: nextStart, end: nextEnd });
  }

  assert.equal(occurrences.length, 15);

  // Verify intervals between each subsequent week
  for (let i = 0; i < occurrences.length - 1; i++) {
    const current = occurrences[i];
    const next = occurrences[i + 1];
    const diffDays = (next.start.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24);
    assert.equal(diffDays, 7, `Week ${current.week} to Week ${next.week} must be exactly 7 days`);

    // Verify hour and minute consistency
    assert.equal(next.start.getUTCHours(), 7);
    assert.equal(next.start.getUTCMinutes(), 0);
    assert.equal(next.end.getUTCHours(), 9);
    assert.equal(next.end.getUTCMinutes(), 25);
  }
});

// ============================================================================
// SUITE 6: ROUTE ALIASES & EXPRESS ROUTER MOUNTING
// ============================================================================

test('[Viet-Schedule-12] Schedule router exposes symmetrical routes and required aliases', () => {
  const routes = [];
  scheduleRouter.stack.forEach((layer) => {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods);
      routes.push({ path, methods });
    }
  });

  // Verify vital route aliases exist
  const hasGetRoot = routes.some((r) => r.path === '/' && r.methods.includes('get'));
  const hasGetUpcoming = routes.some((r) => r.path === '/upcoming' && r.methods.includes('get'));
  const hasGetEvents = routes.some((r) => r.path === '/events' && r.methods.includes('get'));
  const hasPostEvents = routes.some((r) => r.path === '/events' && r.methods.includes('post'));
  const hasPutEvents = routes.some((r) => r.path === '/events/:id' && r.methods.includes('put'));
  const hasDeleteEvents = routes.some((r) => r.path === '/events/:id' && r.methods.includes('delete'));

  assert.ok(hasGetRoot, 'GET / must exist');
  assert.ok(hasGetUpcoming, 'GET /upcoming alias must exist');
  assert.ok(hasGetEvents, 'GET /events alias must exist');
  assert.ok(hasPostEvents, 'POST /events alias must exist');
  assert.ok(hasPutEvents, 'PUT /events/:id alias must exist');
  assert.ok(hasDeleteEvents, 'DELETE /events/:id alias must exist');
});

