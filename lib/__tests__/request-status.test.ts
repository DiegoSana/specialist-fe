import { RequestInterestStatus, RequestStatus } from '@/types';
import {
  INTEREST_STATUS_META,
  REQUEST_STATUS_META,
  TIMELINE_STATUSES,
  getBallOwner,
  getHintKey,
  bucketRequests,
  getPrimaryAction,
  getReportOption,
  getRequestBucket,
} from '../request-status';
import es from '@/messages/es.json';
import en from '@/messages/en.json';

const ALL = Object.values(RequestStatus);
const FINAL_NO_AGREEMENT = [
  RequestStatus.EXPIRED,
  RequestStatus.NO_RESPONSE,
  RequestStatus.REJECTED,
  RequestStatus.CANCELLED,
  RequestStatus.NOT_COMPLETED,
  RequestStatus.INTERRUPTED,
  RequestStatus.ABANDONED,
];

describe('request status metadata', () => {
  it('covers all 15 statuses', () => {
    expect(ALL).toHaveLength(15);
    expect(Object.keys(REQUEST_STATUS_META).sort()).toEqual([...ALL].sort());
  });

  it.each(ALL)('%s has a badge, label key and translations in es and en', (status) => {
    const meta = REQUEST_STATUS_META[status];
    expect(meta.badgeClass).toMatch(/bg-/);
    for (const messages of [es, en] as any[]) {
      expect(messages.requestStatus.status[meta.labelKey]).toBeTruthy();
      expect(messages.requestStatus.hints.client[status]).toBeTruthy();
      expect(messages.requestStatus.hints.provider[status]).toBeTruthy();
      expect(messages.components.timeline.descriptions[status]).toBeTruthy();
    }
  });

  it('flags exactly the 7 final no-agreement statuses', () => {
    const flagged = ALL.filter((s) => REQUEST_STATUS_META[s].isFinalNoAgreement);
    expect(flagged.sort()).toEqual([...FINAL_NO_AGREEMENT].sort());
  });

  it('puts only the post-contact statuses on the timeline, in order', () => {
    expect(TIMELINE_STATUSES.map((s) => REQUEST_STATUS_META[s].timelineStep)).toEqual([0, 1, 2, 3]);
    const onTimeline = ALL.filter((s) => REQUEST_STATUS_META[s].timelineStep !== null);
    expect(onTimeline.sort()).toEqual(
      [...TIMELINE_STATUSES, RequestStatus.UNDER_REVIEW].sort(),
    );
    expect(REQUEST_STATUS_META[RequestStatus.UNDER_REVIEW].timelineStep).toBe(2);
  });

  it('only offers "volver a publicar" for the statuses that did not come to an agreement', () => {
    const republishable = ALL.filter((s) => REQUEST_STATUS_META[s].canRepublish);
    expect(republishable.sort()).toEqual(
      [
        RequestStatus.EXPIRED,
        RequestStatus.NO_RESPONSE,
        RequestStatus.REJECTED,
        RequestStatus.NOT_COMPLETED,
        RequestStatus.ABANDONED,
      ].sort(),
    );
  });
});

describe('ball owner and buckets', () => {
  it('matches the spec table', () => {
    expect(getBallOwner(RequestStatus.DRAFT)).toBe('CLIENT');
    expect(getBallOwner(RequestStatus.SENT)).toBe('PROVIDER');
    expect(getBallOwner(RequestStatus.IN_PROGRESS)).toBe('PROVIDER');
    expect(getBallOwner(RequestStatus.FINISHED)).toBe('CLIENT');
    expect(getBallOwner(RequestStatus.UNDER_REVIEW)).toBe('SUPPORT');
    expect(getBallOwner(RequestStatus.CLOSED)).toBe('NONE');
  });

  it('a published request is the client turn only once someone is interested', () => {
    expect(getBallOwner(RequestStatus.PUBLISHED)).toBe('PROVIDER');
    expect(getBallOwner(RequestStatus.PUBLISHED, { interestCount: 3 })).toBe('CLIENT');
    expect(getRequestBucket(RequestStatus.PUBLISHED, 'client', { interestCount: 3 })).toBe('yours');
    expect(getRequestBucket(RequestStatus.PUBLISHED, 'client')).toBe('waiting');
  });

  it.each([
    [RequestStatus.DRAFT, 'client', 'yours'],
    [RequestStatus.SENT, 'client', 'waiting'],
    [RequestStatus.SENT, 'provider', 'yours'],
    [RequestStatus.CONTACT_RELEASED, 'client', 'yours'],
    [RequestStatus.CONTACT_RELEASED, 'provider', 'yours'],
    [RequestStatus.IN_PROGRESS, 'client', 'waiting'],
    [RequestStatus.IN_PROGRESS, 'provider', 'yours'],
    [RequestStatus.FINISHED, 'client', 'yours'],
    [RequestStatus.FINISHED, 'provider', 'waiting'],
    [RequestStatus.UNDER_REVIEW, 'client', 'waiting'],
    [RequestStatus.UNDER_REVIEW, 'provider', 'waiting'],
    [RequestStatus.CLOSED, 'client', 'closed'],
    [RequestStatus.CLOSED, 'provider', 'closed'],
  ] as const)('%s for %s is in "%s"', (status, role, bucket) => {
    expect(getRequestBucket(status, role)).toBe(bucket);
  });

  it.each(FINAL_NO_AGREEMENT)('%s goes to the collapsed final strip for both roles', (status) => {
    expect(getRequestBucket(status, 'client')).toBe('final');
    expect(getRequestBucket(status, 'provider')).toBe('final');
  });
});

