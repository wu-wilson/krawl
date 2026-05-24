import React from 'react';

import { useAmbientCanvas } from '../../hooks/useAmbientCanvas';

/**
 * Ambient constellation background — sparse drifting particles connected by faint lines
 * @returns Canvas with a slow-moving network effect
 */
export const AnimatedBackground: React.FC = () => {
  const canvasRef = useAmbientCanvas();

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};
