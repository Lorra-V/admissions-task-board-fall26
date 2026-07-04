import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTask, getTasks, updateTask, _resetForTests } from '../src/store.js';

beforeEach(() => _resetForTests());

describe('store', () => {
  it('creates a task with id and title', () => {
    const task = createTask('  Write tests  ');
    assert.equal(task.title, 'Write tests');
    assert.equal(task.completed, false);
    assert.equal(task.id, 1);
  });

  it('getTasks returns a copy (not mutable reference)', () => {
    createTask('A');
    const list = getTasks();
    list.push({ id: 999, title: 'hack', completed: false });
    assert.equal(getTasks().length, 1);
  });

  it('updateTask merges patch without dropping fields', () => {
    createTask('Keep title');
    const updated = updateTask(1, { completed: true });
    assert.equal(updated.title, 'Keep title');
    assert.equal(updated.completed, true);
  });
});

describe('DELETE /api/tasks/:id', () => {
  let server;
  let port;

  before(async () => {
    const { app } = await import('../src/server.js');
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    port = server.address().port;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it('deletes an existing task', async () => {
    await fetch(`http://127.0.0.1:${port}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Remove me' }),
    });
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks/1`, { method: 'DELETE' });
    assert.equal(res.status, 204);
    const listRes = await fetch(`http://127.0.0.1:${port}/api/tasks`);
    const { tasks } = await listRes.json();
    assert.equal(tasks.length, 0);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks/999`, { method: 'DELETE' });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'not found');
  });
});
