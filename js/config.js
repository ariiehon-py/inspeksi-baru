// js/config.js — Firebase Configuration & Initialization
const firebase = window.firebase;

const firebaseConfig = {
    apiKey: "AIzaSyBY1BuHTiTGd4yKkSe-zQuFRcT6UZBKJsg",
    authDomain: "inspeksi-341a8.firebaseapp.com",
    projectId: "inspeksi-341a8",
    storageBucket: "inspeksi-341a8.firebasestorage.app",
    messagingSenderId: "799654508292",
    appId: "1:799654508292:web:8a0c2e95af5076b0088251",
    measurementId: "G-0NF9YZBHK3"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const storage = firebase.storage();
export { firebase };

// Persistence dimatikan dulu — enablePersistence lama bikin error WebChannel 404 + timeout 9.5s kamu
// Kalau butuh offline, aktifkan via FirestoreSettings.cache (SDK 10+) bukan enablePersistence deprecated
// try { db.enablePersistence({ synchronizeTabs: true }).catch(()=>{}); } catch {}
