export interface RowDetail {
  cutting_no: string;
  size: string;
  quantity: number;
  body_size?: string;
  zipper_size?: string;
  country?: string;
}

export interface Worker {
  id?: string;
  worker_id: string;
  name: string;
  phone: string;
  skill: string;
  designation?: string;
  line_no?: string;
  join_date?: string;
}

export interface ProductionInput {
  id?: string;
  date: string;
  po_pf: string;
  buyer: string;
  color: string;
  details: RowDetail[];
  quantity: number;
}

export interface ProductionOutput {
  id?: string;
  date: string;
  line_no: string;
  po_pf: string;
  buyer: string;
  color: string;
  details: RowDetail[];
  quantity: number;
}

export interface MaterialRecord {
  id?: string;
  date: string;
  po_pf: string;
  buyer: string;
  color: string;
  details: RowDetail[];
  input_qty: number;
  used_qty: number;
  remaining_qty: number;
}

export interface ThreadRecord {
  id?: string;
  date: string;
  po_pf: string;
  buyer: string;
  color: string;
  details: RowDetail[];
  tex_type: '20 Tex' | '40 Tex' | string;
  cone_input_qty: number;
  cone_used_qty: number;
  remaining_qty: number;
  start_time: string;
  end_time: string;
  total_time: string;
}

export type ModuleType = 'workers' | 'inputs' | 'outputs' | 'zippers' | 'labels' | 'threads' | 'phonebook' | 'attendance' | 'absenteeism';

export interface AttendanceRecord {
  id?: string;
  worker_id: string;
  worker_name: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  reason?: string; // Only for absent
  line_no?: string;
  updatedAt: any;
}

export interface AttendanceSession {
  id?: string;
  date: string;
  presentCount: number;
  absentCount: number;
  totalWorkers: number;
  updatedAt: any;
}
