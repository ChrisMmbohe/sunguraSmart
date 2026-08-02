import { SVGProps } from 'react';

export default function BabyRabbitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://w3.org"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Left Ear */}
      <path d="M10 14V5a2 2 0 0 0-4 0v9" />
      {/* Right Ear */}
      <path d="M14 14V5a2 2 0 0 1 4 0v9" />
      {/* Head */}
      <path d="M6 14a6 6 0 0 0 12 0c0-2.5-1-3.5-3-4.5H9c-2 1-3 2-3 4z" />
      {/* Nose/Mouth */}
      <path d="M12 14l-1-1h2z" />
    </svg>
  );
}
