import test from 'node:test';
import assert from 'node:assert/strict';
import { localTestingEnabled, localRequestAllowed, identityHeaders, LOCAL_TEST_USER } from '../lib/local-testing';

test('local access requires explicit development mode and cannot run on Vercel', () => {
  assert.equal(localTestingEnabled({NODE_ENV:'development',SEARCHSCOPE_LOCAL_TESTING:'1'}), true);
  for (const env of [
    {NODE_ENV:'development'},
    {NODE_ENV:'production',SEARCHSCOPE_LOCAL_TESTING:'1'},
    {NODE_ENV:'test',SEARCHSCOPE_LOCAL_TESTING:'1'},
    {NODE_ENV:'development',SEARCHSCOPE_LOCAL_TESTING:'1',VERCEL:'1'},
    {NODE_ENV:'development',SEARCHSCOPE_LOCAL_TESTING:'1',VERCEL:'0'},
  ]) assert.equal(localTestingEnabled(env), false);
});
test('testing access is restricted to loopback hosts', () => {
  for (const url of ['http://localhost:3000','http://127.0.0.1:3000','http://[::1]:3000']) assert.equal(localRequestAllowed(url),true);
  for (const url of ['https://search-scope-rouge.vercel.app','http://192.168.0.1:3000','http://localhost.attacker.example','http://localhost@attacker.example']) assert.equal(localRequestAllowed(url),false);
});
test('client-supplied identity cannot select a different account', () => {
  const headers = new Headers({'oai-authenticated-user-id':'github:victim','oai-authenticated-user-email':'victim@example.com','oai-authenticated-user-full-name':'Victim','oai-authenticated-user-full-name-encoding':'fake','accept':'application/json'});
  const anonymous = identityHeaders(headers);
  assert.equal(anonymous.get('oai-authenticated-user-id'), null);
  assert.equal(anonymous.get('oai-authenticated-user-email'), null);
  assert.equal(anonymous.get('oai-authenticated-user-full-name'), null);
  assert.equal(anonymous.get('oai-authenticated-user-full-name-encoding'), null);
  assert.equal(anonymous.get('accept'), 'application/json');
  const local = identityHeaders(headers, LOCAL_TEST_USER);
  assert.equal(local.get('oai-authenticated-user-id'), LOCAL_TEST_USER.id);
  assert.equal(local.get('oai-authenticated-user-email'), LOCAL_TEST_USER.email);
  assert.equal(headers.get('oai-authenticated-user-id'), 'github:victim');
});
