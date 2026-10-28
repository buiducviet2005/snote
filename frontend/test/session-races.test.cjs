const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

let moduleId = 0;
const source = readFileSync(resolve(__dirname, '../src/services/api.ts'), 'utf8');
const compiled = ts.transpileModule(source.replace('import.meta.env.VITE_API_BASE_URL', "'http://test/api'"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
function response(data, status = 200) {
  return new Response(JSON.stringify({ success: status < 400, data }), { status });
}
function payload(id) { return { accessToken: `token-${id}`, user: { id } }; }
function tick() { return new Promise((done) => setImmediate(done)); }
async function setup(t, fetch, globals = {}) {
  const replacements = { fetch, ...globals };
  const previous = Object.fromEntries(Object.keys(replacements).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.entries(replacements).forEach(([key, value]) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }));
  t.after(() => Object.entries(previous).forEach(([key, descriptor]) => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }));
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${moduleId++}`);
}
const login = (client, path = 'login') => client.api.post(`/auth/${path}`, {});

test('bootstrap uses only the HttpOnly cookie and removes legacy persisted tokens', async (t) => {
  const removed = [];
  const calls = [];
  const client = await setup(t, (url, init) => {
    calls.push({ url, init });
    return Promise.resolve(response(payload('cookie')));
  }, { localStorage: {
    removeItem: (key) => removed.push(key),
    getItem: (key) => {
      assert.equal(key, 'snote_logout_pending');
      return null;
    },
    setItem: () => assert.fail('must never persist tokens')
  } });
  assert.equal(client.getStoredToken(), null);
  const [first, second] = await Promise.all([client.refreshSession(), client.refreshSession()]);
  assert.deepEqual(first, second);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://test/api/auth/refresh');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.equal(client.getStoredToken(), 'token-cookie');
  assert.deepEqual(removed, ['snote_token']);
});

test('pending refresh cannot restore a session after logout starts; cookie writes are serialized', async (t) => {
  const refresh = deferred();
  const logout = deferred();
  const calls = [];
  const client = await setup(t, (url) => {
    calls.push(url);
    return url.endsWith('/refresh') ? refresh.promise : logout.promise;
  });
  const pending = client.refreshSession();
  const rejected = assert.rejects(pending, { code: 'SESSION_CHANGED' });
  await tick();
  const ending = client.api.post('/auth/logout', {});
  assert.equal(client.getStoredToken(), null);
  await tick();
  assert.equal(calls.length, 1);
  refresh.resolve(response(payload('old')));
  await rejected;
  await tick();
  assert.equal(calls.length, 2);
  logout.resolve(response(null));
  await ending;
  assert.equal(client.getSessionSnapshot().session, null);
});

for (const status of [200, 401]) {
  test(`old refresh (${status}) cannot overwrite a newer login`, async (t) => {
    const refresh = deferred();
    const client = await setup(t, (url) => url.endsWith('/refresh') ? refresh.promise : Promise.resolve(response(payload('new'))));
    const pending = client.refreshSession();
    const rejected = assert.rejects(pending);
    await tick();
    const signingIn = login(client);
    refresh.resolve(response(payload('old'), status));
    await rejected;
    await signingIn;
    assert.equal(client.getSessionSnapshot().session.user.id, 'new');
  });
}

for (const method of ['login', 'register', 'google']) {
  test(`failed anonymous ${method} preserves the mounted auth form`, async (t) => {
    const client = await setup(t, () => Promise.resolve(response(null, 401)));
    const initial = client.getSessionSnapshot();
    await assert.rejects(login(client, method), { status: 401 });
    assert.equal(client.getSessionSnapshot().boundary, initial.boundary);
    assert.equal(client.getSessionSnapshot().session, null);
  });

  test(`${method} writes cookies before a newer login; stale results stay unpublished`, async (t) => {
    const old = deferred();
    const calls = [];
    const client = await setup(t, (url) => {
      calls.push(url);
      return calls.length === 1 ? old.promise : Promise.resolve(response(payload('new')));
    });
    const signingIn = login(client, method);
    const rejected = assert.rejects(signingIn, { code: 'SESSION_CHANGED' });
    await tick();
    const latest = login(client);
    await tick();
    assert.equal(calls.length, 1);
    old.resolve(response(payload('old')));
    await rejected;
    await latest;
    assert.equal(calls.length, 2);
    assert.equal(client.getStoredToken(), 'token-new');
  });
}

for (const status of [200, 401]) {
  test(`refresh queued during ${status === 200 ? 'successful' : 'failed'} login never sends an old cookie`, async (t) => {
    const result = deferred();
    const calls = [];
    const client = await setup(t, (url) => { calls.push(url); return result.promise; });
    const signingIn = login(client);
    const done = status === 200 ? signingIn : assert.rejects(signingIn, { status: 401 });
    await tick();
    const queued = client.refreshSession();
    const rejected = assert.rejects(queued, { code: 'SESSION_CHANGED' });
    result.resolve(response(payload('account'), status));
    await done;
    await rejected;
    assert.equal(calls.length, 1);
  });
}

test('late logout completion does not clear a newer login', async (t) => {
  const logout = deferred();
  const client = await setup(t, (url) => url.endsWith('/logout') ? logout.promise : Promise.resolve(response(payload('new'))));
  const ending = client.api.post('/auth/logout', {});
  const rejected = assert.rejects(ending, { code: 'SESSION_CHANGED' });
  await tick();
  const signingIn = login(client);
  logout.resolve(response(null));
  await rejected;
  await signingIn;
  assert.equal(client.getStoredToken(), 'token-new');
});

test('an old refresh completion cannot detach the current shared refresh', async (t) => {
  const old = deferred();
  const current = deferred();
  let refreshCount = 0;
  const client = await setup(t, (url) => {
    if (url.endsWith('/refresh')) return ++refreshCount === 1 ? old.promise : current.promise;
    return Promise.resolve(response(payload('new')));
  });
  const pending = client.refreshSession();
  const rejected = assert.rejects(pending, { code: 'SESSION_CHANGED' });
  await tick();
  const signingIn = login(client);
  const queued = client.refreshSession();
  const queuedRejected = assert.rejects(queued, { code: 'SESSION_CHANGED' });
  old.resolve(response(payload('old')));
  await rejected;
  await signingIn;
  await queuedRejected;
  const first = client.refreshSession();
  const second = client.refreshSession();
  await tick();
  assert.equal(refreshCount, 2);
  current.resolve(response(payload('fresh')));
  assert.deepEqual(await first, await second);
});

for (const status of [200, 401]) {
  test(`previous account delayed ${status} cannot return data or retry with a new token`, async (t) => {
    const notes = deferred();
    let count = 0;
    const client = await setup(t, (url) => {
      if (url.endsWith('/notes')) { count += 1; return notes.promise; }
      return Promise.resolve(response(payload('account')));
    });
    await login(client);
    const pending = client.api.get('/notes');
    const rejected = assert.rejects(pending, { code: 'SESSION_CHANGED' });
    await login(client);
    notes.resolve(response({ private: 'old data' }, status));
    await rejected;
    assert.equal(count, 1);
  });
}

test('logout during JSON decoding discards old data', async (t) => {
  const body = deferred();
  const client = await setup(t, (url) => url.endsWith('/notes')
    ? Promise.resolve({ ok: true, status: 200, json: () => body.promise })
    : Promise.resolve(response(payload('account'))));
  await login(client);
  const pending = client.api.get('/notes');
  const rejected = assert.rejects(pending, { code: 'SESSION_CHANGED' });
  await tick();
  await client.api.post('/auth/logout', {});
  body.resolve({ data: 'old account data' });
  await rejected;
});

test('simultaneous and delayed 401s share one refresh and retry with its token', async (t) => {
  const refresh = deferred();
  const delayed = deferred();
  let refreshCount = 0;
  const calls = [];
  const client = await setup(t, (url, init) => {
    if (url.endsWith('/login')) return Promise.resolve(response(payload('old')));
    if (url.endsWith('/refresh')) { refreshCount += 1; return refresh.promise; }
    calls.push(init.headers.Authorization);
    if (init.headers.Authorization === 'Bearer token-fresh') return Promise.resolve(response('ok'));
    return url.endsWith('/delayed') ? delayed.promise : Promise.resolve(response(null, 401));
  });
  await login(client);
  const first = client.api.get('/first');
  const second = client.api.get('/second');
  const late = client.api.get('/delayed');
  await tick();
  assert.equal(refreshCount, 1);
  refresh.resolve(response(payload('fresh')));
  await Promise.all([first, second]);
  delayed.resolve(response(null, 401));
  await late;
  assert.equal(refreshCount, 1);
  assert.equal(calls.filter((token) => token === 'Bearer token-fresh').length, 3);
});

test('refresh failure clears local session and all waiting requests fail', async (t) => {
  let refreshCount = 0;
  const client = await setup(t, (url) => {
    if (url.endsWith('/login')) return Promise.resolve(response(payload('old')));
    if (url.endsWith('/refresh')) refreshCount += 1;
    return Promise.resolve(response(null, 401));
  });
  await login(client);
  const results = await Promise.allSettled([client.api.get('/notes'), client.api.get('/tasks')]);
  assert.ok(results.every((result) => result.status === 'rejected'));
  assert.equal(client.getStoredToken(), null);
  assert.equal(refreshCount, 1);
});

test('403 preserves backend error shape and does not refresh', async (t) => {
  const calls = [];
  const client = await setup(t, (url) => {
    calls.push(url);
    if (url.endsWith('/login')) return Promise.resolve(response(payload('account')));
    return Promise.resolve(new Response(JSON.stringify({ error: {
      message: 'Forbidden', code: 'FORBIDDEN', details: { resource: 'notes' }
    } }), { status: 403 }));
  });
  await login(client);
  await assert.rejects(client.api.get('/notes'), { message: 'Forbidden', status: 403, code: 'FORBIDDEN', details: { resource: 'notes' } });
  assert.equal(calls.length, 2);
  assert.equal(client.getStoredToken(), 'token-account');
});

test('a retry 401 fails after exactly one refresh', async (t) => {
  const calls = [];
  const client = await setup(t, (url) => {
    calls.push(url);
    return Promise.resolve(url.endsWith('/login') || url.endsWith('/refresh')
      ? response(payload('account')) : response(null, 401));
  });
  await login(client);
  await assert.rejects(client.api.get('/notes'), { status: 401 });
  assert.equal(calls.filter((url) => url.endsWith('/refresh')).length, 1);
  assert.equal(calls.filter((url) => url.endsWith('/notes')).length, 2);
});

function downloadGlobals(events) {
  return {
    window: { URL: {
      createObjectURL: () => { events.push('create'); return 'blob:test'; },
      revokeObjectURL: (url) => events.push(['revoke', url])
    } },
    document: {
      createElement: () => ({ click() { events.push(['click', this.href, this.download]); } }),
      body: { appendChild: () => events.push('append'), removeChild: () => events.push('remove') }
    }
  };
}

test('download refreshes once, uses a raw blob, preserves filename and cleans up', async (t) => {
  const events = [];
  const client = await setup(t, (url, init) => {
    if (url.endsWith('/login')) return Promise.resolve(response(payload('old')));
    if (url.endsWith('/refresh')) return Promise.resolve(response(payload('fresh')));
    assert.equal(init.headers['Content-Type'], undefined);
    return Promise.resolve(init.headers.Authorization === 'Bearer token-fresh'
      ? new Response('export bytes') : response(null, 401));
  }, downloadGlobals(events));
  await login(client);
  await client.api.download('/export', 'snote.json');
  assert.deepEqual(events, ['create', 'append', ['click', 'blob:test', 'snote.json'], ['revoke', 'blob:test'], 'remove']);
});

test('logout during blob decoding cannot download previous account data', async (t) => {
  const blob = deferred();
  const events = [];
  const client = await setup(t, (url) => url.endsWith('/export')
    ? Promise.resolve({ ok: true, status: 200, blob: () => blob.promise })
    : Promise.resolve(response(payload('account'))), downloadGlobals(events));
  await login(client);
  const pending = client.api.download('/export', 'private.json');
  const rejected = assert.rejects(pending, { code: 'SESSION_CHANGED' });
  await tick();
  await client.api.post('/auth/logout', {});
  blob.resolve(new Blob(['private bytes']));
  await rejected;
  assert.deepEqual(events, []);
});

test('session boundary changes on logout/account replacement and stays stable on token refresh', async (t) => {
  const client = await setup(t, () => Promise.resolve(response(payload('account'))));
  const initial = client.getSessionSnapshot().boundary;
  await login(client);
  const authenticated = client.getSessionSnapshot().boundary;
  assert.notEqual(initial, authenticated);
  await client.refreshSession();
  assert.equal(client.getSessionSnapshot().boundary, authenticated);
  await client.api.post('/auth/logout', {});
  assert.notEqual(client.getSessionSnapshot().boundary, authenticated);
});

function browserStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}
function reloadClient() {
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${moduleId++}`);
}

