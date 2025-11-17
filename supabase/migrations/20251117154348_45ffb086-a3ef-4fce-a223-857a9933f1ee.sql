-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum for gender
create type public.gender_type as enum ('male', 'female', 'other');

-- Create enum for belt levels
create type public.belt_level as enum (
  'white',
  'yellow',
  'green',
  'blue',
  'red',
  'black_1st_dan',
  'black_2nd_dan',
  'black_3rd_dan',
  'black_4th_dan',
  'black_5th_dan'
);

-- Create enum for payment status
create type public.payment_status as enum ('paid', 'unpaid', 'partial');

-- Create enum for attendance status
create type public.attendance_status as enum ('present', 'absent', 'late');

-- Create enum for test result
create type public.test_result as enum ('passed', 'failed', 'pending');

-- Create enum for user roles
create type public.app_role as enum ('admin', 'instructor', 'viewer');

-- Create user_roles table (must be separate for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'viewer',
  created_at timestamp with time zone default now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Create students table
create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null check (age > 0 and age < 100),
  gender gender_type not null,
  guardian_name text not null,
  phone_number text not null,
  address text,
  admission_date date not null default current_date,
  current_belt belt_level not null default 'white',
  profile_photo_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.students enable row level security;

-- Create monthly_fees table
create table public.monthly_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  month integer not null check (month >= 1 and month <= 12),
  year integer not null check (year >= 2020 and year <= 2100),
  amount decimal(10,2) not null check (amount >= 0),
  status payment_status not null default 'unpaid',
  paid_date date,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (student_id, month, year)
);

alter table public.monthly_fees enable row level security;

-- Create attendance table
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  date date not null default current_date,
  status attendance_status not null default 'present',
  notes text,
  created_at timestamp with time zone default now(),
  unique (student_id, date)
);

alter table public.attendance enable row level security;

-- Create belt_tests table
create table public.belt_tests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  test_date date not null,
  tested_for_belt belt_level not null,
  test_fee decimal(10,2) not null default 0 check (test_fee >= 0),
  result test_result not null default 'pending',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.belt_tests enable row level security;

-- Create storage bucket for profile photos (without public column)
insert into storage.buckets (id, name)
values ('student-photos', 'student-photos')
on conflict (id) do nothing;

-- RLS Policies for user_roles
create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
create policy "Authenticated users can view students"
on public.students for select
to authenticated
using (true);

create policy "Admins can insert students"
on public.students for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update students"
on public.students for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete students"
on public.students for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for monthly_fees
create policy "Authenticated users can view fees"
on public.monthly_fees for select
to authenticated
using (true);

create policy "Admins can insert fees"
on public.monthly_fees for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update fees"
on public.monthly_fees for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete fees"
on public.monthly_fees for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance
create policy "Authenticated users can view attendance"
on public.attendance for select
to authenticated
using (true);

create policy "Admins can insert attendance"
on public.attendance for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update attendance"
on public.attendance for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete attendance"
on public.attendance for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for belt_tests
create policy "Authenticated users can view belt tests"
on public.belt_tests for select
to authenticated
using (true);

create policy "Admins can insert belt tests"
on public.belt_tests for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update belt tests"
on public.belt_tests for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete belt tests"
on public.belt_tests for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Storage RLS Policies
create policy "Anyone can view student photos"
on storage.objects for select
to authenticated
using (bucket_id = 'student-photos');

create policy "Admins can upload student photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'student-photos' and
  public.has_role(auth.uid(), 'admin')
);

create policy "Admins can update student photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'student-photos' and
  public.has_role(auth.uid(), 'admin')
);

create policy "Admins can delete student photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'student-photos' and
  public.has_role(auth.uid(), 'admin')
);

-- Create indexes for better performance
create index idx_students_name on public.students(name);
create index idx_students_current_belt on public.students(current_belt);
create index idx_students_is_active on public.students(is_active);
create index idx_monthly_fees_student on public.monthly_fees(student_id);
create index idx_monthly_fees_status on public.monthly_fees(status);
create index idx_monthly_fees_month_year on public.monthly_fees(month, year);
create index idx_attendance_student on public.attendance(student_id);
create index idx_attendance_date on public.attendance(date);
create index idx_belt_tests_student on public.belt_tests(student_id);
create index idx_belt_tests_date on public.belt_tests(test_date);

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger update_students_updated_at
  before update on public.students
  for each row
  execute function public.update_updated_at_column();

create trigger update_monthly_fees_updated_at
  before update on public.monthly_fees
  for each row
  execute function public.update_updated_at_column();

create trigger update_belt_tests_updated_at
  before update on public.belt_tests
  for each row
  execute function public.update_updated_at_column();