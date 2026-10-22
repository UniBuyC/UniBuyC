import { ForbiddenException } from '@nestjs/common';

interface ModerationFields {
  suspendedUntil: Date | null;
  bannedAt: Date | null;
  suspensionReason?: string | null;
}

const formatDate = (date: Date) =>
  date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'long', timeStyle: 'short' });

// Si la cuenta está bloqueada o suspendida, lanza un 403 con un mensaje para mostrar en la app.
// El campo `error: ACCOUNT_SUSPENDED` le indica a la app que debe cerrar la sesión.
export function assertAccountActive(user: ModerationFields) {
  const reason = user.suspensionReason ? ` Motivo: ${user.suspensionReason}` : '';
  if (user.bannedAt) {
    throw new ForbiddenException({
      statusCode: 403,
      error: 'ACCOUNT_SUSPENDED',
      message: `Tu cuenta fue suspendida permanentemente.${reason}`,
    });
  }
  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    throw new ForbiddenException({
      statusCode: 403,
      error: 'ACCOUNT_SUSPENDED',
      // La hora ya termina en "p.m." / "a.m.": no agregamos otro punto
      message: `Tu cuenta está suspendida hasta el ${formatDate(user.suspendedUntil).replace(/\.?$/, '.')}${reason}`,
    });
  }
}

// Filtro de Prisma: vendedores activos (ni bloqueados ni suspendidos en este momento)
export const activeSellerFilter = () => ({
  bannedAt: null,
  OR: [{ suspendedUntil: null }, { suspendedUntil: { lt: new Date() } }],
});
