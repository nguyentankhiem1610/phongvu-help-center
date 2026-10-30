import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { performAuthAction, loadProfile } from '../../.next/auth-tests/views/api/auth-actions.js';
const requireConfig = createRequire(import.meta.url);

const user = { id: '11111111-1111-4111-8111-111111111111', email: 'customer@example.test', user_metadata: {} };
const origin = 'http://localhost:3000';
const input = { email: 'Customer@example.test ', password: 'Demo-password-123', full_name: 'Khách thử nghiệm', phone: '0901234567' };
function fixture(role = 'Customer') {
  const calls = [];
  const state = {
    row: { id: user.id, full_name: input.full_name, email: user.email,
      phone_number: input.phone, address: '', role, is_active: true },
    authError: null, session: null,
  };
  const result = data => ({ data, error: state.authError });
  const client = {
    auth: {
      signUp: async payload => { calls.push(['signup',payload]); return result({ user,session:state.session }); },
      signInWithPassword: async payload => { calls.push(['login',payload]); return result({ user }); },
      signOut: async payload => { calls.push(['logout',payload]); return {error:null}; },
      resetPasswordForEmail: async (...payload) => { calls.push(['forgot',...payload]); return {error:null}; },
      updateUser: async payload => { calls.push(['updateUser',payload]); return {error:null}; },
      reauthenticate: async () => ({error:null}),
      getUser: async () => result({ user }),
    },
    from(table) {
      calls.push(['from',table]);
      return {
        select() { return this; },
        eq(column,value) { calls.push(['eq',column,value]); return this; },
        update(payload) { calls.push(['update',payload]); return this; },
        async maybeSingle() { return {data:state.row,error:null}; },
        then(resolve,reject) { return Promise.resolve({error:null}).then(resolve,reject); },
      };
    },
  };
  return {client,state,calls};
}

