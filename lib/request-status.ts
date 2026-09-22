import { RequestInterestStatus, RequestStatus } from '@/types';

/**
 * Single source of truth for how each RequestStatus is presented and who "owns the ball",
 * per specialist-be/docs/EspecialistBRC — Estados del pedido.md. Every list/detail/timeline
 * derives label, badge, tab and primary action from here instead of switching on the enum.
 * Labels live in messages/{es,en}.json under `requestStatus`.
 */

export type BallOwner = 'CLIENT' | 'PROVIDER' | 'SYSTEM' | 'SUPPORT' | 'NONE';
export type RequestRole = 'client' | 'provider';

/** Tabs of the list screens; `final` is the collapsed "finalizados sin acuerdo" strip. */
export type RequestBucket = 'yours' | 'waiting' | 'closed' | 'final';

export type PrimaryAction =
  | 'CONTINUE_DRAFT'
  | 'VIEW_INTERESTS'
  | 'ACCEPT_REJECT'
  | 'OPEN_WHATSAPP'
  | 'MARK_FINISHED'
  | 'CONFIRM_OBJECT'
  | 'RATE'
  | 'REPUBLISH'
  | 'NONE';

export interface RequestStatusMeta {
  /** Key under `requestStatus.status` in the message catalogs. */
  labelKey: string;
  badgeClass: string;
  ballOwner: BallOwner;
  /** 0..3 for CONTACT_RELEASED → IN_PROGRESS → FINISHED → CLOSED; null when not on the timeline. */
  timelineStep: number | null;
  /** Ends the request without an agreement (collapsed strip, offers "volver a publicar"). */
  isFinalNoAgreement: boolean;
  /** Whether the client can create a new request copying this one. */
  canRepublish: boolean;
}

export const TIMELINE_STATUSES = [
  RequestStatus.CONTACT_RELEASED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.FINISHED,
  RequestStatus.CLOSED,
] as const;

const GRAY = 'bg-gray-100 text-gray-600';
const RED = 'bg-red-100 text-red-800';
const AMBER = 'bg-amber-100 text-amber-800';

