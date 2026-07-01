export function scrollCarouselToIndex(el: HTMLDivElement | null, index: number) {
  if (!el) return;
  const children = Array.from(el.children) as HTMLElement[];
  const target = children[index];
  if (!target) return;

  const left = target.offsetLeft + target.offsetWidth / 2 - el.clientWidth / 2;

  el.scrollLeft = left;
}
