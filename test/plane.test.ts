// Checks that plane.ts refuses unsafe requests before the token can leave the machine.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';

const script = new URL('../skills/plane/scripts/plane.ts', import.meta.url).pathname;

function run(baseUrl: string, ...args: string[]): Promise<{ code: number; stderr: string }> {
  const env = { PATH: process.env.PATH, PLANE_BASE_URL: baseUrl, PLANE_WORKSPACE: 'ws', PLANE_TOKEN_FOR_AI: 'test-token' };
  return new Promise((resolve) => {
    execFile(process.execPath, [script, ...args], { env }, (error, _stdout, stderr) => {
      resolve({ code: error ? Number(error.code) : 0, stderr });
    });
  });
}

async function listen(server: Server): Promise<string> {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

test('refuses DELETE before sending anything', async () => {
  const result = await run('https://plane.invalid', 'api', 'delete', '/workspaces/{ws}/projects/p/issues/i/');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /does not send DELETE/);
});

test('refuses a base URL without https', async () => {
  const result = await run('http://plane.example.com', 'api', 'GET', '/users/me/');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /must start with https/);
});

test('refuses a base URL that is not a URL', async () => {
  const result = await run('plane.example.com', 'api', 'GET', '/users/me/');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /not a URL/);
});

test('does not follow a redirect, so the token never reaches the other host', async () => {
  const received: IncomingHttpHeaders[] = [];
  const elsewhere = createServer((request, response) => {
    received.push(request.headers);
    response.end('{}');
  });
  const elsewhereUrl = await listen(elsewhere);
  const plane = createServer((_request, response) => {
    response.writeHead(302, { location: `${elsewhereUrl}/collect` }).end();
  });
  const planeUrl = await listen(plane);
  try {
    const result = await run(planeUrl, 'api', 'GET', '/users/me/');
    assert.equal(result.code, 1);
    assert.match(result.stderr, /302 redirect/);
    assert.deepEqual(received, []);
  } finally {
    plane.close();
    elsewhere.close();
  }
});
