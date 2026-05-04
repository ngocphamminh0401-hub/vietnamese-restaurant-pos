
import * as _React from 'react';

declare global {
  /**
   * Removed conflicting global React namespace declaration as it is already provided by the 'react' package.
   */
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends _React.ReactElement<any, any> { }
  }
}

/**
 * Fixed: Removed invalid 'export =' in module augmentation.
 */
declare module 'react' {
  export = _React;
}

/**
 * Fixed: Corrected react-dom/client augmentation to avoid redeclaration conflicts.
 */
declare module 'react-dom/client' {
  export const createRoot: (container: Element | DocumentFragment) => any;
}

/**
 * Fixed: Simplified lucide-react augmentation. 
 * Removed individual icon declarations as they are already provided by the package's own types,
 * which was causing "Subsequent variable declarations must have the same type" errors.
 */
declare module 'lucide-react' {
  export interface IconProps {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type Icon = _React.ElementType<IconProps>;
}

declare module 'socket.io-client' {
  export const io: (url?: string, opts?: any) => any;
  export type Socket = any;
}
