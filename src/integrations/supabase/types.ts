export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_exports: {
        Row: {
          chat_id: string
          created_at: string | null
          export_type: string
          file_url: string | null
          id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          export_type: string
          file_url?: string | null
          id?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          export_type?: string
          file_url?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_exports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_exports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_exports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_exports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_exports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string | null
          created_at: string | null
          id: string
          message: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_nicknames: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          nickname: string
          target_user_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          nickname: string
          target_user_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          nickname?: string
          target_user_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_nicknames_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_nicknames_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_nicknames_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_nicknames_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_nicknames_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_settings: {
        Row: {
          auto_delete_duration: number | null
          chat_id: string
          created_at: string | null
          id: string
          is_muted: boolean | null
          is_pinned: boolean | null
          notifications_enabled: boolean | null
          theme_color: string | null
          updated_at: string | null
          user_id: string
          wallpaper_url: string | null
        }
        Insert: {
          auto_delete_duration?: number | null
          chat_id: string
          created_at?: string | null
          id?: string
          is_muted?: boolean | null
          is_pinned?: boolean | null
          notifications_enabled?: boolean | null
          theme_color?: string | null
          updated_at?: string | null
          user_id: string
          wallpaper_url?: string | null
        }
        Update: {
          auto_delete_duration?: number | null
          chat_id?: string
          created_at?: string | null
          id?: string
          is_muted?: boolean | null
          is_pinned?: boolean | null
          notifications_enabled?: boolean | null
          theme_color?: string | null
          updated_at?: string | null
          user_id?: string
          wallpaper_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_settings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_settings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_settings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_settings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_settings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chats: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          creator_id: string | null
          id: string
          is_pinned: boolean | null
          muted_until: string | null
          name: string | null
          theme_color: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          id?: string
          is_pinned?: boolean | null
          muted_until?: string | null
          name?: string | null
          theme_color?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_id?: string | null
          id?: string
          is_pinned?: boolean | null
          muted_until?: string | null
          name?: string | null
          theme_color?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_creator_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["comment_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_pages: {
        Row: {
          bio: string | null
          cover_media_id: string | null
          cover_url: string | null
          created_at: string | null
          custom_css: string | null
          id: string
          is_published: boolean | null
          monetization_enabled: boolean | null
          profile_media_id: string | null
          profile_url: string | null
          slug: string
          social_links: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          cover_media_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_css?: string | null
          id?: string
          is_published?: boolean | null
          monetization_enabled?: boolean | null
          profile_media_id?: string | null
          profile_url?: string | null
          slug: string
          social_links?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          cover_media_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_css?: string | null
          id?: string
          is_published?: boolean | null
          monetization_enabled?: boolean | null
          profile_media_id?: string | null
          profile_url?: string | null
          slug?: string
          social_links?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_pages_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_pages_profile_media_id_fkey"
            columns: ["profile_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_pages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_otps: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_collaborators: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_collaborators_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          location: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friends_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "group_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          member_count: number | null
          name: string
          privacy: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
          privacy?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
          privacy?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          tag: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tag?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          height: number | null
          id: string
          mime: string
          post_id: string | null
          size: number | null
          url: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          mime: string
          post_id?: string | null
          size?: number | null
          url: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          mime?: string
          post_id?: string | null
          size?: number | null
          url?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          message_id: string | null
          storage_path: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          message_id?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_with_users"
            referencedColumns: ["message_id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      message_seen: {
        Row: {
          id: string
          message_id: string
          seen_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          seen_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_seen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_seen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      message_translations: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          original_language: string | null
          target_language: string
          translated_text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          original_language?: string | null
          target_language: string
          translated_text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          original_language?: string | null
          target_language?: string
          translated_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_translations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_for: string[] | null
          edit_deadline: string | null
          edited_at: string | null
          forwarded_from_message_id: string | null
          id: string
          is_edited: boolean | null
          is_forwarded: boolean | null
          media_type: string | null
          media_url: string | null
          receiver_id: string | null
          reply_to: string | null
          sender_id: string | null
          status: string | null
        }
        Insert: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_for?: string[] | null
          edit_deadline?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_edited?: boolean | null
          is_forwarded?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          status?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_for?: string[] | null
          edit_deadline?: string | null
          edited_at?: string | null
          forwarded_from_message_id?: string | null
          id?: string
          is_edited?: boolean | null
          is_forwarded?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_message_id_fkey"
            columns: ["forwarded_from_message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          data: Json | null
          entity_id: string | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          data?: Json | null
          entity_id?: string | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      page_followers: {
        Row: {
          created_at: string | null
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_followers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pages: {
        Row: {
          avatar_url: string | null
          category: string | null
          contact_email: string | null
          cover_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          followers_count: number | null
          id: string
          is_official: boolean | null
          is_verified: boolean | null
          name: string
          updated_at: string | null
          username: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          followers_count?: number | null
          id?: string
          is_official?: boolean | null
          is_verified?: boolean | null
          name: string
          updated_at?: string | null
          username: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          followers_count?: number | null
          id?: string
          is_official?: boolean | null
          is_verified?: boolean | null
          name?: string
          updated_at?: string | null
          username?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          option_text: string
          poll_id: string
          votes_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text: string
          poll_id: string
          votes_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_text?: string
          poll_id?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple: boolean | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          post_id: string | null
          question: string
        }
        Insert: {
          allow_multiple?: boolean | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          post_id?: string | null
          question: string
        }
        Update: {
          allow_multiple?: boolean | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          post_id?: string | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      post_drafts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          privacy: string | null
          scheduled_for: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          privacy?: string | null
          scheduled_for?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          privacy?: string | null
          scheduled_for?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_hashtags: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_view"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "trending_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          is_deleted: boolean
          is_public: boolean | null
          is_published: boolean | null
          location: string | null
          media_ids: string[] | null
          media_type: string | null
          media_url: string | null
          media_urls: string[] | null
          privacy: string | null
          reactions_count: number | null
          reposts_count: number | null
          scheduled_for: string | null
          shares_count: number | null
          tagged_users: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          is_public?: boolean | null
          is_published?: boolean | null
          location?: string | null
          media_ids?: string[] | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          privacy?: string | null
          reactions_count?: number | null
          reposts_count?: number | null
          scheduled_for?: string | null
          shares_count?: number | null
          tagged_users?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean
          is_public?: boolean | null
          is_published?: boolean | null
          location?: string | null
          media_ids?: string[] | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          privacy?: string | null
          reactions_count?: number | null
          reposts_count?: number | null
          scheduled_for?: string | null
          shares_count?: number | null
          tagged_users?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cover_url: string | null
          created_at: string | null
          display_name: string
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          last_seen: string | null
          location: string | null
          phone: string | null
          relationship_status: string | null
          theme_color: string | null
          updated_at: string | null
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          display_name: string
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          location?: string | null
          phone?: string | null
          relationship_status?: string | null
          theme_color?: string | null
          updated_at?: string | null
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          display_name?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          location?: string | null
          phone?: string | null
          relationship_status?: string | null
          theme_color?: string | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          last_attempt: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_attempt?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_attempt?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction_type?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_users: {
        Row: {
          chat_id: string | null
          created_at: string | null
          description: string | null
          id: string
          message_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          message_id?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          message_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reported_users_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "reported_users_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "reported_users_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_users_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "reported_users_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "reported_users_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "reported_users_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "reported_users_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_users_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "reported_users_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_users_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reported_users_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reported_users_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          scheduled_for: string
          sender_id: string
          sent: boolean | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          scheduled_for: string
          sender_id: string
          sent?: boolean | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          scheduled_for?: string
          sender_id?: string
          sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "scheduled_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "scheduled_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "scheduled_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "scheduled_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      starred_messages: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starred_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stories: {
        Row: {
          content: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_status: {
        Row: {
          chat_id: string | null
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "typing_status_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "typing_status_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_status_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "typing_status_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "typing_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "typing_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "typing_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          current_chat_id: string | null
          last_seen: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_chat_id?: string | null
          last_seen?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_chat_id?: string | null
          last_seen?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          accent_color: string | null
          allow_friend_requests: boolean | null
          auto_play_videos: boolean | null
          autoplay_videos: boolean | null
          created_at: string | null
          data_saver_mode: boolean | null
          email_notifications: boolean | null
          font_size: string | null
          id: string
          language: string | null
          layout_mode: string | null
          location_sharing: boolean | null
          notification_friend_requests: boolean | null
          notification_messages: boolean | null
          notification_post_comments: boolean | null
          notification_post_reactions: boolean | null
          notify_comments: boolean | null
          notify_email: boolean | null
          notify_likes: boolean | null
          notify_messages: boolean | null
          privacy_who_can_message: string | null
          privacy_who_can_tag: string | null
          privacy_who_can_view_profile: string | null
          profile_visibility: string | null
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          show_sensitive_content: boolean | null
          show_typing_indicator: boolean | null
          sms_notifications: boolean | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          allow_friend_requests?: boolean | null
          auto_play_videos?: boolean | null
          autoplay_videos?: boolean | null
          created_at?: string | null
          data_saver_mode?: boolean | null
          email_notifications?: boolean | null
          font_size?: string | null
          id?: string
          language?: string | null
          layout_mode?: string | null
          location_sharing?: boolean | null
          notification_friend_requests?: boolean | null
          notification_messages?: boolean | null
          notification_post_comments?: boolean | null
          notification_post_reactions?: boolean | null
          notify_comments?: boolean | null
          notify_email?: boolean | null
          notify_likes?: boolean | null
          notify_messages?: boolean | null
          privacy_who_can_message?: string | null
          privacy_who_can_tag?: string | null
          privacy_who_can_view_profile?: string | null
          profile_visibility?: string | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_sensitive_content?: boolean | null
          show_typing_indicator?: boolean | null
          sms_notifications?: boolean | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string | null
          allow_friend_requests?: boolean | null
          auto_play_videos?: boolean | null
          autoplay_videos?: boolean | null
          created_at?: string | null
          data_saver_mode?: boolean | null
          email_notifications?: boolean | null
          font_size?: string | null
          id?: string
          language?: string | null
          layout_mode?: string | null
          location_sharing?: boolean | null
          notification_friend_requests?: boolean | null
          notification_messages?: boolean | null
          notification_post_comments?: boolean | null
          notification_post_reactions?: boolean | null
          notify_comments?: boolean | null
          notify_email?: boolean | null
          notify_likes?: boolean | null
          notify_messages?: boolean | null
          privacy_who_can_message?: string | null
          privacy_who_can_tag?: string | null
          privacy_who_can_view_profile?: string | null
          profile_visibility?: string | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_sensitive_content?: boolean | null
          show_typing_indicator?: boolean | null
          sms_notifications?: boolean | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_online: boolean | null
          is_verified: boolean | null
          last_seen: string | null
          password_hash: string
          phone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          password_hash: string
          phone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          password_hash?: string
          phone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      verification_audit: {
        Row: {
          action: string
          code_id: string | null
          created_at: string
          details: Json | null
          id: string
          operator_id: string | null
        }
        Insert: {
          action: string
          code_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          operator_id?: string | null
        }
        Update: {
          action?: string
          code_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          operator_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_audit_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "verification_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          issued_at: string | null
          op_notes: string | null
          purchased_at: string | null
          status: string
          used_at: string | null
          used_by: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          issued_at?: string | null
          op_notes?: string | null
          purchased_at?: string | null
          status?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          issued_at?: string | null
          op_notes?: string | null
          purchased_at?: string | null
          status?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "verification_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      chat_list_view: {
        Row: {
          chat_created_at: string | null
          chat_id: string | null
          chat_name: string | null
          last_message: string | null
          last_message_at: string | null
          last_message_id: string | null
          last_message_status: string | null
          other_user_avatar: string | null
          other_user_id: string | null
          other_user_name: string | null
          type: string | null
          unread_count: number | null
        }
        Relationships: []
      }
      chat_messages_view: {
        Row: {
          chat_id: string | null
          created_at: string | null
          message: string | null
          message_id: string | null
          sender: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_overview: {
        Row: {
          chat_avatar: string | null
          chat_created_at: string | null
          chat_id: string | null
          chat_name: string | null
          participants: Json | null
          type: string | null
        }
        Relationships: []
      }
      comments_view: {
        Row: {
          avatar_url: string | null
          comment_id: string | null
          content: string | null
          created_at: string | null
          full_name: string | null
          post_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      conversation_view: {
        Row: {
          chat_id: string | null
          created_at: string | null
          last_message: Json | null
          participants: Json | null
        }
        Relationships: []
      }
      conversations_view: {
        Row: {
          chat_avatar: string | null
          chat_created_at: string | null
          chat_id: string | null
          chat_name: string | null
          type: string | null
        }
        Insert: {
          chat_avatar?: string | null
          chat_created_at?: string | null
          chat_id?: string | null
          chat_name?: string | null
          type?: string | null
        }
        Update: {
          chat_avatar?: string | null
          chat_created_at?: string | null
          chat_id?: string | null
          chat_name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      message_feed_view: {
        Row: {
          chat_id: string | null
          content: string | null
          created_at: string | null
          media_url: string | null
          message_id: string | null
          sender_avatar: string | null
          sender_id: string | null
          sender_name: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions_view: {
        Row: {
          count: number | null
          message_id: string | null
          reaction_type: string | null
          users: Json[] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_seen_view: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          message_id: string | null
          seen_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "message_seen_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_seen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_seen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      message_with_users: {
        Row: {
          chat_id: string | null
          created_at: string | null
          message: string | null
          message_id: string | null
          sender: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "comments_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_status_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_view: {
        Row: {
          chat_id: string | null
          content: string | null
          created_at: string | null
          media_url: string | null
          message_id: string | null
          reaction_count: number | null
          seen_count: number | null
          sender_avatar: string | null
          sender_id: string | null
          sender_name: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_with_users: {
        Row: {
          chat_id: string | null
          chat_name: string | null
          chat_type: string | null
          content: string | null
          created_at: string | null
          id: string | null
          is_edited: boolean | null
          media_url: string | null
          receiver_avatar_url: string | null
          receiver_display_name: string | null
          receiver_id: string | null
          receiver_username: string | null
          reply_to: string | null
          sender_avatar_url: string | null
          sender_display_name: string | null
          sender_id: string | null
          sender_username: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat_overview"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversation_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "conversations_view"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_list_view"
            referencedColumns: ["last_message_id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "message_feed_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages_view"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_view: {
        Row: {
          created_at: string | null
          entity_id: string | null
          is_read: boolean | null
          notification_id: string | null
          triggered_by_avatar: string | null
          triggered_by_name: string | null
          type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_view: {
        Row: {
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          media_type: string | null
          media_url: string | null
          post_id: string | null
          privacy: string | null
          reactions_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_view: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cover_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_private: boolean | null
          is_verified: boolean | null
          last_seen: string | null
          location: string | null
          notification_friend_requests: boolean | null
          notification_messages: boolean | null
          notification_post_reactions: boolean | null
          privacy_who_can_message: string | null
          privacy_who_can_view_profile: string | null
          relationship_status: string | null
          theme_color: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_settings_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      settings_view: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          notification_friend_requests: boolean | null
          notification_messages: boolean | null
          notification_post_reactions: boolean | null
          privacy_who_can_message: string | null
          privacy_who_can_view_profile: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          media_type: string | null
          media_url: string | null
          privacy: string | null
          reactions_count: number | null
          scheduled_for: string | null
          shares_count: number | null
          trending_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          media_type?: string | null
          media_url?: string | null
          privacy?: string | null
          reactions_count?: number | null
          scheduled_for?: string | null
          shares_count?: number | null
          trending_score?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          media_type?: string | null
          media_url?: string | null
          privacy?: string | null
          reactions_count?: number | null
          scheduled_for?: string | null
          shares_count?: number | null
          trending_score?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings_view: {
        Row: {
          allow_friend_requests: boolean | null
          auto_play_videos: boolean | null
          data_saver_mode: boolean | null
          language: string | null
          notify_comments: boolean | null
          notify_email: boolean | null
          notify_likes: boolean | null
          notify_messages: boolean | null
          profile_visibility: string | null
          show_online_status: boolean | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_status_view: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          is_online: boolean | null
          is_typing: boolean | null
          last_seen: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_increment_rate_limit: {
        Args: {
          p_action: string
          p_block_duration_seconds?: number
          p_max_attempts?: number
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: Json
      }
      column_exists: {
        Args: { column_name: string; schema_name: string; table_name: string }
        Returns: boolean
      }
      create_chat: {
        Args: { _creator: string; _receiver: string }
        Returns: string
      }
      create_message: {
        Args: {
          _chat_id: string
          _content: string
          _receiver: string
          _sender: string
        }
        Returns: string
      }
      create_private_chat: {
        Args: { _user1: string; _user2: string }
        Returns: {
          chat_id: string
          target_user: string
        }[]
      }
      extract_hashtags: { Args: { post_content: string }; Returns: string[] }
      generate_verification_code: { Args: never; Returns: string }
      get_random_feed: {
        Args: { user_uuid: string }
        Returns: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          is_deleted: boolean
          is_public: boolean | null
          is_published: boolean | null
          location: string | null
          media_ids: string[] | null
          media_type: string | null
          media_url: string | null
          media_urls: string[] | null
          privacy: string | null
          reactions_count: number | null
          reposts_count: number | null
          scheduled_for: string | null
          shares_count: number | null
          tagged_users: string[] | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      handle_post_visibility: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_blocked: {
        Args: { by_user_id: string; check_user_id: string }
        Returns: boolean
      }
      safe_error_message: { Args: { error_text: string }; Returns: string }
      send_message: {
        Args: { _chat_id: string; _content: string; _sender_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
