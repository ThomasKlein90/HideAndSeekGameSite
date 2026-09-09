export type GameTeam = "hiders" | "seekers";
export type GamePhase =
  | "setup"
  | "hider_head_start"
  | "active_seeking"
  | "final_hiding"
  | "round_complete"
  | "game_complete";
export type PlayerRole = "host" | "player";
export type QuestionCategory =
  | "matching"
  | "measuring"
  | "thermometer"
  | "radar"
  | "tentacles"
  | "photos";
export type QuestionAnswerType = "yes_no" | "number" | "text" | "photo";
export type QuestionEventStatus = "pending" | "answered" | "cancelled";
export type SeekerAnnotationType = "note" | "pin" | "eliminated_area";
export type CardLogStatus = "held" | "used" | "expired";

type NoRelationships = [];

export type Database = {
  public: {
    Tables: {
      game_players: {
        Row: {
          created_at: string;
          game_id: string;
          is_team_assigned: boolean;
          role: PlayerRole;
          team: GameTeam;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          is_team_assigned?: boolean;
          role?: PlayerRole;
          team: GameTeam;
          user_id: string;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          is_team_assigned?: boolean;
          role?: PlayerRole;
          team?: GameTeam;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_players_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      hider_card_log: {
        Row: {
          card_name: string;
          created_at: string;
          game_id: string;
          id: string;
          note: string;
          received_at: string;
          recorded_by: string;
          round_id: string | null;
          status: CardLogStatus;
          updated_at: string;
          used_at: string | null;
        };
        Insert: {
          card_name: string;
          created_at?: string;
          game_id: string;
          id?: string;
          note?: string;
          received_at?: string;
          recorded_by: string;
          round_id?: string | null;
          status?: CardLogStatus;
          updated_at?: string;
          used_at?: string | null;
        };
        Update: {
          card_name?: string;
          created_at?: string;
          game_id?: string;
          id?: string;
          note?: string;
          received_at?: string;
          recorded_by?: string;
          round_id?: string | null;
          status?: CardLogStatus;
          updated_at?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hider_card_log_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hider_card_log_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hider_card_log_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_settings: {
        Row: {
          allowed_transit_modes: string[];
          board_boundary: Json | null;
          created_at: string;
          final_hiding_radius_meters: number;
          game_id: string;
          hider_head_start_seconds: number;
          no_go_areas: Json;
          updated_at: string;
        };
        Insert: {
          allowed_transit_modes?: string[];
          board_boundary?: Json | null;
          created_at?: string;
          final_hiding_radius_meters?: number;
          game_id: string;
          hider_head_start_seconds?: number;
          no_go_areas?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_settings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "game_settings_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: true;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          created_at: string;
          host_id: string;
          id: string;
          join_code: string;
          name: string;
          phase: GamePhase;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          host_id: string;
          id?: string;
          join_code: string;
          name: string;
          phase?: GamePhase;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "games_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: NoRelationships;
      };
      question_templates: {
        Row: {
          answer_type: QuestionAnswerType;
          category: QuestionCategory;
          created_at: string;
          id: string;
          is_active: boolean;
          prompt: string;
          reward_rule: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          answer_type: QuestionAnswerType;
          category: QuestionCategory;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          prompt: string;
          reward_rule?: string;
          sort_order: number;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["question_templates"]["Insert"]>;
        Relationships: NoRelationships;
      };
      question_events: {
        Row: {
          answer: string | null;
          answered_at: string | null;
          answered_by: string | null;
          asked_by: string;
          created_at: string;
          game_id: string;
          id: string;
          question_template_id: string;
          reward_logged_at: string | null;
          reward_logged_by: string | null;
          reward_note: string | null;
          round_id: string | null;
          status: QuestionEventStatus;
          updated_at: string;
        };
        Insert: {
          answer?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          asked_by: string;
          created_at?: string;
          game_id: string;
          id?: string;
          question_template_id: string;
          reward_logged_at?: string | null;
          reward_logged_by?: string | null;
          reward_note?: string | null;
          round_id?: string | null;
          status?: QuestionEventStatus;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["question_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "question_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_events_question_template_id_fkey";
            columns: ["question_template_id"];
            isOneToOne: false;
            referencedRelation: "question_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_events_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_events_asked_by_fkey";
            columns: ["asked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_events_answered_by_fkey";
            columns: ["answered_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_events_reward_logged_by_fkey";
            columns: ["reward_logged_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      seeker_annotations: {
        Row: {
          annotation_type: SeekerAnnotationType;
          created_at: string;
          created_by: string;
          game_id: string;
          id: string;
          latitude: number | null;
          location_label: string | null;
          longitude: number | null;
          note: string;
          round_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          annotation_type: SeekerAnnotationType;
          created_at?: string;
          created_by: string;
          game_id: string;
          id?: string;
          latitude?: number | null;
          location_label?: string | null;
          longitude?: number | null;
          note?: string;
          round_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seeker_annotations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "seeker_annotations_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seeker_annotations_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seeker_annotations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rounds: {
        Row: {
          created_at: string;
          ended_at: string | null;
          final_hiding_started_at: string | null;
          game_id: string;
          hiding_team: GameTeam;
          id: string;
          number: number;
          started_at: string | null;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          final_hiding_started_at?: string | null;
          game_id: string;
          hiding_team: GameTeam;
          id?: string;
          number: number;
          started_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["rounds"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "rounds_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      assign_player_team: {
        Args: {
          selected_team: GameTeam;
          target_game_id: string;
          target_user_id: string;
        };
        Returns: undefined;
      };
      create_game: {
        Args: {
          final_hiding_radius_meters?: number;
          game_name: string;
          hider_head_start_seconds?: number;
          host_team: GameTeam;
        };
        Returns: {
          id: string;
          join_code: string;
          name: string;
          phase: GamePhase;
        }[];
      };
      join_game: {
        Args: {
          game_join_code: string;
        };
        Returns: {
          id: string;
          join_code: string;
          name: string;
          phase: GamePhase;
        }[];
      };
    };
    Enums: {
      game_phase: GamePhase;
      game_team: GameTeam;
      player_role: PlayerRole;
      question_answer_type: QuestionAnswerType;
      question_category: QuestionCategory;
      question_event_status: QuestionEventStatus;
      seeker_annotation_type: SeekerAnnotationType;
      card_log_status: CardLogStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
