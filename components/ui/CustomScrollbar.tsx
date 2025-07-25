import React, { useEffect, useRef, useState } from 'react';

interface CustomScrollbarProps {
  containerRef: React.RefObject<HTMLElement | HTMLDivElement>;
  height: number;
  top?: number;
  left?: number;
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ containerRef, height, top = 0, left }) => {
  const [thumbHeight, setThumbHeight] = useState(40);
  const [thumbTop, setThumbTop] = useState(0);
  const [visible, setVisible] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);

  // Calculate thumb size and position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const { scrollHeight, clientHeight, scrollTop } = container;
      if (scrollHeight <= clientHeight) {
        setVisible(false);
        return;
      }
      setVisible(true);
      const ratio = clientHeight / scrollHeight;
      setThumbHeight(Math.max(40, clientHeight * ratio));
      setThumbTop((scrollTop / (scrollHeight - clientHeight)) * (clientHeight - Math.max(40, clientHeight * ratio)));
    };
    update();
    container.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      container.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [containerRef, height]);

  // Drag logic
  const onThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startY.current = e.clientY;
    startScroll.current = containerRef.current?.scrollTop || 0;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const container = containerRef.current;
    const { scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const maxThumbTop = clientHeight - thumbHeight;
    const deltaY = e.clientY - startY.current;
    const newThumbTop = Math.min(Math.max(thumbTop + deltaY, 0), maxThumbTop);
    const newScrollTop = (newThumbTop / maxThumbTop) * maxScroll;
    container.scrollTop = newScrollTop;
  };
  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        right: 0,
        height,
        width: 16,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: thumbTop,
          right: 1,
          width: 14,
          height: thumbHeight,
          background: 'rgba(0,0,0,0.28)',
          borderRadius: 6,
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'background 0.2s',
        }}
        onMouseDown={onThumbMouseDown}
      />
    </div>
  );
};

export default CustomScrollbar; 