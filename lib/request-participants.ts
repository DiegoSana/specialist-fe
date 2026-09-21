import { Request } from '@/types';
import { RequestRole } from '@/lib/request-status';

export interface Counterpart {
  name: string | null;
  phone: string | null;
  initials: string;
}

function initialsOf(name: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** The other side of the request from the viewer's point of view (provider for the client, and vice versa). */
export function getCounterpart(request: Request, role: RequestRole): Counterpart {
  if (role === 'client') {
    let name: string | null = null;
    let phone: string | null = null;
    if (request.company?.companyName) {
      name = request.company.companyName;
      phone = request.company.phone ?? null;
    } else if (request.professional) {
      const user = request.professional.user;
      const full = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
      name = full || null;
      phone = request.professional.whatsapp ?? null;
    }
    return { name, phone, initials: initialsOf(name) };
  }
  const client = request.client;
  const name = client ? `${client.firstName} ${client.lastName}`.trim() : null;
  return { name, phone: client?.phone ?? null, initials: initialsOf(name) };
}

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
}
