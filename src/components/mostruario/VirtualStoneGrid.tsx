import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Grid } from 'react-window';
import StoneCard from './StoneCard';

interface Props {
  stones: any[];
  isMarmorista: boolean;
  onDetail: (s: any) => void;
  onUploadPhoto?: (s: any) => void;
}

const GAP = 12; // matches gap-3
const ROW_HEIGHT = 260; // aspect-[4/3] image (~180) + card content

const getCols = (w: number) => (w >= 1024 ? 4 : w >= 640 ? 3 : 2);

const VirtualStoneGrid = ({ stones, isMarmorista, onDetail, onUploadPhoto }: Props) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const cols = width ? getCols(width) : 2;
  const rowCount = Math.ceil(stones.length / cols);
  const cellWidth = width ? Math.floor((width - GAP * (cols - 1)) / cols) : 0;

  const cellProps = useMemo(
    () => ({ stones, cols, isMarmorista, onDetail, onUploadPhoto }),
    [stones, cols, isMarmorista, onDetail, onUploadPhoto]
  );

  // Fallback: for short lists, render plain grid (no virtualization overhead).
  if (stones.length <= 40) {
    return (
      <div ref={wrapRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {stones.map((s, i) => (
          <StoneCard key={s.id} stone={s} isMarmorista={isMarmorista} onDetail={onDetail} onUploadPhoto={onUploadPhoto} index={i} />
        ))}
      </div>
    );
  }

  // Height: min(viewport - ~280px header/filters, rows * rowHeight)
  const maxH = typeof window !== 'undefined' ? Math.max(400, window.innerHeight - 280) : 800;
  const totalH = rowCount * (ROW_HEIGHT + GAP);
  const height = Math.min(maxH, totalH);

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      {width > 0 && (
        <Grid
          cellComponent={Cell}
          cellProps={cellProps}
          columnCount={cols}
          columnWidth={cellWidth + GAP}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT + GAP}
          defaultHeight={height}
          defaultWidth={width}
          style={{ height, width }}
          overscanCount={2}
        />
      )}
    </div>
  );
};

const Cell = ({ columnIndex, rowIndex, style, stones, cols, isMarmorista, onDetail, onUploadPhoto }: any) => {
  const idx = rowIndex * cols + columnIndex;
  const s = stones[idx];
  if (!s) return <div style={style} />;
  return (
    <div style={{ ...style, paddingRight: columnIndex < cols - 1 ? GAP : 0, paddingBottom: GAP }}>
      <StoneCard stone={s} isMarmorista={isMarmorista} onDetail={onDetail} onUploadPhoto={onUploadPhoto} index={idx} />
    </div>
  );
};

export default VirtualStoneGrid;