for (const failure of ['offline', 'server']) {
  test(`${failure} logout remains pending across reload; retry precedes any cookie refresh`, async (t) => {
    const storage = browserStorage();
    const calls = [];
    let online = false;
    const client = await setup(t, (url) => {
      calls.push(url);
      if (url.endsWith('/login')) return Promise.resolve(response(payload('account')));
      if (url.endsWith('/logout')) {
        if (online) return Promise.resolve(response(null));
        return failure === 'offline' ? Promise.reject(new TypeError('Offline')) : Promise.resolve(response(null, 500));
      }
      assert.fail('must not refresh while logout is pending');
    }, { localStorage: storage });
    await login(client);
    const ending = client.api.post('/auth/logout', {});
    assert.equal(client.getStoredToken(), null);
    assert.equal(storage.getItem('snote_logout_pending'), '1');
    await assert.rejects(ending, { code: 'LOGOUT_NOT_CONFIRMED' });
    const reloaded = await reloadClient();
    await assert.rejects(reloaded.bootstrapSession(), { code: 'LOGOUT_NOT_CONFIRMED' });
    assert.equal(reloaded.getSessionSnapshot().session, null);
    await assert.rejects(reloaded.refreshSession(), { code: 'LOGOUT_NOT_CONFIRMED' });
    assert.equal(storage.getItem('snote_logout_pending'), '1');
    online = true;
    assert.equal(await reloaded.bootstrapSession(), null);
    assert.equal(storage.getItem('snote_logout_pending'), null);
    assert.equal(reloaded.getStoredToken(), null);
    assert.deepEqual(calls.map((url) => url.split('/').at(-1)), ['login', 'logout', 'logout', 'logout']);
  });
}

