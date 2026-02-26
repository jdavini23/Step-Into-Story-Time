import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Additional breakpoints for fine-grained control
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<
    keyof typeof BREAKPOINTS | "xs"
  >("xs");

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= BREAKPOINTS.xl) setBreakpoint("xl");
      else if (width >= BREAKPOINTS.lg) setBreakpoint("lg");
      else if (width >= BREAKPOINTS.md) setBreakpoint("md");
      else if (width >= BREAKPOINTS.sm) setBreakpoint("sm");
      else setBreakpoint("xs");
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
}
