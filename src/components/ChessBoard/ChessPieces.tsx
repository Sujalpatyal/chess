import React from 'react';
import { PieceStyleId } from '../../types/chess';

interface PieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  style?: PieceStyleId;
  className?: string;
}

export const ChessPiece: React.FC<PieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#1E293B';
  const stroke = isWhite ? '#334155' : '#0F172A';
  const accent = isWhite ? '#E2E8F0' : '#475569';

  switch (type) {
    case 'p':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M12 39.5h21" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'n':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M22 10c-3.5 0-6 2-7.5 5-2 4-1 8 0 10-1.5.5-3 1.5-3.5 3 0 0-.5 2 1.5 2 2 0 4-1 5.5-2 1.5 2 4.5 3.5 7.5 3.5 2.5 0 5-1 6.5-2.5 1 2 2.5 3 5 3 1.5 0 2.5-1 2-2.5-1-2-2-4.5-1-8 1-3.5-.5-6.5-2.5-8.5-3.5-3.5-8.5-3-13.5-3z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm15-9c.5 1.5 0 3-1 3.5"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M11 39.5h23" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'b':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
          </g>
          <path d="M17.5 26h10M22.5 21v10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'r':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
            <path d="M13 14l1.5 14h16l1.5-14H13z" />
            <path d="M11 14h23" />
          </g>
          <path d="M14 28h17" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'q':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-14-6 14-7-11 2 12z" />
            <path d="M9 26c0 2 1.5 2 2.5 4 2.5 5 1 5.5 1.5 6.5 2 1 7.5 1 9.5 1s7.5 0 9.5-1c.5-1-1-1.5 1.5-6.5 1-2 2.5-2 2.5-4 0-1.5-1-2-1-2H9s-1 .5-1 2z" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
            <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" stroke={stroke} />
          </g>
        </svg>
      );

    case 'k':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
            <path d="M11.5 37c5.5 3.5 16.5 3.5 22 0 0-4-3-4-3-6 0-3 1-4 1-6 0-4-4.5-7-9-7s-9 3-9 7c0 2 1 3 1 6 0 2-3 2-3 6z" />
            <path d="M11.5 30c5.5-2 16.5-2 22 0m-22 3.5c5.5-2 16.5-2 22 0" fill="none" stroke={stroke} />
          </g>
        </svg>
      );

    default:
      return null;
  }
};
