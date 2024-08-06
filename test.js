const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");


const firebaseConfig = {
    apiKey: "AIzaSyAtKM-WlcpXZlDlspOR6w2EElMj2Qa5lVM",
    authDomain: "pantrytracker-786d4.firebaseapp.com",
    projectId: "pantrytracker-786d4",
    storageBucket: "pantrytracker-786d4.appspot.com",
    messagingSenderId: "315756036641",
    appId: "1:315756036641:web:54bb5cc5f54f148ad95960",
    measurementId: "G-EEDCHR4KWZ"
  };
  
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const fetchItems = async () => {
  try {
    const itemsRef = collection(firestore, 'categories', 'groceries', 'items');
    const itemsSnapshot = await getDocs(itemsRef);
    if (itemsSnapshot.empty) {
      console.log('No matching documents.');
      return [];
    }
    const itemsList = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(itemsList);
  } catch (error) {
    console.error("Error fetching items:", error);
  }
};

fetchItems();
