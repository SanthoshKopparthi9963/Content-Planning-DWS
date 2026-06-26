import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(process.env.DATABASE_URL || 'database.sqlite');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'LEAD', 'MEMBER'
    member_type TEXT, -- 'WRITER', 'EDITOR'
    base_capacity INTEGER DEFAULT 480
  );

  CREATE TABLE IF NOT EXISTS task_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    words_per_hour INTEGER NOT NULL,
    allowed_role TEXT NOT NULL -- 'WRITER', 'EDITOR', 'BOTH'
  );

  CREATE TABLE IF NOT EXISTS task_types_meta (
    task_type_id INTEGER PRIMARY KEY,
    category TEXT, -- 'Writing','Editing','AI','Hybrid'
    buffer_percentage INTEGER DEFAULT 0,
    allowed_roles TEXT, -- CSV
    allow_multi_user INTEGER DEFAULT 1,
    daily_target TEXT,
    est_hours_min REAL,
    est_hours_max REAL,
    FOREIGN KEY (task_type_id) REFERENCES task_types(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type_id INTEGER NOT NULL,
    total_word_count INTEGER NOT NULL,
    total_minutes_required INTEGER NOT NULL,
    remaining_minutes INTEGER NOT NULL,
    deadline TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT DEFAULT 'NEW',
    source TEXT DEFAULT 'Manual',
    pm_name TEXT,
    reviewer TEXT,
    ai_requirement TEXT,
    pieces INTEGER DEFAULT 1,
    FOREIGN KEY (type_id) REFERENCES task_types(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    minutes_assigned INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'STARTED', 'SUBMITTED'
    actual_word_count INTEGER DEFAULT 0,
    content TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS deadline_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    requested_date TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings_global (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    full_day_minutes INTEGER DEFAULT 480,
    half_day_minutes INTEGER DEFAULT 240,
    short_leave_minutes INTEGER DEFAULT 120,
    working_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    office_start TEXT DEFAULT '09:00',
    office_end TEXT DEFAULT '18:00',
    default_buffer_pct INTEGER DEFAULT 0,
    rounding_rule TEXT DEFAULT 'NEAREST', -- NEAREST|UP|BLOCK5
    allow_split_users INTEGER DEFAULT 1,
    allow_split_dates INTEGER DEFAULT 1,
    over_capacity_policy TEXT DEFAULT 'BLOCK', -- BLOCK|WARN|ALLOW
    auto_overdue INTEGER DEFAULT 1,
    auto_close INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS leave_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    require_approval INTEGER DEFAULT 1,
    auto_block INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    leave_type_id INTEGER NOT NULL,
    minutes INTEGER NOT NULL,
    approved INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  db.prepare('INSERT INTO users (name, role, member_type) VALUES (?, ?, ?)').run('Alice Lead', 'LEAD', null);
  
  const members = [
    ['Anika', 'WRITER'], ['Trishna', 'WRITER'], ['Akanksha', 'WRITER'], 
    ['Bisman', 'EDITOR'], ['Soumik', 'WRITER'], ['Jasveen', 'EDITOR'],
    ['Rashmi', 'WRITER'], ['Priya', 'WRITER'], ['Rahul', 'EDITOR'],
    ['Sneha', 'WRITER'], ['Amit', 'WRITER'], ['Vikram', 'EDITOR'],
    ['Kavita', 'WRITER'], ['Sanjay', 'WRITER'], ['Meera', 'EDITOR'],
    ['Arjun', 'WRITER'], ['Pooja', 'WRITER'], ['Rohan', 'EDITOR'],
    ['Nisha', 'WRITER'], ['Karan', 'WRITER'], ['Shweta', 'EDITOR'],
    ['Deepak', 'WRITER'], ['Sunita', 'WRITER'], ['Manish', 'EDITOR'],
    ['Freelancer 1', 'WRITER'], ['Freelancer 2', 'EDITOR']
  ];

  for (const [name, type] of members) {
    db.prepare('INSERT INTO users (name, role, member_type) VALUES (?, ?, ?)').run(name, 'MEMBER', type);
  }

  db.prepare('INSERT INTO task_types (name, words_per_hour, allowed_role) VALUES (?, ?, ?)').run('Writing (Human)', 313, 'WRITER');
  db.prepare('INSERT INTO task_types (name, words_per_hour, allowed_role) VALUES (?, ?, ?)').run('Editing (Human)', 2250, 'EDITOR');
  db.prepare('INSERT INTO task_types (name, words_per_hour, allowed_role) VALUES (?, ?, ?)').run('AI + Editing', 1500, 'EDITOR');

  // Seed some tasks
  const taskTypes = db.prepare('SELECT id, words_per_hour FROM task_types').all() as any[];
  const writingId = taskTypes.find(t => t.words_per_hour === 313).id;
  const editingId = taskTypes.find(t => t.words_per_hour === 2250).id;

  const initialTasks = [
    ['Q1 Marketing Blog', writingId, 1200, '2026-03-01', 'HIGH', 'NEW', 'Google Form', 'Sarah PM', 'Bisman', 'No', 1],
    ['Product Review: Alice', writingId, 800, '2026-02-28', 'MEDIUM', 'NEW', 'Google Form', 'John PM', 'Jasveen', 'Yes (Human Edit)', 1],
    ['Newsletter Feb', editingId, 3000, '2026-02-25', 'HIGH', 'IN_PROGRESS', 'Manual', 'Sarah PM', 'Bisman', 'No', 1],
    ['Social Media Copy', writingId, 500, '2026-02-26', 'LOW', 'NEW', 'Google Form', 'Mike PM', 'Rahul', 'No', 3],
    ['Whitepaper Draft', writingId, 5000, '2026-03-15', 'MEDIUM', 'NEW', 'Manual', 'Sarah PM', 'Jasveen', 'No', 1],
    ['Tech Case Study', writingId, 1500, '2026-03-05', 'HIGH', 'NEW', 'Google Form', 'John PM', 'Bisman', 'Yes', 1],
    ['E-commerce Guide', editingId, 2500, '2026-03-10', 'MEDIUM', 'NEW', 'Google Form', 'Mike PM', 'Jasveen', 'No', 1]
  ];

  for (const [name, typeId, words, deadline, priority, status, source, pm, reviewer, ai, pieces] of initialTasks) {
    const type = taskTypes.find(t => t.id === typeId);
    const minutes = Math.round((words as number / type.words_per_hour) * 60);
    db.prepare(`
      INSERT INTO tasks (name, type_id, total_word_count, total_minutes_required, remaining_minutes, deadline, priority, status, source, pm_name, reviewer, ai_requirement, pieces)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, typeId, words, minutes, minutes, deadline, priority, status, source, pm, reviewer, ai, pieces);
  }

  // Add some assignments to create FULLY_ASSIGNED and COMPLETED tasks
  const bisman = db.prepare("SELECT id FROM users WHERE name = 'Bisman'").get() as any;
  const jasveen = db.prepare("SELECT id FROM users WHERE name = 'Jasveen'").get() as any;
  const newsletterTask = db.prepare("SELECT id, total_minutes_required FROM tasks WHERE name = 'Newsletter Feb'").get() as any;
  const socialTask = db.prepare("SELECT id, total_minutes_required FROM tasks WHERE name = 'Social Media Copy'").get() as any;

  if (newsletterTask && bisman) {
    db.prepare('INSERT INTO assignments (task_id, user_id, date, minutes_assigned, status) VALUES (?, ?, ?, ?, ?)')
      .run(newsletterTask.id, bisman.id, '2026-02-25', newsletterTask.total_minutes_required, 'SUBMITTED');
    db.prepare('UPDATE tasks SET remaining_minutes = 0, status = ? WHERE id = ?').run('COMPLETED', newsletterTask.id);
  }

  if (socialTask && jasveen) {
    db.prepare('INSERT INTO assignments (task_id, user_id, date, minutes_assigned, status) VALUES (?, ?, ?, ?, ?)')
      .run(socialTask.id, jasveen.id, '2026-02-26', socialTask.total_minutes_required, 'PENDING');
    db.prepare('UPDATE tasks SET remaining_minutes = 0, status = ? WHERE id = ?').run('FULLY_ASSIGNED', socialTask.id);
  }

  // Seed some assignments for the weekly view
  const anika = db.prepare("SELECT id FROM users WHERE name = 'Anika'").get() as any;
  const trishna = db.prepare("SELECT id FROM users WHERE name = 'Trishna'").get() as any;
  const marketingBlogTask = db.prepare("SELECT id, total_minutes_required FROM tasks WHERE name = 'Q1 Marketing Blog'").get() as any;
  const productReviewTask = db.prepare("SELECT id, total_minutes_required FROM tasks WHERE name = 'Product Review: Alice'").get() as any;

  if (marketingBlogTask && anika) {
    db.prepare('INSERT INTO assignments (task_id, user_id, date, minutes_assigned, status) VALUES (?, ?, ?, ?, ?)')
      .run(marketingBlogTask.id, anika.id, '2026-02-24', 240, 'PENDING');
    db.prepare('INSERT INTO assignments (task_id, user_id, date, minutes_assigned, status) VALUES (?, ?, ?, ?, ?)')
      .run(marketingBlogTask.id, anika.id, '2026-02-25', 240, 'PENDING');
  }

  if (productReviewTask && trishna) {
    db.prepare('INSERT INTO assignments (task_id, user_id, date, minutes_assigned, status) VALUES (?, ?, ?, ?, ?)')
      .run(productReviewTask.id, trishna.id, '2026-02-26', 480, 'PENDING');
  }

  // Seed some leaves
  const akanksha = db.prepare("SELECT id FROM users WHERE name = 'Akanksha'").get() as any;
  if (akanksha) {
    db.prepare('INSERT INTO user_leaves (user_id, date, leave_type_id, minutes, approved) VALUES (?, ?, ?, ?, ?)')
      .run(akanksha.id, '2026-02-27', 1, 480, 1);
  }



  // Seed Masters: Task Types with Daily Target and Estimated Hours if not present
  const existingMasters = db.prepare('SELECT COUNT(*) as c FROM task_types WHERE name LIKE ?').get('%DWS Stats-based%') as any;
  if (!existingMasters || existingMasters.c === 0) {
    const masters: Array<{name: string; daily: string; estMin: number; estMax: number}> = [
      { name: 'DWS Stats-based/AMA/AML/ELI Blogs', daily: '2,500 words', estMin: 4.0, estMax: 5.0 },
      { name: 'Standard Writing', daily: '1,500 - 1,700 words', estMin: 2.5, estMax: 3.0 },
      { name: 'Title Generation', daily: '480 titles', estMin: 1.5, estMax: 2.0 },
      { name: 'Simple Narrative Elements (NEs)', daily: '80 units', estMin: 1.5, estMax: 2.0 },
      { name: 'Long Narrative Elements (NEs)', daily: '60 - 70 units', estMin: 2.0, estMax: 2.5 },
    ];
    for (const m of masters) {
      const r = db.prepare('INSERT INTO task_types (name, words_per_hour, allowed_role) VALUES (?, ?, ?)').run(m.name, 0, 'BOTH');
      db.prepare(`
        INSERT INTO task_types_meta (task_type_id, category, buffer_percentage, allowed_roles, allow_multi_user, daily_target, est_hours_min, est_hours_max)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(r.lastInsertRowid, 'Writing', 0, 'WRITER', 1, m.daily, m.estMin, m.estMax);
    }
  }
}

// Ensure master task types exist even on existing databases
(() => {
  try {
    const marker = db.prepare('SELECT COUNT(*) as c FROM task_types WHERE name LIKE ?').get('%DWS Stats-based%') as any;
    if (!marker || marker.c === 0) {
      const masters: Array<{name: string; daily: string; estMin: number; estMax: number}> = [
        { name: 'DWS Stats-based/AMA/AML/ELI Blogs', daily: '2,500 words', estMin: 4.0, estMax: 5.0 },
        { name: 'Standard Writing', daily: '1,500 - 1,700 words', estMin: 2.5, estMax: 3.0 },
        { name: 'Title Generation', daily: '480 titles', estMin: 1.5, estMax: 2.0 },
        { name: 'Simple Narrative Elements (NEs)', daily: '80 units', estMin: 1.5, estMax: 2.0 },
        { name: 'Long Narrative Elements (NEs)', daily: '60 - 70 units', estMin: 2.0, estMax: 2.5 },
      ];
      for (const m of masters) {
        const r = db.prepare('INSERT INTO task_types (name, words_per_hour, allowed_role) VALUES (?, ?, ?)').run(m.name, 0, 'BOTH');
        db.prepare(`
          INSERT INTO task_types_meta (task_type_id, category, buffer_percentage, allowed_roles, allow_multi_user, daily_target, est_hours_min, est_hours_max)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(r.lastInsertRowid, 'Writing', 0, 'WRITER', 1, m.daily, m.estMin, m.estMax);
      }
    }
  } catch {}
})();

async function startServer() {
  const app = express();
  app.use(express.json());

  const ensureGlobalSettings = () => {
    const s = db.prepare('SELECT * FROM settings_global WHERE id = 1').get();
    if (!s) {
      db.prepare('INSERT INTO settings_global (id) VALUES (1)').run();
    }
    return db.prepare('SELECT * FROM settings_global WHERE id = 1').get() as any;
  };

  const requireLead = (req: any, res: any) => {
    const role = req.header('x-user-role');
    if (role !== 'LEAD') {
      res.status(403).json({ error: 'Forbidden' });
      return false;
    }
    return true;
  };

  const applyRounding = (minutes: number, rule: string) => {
    if (rule === 'UP') return Math.ceil(minutes);
    if (rule === 'BLOCK5') return Math.ceil(minutes / 5) * 5;
    return Math.round(minutes);
  };

  // API Routes
  app.get('/api/users', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const users = db.prepare('SELECT * FROM users').all() as any[];
    
    const usersWithAssigned = users.map(user => {
      const assigned = db.prepare('SELECT SUM(minutes_assigned) as total FROM assignments WHERE user_id = ? AND date = ?')
        .get(user.id, today) as any;
      return {
        ...user,
        assigned: assigned.total || 0
      };
    });
    
    res.json(usersWithAssigned);
  });

  app.get('/api/capacity', (req, res) => {
    const { date } = req.query;
    const users = db.prepare('SELECT * FROM users').all() as any[];
    
    const usersWithAssigned = users.map(user => {
      const assigned = db.prepare('SELECT SUM(minutes_assigned) as total FROM assignments WHERE user_id = ? AND date = ?')
        .get(user.id, date) as any;
      return {
        ...user,
        assigned: assigned.total || 0
      };
    });
    
    res.json(usersWithAssigned);
  });

  app.get('/api/capacity/weekly', (req, res) => {
    const { startDate, endDate } = req.query;
    const users = db.prepare('SELECT * FROM users').all() as any[];
    
    const usersWithAssignments = users.map(user => {
      const assignments = db.prepare(`
        SELECT a.*, t.name as task_name
        FROM assignments a
        JOIN tasks t ON a.task_id = t.id
        WHERE a.user_id = ? AND a.date >= ? AND a.date <= ?
      `).all(user.id, startDate, endDate);

      const leaves = db.prepare(`
        SELECT * FROM user_leaves WHERE user_id = ? AND date >= ? AND date <= ?
      `).all(user.id, startDate, endDate);

      return {
        ...user,
        assignments,
        leaves
      };
    });
    
    res.json(usersWithAssignments);
  });

  app.get('/api/settings/global', (req, res) => {
    const s = ensureGlobalSettings();
    res.json(s);
  });

  app.put('/api/settings/global', (req, res) => {
    if (!requireLead(req, res)) return;
    const s = ensureGlobalSettings();
    const payload = { ...s, ...req.body };
    db.prepare(`
      UPDATE settings_global SET
        full_day_minutes = ?,
        half_day_minutes = ?,
        short_leave_minutes = ?,
        working_days = ?,
        office_start = ?,
        office_end = ?,
        default_buffer_pct = ?,
        rounding_rule = ?,
        allow_split_users = ?,
        allow_split_dates = ?,
        over_capacity_policy = ?,
        auto_overdue = ?,
        auto_close = ?
      WHERE id = 1
    `).run(
      payload.full_day_minutes,
      payload.half_day_minutes,
      payload.short_leave_minutes,
      payload.working_days,
      payload.office_start,
      payload.office_end,
      payload.default_buffer_pct,
      payload.rounding_rule,
      payload.allow_split_users,
      payload.allow_split_dates,
      payload.over_capacity_policy,
      payload.auto_overdue,
      payload.auto_close
    );
    res.json({ success: true });
  });

  app.get('/api/masters/task-types', (req, res) => {
    const rows = db.prepare(`
      SELECT t.*, m.category, m.buffer_percentage, m.allowed_roles, m.allow_multi_user
           , m.daily_target, m.est_hours_min, m.est_hours_max
      FROM task_types t
      LEFT JOIN task_types_meta m ON m.task_type_id = t.id
      ORDER BY t.id DESC
    `).all();
    res.json(rows);
  });

  app.post('/api/masters/task-types', (req, res) => {
    if (!requireLead(req, res)) return;
    const { name, words_per_hour, allowed_role, category, buffer_percentage, allowed_roles, allow_multi_user, daily_target, est_hours_min, est_hours_max } = req.body;
    const r = db.prepare('INSERT INTO task_types (name, words_per_hour, allowed_role) VALUES (?, ?, ?)').run(name, words_per_hour, allowed_role || 'BOTH');
    db.prepare(`
      INSERT INTO task_types_meta (task_type_id, category, buffer_percentage, allowed_roles, allow_multi_user, daily_target, est_hours_min, est_hours_max)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(r.lastInsertRowid, category || null, buffer_percentage || 0, allowed_roles || null, allow_multi_user ? 1 : 0, daily_target || null, est_hours_min || null, est_hours_max || null);
    res.json({ id: r.lastInsertRowid });
  });

  app.put('/api/masters/task-types/:id', (req, res) => {
    if (!requireLead(req, res)) return;
    const { id } = req.params;
    const { name, words_per_hour, allowed_role, category, buffer_percentage, allowed_roles, allow_multi_user, daily_target, est_hours_min, est_hours_max } = req.body;
    db.prepare('UPDATE task_types SET name = ?, words_per_hour = ?, allowed_role = ? WHERE id = ?')
      .run(name, words_per_hour, allowed_role, id);
    db.prepare(`
      INSERT INTO task_types_meta (task_type_id, category, buffer_percentage, allowed_roles, allow_multi_user, daily_target, est_hours_min, est_hours_max)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_type_id) DO UPDATE SET
        category=excluded.category,
        buffer_percentage=excluded.buffer_percentage,
        allowed_roles=excluded.allowed_roles,
        allow_multi_user=excluded.allow_multi_user,
        daily_target=excluded.daily_target,
        est_hours_min=excluded.est_hours_min,
        est_hours_max=excluded.est_hours_max
    `).run(id, category || null, buffer_percentage || 0, allowed_roles || null, allow_multi_user ? 1 : 0, daily_target || null, est_hours_min || null, est_hours_max || null);
    res.json({ success: true });
  });

  app.delete('/api/masters/task-types/:id', (req, res) => {
    if (!requireLead(req, res)) return;
    const { id } = req.params;
    db.prepare('DELETE FROM task_types_meta WHERE task_type_id = ?').run(id);
    db.prepare('DELETE FROM task_types WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/leave-types', (req, res) => {
    const rows = db.prepare('SELECT * FROM leave_types ORDER BY id DESC').all();
    res.json(rows);
  });

  app.post('/api/leave-types', (req, res) => {
    if (!requireLead(req, res)) return;
    const { name, minutes, require_approval, auto_block } = req.body;
    const r = db.prepare('INSERT INTO leave_types (name, minutes, require_approval, auto_block) VALUES (?, ?, ?, ?)')
      .run(name, minutes, require_approval ? 1 : 0, auto_block ? 1 : 0);
    res.json({ id: r.lastInsertRowid });
  });

  app.put('/api/leave-types/:id', (req, res) => {
    if (!requireLead(req, res)) return;
    const { id } = req.params;
    const { name, minutes, require_approval, auto_block } = req.body;
    db.prepare('UPDATE leave_types SET name = ?, minutes = ?, require_approval = ?, auto_block = ? WHERE id = ?')
      .run(name, minutes, require_approval ? 1 : 0, auto_block ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete('/api/leave-types/:id', (req, res) => {
    if (!requireLead(req, res)) return;
    const { id } = req.params;
    db.prepare('DELETE FROM leave_types WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.post('/api/leaves/apply', (req, res) => {
    if (!requireLead(req, res)) return;
    const { user_id, date, leave_type_id, minutes, approved } = req.body;
    const r = db.prepare('INSERT INTO user_leaves (user_id, date, leave_type_id, minutes, approved) VALUES (?, ?, ?, ?, ?)')
      .run(user_id, date, leave_type_id, minutes, approved ? 1 : 0);
    res.json({ id: r.lastInsertRowid });
  });

  app.get('/api/team-calendar', (req, res) => {
    const { start_date, end_date } = req.query;
    const users = db.prepare("SELECT * FROM users WHERE role = 'MEMBER'").all() as any[];
    const calendarData = users.map(user => {
      const assignments = db.prepare(`
        SELECT a.*, t.name as task_name, t.status as task_status
        FROM assignments a
        JOIN tasks t ON a.task_id = t.id
        WHERE a.user_id = ? AND a.date >= ? AND a.date <= ?
      `).all(user.id, start_date, end_date) as any[];
      
      return {
        ...user,
        assignments
      };
    });
    res.json(calendarData);
  });

  app.get('/api/tasks/:id/assignments', (req, res) => {
    const { id } = req.params;
    const assignments = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      WHERE a.task_id = ?
      ORDER BY a.date ASC
    `).all(id);
    res.json(assignments);
  });

  app.get('/api/task-types', (req, res) => {
    const types = db.prepare('SELECT * FROM task_types').all();
    res.json(types);
  });

  app.get('/api/tasks', (req, res) => {
    const tasks = db.prepare(`
      SELECT tasks.*, task_types.name as type_name 
      FROM tasks 
      JOIN task_types ON tasks.type_id = task_types.id
      ORDER BY tasks.id DESC
    `).all() as any[];

    const tasksWithMembers = tasks.map(task => {
      const members = db.prepare(`
        SELECT u.name, a.minutes_assigned as minutes, a.date,
        (SELECT SUM(minutes_assigned) FROM assignments WHERE user_id = u.id AND date = a.date) as total_day_minutes
        FROM assignments a
        JOIN users u ON a.user_id = u.id
        WHERE a.task_id = ?
      `).all(task.id) as any[];
      return { ...task, assigned_members: members };
    });

    res.json(tasksWithMembers);
  });

  app.post('/api/tasks', (req, res) => {
    const { name, type_id, total_word_count, deadline, priority, source, pm_name, reviewer, ai_requirement } = req.body;
    const type = db.prepare(`
      SELECT t.words_per_hour, m.buffer_percentage
      FROM task_types t LEFT JOIN task_types_meta m ON m.task_type_id = t.id
      WHERE t.id = ?
    `).get(type_id) as any;
    const s = ensureGlobalSettings();
    const bufferPct = (type?.buffer_percentage ?? s.default_buffer_pct) || 0;
    const raw = (total_word_count / type.words_per_hour) * 60;
    const withBuffer = raw * (1 + bufferPct / 100);
    const minutes = applyRounding(withBuffer, s.rounding_rule);
    
    const result = db.prepare(`
      INSERT INTO tasks (name, type_id, total_word_count, total_minutes_required, remaining_minutes, deadline, priority, source, pm_name, reviewer, ai_requirement)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, type_id, total_word_count, minutes, minutes, deadline, priority, source || 'Manual', pm_name, reviewer, ai_requirement);
    
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/capacity/:date', (req, res) => {
    const { date } = req.params;
    const s = ensureGlobalSettings();
    const users = db.prepare("SELECT * FROM users WHERE role = 'MEMBER'").all() as any[];
    const capacityData = users.map(user => {
      const assigned = db.prepare('SELECT SUM(minutes_assigned) as total FROM assignments WHERE user_id = ? AND date = ?')
        .get(user.id, date) as any;
      const leaves = db.prepare('SELECT SUM(minutes) as total FROM user_leaves WHERE user_id = ? AND date = ? AND approved = 1')
        .get(user.id, date) as any;
      const totalAssigned = assigned.total || 0;
      const leaveMins = leaves?.total || 0;
      const base = s.full_day_minutes;
      return {
        ...user,
        assigned: totalAssigned,
        remaining: Math.max(0, base - leaveMins - totalAssigned)
      };
    });
    res.json(capacityData);
  });

  app.post('/api/assignments/bulk', (req, res) => {
    const { task_id, allocations } = req.body; // allocations: [{ user_id, date, minutes_assigned }]
    
    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ error: 'No allocations provided' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task_id) as any;
    const totalToAssign = allocations.reduce((sum, a) => sum + a.minutes_assigned, 0);

    if (totalToAssign > task.remaining_minutes) {
      return res.status(400).json({ error: 'Total allocation exceeds task remaining minutes' });
    }

    try {
      const transaction = db.transaction(() => {
        const s = ensureGlobalSettings();
        for (const allocation of allocations) {
          const { user_id, date, minutes_assigned } = allocation;
          
          // User capacity check
          const assigned = db.prepare('SELECT SUM(minutes_assigned) as total FROM assignments WHERE user_id = ? AND date = ?')
            .get(user_id, date) as any;
          const leaveRow = db.prepare('SELECT SUM(minutes) as total FROM user_leaves WHERE user_id = ? AND date = ? AND approved = 1')
            .get(user_id, date) as any;
          const currentAssigned = assigned.total || 0;
          const leaveMins = leaveRow?.total || 0;
          const base = s.full_day_minutes - leaveMins;
          
          if (s.over_capacity_policy === 'BLOCK' && currentAssigned + minutes_assigned > base) {
            throw new Error(`Capacity exceeded for user ${user_id} on ${date}`);
          }

          db.prepare('INSERT INTO assignments (task_id, user_id, date, minutes_assigned) VALUES (?, ?, ?, ?)')
            .run(task_id, user_id, date, minutes_assigned);
        }

        const newRemaining = task.remaining_minutes - totalToAssign;
        const newStatus = newRemaining === 0 ? 'FULLY_ASSIGNED' : task.status;
        
        db.prepare('UPDATE tasks SET remaining_minutes = ?, status = ? WHERE id = ?')
          .run(newRemaining, newStatus, task_id);
      });

      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/my-tasks/:userId/:date', (req, res) => {
    const { userId, date } = req.params;
    const tasks = db.prepare(`
      SELECT assignments.*, tasks.name as task_name, tasks.total_word_count, tasks.deadline, task_types.words_per_hour
      FROM assignments
      JOIN tasks ON assignments.task_id = tasks.id
      JOIN task_types ON tasks.type_id = task_types.id
      WHERE assignments.user_id = ? AND assignments.date = ?
    `).all(userId, date);
    res.json(tasks);
  });

  app.post('/api/assignments/:id/submit', (req, res) => {
    const { id } = req.params;
    const { actual_word_count, content } = req.body;
  db.prepare('UPDATE assignments SET status = ?, actual_word_count = ?, content = ? WHERE id = ?')
    .run('SUBMITTED', actual_word_count, content, id);
    res.json({ success: true });
  });

  app.get('/api/reports/utilization', (req, res) => {
    const stats = db.prepare(`
      SELECT 
        u.name,
        SUM(a.minutes_assigned) as total_minutes,
        AVG(CAST(a.minutes_assigned AS FLOAT) / u.base_capacity * 100) as avg_utilization
      FROM users u
      LEFT JOIN assignments a ON u.id = a.user_id
      WHERE u.role = 'MEMBER'
      GROUP BY u.id
    `).all();
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(process.env.PORT || 3001, () => {
    console.log(`Server running at http://localhost:${process.env.PORT || 3001}`);
  });
}

startServer();
