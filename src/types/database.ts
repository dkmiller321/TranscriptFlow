export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          preferences: {
            theme: 'light' | 'dark' | 'system';
            defaultFormat: 'txt' | 'srt' | 'json';
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          preferences?: {
            theme: 'light' | 'dark' | 'system';
            defaultFormat: 'txt' | 'srt' | 'json';
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          preferences?: {
            theme: 'light' | 'dark' | 'system';
            defaultFormat: 'txt' | 'srt' | 'json';
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      extraction_history: {
        Row: {
          id: string;
          user_id: string | null;
          video_id: string;
          video_title: string;
          channel_name: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          transcript_preview: string | null;
          word_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          video_id: string;
          video_title: string;
          channel_name?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          transcript_preview?: string | null;
          word_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          video_id?: string;
          video_title?: string;
          channel_name?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          transcript_preview?: string | null;
          word_count?: number | null;
          created_at?: string;
        };
      };
      saved_transcripts: {
        Row: {
          id: string;
          user_id: string;
          extraction_id: string | null;
          video_id: string;
          video_title: string;
          content: string;
          content_srt: string | null;
          content_json: Json | null;
          is_favorite: boolean;
          tags: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          extraction_id?: string | null;
          video_id: string;
          video_title: string;
          content: string;
          content_srt?: string | null;
          content_json?: Json | null;
          is_favorite?: boolean;
          tags?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          extraction_id?: string | null;
          video_id?: string;
          video_title?: string;
          content?: string;
          content_srt?: string | null;
          content_json?: Json | null;
          is_favorite?: boolean;
          tags?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rate_limits: {
        Row: {
          id: string;
          identifier: string;
          request_type: string;
          request_count: number;
          window_start: string;
        };
        Insert: {
          id?: string;
          identifier: string;
          request_type: string;
          request_count?: number;
          window_start?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          request_type?: string;
          request_count?: number;
          window_start?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
