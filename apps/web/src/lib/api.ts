import type {
  AbandonWorkoutSessionRequest,
  AbandonWorkoutSessionResponse,
  ActivateMealPlanRequest,
  ActivateMealPlanResponse,
  ActivateNutritionTargetRequest,
  ActivateNutritionTargetResponse,
  ActivateTrainingPlanRequest,
  ActivateTrainingPlanResponse,
  CharacterSelection,
  CompleteOnboardingResponse,
  CompleteWorkoutSessionRequest,
  CompleteWorkoutSessionResponse,
  ContentTodayResponse,
  CreateMealLogRequest,
  CreateMealLogResponse,
  CurrentGroceryListResponse,
  CurrentMealPlanResponse,
  CurrentTrainingPlanResponse,
  ExerciseSummary,
  GetNotificationPreferencesResponse,
  ListCharactersResponse,
  ListMediaResponse,
  ListNotificationsResponse,
  ListPlannedSessionsResponse,
  ListRecipesResponse,
  LoginRequest,
  MarkNotificationReadResponse,
  MediaAccessRequest,
  MediaAccessResponse,
  OnboardingProgress,
  PreviewMealPlanRequest,
  PreviewMealPlanResponse,
  PreviewNutritionTargetRequest,
  PreviewNutritionTargetResponse,
  PreviewTrainingPlanRequest,
  PreviewTrainingPlanResponse,
  ProgressHistoryResponse,
  ProgressSummaryResponse,
  ProgressXpLedgerResponse,
  RecipeDetail,
  RegisterRequest,
  SaveOnboardingStep,
  SelectCharacterRequest,
  SessionUser,
  ShortenPlannedSessionRequest,
  ShortenPlannedSessionResponse,
  StartWorkoutSessionRequest,
  StartWorkoutSessionResponse,
  SwapMealConfirmRequest,
  SwapMealConfirmResponse,
  SwapMealPreviewRequest,
  SwapMealPreviewResponse,
  UpdateNotificationPreferencesRequest,
  UpdateWorkoutSetRequest,
  UpdateWorkoutSetResponse,
} from '@saiyan/contracts';

export const COOKIE_ACCEPT = 'application/json; auth=cookie';

export type ApiErrorBody = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryable?: boolean;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly requestId?: string;
  readonly retryable: boolean;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code;
    if (body.fieldErrors !== undefined) {
      this.fieldErrors = body.fieldErrors;
    }
    if (body.requestId !== undefined) {
      this.requestId = body.requestId;
    }
    this.retryable = body.retryable ?? false;
  }
}

export type MeProfileSummary = {
  id: string;
  userId: string;
  version: number;
  goals: string[] | null;
  experience: string | null;
  weeklyAvailabilityMinutes: number | null;
  sessionDurationMinutes: number | null;
  availableDays: string[] | null;
  equipment: string[] | null;
  accessPreferences: Record<string, unknown> | null;
  effectiveAt: string;
};

export type MeResponse = {
  user: SessionUser;
  profile: MeProfileSummary | null;
};

export type AuthSuccessResponse = {
  user: SessionUser;
  profile: unknown;
  authMode: 'cookie' | 'bearer';
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
};

function apiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:3001';
  return raw.replace(/\/$/, '');
}

