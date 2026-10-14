export interface Batch {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
}

export interface Subject {
  subjectid: string;
  subject_name: string;
  subject_logo: string;
  sortingparam: string;
  is_paid?: string;
}

export interface Topic {
  topicid: string;
  topic_name: string;
  topic_logo: string;
  sortingparam: number;
}

export interface VideoQuality {
  quality: string;
  url: string;
  player_url?: string;
  bitrate?: string;
}

export interface Lecture {
  id: string;
  Title: string;
  title?: string;
  material_type?: string;
  type?: string;
  thumbnail?: string;
  duration?: string;
  duration_in_secs?: number;
  date_and_time?: string;
  event_date?: string;
  file_link?: string;
  pdf_link?: string;
  download_link?: string;
  live_status?: string | number;
  livestream_links?: { quality: string; path: string }[];
  download_links?: { bitrate: string; quality: string; path: string }[];
  course_id?: string;
  description?: string;
}

export interface VideoDetails {
  success: boolean;
  video_id: string;
  course_id: string;
  title: string;
  duration?: string;
  thumbnail?: string;
  date?: string;
  decoded_video_link?: string;
  player_url?: string;
  qualities?: VideoQuality[];
  decoded_pdf_link?: string;
  pdf_viewer?: string;
}

export type ViewMode = 'home' | 'course' | 'enrollments';

export interface BreadcrumbItem {
  id: string;
  title: string;
  type: 'root' | 'subject' | 'topic';
}