describe('primary action', () => {
  it('client', () => {
    expect(getPrimaryAction(RequestStatus.DRAFT, 'client')).toBe('CONTINUE_DRAFT');
    expect(getPrimaryAction(RequestStatus.PUBLISHED, 'client', { interestCount: 2 })).toBe('VIEW_INTERESTS');
    expect(getPrimaryAction(RequestStatus.PUBLISHED, 'client')).toBe('NONE');
    expect(getPrimaryAction(RequestStatus.SENT, 'client')).toBe('NONE');
    expect(getPrimaryAction(RequestStatus.CONTACT_RELEASED, 'client')).toBe('OPEN_WHATSAPP');
    expect(getPrimaryAction(RequestStatus.IN_PROGRESS, 'client')).toBe('NONE');
    expect(getPrimaryAction(RequestStatus.FINISHED, 'client')).toBe('CONFIRM_OBJECT');
    expect(getPrimaryAction(RequestStatus.CLOSED, 'client')).toBe('RATE');
    expect(getPrimaryAction(RequestStatus.NOT_COMPLETED, 'client')).toBe('REPUBLISH');
    expect(getPrimaryAction(RequestStatus.CANCELLED, 'client')).toBe('NONE');
  });

  it('provider', () => {
    expect(getPrimaryAction(RequestStatus.SENT, 'provider')).toBe('ACCEPT_REJECT');
    expect(getPrimaryAction(RequestStatus.CONTACT_RELEASED, 'provider')).toBe('OPEN_WHATSAPP');
    expect(getPrimaryAction(RequestStatus.IN_PROGRESS, 'provider')).toBe('MARK_FINISHED');
    expect(getPrimaryAction(RequestStatus.FINISHED, 'provider')).toBe('NONE');
    expect(getPrimaryAction(RequestStatus.CLOSED, 'provider')).toBe('RATE');
    expect(getPrimaryAction(RequestStatus.REJECTED, 'provider')).toBe('NONE');
  });

  it('CLOSED does not offer RATE again once the viewer already reviewed', () => {
    expect(getPrimaryAction(RequestStatus.CLOSED, 'client', { alreadyReviewed: true })).toBe('NONE');
    expect(getPrimaryAction(RequestStatus.CLOSED, 'client', { alreadyReviewed: false })).toBe('RATE');
    expect(getPrimaryAction(RequestStatus.CLOSED, 'provider', { alreadyReviewed: true })).toBe('NONE');
    expect(getPrimaryAction(RequestStatus.CLOSED, 'provider', { alreadyReviewed: false })).toBe('RATE');
  });

  it('every status resolves an action for both roles without throwing', () => {
    for (const status of ALL) {
      expect(getPrimaryAction(status, 'client')).toBeDefined();
      expect(getPrimaryAction(status, 'provider')).toBeDefined();
    }
  });
});

describe('hints', () => {
  it('uses a dedicated client hint for a published request with no interests yet', () => {
    expect(getHintKey(RequestStatus.PUBLISHED, 'client')).toBe('PUBLISHED_NO_INTERESTS');
    expect(getHintKey(RequestStatus.PUBLISHED, 'client', { interestCount: 1 })).toBe('PUBLISHED');
    expect(getHintKey(RequestStatus.PUBLISHED, 'provider')).toBe('PUBLISHED');
    for (const messages of [es, en] as any[]) {
      expect(messages.requestStatus.hints.client.PUBLISHED_NO_INTERESTS).toBeTruthy();
    }
  });
});

