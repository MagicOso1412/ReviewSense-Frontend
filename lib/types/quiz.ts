export type ActionLevel = "low" | "medium" | "high";

export type QuizAnswers = {
  favorite_genre: string;
  action_level: ActionLevel;
  keywords: string[];
};

export type QuizOut = {
  user_id: string;
  quiz: Record<string, unknown>;
};
