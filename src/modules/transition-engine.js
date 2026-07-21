const TRANSITIONS = {
  CROSSFADE: 'crossfade',
  SLIDE_LEFT: 'slide-left',
  SLIDE_RIGHT: 'slide-right',
  SLIDE_UP: 'slide-up',
  SLIDE_DOWN: 'slide-down',
  ZOOM_IN: 'zoom-in',
  ZOOM_OUT: 'zoom-out',
  MORPH: 'morph',
  CURTAIN: 'curtain',
  GLITCH: 'glitch',
  PARTICLES: 'particles'
};

function getTransitionCSS(type, duration = 800) {
  const d = duration;
  switch (type) {
    case TRANSITIONS.CROSSFADE:
      return `.transition-crossfade { animation: tfFade ${d}ms ease-in-out; }
        @keyframes tfFade { 0%{opacity:0} 100%{opacity:1} }`;
    case TRANSITIONS.SLIDE_LEFT:
      return `.transition-slide-left { animation: tfSlideL ${d}ms ease-out; }
        @keyframes tfSlideL { 0%{transform:translateX(100%);opacity:0} 100%{transform:translateX(0);opacity:1} }`;
    case TRANSITIONS.SLIDE_RIGHT:
      return `.transition-slide-right { animation: tfSlideR ${d}ms ease-out; }
        @keyframes tfSlideR { 0%{transform:translateX(-100%);opacity:0} 100%{transform:translateX(0);opacity:1} }`;
    case TRANSITIONS.SLIDE_UP:
      return `.transition-slide-up { animation: tfSlideU ${d}ms ease-out; }
        @keyframes tfSlideU { 0%{transform:translateY(100%);opacity:0} 100%{transform:translateY(0);opacity:1} }`;
    case TRANSITIONS.SLIDE_DOWN:
      return `.transition-slide-down { animation: tfSlideD ${d}ms ease-out; }
        @keyframes tfSlideD { 0%{transform:translateY(-100%);opacity:0} 100%{transform:translateY(0);opacity:1} }`;
    case TRANSITIONS.ZOOM_IN:
      return `.transition-zoom-in { animation: tfZoomIn ${d}ms ease-out; }
        @keyframes tfZoomIn { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }`;
    case TRANSITIONS.ZOOM_OUT:
      return `.transition-zoom-out { animation: tfZoomOut ${d}ms ease-out; }
        @keyframes tfZoomOut { 0%{transform:scale(1.5);opacity:0} 100%{transform:scale(1);opacity:1} }`;
    case TRANSITIONS.MORPH:
      return `.transition-morph { animation: tfMorph ${d}ms ease-in-out; }
        @keyframes tfMorph { 0%{filter:blur(20px) opacity(0);transform:scale(0.8)} 100%{filter:blur(0) opacity(1);transform:scale(1)} }`;
    case TRANSITIONS.CURTAIN:
      return `.transition-curtain { animation: tfCurtain ${d}ms ease-in-out; clip-path: inset(0 100% 0 0); }
        @keyframes tfCurtain { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0 0 0)} }`;
    case TRANSITIONS.GLITCH:
      return `.transition-glitch { animation: tfGlitch ${d}ms steps(4); }
        @keyframes tfGlitch { 0%{clip-path:inset(50% 0 50% 0);transform:translate(-5px,5px)} 25%{clip-path:inset(20% 0 80% 0);transform:translate(5px,-5px)} 50%{clip-path:inset(80% 0 20% 0);transform:translate(-3px,3px)} 75%{clip-path:inset(10% 0 90% 0);transform:translate(3px,-3px)} 100%{clip-path:inset(0 0 0 0);transform:translate(0)} }`;
    case TRANSITIONS.PARTICLES:
      return `.transition-particles { animation: tfParticles ${d}ms ease-out; }
        @keyframes tfParticles { 0%{opacity:0;filter:blur(10px)} 50%{opacity:0.5;filter:blur(2px)} 100%{opacity:1;filter:blur(0)} }`;
    default:
      return `.transition-crossfade { animation: tfFade ${d}ms ease-in-out; }
        @keyframes tfFade { 0%{opacity:0} 100%{opacity:1} }`;
  }
}

function getAllTransitions() {
  return Object.values(TRANSITIONS);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRANSITIONS, getTransitionCSS, getAllTransitions };
}
