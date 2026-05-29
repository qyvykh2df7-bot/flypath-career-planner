type FlyPathAlertsBlockProps = {
  alerts: string[];
};

function AlertItem({ alert }: { alert: string }) {
  return (
    <li className="flex gap-2 text-[13px] leading-snug text-amber-950/90">
      <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
      <span>{alert}</span>
    </li>
  );
}

function AlertList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5" role="list">
      {items.map((alert) => (
        <AlertItem key={alert} alert={alert} />
      ))}
    </ul>
  );
}

export function FlyPathAlertsBlock({ alerts }: FlyPathAlertsBlockProps) {
  if (alerts.length === 0) {
    return null;
  }

  const useTwoColumns = alerts.length >= 4;
  const splitAt = Math.ceil(alerts.length / 2);
  const leftAlerts = alerts.slice(0, splitAt);
  const rightAlerts = alerts.slice(splitAt);

  return (
    <section className="rounded-2xl border border-amber-200/90 bg-[#faf6ee] px-4 py-3.5 shadow-sm sm:px-5">
      <p className="text-sm font-semibold text-amber-950">Alertas FlyPath</p>
      {useTwoColumns ? (
        <div className="mt-2.5 grid gap-x-8 gap-y-0 sm:grid-cols-2">
          <AlertList items={leftAlerts} />
          <AlertList items={rightAlerts} />
        </div>
      ) : (
        <ul className="mt-2.5 space-y-1.5" role="list">
          {alerts.map((alert) => (
            <AlertItem key={alert} alert={alert} />
          ))}
        </ul>
      )}
    </section>
  );
}
