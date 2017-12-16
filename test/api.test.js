import { init } from '../src/index';

function prom() {
  return Promise.resolve({status: 200})
}

it('returns status 200', () => {
  expect.assertions(1);
  expect(prom()).resolves.toEqual({status: 200})
})