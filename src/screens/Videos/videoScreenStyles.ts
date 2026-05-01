// // import { StyleSheet, Dimensions } from "react-native";

// // const { width, height } = Dimensions.get("window");
// // export const SCREEN_W = width || 375;
// // export const SCREEN_H = height || 812;
// // export const BOTTOM_SHEET_HEIGHT = SCREEN_H * 0.65;

// // const styles = StyleSheet.create({
// //     background: {
// //         flex: 1,
// //     },
// //     container: { flex: 1 },
// //     loader: { flex: 1, justifyContent: "center", alignItems: "center" },
// //     loaderText: { marginTop: 12, fontSize: 16, color: "#333" },
// //     skeletonThumbnail: {
// //         width: "100%",
// //         height: SCREEN_H * 0.32,
// //         backgroundColor: "#e0e0e0",
// //     },
// //     skeletonAvatar: {
// //         width: 35,
// //         height: 35,
// //         borderRadius: 20,
// //         backgroundColor: "#e0e0e0",
// //     },
// //     skeletonTitleLine: {
// //         height: 16,
// //         width: "90%",
// //         borderRadius: 4,
// //         backgroundColor: "#e0e0e0",
// //     },
// //     header: {
// //         paddingVertical: 8,
// //         paddingHorizontal: 16,
// //         borderBottomWidth: 1,
// //         borderBottomColor: "#eee",
// //     },
// //     headerRow: {
// //         flexDirection: "row",
// //         alignItems: "center",
// //         justifyContent: "space-between",
// //     },
// //     backButton: {
// //         padding: 4,
// //     },
// //     backButtonPlaceholder: {
// //         width: 32,
// //         fontFamily: "PlusJakartaSans-Medium",
// //     },
// //     heading: {
// //         fontSize: 18,
// //         fontFamily: "PlusJakartaSans-Bold",
// //         color: "#000",
// //         flex: 1,
// //         textAlign: "center",
// //     },
// //     searchRow: { marginHorizontal: 20, marginBottom: 10, marginTop: 10 },
// //     searchContainer: {
// //         paddingHorizontal: 16,
// //         paddingVertical: 8,
// //         backgroundColor: "transparent",
// //     },
// //     searchInputContainer: {
// //         flexDirection: "row",
// //         alignItems: "center",
// //         backgroundColor: "#F3F4F6",
// //         borderRadius: 12,
// //         paddingHorizontal: 12,
// //         height: 44,
// //         borderWidth: 1,
// //         borderColor: "#E5E7EB",
// //     },
// //     loadMoreContainer: {
// //         paddingVertical: 20,
// //         alignItems: "center",
// //     },
// //     searchInput: {
// //         flex: 1,
// //         fontSize: 14,
// //         color: "#000",
// //         fontFamily: "PlusJakartaSans-Medium",
// //         paddingVertical: 0,
// //     },
// //     clearButton: {
// //         marginLeft: 8,
// //     },
// //     emptyContainer: {
// //         flex: 1,
// //         justifyContent: "center",
// //         alignItems: "center",
// //         paddingVertical: 60,
// //         paddingHorizontal: 20,
// //     },
// //     emptySearchImage: {
// //         width: 194,
// //         height: 194,
// //         marginBottom: 16,
// //     },
// //     emptyText: {
// //         fontSize: 20,
// //         fontFamily: "PlusJakartaSans-Bold",
// //         color: "#333",
// //         marginTop: 16,
// //         textAlign: "center",
// //     },
// //     emptySubtext: {
// //         fontSize: 14,
// //         fontFamily: "PlusJakartaSans-Medium",
// //         color: "#666",
// //         marginTop: 8,
// //         textAlign: "center",
// //     },
// //     card: {
// //         width: SCREEN_W - 40,
// //         alignSelf: "center",
// //         backgroundColor: "#fff",
// //         marginVertical: 10,
// //         borderRadius: 12,
// //         overflow: "hidden",
// //         elevation: 3,
// //     },
// //     thumbnail: {
// //         width: "100%",
// //         height: SCREEN_H * 0.32,
// //         backgroundColor: "#000",
// //     },
// //     playIconContainer: {
// //         position: "absolute",
// //         top: "40%",
// //         left: "40%",
// //         zIndex: 20,
// //     },
// //     titleRow: { flexDirection: "row", alignItems: "center", padding: 10 },
// //     avatar: { width: 35, height: 35, borderRadius: 20 },
// //     caption: { fontSize: 15, fontFamily: "PlusJakartaSans-Medium", color: "#333", marginLeft: 10, flex: 1 },
// //     modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
// //     touchOverlay: { flex: 1 },
// //     bottomSheet: {
// //         width: "100%",
// //         backgroundColor: "#000",
// //         borderTopLeftRadius: 14,
// //         borderTopRightRadius: 14,
// //         overflow: "hidden",
// //         alignSelf: "flex-end",
// //     },
// //     sheetHeader: {
// //         height: 42,
// //         alignItems: "center",
// //         justifyContent: "center",
// //     },
// //     grabber: {
// //         width: 60,
// //         height: 6,
// //         borderRadius: 4,
// //         backgroundColor: "rgba(255,255,255,0.18)",
// //         alignSelf: "center",
// //         marginTop: 8,
// //     },
// //     sheetCloseBtn: {
// //         position: "absolute",
// //         right: 12,
// //         top: 6,
// //         zIndex: 50,
// //         backgroundColor: "rgba(0,0,0,0.35)",
// //         padding: 6,
// //         borderRadius: 20,
// //     },
// //     playerArea: {
// //         flex: 1,
// //         width: "100%",
// //         height: BOTTOM_SHEET_HEIGHT - 42,
// //         justifyContent: "center",
// //         alignItems: "center",
// //         backgroundColor: "#000",
// //     },
// //     playerVideo: {
// //         width: "100%",
// //         height: "100%",
// //         backgroundColor: "#000",
// //     },
// //     playerVideoAbsolute: {
// //         position: "absolute",
// //         top: SCREEN_H - BOTTOM_SHEET_HEIGHT + 42, // Position at sheet player area
// //         left: 0,
// //         right: 0,
// //         width: "100%",
// //         height: BOTTOM_SHEET_HEIGHT - 42, // Sheet height minus header
// //         backgroundColor: "#000",
// //     },
// //     bufferOverlay: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         top: 0,
// //         bottom: 0,
// //         justifyContent: "center",
// //         alignItems: "center",
// //         zIndex: 900,
// //     },
// //     bufferOverlayFS: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         top: 0,
// //         bottom: 0,
// //         justifyContent: "center",
// //         alignItems: "center",
// //         zIndex: 1200,
// //     },
// //     controlsOverlay: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         top: 0,
// //         bottom: 0,
// //         zIndex: 400,
// //     },
// //     // Instagram-style orange progress bar
// //     progressBarContainer: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         bottom: 100,
// //         zIndex: 500,
// //         paddingHorizontal: 0,
// //     },
// //     progressBarTrack: {
// //         width: "100%",
// //         height: 4,
// //         backgroundColor: "rgba(255,255,255,0.3)",
// //         borderRadius: 2,
// //         position: "relative",
// //         overflow: "visible", // Allow thumb to extend beyond track
// //     },
// //     progressBarFill: {
// //         height: "100%",
// //         backgroundColor: "#F97316", // Instagram-style orange
// //     },
// //     progressBarThumb: {
// //         position: "absolute",
// //         width: 18,
// //         height: 18,
// //         borderRadius: 9,
// //         backgroundColor: "#FFD700", // Yellow thumb/handle
// //         top: -7,
// //         borderWidth: 2,
// //         borderColor: "#fff",
// //         shadowColor: "#000",
// //         shadowOffset: { width: 0, height: 2 },
// //         shadowOpacity: 0.4,
// //         shadowRadius: 4,
// //         elevation: 6,
// //         zIndex: 10,
// //     },
// //     bottomControlRow: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         bottom: 30,
// //         flexDirection: "row",
// //         alignItems: "center",
// //         justifyContent: "center",
// //         gap: 40,
// //         zIndex: 500,
// //         paddingHorizontal: 20,
// //     },
// //     playBtn: {
// //         width: 64,
// //         height: 64,
// //         borderRadius: 32,
// //         backgroundColor: "rgba(0,0,0,0.5)",
// //         justifyContent: "center",
// //         alignItems: "center",
// //         borderWidth: 2,
// //         borderColor: "rgba(255,255,255,0.8)",
// //     },
// //     replayBtn: {
// //         flexDirection: "row",
// //         alignItems: "center",
// //         justifyContent: "center",
// //         backgroundColor: "#F97316", // Theme orange
// //         paddingHorizontal: 20,
// //         paddingVertical: 12,
// //         borderRadius: 24,
// //         gap: 8,
// //         shadowColor: "#F97316",
// //         shadowOffset: { width: 0, height: 4 },
// //         shadowOpacity: 0.3,
// //         shadowRadius: 8,
// //         elevation: 6,
// //     },
// //     replayLabel: {
// //         color: "#fff",
// //         fontSize: 14,
// //         fontFamily: "PlusJakartaSans-Medium",
// //     },
// //     controlBtn: {
// //         width: 56,
// //         height: 56,
// //         borderRadius: 28,
// //         backgroundColor: "rgba(0,0,0,0.5)",
// //         justifyContent: "center",
// //         alignItems: "center",
// //         borderWidth: 2,
// //         borderColor: "rgba(255,255,255,0.8)",
// //     },
// //     fullscreenContainer: { flex: 1, backgroundColor: "#000" },
// //     fullscreenTouchable: { flex: 1, justifyContent: "center", alignItems: "center" },
// //     fullscreenVideo: { width: "100%", height: "100%", backgroundColor: "#000" },
// //     videoTouchOverlay: {
// //         position: "absolute",
// //         top: 0,
// //         left: 0,
// //         right: 0,
// //         bottom: 0,
// //         zIndex: 100,
// //     },
// //     fullscreenVideoAbsolute: {
// //         position: "absolute",
// //         top: 0,
// //         left: 0,
// //         right: 0,
// //         bottom: 0,
// //         width: "100%",
// //         height: "100%",
// //         backgroundColor: "#000",
// //     },
// //     fsTopRow: {
// //         position: "absolute",
// //         top: 18,
// //         left: 12,
// //         right: 12,
// //         zIndex: 800,
// //         flexDirection: "row",
// //         justifyContent: "space-between",
// //         alignItems: "center",
// //     },
// //     fsTopBtn: {
// //         backgroundColor: "rgba(0,0,0,0.5)",
// //         padding: 10,
// //         borderRadius: 24,
// //         minWidth: 44,
// //         minHeight: 44,
// //         justifyContent: "center",
// //         alignItems: "center",
// //     },
// //     controlsOverlayFS: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         top: 0,
// //         bottom: 0,
// //         zIndex: 700,
// //     },
// //     // Instagram-style orange progress bar for fullscreen
// //     progressBarContainerFS: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         bottom: 120,
// //         zIndex: 800,
// //         paddingHorizontal: 24, // Add padding for better touch area
// //         paddingVertical: 15, // Increase vertical touch area
// //         justifyContent: "center",
// //     },
// //     bottomControlRowFS: {
// //         position: "absolute",
// //         left: 0,
// //         right: 0,
// //         bottom: 40,
// //         flexDirection: "row",
// //         alignItems: "center",
// //         justifyContent: "center",
// //         gap: 50,
// //         zIndex: 900,
// //         paddingHorizontal: 20,
// //     },
// //     playBtnFS: {
// //         width: 72,
// //         height: 72,
// //         borderRadius: 36,
// //         backgroundColor: "rgba(0,0,0,0.5)",
// //         justifyContent: "center",
// //         alignItems: "center",
// //         borderWidth: 2,
// //         borderColor: "rgba(255,255,255,0.8)",
// //     },
// //     replayBtnFS: {
// //         flexDirection: "row",
// //         alignItems: "center",
// //         justifyContent: "center",
// //         backgroundColor: "#F97316", // Theme orange
// //         paddingHorizontal: 24,
// //         paddingVertical: 14,
// //         borderRadius: 28,
// //         gap: 10,
// //         shadowColor: "#F97316",
// //         shadowOffset: { width: 0, height: 4 },
// //         shadowOpacity: 0.3,
// //         shadowRadius: 8,
// //         elevation: 6,
// //     },
// //     controlBtnFS: {
// //         width: 64,
// //         height: 64,
// //         borderRadius: 32,
// //         backgroundColor: "rgba(0,0,0,0.5)",
// //         justifyContent: "center",
// //         alignItems: "center",
// //         borderWidth: 2,
// //         borderColor: "rgba(255,255,255,0.8)",
// //     },
// // });