test('SDK thật gửi POST signup đến Auth cùng metadata và URL xác nhận; không gửi role', async () => {
  const requests = [];
  const client = createClient('https://auth-test.example.invalid','sb_publishable_test_key',{
    auth: {persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global: {fetch: async (url,options) => {
      requests.push({url:String(url),options});
      return new Response(JSON.stringify({...user,identities:[{id:user.id}]}),{
        status:200,headers:{'Content-Type':'application/json'},
      });
    }},
  });
  const result = await performAuthAction(client,'register',input,origin);
  assert.equal(result.verification,true);
  assert.equal(requests.length,1);
  const request = requests[0];
  assert.equal(new URL(request.url).pathname,'/auth/v1/signup');
  assert.equal(request.options.method,'POST');
  const body=JSON.parse(request.options.body);
  assert.equal(body.email,'customer@example.test');
  assert.equal(body.password,input.password);
  assert.deepEqual(body.data,{full_name:input.full_name,phone:input.phone});
  assert.equal(new URL(request.url).searchParams.get('redirect_to'),`${origin}/login`);
});
test('Đăng ký có session thì đọc hồ sơ thật và chuyển đúng không gian', async () => {
  const f=fixture(); f.state.session={user};
  const result=await performAuthAction(f.client,'register',input,origin);
  assert.equal(result.verification,false);
  assert.equal(result.redirectTo,'/customer');
  assert.ok(f.calls.some(c=>c[0]==='from' && c[1]==='users'));
});
test('Đăng ký sai dữ liệu không gọi SDK và không thông báo thành công', async () => {
  const f=fixture();
  await assert.rejects(()=>performAuthAction(f.client,'register',{...input,phone:'123'},origin),/Kiểm tra họ tên/);
  assert.equal(f.calls.length,0);
});
test('Supabase từ chối đăng ký thì truyền lỗi và không tạo session giả', async () => {
  const f=fixture(); f.state.authError={code:'signup_disabled',message:'Signups disabled'};
  await assert.rejects(()=>performAuthAction(f.client,'register',input,origin),/đang tắt đăng ký/);
});
test('Sai mật khẩu hiển thị lỗi; không fallback tài khoản demo', async () => {
  const f=fixture(); f.state.authError={code:'invalid_credentials'};
  await assert.rejects(()=>performAuthAction(f.client,'login',input,origin),/Email hoặc mật khẩu/);
  assert.equal(f.calls.filter(c=>c[0]==='from').length,0);
});
test('Role lấy từ public.users, bỏ qua role giả trong metadata', async () => {
  const f=fixture();
  const profile=await loadProfile(f.client,{...user,user_metadata:{role:'Manager'}});
  assert.equal(profile.role,'customer');
});
test('Thiếu hồ sơ DB hoặc tài khoản vô hiệu không đăng nhập thành công', async () => {
  const f=fixture(); f.state.row=null;
  await assert.rejects(()=>performAuthAction(f.client,'login',input,origin),/public.users/);
  assert.ok(f.calls.some(c=>c[0]==='logout'));
  f.state.row={role:'Customer',is_active:false};
  await assert.rejects(()=>loadProfile(f.client,user),/vô hiệu hóa/);
});
test('Customer không đăng nhập nhân viên; Manager chuyển /admin', async () => {
  const f=fixture();
  await assert.rejects(()=>performAuthAction(f.client,'staff_login',input,origin),/chưa được cấp quyền/);
  assert.ok(f.calls.some(c=>c[0]==='logout' && c[1].scope==='local'));
  f.state.row.role='Manager';
  assert.equal((await performAuthAction(f.client,'staff_login',input,origin)).redirectTo,'/admin');
});
test('Đăng xuất gọi Auth signOut', async () => {
  const f=fixture();
  await performAuthAction(f.client,'logout',{},origin);
  assert.deepEqual(f.calls,[['logout',{scope:'local'}]]);
});
test('Khôi phục mật khẩu gửi đúng URL trả về', async () => {
  const f=fixture();
  const result=await performAuthAction(f.client,'forgot_password',{email:user.email},origin);
  assert.deepEqual(f.calls,[['forgot',user.email,{redirectTo:`${origin}/reset-password`}]]);
  assert.match(result.message,/Nếu email đã đăng ký/);
});
test('Đổi mật khẩu gửi current_password và kết thúc các phiên', async () => {
  const f=fixture();
  await performAuthAction(f.client,'change_password',{password:input.password,current_password:'old-password'},origin);
  assert.deepEqual(f.calls,[['updateUser',{password:input.password,current_password:'old-password'}],['logout',{scope:'global'}]]);
});
test('Cập nhật hồ sơ chỉ ghi ba cột cho user hiện tại', async () => {
  const f=fixture();
  await performAuthAction(f.client,'profile',{full_name:'Tên mới',phone:input.phone,address:'Địa chỉ',role:'Manager'},origin);
  assert.deepEqual(f.calls.find(c=>c[0]==='update')[1],{full_name:'Tên mới',phone_number:input.phone,address:'Địa chỉ'});
  assert.ok(f.calls.some(c=>c[0]==='eq' && c[1]==='id' && c[2]===user.id));
});
test('URL/key mẫu hoặc secret key bị chặn trước khi tạo client', () => {
  const modulePath=requireConfig.resolve('../../.next/auth-tests/views/api/supabase-client.js');
  const keys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const previous=keys.map(k=>process.env[k]);
  function config(url,key) {
    process.env.NEXT_PUBLIC_SUPABASE_URL=url;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=key;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete requireConfig.cache[modulePath];
    return requireConfig(modulePath);
  }
  try {
    assert.throws(()=>config('https://your-project.supabase.co','sb_publishable_your_key_here').getSupabaseClient(),/Chưa cấu hình/);
    assert.throws(()=>config('https://real-project.supabase.co','sb_secret_wrong').getSupabaseClient(),/Publishable key/);
    assert.throws(()=>config('invalid','sb_publishable_test').getSupabaseClient(),/URL hợp lệ/);
  } finally {
    keys.forEach((key,i)=>previous[i]===undefined ? delete process.env[key] : process.env[key]=previous[i]);
    delete requireConfig.cache[modulePath];
  }
});
