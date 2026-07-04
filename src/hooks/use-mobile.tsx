import * as React from "react";

const MOBILE_BREAKPOINT = 768;
/** Alineado con Tailwind `sm`: móvil estricto vs tablet/escritorio. */
const PHONE_BREAKPOINT = 640;

function useMediaBelow(breakpoint: number) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setMatches(window.innerWidth < breakpoint);
    };
    mql.addEventListener("change", onChange);
    setMatches(window.innerWidth < breakpoint);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return !!matches;
}

export function useIsMobile() {
  return useMediaBelow(MOBILE_BREAKPOINT);
}

/** Teléfonos (< sm). Tablet y escritorio quedan fuera. */
export function useIsPhone() {
  return useMediaBelow(PHONE_BREAKPOINT);
}