// // export default styles;



// import { StyleSheet } from "react-native";

// const styles = StyleSheet.create({
//   /* =========================
//      ROOT CONTAINERS
//   ========================== */
//   background: {
//     flex: 1,
//   },

//   container: {
//     flex: 1,
//   },

//   /* =========================
//      HEADER
//   ========================== */
//   header: {
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//     backgroundColor: "#FFF",
//   },

//   headerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },

//   backButton: {
//     padding: 6,
//   },

//   backButtonPlaceholder: {
//     width: 32,
//   },

//   heading: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#111",
//     flex: 1,
//     textAlign: "center",
//   },

//   /* =========================
//      SEARCH
//   ========================== */
//   searchContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     backgroundColor: "#FFF",
//   },

//   searchInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F5F5F5",
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     height: 46,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },

//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     color: "#111",
//   },

//   clearButton: {
//     marginLeft: 8,
//   },

//   /* =========================
//      VIDEO CARD
//   ========================== */
//   card: {
//     width: "92%",
//     alignSelf: "center",
//     backgroundColor: "#FFF",
//     marginVertical: 12,
//     borderRadius: 18,
//     overflow: "hidden",
//     elevation: 4,
//   },

//   thumbnail: {
//     width: "100%",
//     aspectRatio: 16 / 9,
//     backgroundColor: "#000",
//   },

