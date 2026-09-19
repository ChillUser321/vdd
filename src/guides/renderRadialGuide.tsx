export function renderRadialGuide({ spokes, radius, color, strokeWidth }: { spokes: number; radius: number; color: string; strokeWidth: number }) {
  return <>{Array.from({ length: spokes }, (_, index) => {
    const angle = (index / spokes) * Math.PI * 2;
    return <line data-guide-part="radial-spoke" key={index} x1={0} y1={0} x2={Math.cos(angle) * radius} y2={Math.sin(angle) * radius} stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />;
  })}<circle cx={0} cy={0} fill="none" r={radius} stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" /></>;
}
