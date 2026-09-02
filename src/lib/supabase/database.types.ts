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