//   playIconContainer: {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     transform: [{ translateX: -32 }, { translateY: -32 }],
//     zIndex: 10,
//   },

//   titleRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 14,
//   },

//   avatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//   },

//   caption: {
//     fontSize: 15,
//     color: "#333",
//     marginLeft: 12,
//     flex: 1,
//     lineHeight: 20,
//   },

//   /* =========================
//      SKELETON
//   ========================== */
//   skeletonThumbnail: {
//     width: "100%",
//     aspectRatio: 16 / 9,
//     backgroundColor: "#E5E7EB",
//   },

//   skeletonAvatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#E5E7EB",
//   },

//   skeletonTitleLine: {
//     height: 14,
//     width: "90%",
//     borderRadius: 6,
//     backgroundColor: "#E5E7EB",
//   },

//   /* =========================
//      EMPTY STATE
//   ========================== */
//   emptyContainer: {
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 80,
//     paddingHorizontal: 20,
//   },

//   emptySearchImage: {
//     width: 180,
//     height: 180,
//     marginBottom: 20,
//   },

//   emptyText: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#333",
//     marginTop: 10,
//     textAlign: "center",
//   },

//   emptySubtext: {
//     fontSize: 14,
//     color: "#777",
//     marginTop: 6,
//     textAlign: "center",
//   },

