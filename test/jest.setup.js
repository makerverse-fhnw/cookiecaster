import { TextEncoder, TextDecoder } from "node:util";

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