test('new login must confirm a pending logout before attempting authentication', async (t) => {
  const storage = browserStorage();
  storage.setItem('snote_logout_pending', '1');
  const calls = [];
  const client = await setup(t, (url) => {
    calls.push(url);
    return Promise.resolve(url.endsWith('/logout') ? response(null) : response(payload('new')));
  }, { localStorage: storage });
  await login(client);
  assert.deepEqual(calls.map((url) => url.split('/').at(-1)), ['logout', 'login']);
  assert.equal(client.getStoredToken(), 'token-new');
  assert.equal(storage.getItem('snote_logout_pending'), null);
});

// A small hook runner exercises the real provider and LoginPage sources. It applies
// React's keyed-subtree identity rule and state/effect lifecycle without a DOM dependency.
function authFormLifecycle(client) {
  let current;
  let authValue;
  let lastKey;
  let formState = [];
  const providerState = [];
  const effects = [];
  const cleanups = [];
  let mounted = false;
  const React = {
    Fragment: Symbol('Fragment'),
    createContext: () => ({ Provider: Symbol('Provider') }),
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useContext: () => authValue,
    useState: (initial) => {
      const frame = current;
      const index = frame.index++;
      if (!(index in frame.state)) frame.state[index] = typeof initial === 'function' ? initial() : initial;
      return [frame.state[index], (value) => {
        frame.state[index] = typeof value === 'function' ? value(frame.state[index]) : value;
      }];
    },
    useEffect: (effect) => { if (!mounted) effects.push(effect); }
  };
  const reactModule = { ...React, default: React, __esModule: true };
  function load(relativePath, dependencies) {
    const input = readFileSync(resolve(__dirname, relativePath), 'utf8');
    const output = ts.transpileModule(input, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React }
    }).outputText;
    const exports = {};
    new Function('require', 'exports', output)((name) => {
      if (name === 'react') return reactModule;
      if (name in dependencies) return dependencies[name];
      // Icons and GoogleSignInButton render as opaque children in this form test.
      return new Proxy({}, { get: (_, key) => key });
    }, exports);
    return exports;
  }
  const auth = load('../src/contexts/AuthContext.tsx', {
    '../services/api': client, '@snote/shared': { UserRole: { ADMIN: 'ADMIN' } }
  });
  const { LoginPage } = load('../src/features/auth/pages/LoginPage.tsx', {
    '../../../contexts/AuthContext': auth,
    'react-router-dom': { useNavigate: () => () => {}, Link: 'Link' }
  });
  function render() {
    current = { state: providerState, index: 0 };
    const provider = auth.AuthProvider({ children: null });
    authValue = provider.props.value;
    const fragment = provider.props.children[0];
    if (lastKey !== fragment.props.key) {
      formState = [];
      lastKey = fragment.props.key;
    }
    current = { state: formState, index: 0 };
    const form = LoginPage();
    return { form, key: lastKey };
  }
  return {
    render,
    mount: () => {
      render();
      effects.splice(0).forEach((effect) => cleanups.push(effect()));
      mounted = true;
    },
    unmount: () => cleanups.forEach((cleanup) => cleanup?.())
  };
}
function findElement(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of node.props?.children?.flat(Infinity) ?? []) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
}
function textContent(node) {
  if (typeof node === 'string') return node;
  return (node?.props?.children?.flat(Infinity) ?? []).map(textContent).join('');
}

