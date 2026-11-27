// scenes/cast.js — MC v2 recurring cast definitions for What If Demo.
import { drawFigure, bigFace, handPos, headPos, COATS } from '/kit/engine/rig2d.js';

export const CAST = {
  host: {
    coat: COATS.cream,
    outfit: { top: 'coat' },
    rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 },
  },
  friend: {
    coat: COATS.sage,
    outfit: { top: 'cardigan', shirtColor: COATS.cream },
    rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 },
  },
  scientist: {
    coat: COATS.sky,
    glasses: true,
    outfit: { top: 'labcoat', shirtColor: COATS.peach },
    rim: { color: '#ffd89c', dir: [-1, -0.3], w: 3.4 },
  },
};

export const drawHost = (g, o = {}) => drawFigure(g, { ...CAST.host, ...o });
export const drawFriend = (g, o = {}) => drawFigure(g, { ...CAST.friend, ...o });
export const drawScientist = (g, o = {}) => drawFigure(g, { ...CAST.scientist, ...o });
export const friendCloseUp = (g, x, y, r, o = {}) => bigFace(g, x, y, r, { ...CAST.friend, ...o });
export { handPos, headPos, COATS };
