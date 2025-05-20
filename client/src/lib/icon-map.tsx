import React from 'react';
import { 
  Activity, BarChart3, Bug, 
  FileSearch, FileText, Fingerprint, 
  History, Key, Radar, 
  Scan, Settings, ShieldAlert
} from 'lucide-react';

export type IconName = 
  | 'dashboard'
  | 'history'
  | 'subdomain'
  | 'port-scanner'
  | 'tech-detector'
  | 'vulnerability'
  | 'parameter'
  | 'content-discovery'
  | 'reports'
  | 'settings'
  | 'activity'
  | 'shield'
  | 'chart';

interface IconMapProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function IconMap({ name, className, size = 24 }: IconMapProps) {
  const icons: Record<IconName, React.ReactNode> = {
    'dashboard': <BarChart3 size={size} className={className} />,
    'history': <History size={size} className={className} />,
    'subdomain': <Radar size={size} className={className} />,
    'port-scanner': <Scan size={size} className={className} />,
    'tech-detector': <Fingerprint size={size} className={className} />,
    'vulnerability': <Bug size={size} className={className} />,
    'parameter': <Key size={size} className={className} />,
    'content-discovery': <FileSearch size={size} className={className} />,
    'reports': <FileText size={size} className={className} />,
    'settings': <Settings size={size} className={className} />,
    'activity': <Activity size={size} className={className} />,
    'shield': <ShieldAlert size={size} className={className} />,
    'chart': <BarChart3 size={size} className={className} />
  };
  
  return <>{icons[name] || null}</>;
}
