const { login } = await import('./src/controllers/auth.controller.js');
const req = {
  body: {
    tenant_id: '1',
    username: 'Admin Delhi',
    pin: '1234',
    device_token: 'dummy-token'
  }
};
const res = {
  json: console.log,
  status: (code) => { console.log('STATUS', code); return { json: console.log }; }
};
login(req, res).catch(console.error);