//   loadMoreContainer: {
//     paddingVertical: 20,
//     alignItems: "center",
//   },

//   /* =========================
//      FULLSCREEN PLAYER
//   ========================== */
//   fullscreenContainer: {
//     flex: 1,
//     backgroundColor: "#000",
//   },

//   fullscreenTouchable: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   fullscreenVideo: {
//     width: "100%",
//     height: "100%",
//     backgroundColor: "#000",
//   },

//   videoTouchOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 100,
//   },

//   bufferOverlayFS: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 1000,
//   },

//   /* =========================
//      FULLSCREEN TOP BAR
//   ========================== */
//   fsTopRow: {
//     position: "absolute",
//     top: 20,
//     left: 14,
//     right: 14,
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     zIndex: 2000,
//   },

//   fsTopBtn: {
//     backgroundColor: "rgba(0,0,0,0.6)",
//     padding: 10,
//     borderRadius: 24,
//   },

//   /* =========================
//      FULLSCREEN CONTROLS
//   ========================== */
//   controlsOverlayFS: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 1500,
//   },

//   bottomControlRowFS: {
//     position: "absolute",
//     bottom: 50,
//     left: 0,
//     right: 0,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 60,
//   },

//   playBtnFS: {
//     width: 74,
//     height: 74,
//     borderRadius: 37,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "#FFF",
//   },

//   replayBtnFS: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F97316",
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 30,
//     gap: 10,
//   },

//   replayLabel: {
//     color: "#FFF",
//     fontSize: 14,
//     fontWeight: "600",
//   },

//   controlBtnFS: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "#FFF",
//   },
// });

// export default styles;
