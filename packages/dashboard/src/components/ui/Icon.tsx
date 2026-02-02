import {
  Search,
  BarChart3,
  Settings,
  AlertTriangle,
  Target,
  Trash2,
  Check,
  X,
  Copy,
  Clipboard,
  Lightbulb,
  BookOpen,
  Link,
  RefreshCw,
  Upload,
  Download,
  Clock,
  Play,
  Edit,
  Plus,
  ChevronDown,
  ExternalLink,
  ArrowLeft,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Monitor,
  Tablet,
  Smartphone,
  Image,
  FileCode,
  Wrench,
  Sparkles,
  Ban,
  Undo,
  Microscope,
  Map,
  MoreVertical,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

// Map semantic icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  // Navigation & Actions
  search: Search,
  close: X,
  check: Check,
  copy: Copy,
  clipboard: Clipboard,
  refresh: RefreshCw,
  upload: Upload,
  download: Download,
  edit: Edit,
  plus: Plus,
  trash: Trash2,
  link: Link,
  'external-link': ExternalLink,
  back: ArrowLeft,
  'chevron-down': ChevronDown,
  more: MoreVertical,
  play: Play,

  // Status & Alerts
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  error: XCircle,
  'alert-circle': AlertCircle,
  ban: Ban,
  undo: Undo,

  // Charts & Data
  chart: BarChart3,
  target: Target,

  // Settings & Config
  settings: Settings,
  wrench: Wrench,
  map: Map,

  // Content & Files
  book: BookOpen,
  lightbulb: Lightbulb,
  image: Image,
  'file-code': FileCode,

  // Devices
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,

  // Special
  microscope: Microscope,
  sparkles: Sparkles,
  clock: Clock,
  loader: Loader2,
};

export interface IconProps {
  name: keyof typeof iconMap | string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean;
}

export function Icon({
  name,
  size = 16,
  color,
  className,
  style,
  'aria-hidden': ariaHidden = true,
}: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    />
  );
}

// Note: Import icons directly from 'lucide-react' for better tree-shaking
// Example: import { Search } from 'lucide-react';
