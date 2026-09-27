import {
  FaStar,
  FaHeart,
  FaCheckCircle,
  FaInfoCircle,
  FaCode,
  FaGlobe,
} from "react-icons/fa";

export const editorIcons = {
  star: FaStar,
  heart: FaHeart,
  check: FaCheckCircle,
  info: FaInfoCircle,
  code: FaCode,
  globe: FaGlobe,
} as const;

export type EditorIconName = keyof typeof editorIcons;