const VISITOR_ID_KEY = 'ueab_visitor_id';

export function getVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