export const REQUEST_STATUS_META: Record<RequestStatus, RequestStatusMeta> = {
  [RequestStatus.DRAFT]: {
    labelKey: 'DRAFT',
    badgeClass: GRAY,
    ballOwner: 'CLIENT',
    timelineStep: null,
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.PUBLISHED]: {
    labelKey: 'PUBLISHED',
    badgeClass: 'bg-blue-100 text-blue-800',
    ballOwner: 'PROVIDER', // specialists first, then the client once someone is interested
    timelineStep: null,
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.SENT]: {
    labelKey: 'SENT',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    ballOwner: 'PROVIDER',
    timelineStep: null,
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.CONTACT_RELEASED]: {
    labelKey: 'CONTACT_RELEASED',
    badgeClass: 'bg-teal-100 text-teal-700',
    ballOwner: 'CLIENT', // both sides coordinate — see getRequestBucket
    timelineStep: 0,
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.IN_PROGRESS]: {
    labelKey: 'IN_PROGRESS',
    badgeClass: 'bg-purple-100 text-purple-800',
    ballOwner: 'PROVIDER',
    timelineStep: 1,
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.FINISHED]: {
    labelKey: 'FINISHED',
    badgeClass: 'bg-indigo-100 text-indigo-800',
    ballOwner: 'CLIENT',
    timelineStep: 2,
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.CLOSED]: {
    labelKey: 'CLOSED',
    badgeClass: 'bg-green-100 text-green-800',
    ballOwner: 'NONE',
    timelineStep: 3,
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.UNDER_REVIEW]: {
    labelKey: 'UNDER_REVIEW',
    badgeClass: 'bg-orange-100 text-orange-800',
    ballOwner: 'SUPPORT',
    timelineStep: 2, // detour from FINISHED: stays on the "Terminado" step
    isFinalNoAgreement: false,
    canRepublish: false,
  },
  [RequestStatus.EXPIRED]: {
    labelKey: 'EXPIRED',
    badgeClass: GRAY,
    ballOwner: 'NONE',
    timelineStep: null,
    isFinalNoAgreement: true,
    canRepublish: true,
  },
  [RequestStatus.NO_RESPONSE]: {
    labelKey: 'NO_RESPONSE',
    badgeClass: GRAY,
    ballOwner: 'NONE',
    timelineStep: null,
    isFinalNoAgreement: true,
    canRepublish: true,
  },
  [RequestStatus.REJECTED]: {
    labelKey: 'REJECTED',
    badgeClass: RED,
    ballOwner: 'NONE',
    timelineStep: null,
    isFinalNoAgreement: true,
    canRepublish: true,
  },
  [RequestStatus.CANCELLED]: {
    labelKey: 'CANCELLED',
    badgeClass: RED,
    ballOwner: 'NONE',
    timelineStep: null,
    isFinalNoAgreement: true,
    canRepublish: false,
  },
  [RequestStatus.NOT_COMPLETED]: {
    labelKey: 'NOT_COMPLETED',
    badgeClass: AMBER,
    ballOwner: 'NONE',
    timelineStep: null,
    isFinalNoAgreement: true,
    canRepublish: true,
  },
  [RequestStatus.INTERRUPTED]: {
    labelKey: 'INTERRUPTED',
    badgeClass: AMBER,
    ballOwner: 'NONE',
    timelineStep: null,
    isFinalNoAgreement: true,
    canRepublish: false,
  },
  [RequestStatus.ABANDONED]: {
    labelKey: 'ABANDONED',
    badgeClass: GRAY,
    ballOwner: 'NONE',
    timelineStep: null,
    isFinalNoAgreement: true,
    canRepublish: true,
  },
};

export function getRequestStatusMeta(status: RequestStatus): RequestStatusMeta {
  return REQUEST_STATUS_META[status];
}

export interface RequestStatusContext {
  /** Number of specialists currently INTERESTED (PUBLISHED requests only). */
  interestCount?: number;
  /** Whether the viewer already left their review/rating for this CLOSED request. */
  alreadyReviewed?: boolean;
}

/**
 * Whose turn it is. A PUBLISHED request is the client's turn only once at least one
 * specialist showed interest; before that the ball is with the specialists.
 */
export function getBallOwner(
  status: RequestStatus,
  ctx: RequestStatusContext = {},
): BallOwner {
  if (status === RequestStatus.PUBLISHED) {
    return (ctx.interestCount ?? 0) > 0 ? 'CLIENT' : 'PROVIDER';
  }
  return REQUEST_STATUS_META[status].ballOwner;
}

/** Which list bucket a request falls into for the viewer's role. */
export function getRequestBucket(
  status: RequestStatus,
  role: RequestRole,
  ctx: RequestStatusContext = {},
): RequestBucket {
  const meta = REQUEST_STATUS_META[status];
  if (meta.isFinalNoAgreement) return 'final';
  if (status === RequestStatus.CLOSED) return 'closed';
  if (status === RequestStatus.CONTACT_RELEASED) return 'yours'; // both sides coordinate
  const owner = getBallOwner(status, ctx);
  const mine: BallOwner = role === 'client' ? 'CLIENT' : 'PROVIDER';
  return owner === mine ? 'yours' : 'waiting';
}

