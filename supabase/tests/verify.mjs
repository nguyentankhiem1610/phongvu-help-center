// PostgreSQL nhung; cac schema Auth/Storage duoi day chi la test doubles.
// Khong ket noi hay ghi du lieu len Supabase that.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
let passed = 0;
const ids = {
  customer: '10000000-0000-0000-0000-000000000001',
  other: '10000000-0000-0000-0000-000000000002',
  manager: '10000000-0000-0000-0000-000000000003',
  technician: '10000000-0000-0000-0000-000000000004',
  otherTechnician: '10000000-0000-0000-0000-000000000005',
};
async function check(name, fn) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}
async function as(role, id, sql, params = []) {
  await db.exec(`set role ${role};`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [id || '']);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role');
    await db.exec(`select set_config('request.jwt.claim.sub', '', false)`);
  }
}
async function call(who, sql, params = []) {
  return as('authenticated', ids[who], sql, params);
}
async function reject(fn, pattern) {
  await assert.rejects(fn, pattern);
}

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    grant usage on schema auth to anon, authenticated, service_role;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
    $$;
    create schema storage;
    grant usage on schema storage to authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    insert into auth.users(id,email,raw_user_meta_data) values
      ('${ids.manager}','manager@example.invalid','{"full_name":"Quản lý mẫu"}');
  `);
  const setup = await readFile(new URL('../setup.sql', import.meta.url), 'utf8');
  await check('Script hoàn chỉnh chạy trên PostgreSQL và commit', () => db.exec(setup));
  await check('Seed đủ danh mục và 6 lịch / 3 phiếu / 3 chi tiết', async () => {
    for (const [table, expected] of Object.entries({ services:4,popular_laptops:7,common_issues:6,
      components:6,appointments:6,repair_orders:3,repair_order_details:3 })) {
      assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n, expected);
    }
  });
  await check('Backfill Auth và trigger đăng ký không cho tự chọn Manager', async () => {
    for (const who of ['customer','other','technician','otherTechnician']) {
      await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)`,
        [ids[who],`${who}@example.invalid`,JSON.stringify({full_name:who,role:'Manager'})]);
    }
    assert.equal((await db.query(`select count(*)::int n from public.users where role='Customer'`)).rows[0].n,5);
    await db.query(`update public.users set role='Manager' where id=$1`,[ids.manager]);
    await db.query(`update public.users set role='Technician' where id=any($1::uuid[])`,[[ids.technician,ids.otherTechnician]]);
  });
  await check('Anon đọc danh mục, không đọc PII và không gọi RPC', async () => {
    assert.equal((await as('anon',null,'select * from public.services')).rows.length,4);
    await reject(()=>as('anon',null,'select * from public.appointments'),/permission denied/);
    await reject(()=>as('anon',null,'select public.receive_device(gen_random_uuid())'),/permission denied/);
  });
  await check('Khách sửa hồ sơ của mình nhưng không tự nâng quyền', async () => {
    await call('customer',`update public.users set full_name='Khách thử nghiệm' where id=$1`,[ids.customer]);
    await reject(()=>call('customer',`update public.users set role='Manager' where id=$1`,[ids.customer]),/permission denied/);
    await reject(()=>call('customer',`update public.users set is_active=false where id=$1`,[ids.customer]),/permission denied/);
    assert.equal((await call('customer','select * from public.users')).rows.length,1);
  });

  // Tao ngay mai luc 09:00 theo Viet Nam, khong phu thuoc timezone may chay.
  const scheduled = (await db.query(`select (((now() at time zone 'Asia/Ho_Chi_Minh')::date+1)
    +time '09:00') at time zone 'Asia/Ho_Chi_Minh' as t`)).rows[0].t;
  let appointment, order;
  const booking = [ 'Khách thử nghiệm','0901234567','Dell Inspiron 14',scheduled,'upgrade' ];
  await check('Tạo lịch và sinh mã duy nhất / nhật ký', async () => {
    appointment=(await call('customer','select * from public.create_appointment($1,$2,$3,$4,$5)',booking)).rows[0];
    assert.equal(appointment.status,'Pending');
    assert.equal(appointment.customer_id,ids.customer);
    assert.match(appointment.code,/^PV-\d+$/);
    assert.equal((await call('customer','select * from public.service_events where appointment_id=$1',[appointment.id])).rows.length,1);
  });
  await check('Chặn lịch quá khứ, trùng lịch, giờ lẻ và địa chỉ tại nhà rỗng', async () => {
    await reject(()=>call('customer','select * from public.create_appointment($1,$2,$3,$4,$5)',booking),/duplicate key/);
    await reject(()=>call('customer',`select public.create_appointment('A','0901234567','Dell',now()-interval '1 day','repair')`),/Chọn giờ/);
    await reject(()=>call('customer',`select public.create_appointment('A','0901234567','Dell',$1::timestamptz+interval '7 minutes','repair')`,[scheduled]),/Chọn giờ/);
    await reject(()=>call('other',`select public.create_appointment('A','0901234567','Dell',$1,'repair','','{}','{}','home',null)`,[scheduled]),/check constraint/);
  });
  await check('Không nhận tag hoặc đường dẫn ảnh của khách khác', async () => {
    await reject(()=>call('other',`select public.create_appointment('A','0901234567','Dell',$1,'repair','',array['unknown'])`,[scheduled]),/Tag sự cố/);
    await reject(()=>call('other',`select public.create_appointment('A','0901234567','Dell',$1,'repair','','{}',array[$2])`,
      [scheduled,`users/${ids.customer}/private.jpg`]),/Ảnh sự cố/);
  });
  await check('Khách khác và KTV chưa phân công không thấy lịch', async () => {
    assert.equal((await call('other','select * from public.appointments where id=$1',[appointment.id])).rows.length,0);
    assert.equal((await call('technician','select * from public.appointments where id=$1',[appointment.id])).rows.length,0);
    await reject(()=>call('customer',`update public.appointments set status='Confirmed' where id=$1`,[appointment.id]),/permission denied/);
    await reject(()=>call('customer',`select public.change_appointment_status($1,'Confirmed')`,[appointment.id]),/chỉ được hủy/);
  });
  await check('Quản lý xác nhận rồi tiếp nhận, một lịch chỉ có một phiếu', async () => {
    await call('manager',`select public.change_appointment_status($1,'Confirmed')`,[appointment.id]);
    order=(await call('manager',`select * from public.receive_device($1,'SERIAL-TEST','Trầy nhẹ',$2)`,[appointment.id,ids.technician])).rows[0];
    assert.equal(order.customer_id,ids.customer);
    assert.equal((await call('customer','select status from public.appointments where id=$1',[appointment.id])).rows[0].status,'Processing');
    await reject(()=>call('manager','select public.receive_device($1)',[appointment.id]),/Chỉ tiếp nhận/);
    await reject(()=>call('customer',`select public.change_appointment_status($1,'Cancelled','Đổi ý')`,[appointment.id]),/trạng thái/);
  });
  await check('Kiểm tra vai trò khi phân công và chặn KTV không phụ trách', async () => {
    await reject(()=>call('manager','select public.assign_technician($1,$2)',[order.id,ids.customer]),/Kỹ thuật viên/);
    await reject(()=>call('otherTechnician',`select public.change_repair_status($1,'Diagnosing')`,[order.id]),/chỉ được cập nhật/);
    assert.equal((await call('otherTechnician','select * from public.repair_orders where id=$1',[order.id])).rows.length,0);
    await call('technician',`select public.change_repair_status($1,'Diagnosing')`,[order.id]);
  });
  const component = (await db.query(`select id from public.components where code='SSD-512'`)).rows[0].id;
  const quote = JSON.stringify([
    {component_id:component,item_name:'SSD NVMe 512GB',quantity:2,price:890000},
    {item_name:'Công lắp đặt',quantity:1,price:200000},
  ]);
  await check('Báo giá tính dòng/tổng tại DB; đơn giá và bảo hành là snapshot', async () => {
    const saved = (await call('technician','select * from public.save_repair_quote($1,$2)',[order.id,quote])).rows[0];
    assert.equal(Number(saved.total_amount),1980000);
    await call('manager','update public.components set unit_price=999000,warranty_months=12 where id=$1',[component]);
    const detail = (await call('customer','select * from public.repair_order_details where repair_order_id=$1 and component_id=$2',[order.id,component])).rows[0];
    assert.equal(Number(detail.price),890000);
    assert.equal(detail.warranty_months,36);
  });
  await check('Báo giá sai bị rollback toàn bộ, không mất các dòng đã lưu', async () => {
    const invalid = JSON.stringify([{item_name:'Lỗi',quantity:-1,price:100000}]);
    await reject(()=>call('technician','select public.save_repair_quote($1,$2)',[order.id,invalid]),/check constraint/);
    assert.equal((await call('customer','select * from public.repair_order_details where repair_order_id=$1',[order.id])).rows.length,2);
    assert.equal(Number((await call('customer','select total_amount from public.repair_orders where id=$1',[order.id])).rows[0].total_amount),1980000);
  });
  await check('Không bỏ qua duyệt báo giá; không sửa báo giá đang chờ duyệt', async () => {
    await reject(()=>call('technician',`select public.change_repair_status($1,'Repairing')`,[order.id]),/Chuyển trạng thái/);
    await call('technician',`select public.change_repair_status($1,'Pending_Approval')`,[order.id]);
    await reject(()=>call('technician','select public.save_repair_quote($1,$2)',[order.id,quote]),/Chỉ sửa báo giá/);
    await reject(()=>call('other','select public.decide_repair_quote($1,true)',[order.id]),/người khác/);
    await reject(()=>call('manager','select public.decide_repair_quote($1,true)',[order.id]),/Cần ghi/);
  });
  await check('Khách từ chối / sửa lại / duyệt báo giá', async () => {
    await call('customer',`select public.decide_repair_quote($1,false,'Cần tư vấn thêm')`,[order.id]);
    await call('technician','select public.save_repair_quote($1,$2)',[order.id,quote]);
    await call('technician',`select public.change_repair_status($1,'Pending_Approval')`,[order.id]);
    const r=(await call('customer','select * from public.decide_repair_quote($1,true)',[order.id])).rows[0];
    assert.equal(r.status,'Repairing');
    assert.equal(r.quote_approved_by,ids.customer);
  });
  await check('Nhật ký nội bộ không lộ cho khách; không cho sửa/xóa lịch sử', async () => {
    await call('technician',`select public.add_repair_note($1,'Ghi chú nội bộ',false)`,[order.id]);
    assert.equal((await call('customer',`select * from public.service_events where repair_order_id=$1 and not customer_visible`,[order.id])).rows.length,0);
    assert.equal((await call('technician',`select * from public.service_events where repair_order_id=$1 and not customer_visible`,[order.id])).rows.length,1);
    await reject(()=>call('manager',`delete from public.service_events where repair_order_id=$1`,[order.id]),/permission denied/);
  });
  await check('Storage: khách chỉ upload thư mục mình; KTV đúng việc mới upload ảnh máy', async () => {
    await call('customer',`insert into storage.objects(bucket_id,name) values('service-images',$1)`,[`users/${ids.customer}/test.jpg`]);
    await reject(()=>call('other',`insert into storage.objects(bucket_id,name) values('service-images',$1)`,[`users/${ids.customer}/stolen.jpg`]),/row-level security/);
    assert.equal((await call('other',`select * from storage.objects where name=$1`,[`users/${ids.customer}/test.jpg`])).rows.length,0);
    const path=`repairs/${order.id}/after.jpg`;
    await reject(()=>call('otherTechnician',`insert into storage.objects(bucket_id,name) values('service-images',$1)`,[path]),/row-level security/);
    await call('technician',`insert into storage.objects(bucket_id,name) values('service-images',$1)`,[path]);
    await call('technician','select public.add_repair_image($1,$2)',[order.id,path]);
    assert.equal((await call('customer',`select * from storage.objects where name=$1`,[path])).rows.length,1);
  });
  await check('KTV hoàn thành, chỉ quản lý bàn giao; lịch hẹn hoàn tất theo phiếu', async () => {
    await call('technician',`select public.change_repair_status($1,'Completed')`,[order.id]);
    await reject(()=>call('technician',`select public.change_repair_status($1,'Delivered')`,[order.id]),/Chỉ quản lý/);
    const r=(await call('manager',`select * from public.change_repair_status($1,'Delivered')`,[order.id])).rows[0];
    assert.ok(r.completed_at && r.delivered_at);
    assert.equal((await call('customer','select status from public.appointments where id=$1',[appointment.id])).rows[0].status,'Completed');
    await reject(()=>call('technician',`select public.add_repair_note($1,'Muộn')`,[order.id]),/đã bàn giao/);
  });
  await check('Hồ sơ KTV: khách không tự duyệt, Manager duyệt mới được đổi role', async () => {
    await call('other',`select public.submit_technician_application('Phần cứng',2,'Kinh nghiệm kiểm tra laptop')`);
    await reject(()=>call('other','select public.review_technician_application($1,true)',[ids.other]),/không có quyền/);
    await call('manager','select public.review_technician_application($1,true)',[ids.other]);
    assert.equal((await call('other','select role from public.users where id=$1',[ids.other])).rows[0].role,'Technician');
  });
  await check('Tài khoản vô hiệu không đọc nghiệp vụ / không gọi RPC', async () => {
    await db.query('update public.users set is_active=false where id=$1',[ids.customer]);
    assert.equal((await call('customer','select * from public.appointments')).rows.length,0);
    await reject(()=>call('customer','select public.create_appointment($1,$2,$3,$4,$5)',booking),/không có quyền/);
  });
  await check('Email Auth thay đổi được đồng bộ về hồ sơ', async () => {
    await db.query(`update auth.users set email='changed@example.invalid' where id=$1`,[ids.customer]);
    assert.equal((await db.query('select email from public.users where id=$1',[ids.customer])).rows[0].email,'changed@example.invalid');
  });
  console.log(`\n${passed} nhóm kiểm tra đạt. Auth API và Storage API thật cần kiểm tra thêm trên Supabase.`);
} finally {
  await db.close();
}
