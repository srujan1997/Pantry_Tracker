import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";

export const fetchItemsForCategory = async (category) => {
  try {
    const itemsRef = collection(firestore, 'categories', category, 'items');
    const itemsSnapshot = await getDocs(itemsRef);
    if (itemsSnapshot.empty) {
      console.log('No matching documents.');
      return [];
    }
    const itemsList = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return itemsList;
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
};