/** The single primary action a card/detail offers to the viewer for this status. */
export function getPrimaryAction(
  status: RequestStatus,
  role: RequestRole,
  ctx: RequestStatusContext = {},
): PrimaryAction {
  if (role === 'client') {
    switch (status) {
      case RequestStatus.DRAFT:
        return 'CONTINUE_DRAFT';
      case RequestStatus.PUBLISHED:
        return (ctx.interestCount ?? 0) > 0 ? 'VIEW_INTERESTS' : 'NONE';
      case RequestStatus.CONTACT_RELEASED:
        return 'OPEN_WHATSAPP';
      case RequestStatus.FINISHED:
        return 'CONFIRM_OBJECT';
      case RequestStatus.CLOSED:
        return ctx.alreadyReviewed ? 'NONE' : 'RATE';
      default:
        return REQUEST_STATUS_META[status].canRepublish ? 'REPUBLISH' : 'NONE';
    }
  }
  switch (status) {
    case RequestStatus.SENT:
      return 'ACCEPT_REJECT';
    case RequestStatus.CONTACT_RELEASED:
      return 'OPEN_WHATSAPP';
    case RequestStatus.IN_PROGRESS:
      return 'MARK_FINISHED';
    case RequestStatus.CLOSED:
      return ctx.alreadyReviewed ? 'NONE' : 'RATE';
    default:
      return 'NONE';
  }
}

/**
 * Message key (under `requestStatus.hints.<role>`) for the "Te toca a vos — …" style hint.
 * A PUBLISHED request has a distinct client hint while nobody showed interest yet.
 */
export function getHintKey(
  status: RequestStatus,
  role: RequestRole,
  ctx: RequestStatusContext = {},
): string {
  if (
    status === RequestStatus.PUBLISHED &&
    role === 'client' &&
    (ctx.interestCount ?? 0) === 0
  ) {
    return 'PUBLISHED_NO_INTERESTS';
  }
  return status;
}

export interface InterestStatusMeta {
  labelKey: string;
  badgeClass: string;
  /** Rendered dimmed in the specialist's "postulaciones" list. */
  muted: boolean;
}

export const INTEREST_STATUS_META: Record<
  RequestInterestStatus,
  InterestStatusMeta
> = {
  [RequestInterestStatus.INTERESTED]: {
    labelKey: 'INTERESTED',
    badgeClass: 'bg-blue-50 text-blue-600 border border-blue-100',
    muted: false,
  },
  [RequestInterestStatus.CHOSEN]: {
    labelKey: 'CHOSEN',
    badgeClass: 'bg-green-100 text-green-800',
    muted: false,
  },
  [RequestInterestStatus.NOT_CHOSEN]: {
    labelKey: 'NOT_CHOSEN',
    badgeClass: 'bg-gray-100 text-gray-500',
    muted: true,
  },
  [RequestInterestStatus.WITHDRAWN]: {
    labelKey: 'WITHDRAWN',
    badgeClass: 'bg-gray-100 text-gray-500',
    muted: true,
  },
};

/** Which "informar" option (if any) the viewer has for this status: a reason-bearing final state. */
export function getReportOption(
  status: RequestStatus,
  _role: RequestRole,
): 'NOT_COMPLETED' | 'INTERRUPTED' | null {
  // Mirrors specialist-be TRANSITIONS: CONTACT_RELEASED -> NOT_COMPLETED (either side),
  // IN_PROGRESS -> INTERRUPTED (either side, per handoff-brief.md item 6 — a deliberate
  // divergence from the original spec doc, see specialist-be PR #66).
  if (status === RequestStatus.CONTACT_RELEASED) return 'NOT_COMPLETED';
  if (status === RequestStatus.IN_PROGRESS) return 'INTERRUPTED';
  return null;
}

export type BucketedRequests<T> = Record<RequestBucket, T[]>;

/** Splits a list into the tab buckets ("yours" / "waiting" / "closed") + the final-states strip. */
export function bucketRequests<
  T extends { status: RequestStatus; interestsCount?: number },
>(requests: T[], role: RequestRole): BucketedRequests<T> {
  const buckets: BucketedRequests<T> = {
    yours: [],
    waiting: [],
    closed: [],
    final: [],
  };
  for (const request of requests) {
    const bucket = getRequestBucket(request.status, role, {
      interestCount: request.interestsCount,
    });
    buckets[bucket].push(request);
  }
  return buckets;
}