describe('interest status metadata', () => {
  it.each(Object.values(RequestInterestStatus))('%s has a label in es and en', (status) => {
    const meta = INTEREST_STATUS_META[status];
    for (const messages of [es, en] as any[]) {
      expect(messages.requestStatus.interest[meta.labelKey]).toBeTruthy();
    }
  });

  it('mutes the statuses the specialist can no longer act on', () => {
    expect(INTEREST_STATUS_META[RequestInterestStatus.NOT_CHOSEN].muted).toBe(true);
    expect(INTEREST_STATUS_META[RequestInterestStatus.WITHDRAWN].muted).toBe(true);
    expect(INTEREST_STATUS_META[RequestInterestStatus.INTERESTED].muted).toBe(false);
  });
});

describe('bucketRequests', () => {
  const req = (status: RequestStatus, interestsCount?: number) => ({ status, interestsCount });

  it('splits a client list into yours / waiting / closed / final', () => {
    const buckets = bucketRequests(
      [
        req(RequestStatus.DRAFT),
        req(RequestStatus.PUBLISHED, 3),
        req(RequestStatus.PUBLISHED, 0),
        req(RequestStatus.SENT),
        req(RequestStatus.CONTACT_RELEASED),
        req(RequestStatus.IN_PROGRESS),
        req(RequestStatus.FINISHED),
        req(RequestStatus.UNDER_REVIEW),
        req(RequestStatus.CLOSED),
        req(RequestStatus.REJECTED),
        req(RequestStatus.ABANDONED),
      ],
      'client',
    );
    expect(buckets.yours.map((r) => r.status)).toEqual([
      RequestStatus.DRAFT,
      RequestStatus.PUBLISHED,
      RequestStatus.CONTACT_RELEASED,
      RequestStatus.FINISHED,
    ]);
    expect(buckets.waiting).toHaveLength(4);
    expect(buckets.closed.map((r) => r.status)).toEqual([RequestStatus.CLOSED]);
    expect(buckets.final.map((r) => r.status)).toEqual([RequestStatus.REJECTED, RequestStatus.ABANDONED]);
  });

  it('splits a specialist list the other way around', () => {
    const buckets = bucketRequests(
      [
        req(RequestStatus.SENT),
        req(RequestStatus.IN_PROGRESS),
        req(RequestStatus.FINISHED),
        req(RequestStatus.CLOSED),
        req(RequestStatus.NO_RESPONSE),
      ],
      'provider',
    );
    expect(buckets.yours.map((r) => r.status)).toEqual([RequestStatus.SENT, RequestStatus.IN_PROGRESS]);
    expect(buckets.waiting.map((r) => r.status)).toEqual([RequestStatus.FINISHED]);
    expect(buckets.closed).toHaveLength(1);
    expect(buckets.final).toHaveLength(1);
  });

  it('puts every one of the 15 statuses in exactly one bucket for both roles', () => {
    const all = Object.values(RequestStatus).map((status) => req(status as RequestStatus));
    for (const role of ['client', 'provider'] as const) {
      const buckets = bucketRequests(all, role);
      const total = buckets.yours.length + buckets.waiting.length + buckets.closed.length + buckets.final.length;
      expect(total).toBe(15);
    }
  });
});

describe('getReportOption', () => {
  it('offers NOT_COMPLETED to both roles once contact is released', () => {
    expect(getReportOption(RequestStatus.CONTACT_RELEASED, 'client')).toBe('NOT_COMPLETED');
    expect(getReportOption(RequestStatus.CONTACT_RELEASED, 'provider')).toBe('NOT_COMPLETED');
  });

  it('offers INTERRUPTED to both roles while in progress (backend PR #66 allows either side, per handoff-brief.md)', () => {
    expect(getReportOption(RequestStatus.IN_PROGRESS, 'provider')).toBe('INTERRUPTED');
    expect(getReportOption(RequestStatus.IN_PROGRESS, 'client')).toBe('INTERRUPTED');
  });

  it('offers nothing in other statuses', () => {
    expect(getReportOption(RequestStatus.FINISHED, 'client')).toBeNull();
    expect(getReportOption(RequestStatus.PUBLISHED, 'provider')).toBeNull();
  });
});