function apiUrl(path: string): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl()}/api/v1${normalised}`;
}

async function parseError(response: Response): Promise<ApiClientError> {
  let body: ApiErrorBody = {
    code: 'REQUEST_ERROR',
    message: response.statusText || 'Request failed',
  };
  try {
    const json: unknown = await response.json();
    if (json && typeof json === 'object') {
      const record = json as Record<string, unknown>;
      const next: ApiErrorBody = {
        code: typeof record.code === 'string' ? record.code : body.code,
        message: typeof record.message === 'string' ? record.message : body.message,
      };
      if (record.fieldErrors && typeof record.fieldErrors === 'object') {
        next.fieldErrors = record.fieldErrors as Record<string, string[]>;
      }
      if (typeof record.requestId === 'string') {
        next.requestId = record.requestId;
      }
      if (typeof record.retryable === 'boolean') {
        next.retryable = record.retryable;
      }
      body = next;
    }
  } catch {
    // Keep fallback body when response is not JSON.
  }
  return new ApiClientError(response.status, body);
}

/** Single-flight cookie refresh so parallel 401s do not rotate thrice. */
let refreshInFlight: Promise<boolean> | null = null;

async function tryCookieRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(apiUrl('/auth/refresh'), {
          method: 'POST',
          headers: {
            Accept: COOKIE_ACCEPT,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({}),
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function isAuthPath(path: string): boolean {
  return (
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/logout' ||
    path === '/auth/refresh'
  );
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options?: { cookieAuth?: boolean; retryOnUnauthorized?: boolean },
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (options?.cookieAuth !== false) {
    headers.set('Accept', COOKIE_ACCEPT);
  } else if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiClientError(0, {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      retryable: true,
    });
  }

  if (
    response.status === 401 &&
    options?.retryOnUnauthorized !== false &&
    !isAuthPath(path)
  ) {
    const refreshed = await tryCookieRefresh();
    if (refreshed) {
      return apiFetch<T>(path, init, {
        ...options,
        retryOnUnauthorized: false,
      });
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  register(body: RegisterRequest): Promise<AuthSuccessResponse> {
    return apiFetch<AuthSuccessResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  login(body: LoginRequest): Promise<AuthSuccessResponse> {
    return apiFetch<AuthSuccessResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  logout(): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  me(): Promise<MeResponse> {
    return apiFetch<MeResponse>('/me', { method: 'GET' });
  },

  getOnboarding(): Promise<{ progress: OnboardingProgress }> {
    return apiFetch<{ progress: OnboardingProgress }>('/onboarding', {
      method: 'GET',
    });
  },

  saveOnboardingStep(
    body: SaveOnboardingStep,
  ): Promise<{ progress: OnboardingProgress }> {
    return apiFetch<{ progress: OnboardingProgress }>('/onboarding', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  completeOnboarding(): Promise<CompleteOnboardingResponse> {
    return apiFetch<CompleteOnboardingResponse>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  listCharacters(): Promise<ListCharactersResponse> {
    return apiFetch<ListCharactersResponse>('/characters', { method: 'GET' });
  },

  selectCharacter(
    body: SelectCharacterRequest,
  ): Promise<{ selection: CharacterSelection }> {
    return apiFetch<{ selection: CharacterSelection }>('/characters/select', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getCurrentTrainingPlan(): Promise<CurrentTrainingPlanResponse> {
    return apiFetch<CurrentTrainingPlanResponse>('/training-plans/current', {
      method: 'GET',
    });
  },

  previewTrainingPlan(
    body: PreviewTrainingPlanRequest,
  ): Promise<PreviewTrainingPlanResponse> {
    return apiFetch<PreviewTrainingPlanResponse>('/training-plans/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  activateTrainingPlan(
    body: ActivateTrainingPlanRequest,
    idempotencyKey: string,
  ): Promise<ActivateTrainingPlanResponse> {
    return apiFetch<ActivateTrainingPlanResponse>('/training-plans', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    });
  },

  listPlannedSessions(): Promise<ListPlannedSessionsResponse> {
    return apiFetch<ListPlannedSessionsResponse>('/planned-sessions', {
      method: 'GET',
    });
  },

  shortenPlannedSession(
    plannedSessionId: string,
    body: ShortenPlannedSessionRequest,
  ): Promise<ShortenPlannedSessionResponse> {
    return apiFetch<ShortenPlannedSessionResponse>(
      `/planned-sessions/${plannedSessionId}/shorten`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  startWorkoutSession(
    body: StartWorkoutSessionRequest,
  ): Promise<StartWorkoutSessionResponse> {
    return apiFetch<StartWorkoutSessionResponse>('/workout-sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateWorkoutSet(
    workoutSessionId: string,
    setId: string,
    body: UpdateWorkoutSetRequest,
  ): Promise<UpdateWorkoutSetResponse> {
    return apiFetch<UpdateWorkoutSetResponse>(
      `/workout-sessions/${workoutSessionId}/sets/${setId}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
    );
  },

  completeWorkoutSession(
    workoutSessionId: string,
    body: CompleteWorkoutSessionRequest,
    idempotencyKey: string,
  ): Promise<CompleteWorkoutSessionResponse> {
    return apiFetch<CompleteWorkoutSessionResponse>(
      `/workout-sessions/${workoutSessionId}/complete`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(body),
      },
    );
  },

  abandonWorkoutSession(
    workoutSessionId: string,
    body: AbandonWorkoutSessionRequest = {},
  ): Promise<AbandonWorkoutSessionResponse> {
    return apiFetch<AbandonWorkoutSessionResponse>(
      `/workout-sessions/${workoutSessionId}/abandon`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  getExercise(id: string): Promise<{ exercise: ExerciseSummary }> {
    return apiFetch<{ exercise: ExerciseSummary }>(`/exercises/${id}`, {
      method: 'GET',
    });
  },

  getCurrentMealPlan(): Promise<CurrentMealPlanResponse> {
    return apiFetch<CurrentMealPlanResponse>('/meal-plans/current', {
      method: 'GET',
    });
  },

  previewMealPlan(body: PreviewMealPlanRequest): Promise<PreviewMealPlanResponse> {
    return apiFetch<PreviewMealPlanResponse>('/meal-plans/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  activateMealPlan(
    body: ActivateMealPlanRequest,
    idempotencyKey: string,
  ): Promise<ActivateMealPlanResponse> {
    return apiFetch<ActivateMealPlanResponse>('/meal-plans', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    });
  },

  previewNutritionTarget(
    body: PreviewNutritionTargetRequest,
  ): Promise<PreviewNutritionTargetResponse> {
    return apiFetch<PreviewNutritionTargetResponse>('/nutrition-targets/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  activateNutritionTarget(
    body: ActivateNutritionTargetRequest,
  ): Promise<ActivateNutritionTargetResponse> {
    return apiFetch<ActivateNutritionTargetResponse>('/nutrition-targets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  listRecipes(): Promise<ListRecipesResponse> {
    return apiFetch<ListRecipesResponse>('/recipes', { method: 'GET' });
  },

  getRecipe(id: string): Promise<{ recipe: RecipeDetail }> {
    return apiFetch<{ recipe: RecipeDetail }>(`/recipes/${id}`, {
      method: 'GET',
    });
  },

  previewMealSwap(
    plannedMealId: string,
    body: SwapMealPreviewRequest = {},
  ): Promise<SwapMealPreviewResponse> {
    return apiFetch<SwapMealPreviewResponse>(
      `/planned-meals/${plannedMealId}/swap-preview`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  confirmMealSwap(
    plannedMealId: string,
    body: SwapMealConfirmRequest,
  ): Promise<SwapMealConfirmResponse> {
    return apiFetch<SwapMealConfirmResponse>(
      `/planned-meals/${plannedMealId}/swap-confirm`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  createMealLog(body: CreateMealLogRequest): Promise<CreateMealLogResponse> {
    return apiFetch<CreateMealLogResponse>('/meal-logs', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getCurrentGroceryList(): Promise<CurrentGroceryListResponse> {
    return apiFetch<CurrentGroceryListResponse>('/grocery-lists/current', {
      method: 'GET',
    });
  },

  getProgressSummary(): Promise<ProgressSummaryResponse> {
    return apiFetch<ProgressSummaryResponse>('/progress/summary', {
      method: 'GET',
    });
  },

  getProgressXpLedger(limit?: number): Promise<ProgressXpLedgerResponse> {
    const q = limit != null ? `?limit=${limit}` : '';
    return apiFetch<ProgressXpLedgerResponse>(`/progress/xp-ledger${q}`, {
      method: 'GET',
    });
  },

  getProgressHistory(days?: number): Promise<ProgressHistoryResponse> {
    const q = days != null ? `?days=${days}` : '';
    return apiFetch<ProgressHistoryResponse>(`/progress/history${q}`, {
      method: 'GET',
    });
  },

  getContentToday(locale?: string): Promise<ContentTodayResponse> {
    const q = locale ? `?locale=${encodeURIComponent(locale)}` : '';
    return apiFetch<ContentTodayResponse>(`/content/today${q}`, {
      method: 'GET',
    });
  },

  listMedia(): Promise<ListMediaResponse> {
    return apiFetch<ListMediaResponse>('/media', { method: 'GET' });
  },

  accessMedia(
    id: string,
    body: MediaAccessRequest = { purpose: 'IN_APP_DISPLAY' },
  ): Promise<MediaAccessResponse> {
    return apiFetch<MediaAccessResponse>(`/media/${id}/access`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getNotificationPreferences(): Promise<GetNotificationPreferencesResponse> {
    return apiFetch<GetNotificationPreferencesResponse>(
      '/notification-preferences',
      { method: 'GET' },
    );
  },

  updateNotificationPreferences(
    body: UpdateNotificationPreferencesRequest,
  ): Promise<GetNotificationPreferencesResponse> {
    return apiFetch<GetNotificationPreferencesResponse>(
      '/notification-preferences',
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
    );
  },

  listNotifications(): Promise<ListNotificationsResponse> {
    return apiFetch<ListNotificationsResponse>('/notifications', {
      method: 'GET',
    });
  },

  markNotificationRead(id: string): Promise<MarkNotificationReadResponse> {
    return apiFetch<MarkNotificationReadResponse>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },
};

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Calendar date YYYY-MM-DD in an IANA time zone. */
export function localDateInTimeZone(timeZone: string, at: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}
