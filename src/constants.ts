import { Users, LogIn, LogOut, Ruler, Tag, Activity } from 'lucide-react';
import { ModuleType } from './types';

export const MODULES: { id: ModuleType; label: string; icon: any; color: string }[] = [
  { id: 'workers', label: 'Workers', icon: Users, color: 'text-blue-500' },
  { id: 'inputs', label: 'Cutting Input', icon: LogIn, color: 'text-green-500' },
  { id: 'outputs', label: 'Production Output', icon: LogOut, color: 'text-orange-500' },
  { id: 'zippers', label: 'Zipper Tracking', icon: Ruler, color: 'text-purple-500' },
  { id: 'labels', label: 'Label Tracking', icon: Tag, color: 'text-pink-500' },
  { id: 'threads', label: 'Thread Tracking', icon: Activity, color: 'text-cyan-500' },
];

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
