/**
 * Firebase layer barrel.
 *
 * Firebase **Storage is deliberately absent** from this module and from the
 * whole codebase — images are uploaded to ImgBB and only their URLs are stored
 * in Firestore (spec C / 2).
 */

export { getFirebaseApp } from "./app";
export { getFirebaseAuth } from "./auth";
export { getDb } from "./firestore";
export {
  describeFirebaseEnvProblem,
  firebaseEnv,
  imgbbApiKey,
  isFirebaseConfigured,
  isImgbbConfigured,
} from "./env";
export * from "./collections";
export * from "./converters";
export * from "./normalizers";