test('invalid login preserves the mounted form, entered credentials and visible server error', async (t) => {
  const result = deferred();
  const client = await setup(t, (url) => url.endsWith('/login') ? result.promise : Promise.resolve(response(null, 401)));
  const view = authFormLifecycle(client);
  t.after(view.unmount);
  view.mount();
  await tick();
  let { form, key } = view.render();
  findElement(form, (node) => node.type === 'input' && node.props.type === 'email').props.onChange({ target: { value: 'student@example.com' } });
  findElement(form, (node) => node.type === 'input' && node.props.type === 'password').props.onChange({ target: { value: 'wrong-password' } });
  form = view.render().form;
  const submit = findElement(form, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} });
  const during = view.render();
  assert.equal(during.key, key);
  assert.equal(findElement(during.form, (node) => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  result.resolve(new Response(JSON.stringify({ error: { message: 'Email hoặc mật khẩu không đúng' } }), { status: 401 }));
  await submit;
  const after = view.render();
  assert.equal(after.key, key);
  assert.equal(findElement(after.form, (node) => node.type === 'input' && node.props.type === 'email').props.value, 'student@example.com');
  assert.equal(findElement(after.form, (node) => node.type === 'input' && node.props.type === 'password').props.value, 'wrong-password');
  assert.equal(findElement(after.form, (node) => node.type === 'button' && node.props.type === 'submit').props.disabled, false);
  assert.match(textContent(after.form), /Email hoặc mật khẩu không đúng/);
});
